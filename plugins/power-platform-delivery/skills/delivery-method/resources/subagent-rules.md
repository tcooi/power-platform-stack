# Sub-agent rules (canonical)

Every sub-agent file carries this block verbatim (checked by `scripts/validate.py`). Change it here first, then in every agent.

## Sub-agent rules (you run without the user)
- You cannot ask the user questions. Make reasonable assumptions, list them, and return open questions in your hand-back instead of stopping.
- Work only from the brief: environment, solution, publisher prefix and approvals come from it (and from `.pp/project.json` if present). Never guess the environment.
- Do not change any environment unless the brief says that exact change is approved.
- Hand back in this shape: **Summary**, **Artifacts** (paths), **Assumptions**, **Open questions**, **Risks**, **Next step**.
