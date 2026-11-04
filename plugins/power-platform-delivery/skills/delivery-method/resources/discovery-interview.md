# Discovery interview

Clients ask for what they think a solution looks like ("a dashboard", "a new form", "an app like the old one"), not for the problem. The cheapest moment to find the gap is before any design or build. The lead runs this interview in the main session; sub-agents can't ask questions.

## When
- A new build or change request is missing at least one of: **who** uses it, **why** now, what **success** looks like, the binding **constraint**.
- The request names a solution instead of a problem.
- You are about to fill a gap with an assumption that would change the design.

Skip it for clear, self-contained requests, how-to questions, and when the user says to go ahead with assumptions. Never run it in an unattended run (evals, CI): list the open questions as blockers instead.

## How
1. **Write your hypothesis first**, in one sentence, with an honest confidence and what's missing:
   `HYPOTHESIS: Team leads need to see overdue cases at the morning stand-up; "dashboard" is the convention. CONFIDENCE: ~40% (missing: who exactly, which cases count as overdue, which device)`
2. **Ask one question at a time, with your best guess attached**, so the user can confirm in one word:
   `Who opens this first thing in the morning? My guess: the five team leads, on a laptop, in the Customer Service Hub.`
3. **Update the hypothesis and confidence** after each answer. Stop at about 95%, when you can predict the user's next answers, or when they say "enough".
4. **Read before asking**: as-built docs, `.pp/project.json`, the environment (installed Dynamics apps, existing tables and roles). Never ask what you can look up.
5. **Write the confirmed intent** to `docs/requirements.md` (or `docs/changes/<id>.md`): the final hypothesis, the answers, and what was explicitly left out. Pass it into the requirements-analyst brief.

## Power Platform questions worth covering
| Area | Why it changes the design |
|---|---|
| Users and personas, and how many | Security roles, licensing cost, model-driven vs canvas |
| Licences they already have (Dynamics 365, Power Apps premium, per-app) | Premium connectors, Dataverse access, Copilot Studio credits |
| Does an out-of-the-box Dynamics 365 or Dataverse table already do this? | Fit-gap: configure before you build |
| Data: volume, where it lives today, migration, retention | Delegation, storage capacity, integration pattern |
| Integrations and who owns the other side | Connectors vs custom APIs, service accounts, DLP policies |
| Devices and offline | Mobile app, offline profile, canvas vs model-driven |
| Success measure and deadline | Scope for the first release |
| Compliance (data residency, audit, GDPR) | Environment region, auditing, retention policies |
