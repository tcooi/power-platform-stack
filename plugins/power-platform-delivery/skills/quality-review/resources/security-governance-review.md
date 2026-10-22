# Security and governance review

- DLP: connectors used vs environment policy groups; no HTTP to unknown hosts (`pac admin dlp-policy list`).
- Flows, agents and connections owned by service accounts or application users with a co-owner; no personal connections in PROD.
- Secrets in secret-type environment variables or Key Vault, not in flow definitions or exported values.
- Roles: no System Administrator for end users or app users (note `pac admin create-service-principal` defaults to it); audit on sensitive tables.
- Apps shared to security groups, not individuals.
- Dataverse MCP: enabled only where needed, allowed clients reviewed per environment; consumption billed in Copilot Credits outside Copilot Studio.
- Licensing: premium connectors, managed environments, Dataverse capacity, Copilot Studio / Copilot Credits for real user counts.
