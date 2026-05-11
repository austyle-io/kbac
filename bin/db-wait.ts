import { getDriver, closeDriver } from "../src/db/driver.js";

const MAX_RETRIES = 30;
const RETRY_INTERVAL_MS = 2000;

async function waitForNeo4j(): Promise<void> {
  const driver = getDriver();

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const info = await driver.getServerInfo();
      console.log(`Neo4j ready (${info.address})`);
      await closeDriver();
      return;
    } catch {
      if (attempt === MAX_RETRIES) {
        await closeDriver();
        throw new Error(`Neo4j not ready after ${MAX_RETRIES * RETRY_INTERVAL_MS / 1000}s`);
      }
      process.stdout.write(".");
      await new Promise((r) => setTimeout(r, RETRY_INTERVAL_MS));
    }
  }
}

waitForNeo4j().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
