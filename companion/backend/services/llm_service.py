"""
LLM Service — thin wrapper around the Anthropic SDK.
Provides a single call_llm() helper used by all agents.
"""

from __future__ import annotations
import os
import json
from typing import Optional
import anthropic

_client: Optional[anthropic.Anthropic] = None


def get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        api_key = os.getenv("ANTHROPIC_API_KEY", "")
        _client = anthropic.Anthropic(api_key=api_key)
    return _client


def is_demo_mode() -> bool:
    return os.getenv("DEMO_MODE", "false").lower() == "true" or not os.getenv("ANTHROPIC_API_KEY")


async def call_llm(
    system_prompt: str,
    user_message: str,
    max_tokens: int = 2048,
    model: str = "claude-sonnet-4-6",
) -> str:
    """Call Claude and return the text response. Falls back gracefully in demo mode."""
    if is_demo_mode():
        return f"[DEMO MODE] LLM response for: {user_message[:80]}..."

    client = get_client()
    response = client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=system_prompt,
        messages=[{"role": "user", "content": user_message}],
    )
    return response.content[0].text


async def call_llm_json(
    system_prompt: str,
    user_message: str,
    max_tokens: int = 4096,
    model: str = "claude-sonnet-4-6",
) -> dict:
    """Call Claude expecting a JSON response. Parses and returns the dict."""
    raw = await call_llm(
        system_prompt=system_prompt + "\n\nYou MUST respond with valid JSON only — no markdown fences, no explanation.",
        user_message=user_message,
        max_tokens=max_tokens,
        model=model,
    )
    # Strip markdown code fences if model adds them
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw)


async def call_llm_with_history(
    system_prompt: str,
    history: List[dict],
    max_tokens: int = 1024,
    model: str = "claude-sonnet-4-6",
) -> str:
    """Call Claude with a full message history (for chat)."""
    if is_demo_mode():
        return (
            "I'm currently running in demo mode. In production, I would provide "
            "intelligent, persona-driven responses grounded in your medical report. "
            "Please set ANTHROPIC_API_KEY to enable live AI responses."
        )

    client = get_client()
    response = client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=system_prompt,
        messages=history,
    )
    return response.content[0].text
