Use the Figma plugin for this workspace whenever the task involves a Figma file, node URL, screenshot, component mapping, design tokens, or implementation from design.

Preferred workflow in this repo:

1. For Figma URLs or node IDs, use Figma tools first instead of guessing from screenshots.
2. Prefer `get_design_context` over raw metadata when implementing UI from Figma.
3. Use Code Connect mappings when available before generating fresh component code.
4. If writing back to Figma, load the `figma-use` skill first.
5. Keep output aligned with the existing HCMInvHub visual language unless the user asks for a new direction.

Common Figma tasks for this repo:

- Implement pages or components from Figma into the React app.
- Pull screenshots, variables, and node context for review.
- Create or inspect Code Connect mappings.
- Generate design system rules that match the codebase.
