# Solution checker review

```
pac solution check --path out/<sol>_managed.zip --outputDirectory out/check --geo <Europe|UnitedStates|...>
```
- `--ruleSet` defaults to "Solution Checker"; use "AppSource Certification" for ISV work. `--saveResults` stores results for the Solution Health Hub.
- Critical/High: fix or written waiver. Medium: review. Low: track.
- Fix at the root (sync XHR, deprecated APIs, plug-in anti-patterns). Record waivers in `docs/checker-waivers.md` with reason and owner.
- In CI: `check-solution` (GitHub) or `PowerPlatformChecker@2` with `ErrorLevel`/`ErrorThreshold` (Azure DevOps). Managed environments can enforce checker on import.

Sources: learn.microsoft.com/power-platform/developer/cli/reference/solution#pac-solution-check
