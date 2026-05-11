# Cypher Conventions

When writing or modifying Cypher files in this repository:

- Always use MERGE for seed data operations, never CREATE. MERGE ensures idempotency — files can be re-run safely without duplicating data.
- Always set timestamps on node MERGE operations: `SET n.created = coalesce(n.created, datetime()), n.updated = datetime()`
- MERGE on the `id` property only: `MERGE (n:Label {id: 'value'})` — all other properties go in the SET clause, not the MERGE pattern.
- Never use DETACH DELETE in seed files. Seed files build the graph; they do not tear it down.
- End every Cypher statement with a semicolon. The `run-cypher.ts` runner splits on semicolons.
- Follow numbered file naming in `cypher/`: `NN-purpose.cypher` where NN is the next sequential number.
- Cypher files must be idempotent — running them multiple times produces the same graph state.
- Always set upper bounds on variable-length paths: `*1..5` not `*` (prevents runaway traversals).
