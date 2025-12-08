import { hashToBigInt, modPow, G } from "./utils";

export async function computeBlinded(ids: string[], secret: bigint) {
  const out = new Map<string, bigint>();
  for (const id of ids) {
    const h = hashToBigInt(id);
    const v = await modPow(G, h * secret);
    out.set(id, v);
  }
  return out;
}

export async function reExponentiate(map: Map<string, bigint>, secret: bigint) {
  const out = new Map<string, bigint>();
  for (const [id, v] of map) {
    out.set(id, await modPow(v, secret));
  }
  return out;
}

export function intersect(a: Map<string, bigint>, b: Map<string, bigint>) {
  const index = new Map<string, string>();
  for (const [id, v] of a) index.set(v.toString(), id);

  const result: string[] = [];
  for (const [_, v] of b) {
    const k = v.toString();
    if (index.has(k)) result.push(index.get(k)!);
  }
  return result;
}
