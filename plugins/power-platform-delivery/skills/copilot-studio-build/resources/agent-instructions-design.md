# Agent instructions design

Structure instructions as: Role -> Goal -> Rules (what to do/never do) -> Tool use guidance -> Response style -> Escalation.
- Name tools in the instructions and say when to call each.
- Keep each tool/topic description 1-2 sentences describing *when*, not *how*.
- Ground answers in knowledge sources; state what to do when nothing is found.
- Avoid contradicting rules; test with adversarial prompts.
