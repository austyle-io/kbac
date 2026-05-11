import neo4j, { type Driver } from "neo4j-driver";

let _driver: Driver | null = null;

export function getDriver(): Driver {
  if (_driver) return _driver;

  const uri = process.env.NEO4J_URI ?? "bolt://localhost:7688";
  const username = process.env.NEO4J_USERNAME ?? "neo4j";
  const password = process.env.NEO4J_PASSWORD;

  if (!password) {
    throw new Error(
      "NEO4J_PASSWORD is required. Run via: npx varlock run -- ...",
    );
  }

  _driver = neo4j.driver(uri, neo4j.auth.basic(username, password), {
    disableLosslessIntegers: true,
    maxConnectionPoolSize: 25,
    connectionAcquisitionTimeout: 30_000,
    logging: neo4j.logging.console("warn"),
  });

  return _driver;
}

export async function closeDriver(): Promise<void> {
  if (_driver) {
    await _driver.close();
    _driver = null;
  }
}
