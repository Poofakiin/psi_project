/**
 * Servidor principal de cada clínica para ejecutar el protocolo
 * Private Set Intersection (PSI) usando Fastify.
 *
 * Este servidor permite:
 *  - Generar valores cegados (blinded)
 *  - Re-exponentiar valores enviados por la clínica par
 *  - Ejecutar el protocolo PSI completo
 *  - Calcular tamaño de intersección y edad promedio
 */

import Fastify from "fastify";
import minimist from "minimist";
import fs from "fs";
import { randomSecret } from "./utils";
import { computeBlinded, reExponentiate, intersect } from "./psi";
import { average } from "./stats";
import cors from "@fastify/cors";

/**
 * Representa un registro de paciente dentro de una clínica.
 */
type Item = {
  /** Identificador del paciente (RUT u otro identificador único) */
  id: string;

  /** Edad del paciente */
  age: number;
};

/**
 * Función principal de ejecución del servidor.
 * Se encarga de:
 *  - Leer argumentos por consola
 *  - Cargar los datos desde archivo JSON
 *  - Inicializar Fastify
 *  - Registrar los endpoints del protocolo PSI
 */
async function main() {
  /**
   * Argumentos recibidos por consola usando minimist.
   * Ejemplo:
   *  npm run start:A -- --port 3001 --name A --data datasets/clinicA.json --peer http://localhost:3002
   */
  const args = minimist(process.argv.slice(2));

  /** Puerto en el que se levanta el servidor */
  const port = Number(args.port);

  /** Nombre de la clínica (A o B) */
  const name = args.name;

  /** Dirección del servidor par (otra clínica) */
  const peer: string | undefined = args.peer;

  /**
   * Validación de existencia del parámetro --peer
   */
  if (!peer) {
    console.error("ERROR: Debes iniciar el servidor con el parámetro --peer");
    console.error("Ejemplo:");
    console.error("  npm run start:A -- --peer http://localhost:3002");
    process.exit(1);
  }

  /**
   * Carga del dataset desde archivo JSON
   */
  const data: Item[] = JSON.parse(fs.readFileSync(args.data, "utf8"));

  /**
   * Inicialización de Fastify
   */
  const app = Fastify();

  /**
   * Registro de CORS para permitir peticiones desde el navegador
   */
  await app.register(cors, { origin: "*" });

  /**
   * Secreto cryptográfico privado generado aleatoriamente.
   * Este valor jamás se comparte con la otra clínica.
   */
  const secret = randomSecret();

  /**
   * Endpoint GET /blinded
   *
   * Devuelve los identificadores de los pacientes
   * elevados con el secreto de esta clínica.
   *
   * Es el primer paso del protocolo PSI.
   *
   * @returns Lista de objetos { id, v } donde v es el valor cegado en string
   */
  app.get("/blinded", async () => {
    const ids = data.map(d => d.id);
    const map = await computeBlinded(ids, secret);

    return [...map].map(([id, v]) => ({
      id,
      v: v.toString()
    }));
  });

  /**
   * Endpoint POST /reexp
   *
   * Recibe valores cegados por la clínica par,
   * los vuelve a elevar usando el secreto local
   * (re-exponentiación).
   *
   * @param req.body Lista de objetos { id, v }
   * @returns Valores re-exponentiados
   */
  app.post("/reexp", async (req: any) => {
    const body = req.body as { id: string; v: string }[];

    const map = new Map<string, bigint>(
      body.map(x => [x.id, BigInt(x.v)])
    );

    const out = await reExponentiate(map, secret);

    return [...out].map(([id, v]) => ({
      id,
      v: v.toString()
    }));
  });

  /**
   * Endpoint GET /run
   *
   * Ejecuta el protocolo PSI completo:
   *  1. Obtiene los datos cegados del peer
   *  2. Los re-exponentia localmente
   *  3. Envía sus propios datos cegados al peer
   *  4. Recibe los re-exponentiados
   *  5. Calcula la intersección
   *  6. Calcula tamaño y edad promedio
   *
   * @returns Resultado completo del PSI
   */
  app.get("/run", async () => {
    /**
     * Paso 1: Obtener los valores cegados del peer
     */
    const peerBlind =
      await (await fetch(`${peer}/blinded`)).json() as { id: string; v: string }[];

    /**
     * Paso 2: Re-exponentiar valores del peer
     */
    const re1 = await reExponentiate(
      new Map<string, bigint>(
        peerBlind.map(x => [x.id, BigInt(x.v)])
      ),
      secret
    );

    /**
     * Paso 3: Calcular los valores cegados propios
     */
    const mine = await computeBlinded(
      data.map(d => d.id),
      secret
    );

    /**
     * Paso 4: Enviar valores propios al peer para re-exponentiación
     */
    const peerRe =
      await (await fetch(`${peer}/reexp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          [...mine].map(([id, v]) => ({
            id,
            v: v.toString()
          }))
        )
      })).json() as { id: string; v: string }[];

    /**
     * Paso 5: Convertir respuesta del peer a Map
     */
    const re2 = new Map<string, bigint>(
      peerRe.map(x => [x.id, BigInt(x.v)])
    );

    /**
     * Paso 6: Calcular intersección final
     */
    const ids = intersect(re1, re2);

    /**
     * Paso 7: Obtener edades reales solo de la intersección
     */
    const ages = data
      .filter(d => ids.includes(d.id))
      .map(d => d.age);

    /**
     * Resultado final del protocolo PSI
     */
    return {
      intersection: ids,
      size: ids.length,
      averageAge: average(ages)
    };
  });

  /**
   * Levanta el servidor en el puerto indicado
   */
  await app.listen({
    port: Number(port),
    host: "0.0.0.0"
  });

  /**
   * Mensaje informativo de inicio
   */
  console.log(`Clinic ${name} running on port ${port}`);
}

/**
 * Ejecución del programa
 */
main();
