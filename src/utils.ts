// src/utils.ts
import * as crypto from "crypto";
import * as bigintCrypto from "bigint-crypto-utils";

// Grupo MODP 2048 (demo)
export const P = BigInt(
  "0xFFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A63A3620FFFFFFFFFFFFFFFF"
);
export const G = BigInt(2);

export function hashToBigInt(id: string): bigint {
  const h = crypto.createHash("sha256").update(id).digest("hex");
  return BigInt("0x" + h) % (P - BigInt(1));
}

export function randomSecret(): bigint {
  return bigintCrypto.randBetween(BigInt(2), P - BigInt(2));
}

export async function modPow(base: bigint, exp: bigint): Promise<bigint> {
  return bigintCrypto.modPow(base, exp, P);
}
