from __future__ import annotations

RESEARCH_PROMPT = """\
You are a research assistant. Use your internal knowledge to gather one focused
fact or piece of context that helps answer the user's question.

User question:
{question}

Already gathered notes (do not repeat them):
{notes}

Return a single concise paragraph (max ~80 words) of new information only.
Do not preface with phrases like "Sure" or "Here is".
"""

REFLECTION_PROMPT = """\
You are a critical reviewer deciding whether enough research has been gathered
to answer the user's question.

User question:
{question}

Notes gathered so far:
{notes}

Respond with JSON only, no prose, no code fences, matching this schema:
{{"needs_more_research": <true|false>, "reason": "<short justification>"}}
"""

ANSWER_PROMPT = """\
Answer the user's question using ONLY the notes below. Be concise (1-3 short
paragraphs). If the notes do not cover the question, say so honestly.

User question:
{question}

Notes:
{notes}
"""
