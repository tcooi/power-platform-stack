#!/bin/sh
# Finds guard-hook.mjs in Claude Code or Copilot CLI installs and runs it.
# Fail-safe: if the script or node can't be found, allow the call (exit 0) rather than blocking every tool use.
for d in "$CLAUDE_PLUGIN_ROOT" "$PLUGIN_ROOT" "$(dirname "$0")/.." "$HOME"/.copilot/installed-plugins/*/power-platform-delivery; do
  if [ -n "$d" ] && [ -f "$d/scripts/guard-hook.mjs" ] && command -v node >/dev/null 2>&1; then
    exec node "$d/scripts/guard-hook.mjs"
  fi
done
cat >/dev/null
exit 0
