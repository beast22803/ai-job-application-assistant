"""
config.py — Application and LLM provider configuration.
"""
from __future__ import annotations

import os
from dotenv import load_dotenv

load_dotenv()

import openai
from langchain_openai import ChatOpenAI
from langchain_ollama import ChatOllama

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///agent_memory.db")

# LLM Configuration
_DEFAULT_PROVIDER    = os.getenv("PROVIDER", "openrouter")
_OPENROUTER_BASE     = "https://openrouter.ai/api/v1"
_OPENROUTER_MODEL    = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct:free")
_OPENROUTER_FALLBACK = os.getenv("OPENROUTER_FALLBACK_MODEL", "nousresearch/hermes-3-llama-3.1-405b:free")
_OLLAMA_BASE         = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
_OLLAMA_MODEL        = os.getenv("OLLAMA_MODEL", "llama3.2")
_MAX_ITERATIONS      = int(os.getenv("MAX_ITERATIONS", "1"))


def _make_openrouter(model: str, api_key: str, temperature: float):
    base_llm = ChatOpenAI(
        base_url=_OPENROUTER_BASE,
        api_key=api_key,
        model=model,
        temperature=temperature,
        timeout=60,
        max_retries=0,
    )
    return base_llm.with_retry(
        retry_if_exception_type=(
            openai.RateLimitError,
            openai.APIStatusError,
            openai.APIConnectionError,
        ),
        stop_after_attempt=6,
        wait_exponential_jitter=True,
    )


def get_llm(
    provider: str | None = None,
    model_name: str | None = None,
    temperature: float = 0.7,
):
    """Return a LangChain chat model for the requested provider."""
    provider = (provider or _DEFAULT_PROVIDER).lower()

    if provider == "openrouter":
        api_key = os.getenv("OPENROUTER_API_KEY")
        if not api_key:
            raise EnvironmentError("OPENROUTER_API_KEY is not set.")
        model   = model_name or _OPENROUTER_MODEL
        primary  = _make_openrouter(model, api_key, temperature)
        fallback = _make_openrouter(_OPENROUTER_FALLBACK, api_key, temperature)
        return primary.with_fallbacks([fallback])

    if provider == "ollama":
        return ChatOllama(
            base_url=_OLLAMA_BASE,
            model=model_name or _OLLAMA_MODEL,
            temperature=temperature,
        )

    raise ValueError(f"Unknown provider '{provider}'. Choose 'openrouter' or 'ollama'.")


def get_max_iterations() -> int:
    return _MAX_ITERATIONS
