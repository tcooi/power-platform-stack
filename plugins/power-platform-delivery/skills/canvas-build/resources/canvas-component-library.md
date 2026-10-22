# Component library

- Create the component library in Power Apps Studio inside the solution; expose custom properties (input/output/event).
- Theme tokens as named formulas; no hard-coded colors on screens.
- Version library changes; consuming apps must accept updates, so batch breaking changes.
- Responsive (`Parent.Width`) and accessible (labels, focus order, contrast).

**Tooling**: edit components with Microsoft's `canvas-apps` plugin; ship library and consuming apps through the solution. `pac canvas pack/unpack` is deprecated.
