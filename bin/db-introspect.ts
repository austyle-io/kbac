import { executeRead, closeDriver } from "../src/db/neo4j-service.js";

interface Section {
  title: string;
  cypher: string;
  format: (row: Record<string, unknown>) => string;
}

const sections: Section[] = [
  {
    title: "Labels",
    cypher:
      "CALL db.labels() YIELD label RETURN label ORDER BY label",
    format: (row) => `  ${row.label}`,
  },
  {
    title: "Relationship Types",
    cypher:
      "CALL db.relationshipTypes() YIELD relationshipType RETURN relationshipType ORDER BY relationshipType",
    format: (row) => `  ${row.relationshipType}`,
  },
  {
    title: "Constraints",
    cypher:
      "SHOW CONSTRAINTS YIELD name, type, entityType, labelsOrTypes, properties RETURN name, type, entityType, labelsOrTypes, properties",
    format: (row) => `  ${JSON.stringify(row)}`,
  },
  {
    title: "Indexes",
    cypher:
      "SHOW INDEXES YIELD name, type, entityType, labelsOrTypes, properties, state RETURN name, type, entityType, labelsOrTypes, properties, state",
    format: (row) => `  ${JSON.stringify(row)}`,
  },
  {
    title: "Node Counts",
    cypher:
      "MATCH (n) RETURN labels(n)[0] AS label, count(*) AS count ORDER BY label",
    format: (row) => `  ${JSON.stringify(row)}`,
  },
  {
    title: "Relationship Counts",
    cypher:
      "MATCH ()-[r]->() RETURN type(r) AS type, count(*) AS count ORDER BY type",
    format: (row) => `  ${JSON.stringify(row)}`,
  },
];

async function introspect(): Promise<void> {
  for (const section of sections) {
    console.log(`\n=== ${section.title} ===`);
    const rows = await executeRead(section.cypher);
    for (const row of rows) console.log(section.format(row));
  }
  await closeDriver();
}

introspect().catch((err) => {
  console.error(err);
  process.exit(1);
});
