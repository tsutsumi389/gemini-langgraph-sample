#!/usr/bin/env python3
"""SessionStart hook: surface git state so the agent boots with current context."""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

PROJECT_DIR = Path(os.environ.get("CLAUDE_PROJECT_DIR", Path.cwd()))


def git(args: list[str]) -> str:
    try:
        result = subprocess.run(
            ["git", *args],
            cwd=PROJECT_DIR,
            capture_output=True,
            text=True,
            timeout=5,
        )
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return ""
    return (result.stdout or "").strip()


def main() -> int:
    branch = git(["rev-parse", "--abbrev-ref", "HEAD"]) or "(detached)"
    status = git(["status", "-s"])
    last_commit = git(["log", "-1", "--pretty=format:%h %s"])

    lines = [f"Branch: {branch}"]
    if last_commit:
        lines.append(f"Last commit: {last_commit}")
    if status:
        lines.append("Working tree:")
        lines.append(status)
    else:
        lines.append("Working tree: clean")

    output = {
        "hookSpecificOutput": {
            "hookEventName": "SessionStart",
            "additionalContext": "\n".join(lines),
        }
    }
    print(json.dumps(output))
    return 0


if __name__ == "__main__":
    sys.exit(main())
