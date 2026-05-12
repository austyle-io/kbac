// Fulltext indexes for Domain and System labels, added for the kbac query CLI.
// Idempotent — uses IF NOT EXISTS.

CREATE FULLTEXT INDEX domain_search IF NOT EXISTS
FOR (n:Domain) ON EACH [n.name, n.description];

CREATE FULLTEXT INDEX system_search IF NOT EXISTS
FOR (n:System) ON EACH [n.name, n.description];
