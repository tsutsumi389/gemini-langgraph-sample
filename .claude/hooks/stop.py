#!/usr/bin/env python3
"""Stop hook: gate task completion on backend + frontend test/type-check pass.

Runs at agent stop time. Order:
  1. backend: uv run mypy
  2. backend: uv run pytest -q
  3. frontend: pnpm exec biome check (no --write; CI semantics)
  4. frontend: pnpm test

Any failure → exit 2 with stderr containing the failing tool's output, which
forces Claude to continue and fix instead of declaring done. Honors
stop_hook_active to avoid loops if this hook itself triggered the restart.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

PROJECT_DIR = Path(os.environ.get("CLAUDE_PROJECT_DIR", Path.cwd()))
BACKEND = PROJECT_DIR / "backend"
FRONTEND = PROJECT_DIR / "frontend"

CHECKS: list[tuple[str, list[str], Path]] = [
    ("backend mypy", ["uv", "run", "mypy"], BACKEND),
    ("backend pytest", ["uv", "run", "pytest", "-q"], BACKEND),
    ("frontend biome", ["pnpm", "exec", "biome", "check", "."], FRONTEND),
    ("frontend vitest", ["pnpm", "test"], FRONTEND),
]


def run(cmd: list[str], cwd: Path) -> tuple[int, str]:
    try:
        result = subprocess.run(
            cmd,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=180,
        )
    except FileNotFoundError as exc:
        return 127, f"command not found: {exc}"
    except subprocess.TimeoutExpired:
        return 124, f"timeout after 180s: {' '.join(cmd)}"
    return result.returncode, ((result.stdout or "") + (result.stderr or "")).strip()


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        payload = {}

    if payload.get("stop_hook_active"):
        return 0

    failures: list[str] = []
    for label, cmd, cwd in CHECKS:
        if not cwd.exists():
            continue
        code, output = run(cmd, cwd)
        if code != 0:
            tail = "\n".join(output.splitlines()[-40:])
            failures.append(f"[{label}] FAILED (exit {code})\n$ {' '.join(cmd)}\n{tail}")

    if failures:
        print(
            "Stop blocked: completion gate failed. Fix the issues below and re-run, "
            "do NOT declare the task done.\n\n" + "\n\n---\n\n".join(failures),
            file=sys.stderr,
        )
        return 2

    return 0


if __name__ == "__main__":
    sys.exit(main())
