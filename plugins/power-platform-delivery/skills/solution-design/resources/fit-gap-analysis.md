# Fit-gap analysis

For each requirement produce a row:

| ID | Requirement | Fit | Approach | Effort (S/M/L) | Risk | Licence impact |
|---|---|---|---|---|---|---|

**Fit values**: `OOTB` (works as shipped) / `Config` (settings, views, forms, business rules) / `Low-code` (Power Fx, flows, canvas) / `Pro-code` (plug-in, PCF, web resource, custom API) / `Gap` (needs ISV, redesign or descope).

Rules of thumb:
- Search the shipped apps (Sales, Customer Service, Field Service, Project Operations) for the capability before proposing anything.
- Pro-code needs a written reason why config/low-code cannot do it.
- Anything touching an external system needs an integration entry (auth, volume, failure handling).
- End with a summary count per fit value and the top 5 risks.
