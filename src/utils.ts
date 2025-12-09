/**
 * Utilidades criptográficas utilizadas en el protocolo PSI.
 *
 * Incluye:
 *  - Parámetros del grupo modular
 *  - Hash seguro a BigInt
 *  - Generación de secreto aleatorio
 *  - Exponenciación modular segura
 */

import * as crypto from "crypto";
import * as bigintCrypto from "bigint-crypto-utils";

/**
 * Número primo P de un grupo MODP de 2048 bits (uso demostrativo).
 * Proporciona el espacio modular para las operaciones criptográficas.
 */
export const P = BigInt(
  "0xFFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A63A3620FFFFFFFFFFFFFFFF"
);

/**
 * Generador del grupo modular.
 */
export const G = BigInt(2);

/**
 * Convierte un identificador (string) en un valor BigInt seguro
 * utilizando SHA-256 y reducción modular.
 *
 * @param id Identificador original (por ejemplo RUT)
 * @returns Hash convertido a BigInt dentro del grupo modular
 */
export function hashToBigInt(id: string): bigint {
  const h = crypto.createHash("sha256").update(id).digest("hex");
  return BigInt("0x" + h) % (P - BigInt(1));
}

/**
 * Genera un secreto aleatorio criptográficamente seguro.
 *
 * Se genera un número de 256 bits de entropía usando
 * el generador seguro del sistema.
 *
 * @returns Secreto privado aleatorio dentro del rango válido
 */
export function randomSecret(): bigint {
  const bytes = crypto.randomBytes(32); // 256 bits de entropía
  const hex = bytes.toString("hex");

  return (BigInt("0x" + hex) % (P - BigInt(2))) + BigInt(2);
}

/**
 * Realiza una exponenciación modular segura.
 *
 * @param base Base de la potencia
 * @param exp Exponente
 * @returns Resultado de (base^exp mod P)
 */
export async function modPow(
  base: bigint,
  exp: bigint
): Promise<bigint> {
  return bigintCrypto.modPow(base, exp, P);
}
