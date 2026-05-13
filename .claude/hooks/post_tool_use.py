#!/usr/bin/env python3
"""PostToolUse hook: auto-format & lint the file Claude just edited.

- Python files under backend/ → ruff check --fix + ruff format (via uv run)
- TS/JS/JSON/CSS files under frontend/ → biome check --write (via pnpm exec)

Tool output is collected and fed back to Claude via additionalContext so the
agent can self-correct on remaining violations. Hook never blocks (exit 0)
because formatters/linters reflowing whitespace shouldn't halt the workflow.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

PROJECT_DIR = Path(os.environ.get("CLAUDE_PROJECT_DIR", Path.cwd()))
PY_EXTS = {".py"}
JS_EXTS = {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".css"}


def run(cmd: list[str], cwd: Path) -> tuple[int, str]:
    try:
        result = subprocess.run(
            cmd,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=30,
        )
    except FileNotFoundError as exc:
        return 127, f"command not found: {exc}"
    except subprocess.TimeoutExpired:
        return 124, f"timeout: {' '.join(cmd)}"
    output = (result.stdout or "") + (result.stderr or "")
    return result.returncode, output.strip()


def format_python(file_path: Path) -> list[str]:
    backend = PROJECT_DIR / "backend"
    rel = file_path.relative_to(backend) if file_path.is_relative_to(backend) else file_path
    messages: list[str] = []
    for cmd in (
        ["uv", "run", "--project", str(backend), "ruff", "check", "--fix", str(rel)],
        ["uv", "run", "--project", str(backend), "ruff", "format", str(rel)],
    ):
        code, out = run(cmd, cwd=backend)
        if code != 0 and out:
            messages.append(f"$ {' '.join(cmd[3:])}\n{out}")
    return messages


def format_js(file_path: Path) -> list[str]:
    frontend = PROJECT_DIR / "frontend"
    if not file_path.is_relative_to(frontend):
        return []
    rel = file_path.relative_to(frontend)
    cmd = ["pnpm", "exec", "biome", "check", "--write", "--no-errors-on-unmatched", str(rel)]
    code, out = run(cmd, cwd=frontend)
    if code != 0 and out:
        return [f"$ biome check --write {rel}\n{out}"]
    return []


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        return 0

    tool_input = payload.get("tool_input") or {}
    file_path_str = tool_input.get("file_path")
    if not file_path_str:
        return 0

    file_path = Path(file_path_str)
    if not file_path.exists():
        return 0

    suffix = file_path.suffix.lower()
    messages: list[str] = []

    backend_dir = PROJECT_DIR / "backend"
    frontend_dir = PROJECT_DIR / "frontend"

    if suffix in PY_EXTS and file_path.is_relative_to(backend_dir):
        messages = format_python(file_path)
    elif suffix in JS_EXTS and file_path.is_relative_to(frontend_dir):
        messages = format_js(file_path)
    else:
        return 0

    if messages:
        text = "\n\n".join(messages)
        output = {
            "hookSpecificOutput": {
                "hookEventName": "PostToolUse",
                "additionalContext": (
                    f"Auto-format/lint reported issues for {file_path.name}. "
                    "Fix the violations below before continuing:\n\n" + text
                ),
            }
        }
        print(json.dumps(output))

    return 0


if __name__ == "__main__":
    sys.exit(main())
