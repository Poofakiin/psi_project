import Fastify from "fastify";
import minimist from "minimist";
import fs from "fs";
import cors from "@fastify/cors";
import { randomSecret, modPow } from "./utils";
import { computeBlinded, reExponentiate, intersect } from "./psi";

/**
 * Representa un paciente dentro de cada clínica.
 */
type Item = { 
  id: string; 
  age: number 
};

/**
 * Punto de entrada principal del servidor de cada clínica.
 * 
 * Responsabilidades:
 * - Levanta un servidor Fastify.
 * - Ejecuta el protocolo PSI con apoyo del servicio Oblivious.
 * - Calcula estadísticas sobre la intersección.
 * 
 * Parámetros recibidos por CLI:
 * --port       Puerto del servidor.
 * --name       Identificador de la clínica ("A" o "B").
 * --peer       URL del servidor de la clínica contraparte.
 * --oblivious  URL del servidor Oblivious.
 * --data       Archivo JSON con los datos locales.
 */
async function main() {
  const args = minimist(process.argv.slice(2));

  /** Puerto del servidor */
  const port = Number(args.port);

  /** Nombre de la clínica ("A" o "B") */
  const name = args.name as string;

  /** Dirección del peer */
  const peer = args.peer as string;

  /** Dirección del servidor Oblivious */
  const oblivious = args.oblivious as string;

  /**
   * Validación de parámetros obligatorios.
   */
  if (!peer || !oblivious || !name) {
    console.error("Usage: --port N --name A|B --peer http://... --oblivious http://...");
    process.exit(1);
  }

  /**
   * Carga del conjunto local de pacientes desde archivo JSON.
   */
  const data: Item[] = JSON.parse(fs.readFileSync(args.data, "utf8"));

  /**
   * Inicialización del servidor Fastify.
   */
  const app = Fastify();
  await app.register(cors, { origin: "*" });

  /**
   * Secreto criptográfico privado de la clínica.
   * Nunca se comparte con nadie.
   */
  const secret = randomSecret();

  /**
   * ============================================================
   * GET /blinded
   * ============================================================
   * 
   * Devuelve los valores cegados de los IDs locales:
   *   v = G^(H(id) * secret)
   * 
   * Estos valores se usan dentro del protocolo PSI.
   * 
   * @returns Lista de pares {id, v}
   */
  app.get("/blinded", async () => {
    const ids = data.map(d => d.id);
    const map = await computeBlinded(ids, secret);
    return [...map].map(([id, v]) => ({ id, v: v.toString() }));
  });

  /**
   * ============================================================
   * POST /reexp
   * ============================================================
   * 
   * Recibe valores del peer y los re-exponentia:
   *   v' = v^secret
   * 
   * @param {Array<{id: string, v: string}>} req.body
   * @returns Lista de valores re-exponentiados
   */
  app.post("/reexp", async (req: any) => {
    const body = req.body as { id: string; v: string }[];
    const map = new Map<string, bigint>(
      body.map(x => [x.id, BigInt(x.v)])
    );
    
    const out = await reExponentiate(map, secret);

    return [...out].map(([id, v]) => ({ id, v: v.toString() }));
  });

  /**
   * ============================================================
   * GET /run
   * ============================================================
   * 
   * Ejecuta el protocolo PSI completo utilizando el servicio Oblivious.
   * 
   * Flujo del protocolo:
   * 1. Se calculan los valores cegados locales.
   * 2. Se envían al Oblivious.
   * 3. Se solicitan al Oblivious los valores del peer re-cegados con K.
   * 4. Se re-exponentian con el secreto local.
   * 5. Se solicitan los propios valores re-cegados.
   * 6. Se envían al peer para su re-exponentiación final.
   * 7. Se computa la intersección criptográfica.
   * 8. Se calculan estadísticas sobre la intersección.
   * 
   * @returns Resultado del PSI con estadísticas.
   */
  app.get("/run", async () => {
    try {
      /**
       * 1) Cálculo de valores cegados locales
       */
      const mineMap = await computeBlinded(
        data.map(d => d.id), 
        secret
      );

      const minePayload = [...mineMap].map(
        ([id, v]) => ({ id, v: v.toString() })
      );

      /**
       * 2) Envío al servidor Oblivious
       */
      await fetch(`${oblivious}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          clinic: name, 
          items: minePayload 
        })
      });

      /**
       * 3) Recepción de los valores del peer re-cegados con K
       */
      const peerProcessedRes = await fetch(
        `${oblivious}/processed?clinic=${name}&type=peer`
      );

      const peerProcessed = 
        (await peerProcessedRes.json()) as { id: string; v: string }[];

      /**
       * 4) Re-exponentiación local de los valores del peer
       */
      const re1 = new Map<string, bigint>(
        peerProcessed.map(x => [x.id, BigInt(x.v)])
      );

      const re1Final = await reExponentiate(re1, secret);

      /**
       * 5) Solicitud de mis propios valores re-cegados con K
       */
      const ownProcessedRes = await fetch(
        `${oblivious}/processed?clinic=${name}&type=own`
      );

      const ownProcessed = 
        (await ownProcessedRes.json()) as { id: string; v: string }[];

      /**
       * 6) Envío al peer para re-exponentiación final
       */
      const peerRe = await (await fetch(`${peer}/reexp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ownProcessed)
      })).json() as { id: string; v: string }[];

      const re2 = new Map<string, bigint>(
        peerRe.map(x => [x.id, BigInt(x.v)])
      );

      /**
       * 7) Cálculo de la intersección
       */
      const ids = intersect(re1Final, re2);

      /**
       * 8) Cálculo de estadísticas
       */
      const ages = data
        .filter(d => ids.includes(d.id))
        .map(d => d.age);

      return {
        intersection: ids,
        size: ids.length,
        averageAge: ages.length
          ? ages.reduce((a, b) => a + b, 0) / ages.length
          : null
      };
    } catch (err: any) {
      console.error("ERROR in /run:", err);
      return { error: String(err) };
    }
  });

  /**
   * Inicio del servidor
   */
  await app.listen({ port, host: "0.0.0.0" });
  console.log(`Clinic ${name} running on port ${port}`);
}

/**
 * Ejecución del programa
 */
main();
