# Business rules and BPFs

**Tooling**: `/app-builder` (Microsoft `model-apps` plugin) creates business rules and BPFs as part of an app plan; otherwise use the designers in the maker portal inside the solution, then export/unpack.

**Business rules**: scope Entity (also runs server-side) vs Form. Use for show/hide, required, defaults and simple validation. Keep chains short and document order.

**Business process flows**: stages map to required columns; 3–6 stages; branch sparingly. BPFs are tables: include them in the solution and grant role privileges.

For logic that must run regardless of UI use a flow, a low-code (Power Fx) plug-in or a C# plug-in (`pro-code-developer`).
