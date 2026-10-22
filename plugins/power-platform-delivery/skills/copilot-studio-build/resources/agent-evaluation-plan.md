# Agent evaluation plan

1. Build a test set of 30+ questions: top intents, ambiguous requests, out-of-scope, prompt-injection attempts, multi-turn.
2. Define expected answer or key facts and graders (compare meaning, keyword, tool-called).
3. Run in the Evaluate tab; record pass rate per category; fix instructions/tools; re-run.
4. Gate: publish only above agreed pass rate; keep the set in source control and re-run on every change.
