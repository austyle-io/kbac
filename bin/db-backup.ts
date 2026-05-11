import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { executeRead, closeDriver } from "../src/db/neo4j-service.js";

async function backup(): Promise<void> {
  console.log("Exporting graph via APOC...");

  const rows = await executeRead<{ cypherStatements: string }>(
    `CALL apoc.export.cypher.all(null, {
      format: "cypher-shell",
      stream: true,
      useOptimizations: {type: "UNWIND_BATCH", unwindBatchSize: 20}
    })
    YIELD cypherStatements
    RETURN cypherStatements`,
  );

  const cypher = rows.map((r) => r.cypherStatements).join("\n");

  const dir = join(process.cwd(), "backups");
  await mkdir(dir, { recursive: true });

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("Z", "");
  const filename = `${timestamp}.cypher`;
  const filepath = join(dir, filename);

  await writeFile(filepath, cypher, "utf-8");
  await closeDriver();

  const lines = cypher.split("\n").length;
  console.log(`Backup saved: backups/${filename} (${lines} lines)`);
}

backup().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
