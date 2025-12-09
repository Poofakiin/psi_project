/**
 * Implementación de las operaciones principales del protocolo
 * Private Set Intersection (PSI).
 *
 * Este archivo contiene:
 *  - Cegado de identificadores (blinding)
 *  - Re-exponentiación de valores
 *  - Cálculo de intersección final
 */

import { hashToBigInt, modPow, G } from "./utils";

/**
 * Aplica el cegado criptográfico a un conjunto de identificadores.
 *
 * Cada identificador es:
 *  1. Hasheado
 *  2. Convertido a BigInt
 *  3. Elevado como: G^(hash(id) * secret) mod P
 *
 * @param ids Lista de identificadores originales de pacientes
 * @param secret Secreto privado de la clínica
 * @returns Mapa con pares (id → valor cegado)
 */
export async function computeBlinded(
  ids: string[],
  secret: bigint
): Promise<Map<string, bigint>> {
  const out = new Map<string, bigint>();

  for (const id of ids) {
    const h = hashToBigInt(id);
    const v = await modPow(G, h * secret);
    out.set(id, v);
  }

  return out;
}

/**
 * Re-exponentia un conjunto de valores cegados recibidos desde el peer.
 *
 * Cada valor es elevado nuevamente usando el secreto local:
 *  v' = v^secret mod P
 *
 * @param map Mapa con valores cegados recibidos
 * @param secret Secreto privado local
 * @returns Nuevo mapa con valores re-exponentiados
 */
export async function reExponentiate(
  map: Map<string, bigint>,
  secret: bigint
): Promise<Map<string, bigint>> {
  const out = new Map<string, bigint>();

  for (const [id, v] of map) {
    out.set(id, await modPow(v, secret));
  }

  return out;
}

/**
 * Calcula la intersección entre dos conjuntos
 * usando comparación de valores re-exponentiados.
 *
 * Si dos valores son iguales, significa que
 * las clínicas comparten ese identificador.
 *
 * @param a Mapa re-exponentiado de la clínica A
 * @param b Mapa re-exponentiado de la clínica B
 * @returns Lista de identificadores comunes
 */
export function intersect(
  a: Map<string, bigint>,
  b: Map<string, bigint>
): string[] {
  const index = new Map<string, string>();

  /**
   * Se crea un índice invertido usando el valor como clave.
   */
  for (const [id, v] of a) {
    index.set(v.toString(), id);
  }

  const result: string[] = [];

  /**
   * Se revisa qué valores existen en ambos mapas.
   */
  for (const [_, v] of b) {
    const k = v.toString();
    if (index.has(k)) {
      result.push(index.get(k)!);
    }
  }

  return result;
}
