/**
 * Servicio Oblivious para PSI con cegado adicional mediante clave secreta K.
 * 
 * Este servidor actúa como una tercera parte que:
 *  - Recibe valores cegados desde ambas clínicas.
 *  - Los vuelve a cegar usando una clave secreta K propia.
 *  - Devuelve los valores re-cegados correspondientes.
 * 
 * Importante:
 *  - El oblivious NO conoce los IDs en texto plano.
 *  - El oblivious NO puede reconstruir la intersección.
 *  - Solo opera sobre exponentiaciones modulares.
 */

import Fastify from "fastify";
import cors from "@fastify/cors";
import { modPow } from "./utils";
import crypto from "crypto";

/**
 * Estructura de cada valor almacenado por el oblivious.
 * 
 * id : identificador local del elemento (solo sirve para la clínica de origen)
 * v  : valor cegado en forma de string decimal (BigInt serializado)
 */
type StoredItem = { id: string; v: string };

async function main() {
  /**
   * Inicialización del servidor Fastify
   */
  const app = Fastify();

  /**
   * Se habilita CORS para permitir comunicación entre contenedores
   * y también desde los frontends web.
   */
  await app.register(cors, { origin: "*" });

  /**
   * ============================================================
   * CLAVE SECRETA K DEL OBLIVIOUS
   * ============================================================
   * 
   * Esta clave:
   *  - Se genera al iniciar el servicio.
   *  - Nunca se transmite a ninguna clínica.
   *  - Se usa para aplicar un segundo cegado: v^K mod P.
   * 
   * Su función es:
   *  - Expandir el dominio criptográfico.
   *  - Evitar ataques por fuerza bruta sobre hashes de IDs.
   *  - Impedir correlaciones directas entre valores recibidos.
   */
  const K: bigint = (() => {
    const bytes = crypto.randomBytes(32); // 256 bits de entropía
    const hex = bytes.toString("hex");
    return BigInt("0x" + hex);
  })();

  /**
   * ============================================================
   * ALMACENAMIENTO TEMPORAL DE VALORES CEGADOS
   * ============================================================
   * 
   * Estructura:
   * {
   *   A: [ { id, v }, ... ],
   *   B: [ { id, v }, ... ]
   * }
   * 
   * Donde:
   *  - A y B son las dos clínicas.
   *  - v = G^(H(id) * secreto_clinica)
   * 
   * El oblivious:
   *  - NO conoce los secretos.
   *  - NO conoce los IDs reales.
   */
  const store: Record<string, StoredItem[]> = {};

  /**
   * ============================================================
   * ENDPOINT: POST /upload
   * ============================================================
   * 
   * Permite que cada clínica registre sus valores cegados.
   * 
   * Body esperado:
   * {
   *   clinic: "A" | "B",
   *   items: [{ id, v }]
   * }
   * 
   * Seguridad:
   *  - El oblivious solo almacena exponentes.
   *  - No puede derivar los identificadores originales.
   */
  app.post("/upload", async (req: any) => {
    const { clinic, items } = req.body;
    store[clinic] = items;
    return { ok: true };
  });

  /**
   * ============================================================
   * ENDPOINT: GET /processed
   * ============================================================
   * 
   * Parámetros:
   *   clinic = A | B
   *   type   = own | peer
   * 
   * Funcionalidad:
   *  - Si type = own:
   *      devuelve mis propios valores elevados a K.
   *      (G^(H(id)*a))^K
   * 
   *  - Si type = peer:
   *      devuelve los valores del peer elevados a K.
   *      (G^(H(id)*b))^K
   * 
   * Este resultado:
   *  - No permite al oblivious detectar intersecciones.
   *  - Solo sirve para continuar el protocolo DH-PSI.
   */
  app.get("/processed", async (req: any) => {
    const clinic = req.query.clinic as string;
    const type = req.query.type as string;

    const me = store[clinic];
    const other = store[clinic === "A" ? "B" : "A"];

    // Si alguna clínica aún no ha cargado datos
    if (!me || !other) return [];

    // Se decide si se procesan los propios o los del peer
    const base = type === "own" ? me : other;

    const out: StoredItem[] = [];

    /**
     * Para cada valor cegado recibido:
     * se aplica un nuevo cegado con la clave K:
     * 
     * v' = v^K mod P
     */
    for (const item of base) {
      const v = BigInt(item.v);
      const vk = await modPow(v, K);
      out.push({ id: item.id, v: vk.toString() });
    }

    return out;
  });

  await app.listen({ port: 4000, host: "0.0.0.0" });
  console.log("Oblivious running on port 4000");
}

main();
