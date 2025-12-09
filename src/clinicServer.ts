import Fastify from "fastify";
import minimist from "minimist";
import fs from "fs";
import { randomSecret } from "./utils";
import { computeBlinded, reExponentiate, intersect } from "./psi";
import { average } from "./stats";
import cors from "@fastify/cors";

type Item = { id: string; age: number };

async function main() {
  const args = minimist(process.argv.slice(2));
  const port = args.port;
  const name = args.name;
  const peer = args.peer;

  const data: Item[] = JSON.parse(fs.readFileSync(args.data, "utf8"));

  const app = Fastify();

  // ✅ CORS CORRECTAMENTE REGISTRADO
  await app.register(cors, { origin: "*" });

  const secret = randomSecret();

  // ================================
  // ENDPOINT 1: BLINDED IDS
  // ================================
  app.get("/blinded", async () => {
    const ids = data.map(d => d.id);
    const map = await computeBlinded(ids, secret);
    return [...map].map(([id, v]) => ({ id, v: v.toString() }));
  });

  // ================================
  // ENDPOINT 2: RE-EXPONENTIATION
  // ================================
  app.post("/reexp", async (req: any) => {
    const body = req.body as { id: string; v: string }[];

    const map = new Map<string, bigint>(
      body.map(x => [x.id, BigInt(x.v)])
    );

    const out = await reExponentiate(map, secret);

    return [...out].map(([id, v]) => ({ id, v: v.toString() }));
  });

  // ================================
  // ENDPOINT 3: RUN PSI + STATS
  // ================================
  app.get("/run", async () => {
    // 1️⃣ Obtener blinds del peer
    const peerBlind =
      await (await fetch(`${peer}/blinded`)).json() as { id: string; v: string }[];

    const re1 = await reExponentiate(
      new Map<string, bigint>(peerBlind.map(x => [x.id, BigInt(x.v)])),
      secret
    );

    // 2️⃣ Mandar mis blinds al peer
    const mine = await computeBlinded(data.map(d => d.id), secret);

    const peerRe =
      await (await fetch(`${peer}/reexp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([...mine].map(([id, v]) => ({ id, v: v.toString() })))
      })).json() as { id: string; v: string }[];

    const re2 = new Map<string, bigint>(
      peerRe.map(x => [x.id, BigInt(x.v)])
    );

    // 3️⃣ Intersección
    const ids = intersect(re1, re2);

    // 4️⃣ Estadística (edad promedio)
    const ages = data
      .filter(d => ids.includes(d.id))
      .map(d => d.age);

    return {
      intersection: ids,
      size: ids.length,
      averageAge: average(ages)
    };
  });

  await app.listen({ port: Number(port) });

  console.log(`Clinic ${name} running on port ${port}`);
}

main();
