// Migration: drop varlock/1Password-era nodes from the live graph.
//
// Run once via `yarn cypher cypher/08-migration-drop-varlock.cypher`.
// Idempotent — DETACH DELETE is a no-op when the nodes are already gone.
//
// Subsequent `yarn db:reset` would re-create a clean graph from the
// edited seed files without any of these nodes, but running this
// migration avoids a full reset on machines that already have a
// populated graph from the pre-migration era.

MATCH (t:Tool) WHERE t.id IN ['varlock', '1password']
WITH t
DETACH DELETE t
RETURN count(t) AS deleted_tools;

MATCH (c:Concept) WHERE c.id IN ['credential-injection', 'biometric-auth']
WITH c
DETACH DELETE c
RETURN count(c) AS deleted_concepts;

MATCH (s:System {id: 'varlock-1password-pipeline'})
DETACH DELETE s
RETURN count(s) AS deleted_systems;

MATCH (d:Domain {id: 'credential-management'})
DETACH DELETE d
RETURN count(d) AS deleted_domains;
