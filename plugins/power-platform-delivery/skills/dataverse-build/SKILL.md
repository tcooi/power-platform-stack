---
name: dataverse-build
description: "Our standards for building Dataverse tables, columns, relationships, keys and data, applied with Microsoft's dataverse plugin (dv-metadata, dv-data, dv-solution) or /app-builder, with ppdv as fallback. Use whenever schema or data is created or changed."
---

# Dataverse build standards

**Microsoft tool**: `dataverse` plugin (`dv-metadata`, `dv-data`, `dv-query`, `dv-solution`, `dv-security`). If it isn't installed, `/app-builder` (model-apps) builds tables, columns, relationships, forms and views from one approved spec; other fallbacks are in `tool-selection-guide`. Details: `resources/dataverse-schema-build.md`, `resources/sample-data-load.md`, `security-roles`.

## Verified (TEST-US, 2026-10-22)
`dv-metadata` built a whole-number column through the Dataverse CLI (`dataverse api request`) with the solution header, read it back and checked solution membership. Microsoft's Python SDK can't set a min/max range on whole-number columns, so ranges go through the Web API route. Dataverse MCP needs the environment's MCP setting and the client allow-list (admin, billed outside Copilot Studio); without it the dv-* skills use the CLI/SDK.

## Our rules
- Build from the approved data model (`docs/design/`); no unapproved tables or columns.
- Reuse standard tables first; every new name uses the publisher prefix.
- Dependency order: global choices, parent tables, child tables, relationships, alternate keys, then forms/views.
- Formula columns, not calculated columns (see `pro-code` (resources/ce-customization-patterns.md)).
- Alternate keys on anything loaded from another system, so loads can upsert.
- Never delete tables, columns or data without explicit approval naming the item.
- Roles: build and assign with the tool matrix in `security-roles` (`/app-builder` personas for the app's own roles, Web API for the rest); application users never get System Administrator.


## Always
- Run in the main session (the Microsoft skills ask you questions and wait for approval).
- Load `.pp/project.json`; confirm environment (`pac org who`), solution and prefix before the first change.
- After building, confirm every new component is in the solution (`ppdv solution has`; `ppdv solution add` if not), export and unpack (or commit via Git integration), record test-only items with `ppdv artifacts add`, and log progress with `ppdv state task|add` (never hand-edit the state file).

## Detailed guidance (load the file you need)
- `resources/dataverse-schema-build.md` — Create Dataverse tables, columns, relationships, choices and alternate keys in a solution using Microsoft's dv-metadata skill, the Dataverse SDK for Python or the Web API. Use when implementing an approved data model.
- `resources/sample-data-load.md` — Load sample or migration data into Dataverse with the right bulk API (CreateMultiple, UpdateMultiple, UpsertMultiple, $batch) via Microsoft's dv-data skill, Dataverse SDK for Python, Dataverse CLI or Web API. Use for test data or initial loads.
