#!/usr/bin/env python3
"""PreToolUse hook: protect harness/configuration files from agent edits.

Hard-blocks edits to: .env files, .claude/settings.json, frontend/biome.json,
frontend/eslint.config.mjs. Soft-warns on pyproject.toml edits so dependency
additions still work but ruff/mypy section drift is flagged.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

HARD_BLOCK_BASENAMES = {
    "biome.json",
    "eslint.config.mjs",
    "eslint.config.js",
    "eslint.config.ts",
}

HARD_BLOCK_SUFFIXES = (
    ".env",
    ".env.local",
    ".env.production",
    ".env.development",
)

SOFT_WARN_BASENAMES = {"pyproject.toml"}


def is_env_file(name: str) -> bool:
    return name == ".env" or name.startswith(".env.") and not name.endswith(".example")


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        return 0

    tool_input = payload.get("tool_input") or {}
    file_path = tool_input.get("file_path") or tool_input.get("notebook_path")
    if not file_path:
        return 0

    path = Path(file_path)
    name = path.name

    rel = file_path
    if ".claude/settings.json" in rel or rel.endswith("/.claude/settings.json"):
        print(
            "Refusing to edit .claude/settings.json. Hooks configuration is harness "
            "infrastructure; if you really need a change, ask the user to edit it manually.",
            file=sys.stderr,
        )
        return 2

    if is_env_file(name):
        print(
            f"Refusing to edit {name}: secret material lives here. "
            "If you need a new variable, document it in .env.example instead.",
            file=sys.stderr,
        )
        return 2

    if name in HARD_BLOCK_BASENAMES:
        print(
            f"Refusing to edit {name}: linter/formatter config is locked. "
            "Configuration changes require explicit human approval.",
            file=sys.stderr,
        )
        return 2

    for suffix in HARD_BLOCK_SUFFIXES:
        if name == suffix:
            print(f"Refusing to edit {name}: env files are locked.", file=sys.stderr)
            return 2

    if name in SOFT_WARN_BASENAMES:
        output = {
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "additionalContext": (
                    f"Note: editing {name}. Adding/removing dependencies is fine, but do NOT "
                    "modify [tool.ruff*] or [tool.mypy] sections without explicit user approval — "
                    "those are part of the harness."
                ),
            }
        }
        print(json.dumps(output))
        return 0

    return 0


if __name__ == "__main__":
    sys.exit(main())
