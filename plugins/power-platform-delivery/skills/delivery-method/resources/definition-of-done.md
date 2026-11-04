# Definition of Done

The same bar for every change, on top of the change's own acceptance criteria. A change is done only when **both** are met. Acceptance criteria answer "did we build the right thing?"; this list answers "is it finished to our standard?". Items marked **(verify)** are checked by `ppdv verify`; the rest you confirm and record.

Report it as a short checklist with evidence (command output, file path, test result). Anything not done is either fixed or listed as an open item with the user's agreement; never left out.

## Built right
- [ ] Every new or changed component is in the project solution **(verify)**
- [ ] Publisher prefix on every new component **(verify)**; no `new_` or default-publisher items
- [ ] No unmanaged changes made in test or production; managed components changed only in dev
- [ ] Connection references and environment variables instead of personal connections and hard-coded URLs, IDs or e-mail addresses
- [ ] Dataverse-triggered flows have a registered trigger **(verify)**, error handling, and filtering columns on update triggers
- [ ] Project `standards` in `.pp/project.json` applied

## Secure
- [ ] A security role grants exactly what the design says (least depth); no System Administrator or System Customizer as a shortcut
- [ ] Tested as each affected persona with `ppdv test as-user` (not as admin): allowed and denied operations both checked
- [ ] No secrets in code, flows, plug-in configuration or the repo

## Works
- [ ] Acceptance criteria tested, including denied and failure paths
- [ ] Regression suite for the app (`tests/<app>/`) passes; a new case added for every bug fixed
- [ ] Solution checker run; findings fixed or waived with a written reason (`quality-review`)
- [ ] Test-only items recorded with `ppdv artifacts add` (and removed with `ppdv teardown` when finished)

## Documented and releasable
- [ ] Decisions recorded (`ppdv state add --kind decision`) with the reason, especially config vs code and custom vs out-of-the-box
- [ ] As-built document for the app updated (`docs/as-built/<app>.md`)
- [ ] Deployment settings file updated for new connection references or environment variables
- [ ] Solution exported and unpacked (or committed through Git integration); version increased for a release
- [ ] Release notes entry (`docs/releases/<version>.md`) when it ships
