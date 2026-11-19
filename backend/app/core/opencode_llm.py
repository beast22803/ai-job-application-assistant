"""
opencode_llm.py — Use the opencode CLI / server (https://opencode.ai) as the LLM.

Two ways to reach opencode, chosen by environment variables:

* ``OPENCODE_SERVER_URL`` set  -> talk to a running ``opencode serve`` over HTTP
  (fast, no per-call start-up cost; recommended).
* otherwise                    -> run ``opencode run --format json`` as a subprocess.

opencode is a coding agent, so every request is wrapped to behave like a plain
text-completion call: tools are switched off (HTTP) / the model is told not to use
them (CLI) and the CLI runs in an empty scratch directory.

opencode must be installed on the same machine as this backend (or reachable via
OPENCODE_SERVER_URL), so this provider is meant for running the backend locally.
"""
from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import tempfile
from typing import Any, List, Optional

import requests
from langchain_core.callbacks import CallbackManagerForLLMRun
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_core.outputs import ChatGeneration, ChatResult

_GUARD = (
    "You are being used as a plain text-generation API, not as a coding agent. "
    "Do NOT use any tools, do NOT read, create or edit files and do NOT run commands. "
    "Reply with ONLY the requested output — no preamble, no explanations, no markdown fences "
    "unless the instructions explicitly ask for them."
)

# Tool names that opencode may offer; all are disabled for HTTP calls.
_TOOLS_OFF = {t: False for t in (
    "bash", "edit", "write", "read", "grep", "glob", "list", "patch",
    "webfetch", "websearch", "todowrite", "todoread", "task", "skill",
)}

_ANSI = re.compile(r"\x1b\[[0-9;]*[A-Za-z]")


class OpenCodeError(RuntimeError):
    pass


def _split_model(model: str) -> tuple[str, str]:
    """'openrouter/openai/gpt-oss-120b' -> ('openrouter', 'openai/gpt-oss-120b')."""
    provider, _, model_id = model.partition("/")
    if not model_id:
        raise OpenCodeError(f"OPENCODE_MODEL must look like 'provider/model', got '{model}'.")
    return provider, model_id


def _render_messages(messages: List[BaseMessage]) -> tuple[str, str]:
    """Return (system_text, user_text) for the conversation."""
    system = "\n\n".join(m.content for m in messages if isinstance(m, SystemMessage) and isinstance(m.content, str))
    turns = [m for m in messages if not isinstance(m, SystemMessage)]
    if len(turns) == 1:
        user = turns[0].content if isinstance(turns[0].content, str) else str(turns[0].content)
    else:
        lines = []
        for m in turns:
            who = "Assistant" if isinstance(m, AIMessage) else "User"
            lines.append(f"{who}: {m.content}")
        user = "\n\n".join(lines) + "\n\nAssistant:"
    return system, user


class ChatOpenCode(BaseChatModel):
    model: str = ""                      # 'provider/model'; empty -> opencode's own default
    server_url: Optional[str] = None
    username: str = "opencode"
    password: Optional[str] = None
    variant: Optional[str] = None        # reasoning effort, e.g. 'high'
    binary: str = "opencode"
    timeout: int = 300

    @property
    def _llm_type(self) -> str:
        return "opencode"

    # ── HTTP (opencode serve) ────────────────────────────────────────────────
    def _call_server(self, system: str, user: str) -> str:
        base = self.server_url.rstrip("/")
        auth = (self.username, self.password) if self.password else None

        def req(method: str, path: str, **kw):
            try:
                r = requests.request(method, base + path, auth=auth, timeout=self.timeout, **kw)
            except requests.RequestException as e:
                raise OpenCodeError(f"Cannot reach opencode server at {base}: {e}") from e
            if r.status_code >= 400:
                raise OpenCodeError(f"opencode server returned {r.status_code}: {r.text[:300]}")
            return r

        session_id = req("POST", "/session", json={"title": "jobanalyser"}).json()["id"]
        try:
            body: dict[str, Any] = {
                "system": f"{_GUARD}\n\n{system}".strip(),
                "tools": _TOOLS_OFF,
                "parts": [{"type": "text", "text": user}],
            }
            if self.model:
                provider, model_id = _split_model(self.model)
                body["model"] = {"providerID": provider, "modelID": model_id}
            if self.variant:
                body["variant"] = self.variant
            data = req("POST", f"/session/{session_id}/message", json=body).json()
        finally:
            try:
                req("DELETE", f"/session/{session_id}")
            except OpenCodeError:
                pass

        err = (data.get("info") or {}).get("error")
        if err:
            raise OpenCodeError(f"opencode model error: {json.dumps(err)[:300]}")
        text = "".join(p.get("text", "") for p in data.get("parts", []) if p.get("type") == "text")
        if not text.strip():
            raise OpenCodeError("opencode returned an empty response.")
        return text

    # ── CLI (opencode run) ───────────────────────────────────────────────────
    def _call_cli(self, system: str, user: str) -> str:
        exe = shutil.which(self.binary) or (self.binary if os.path.isfile(self.binary) else None)
        if not exe:
            raise OpenCodeError(
                f"'{self.binary}' was not found on PATH. Install opencode, set OPENCODE_BIN, "
                "or set OPENCODE_SERVER_URL to a running `opencode serve`."
            )
        prompt = f"{_GUARD}\n\n=== INSTRUCTIONS ===\n{system}\n\n=== INPUT ===\n{user}" if system else f"{_GUARD}\n\n{user}"
        cmd = [exe, "run", "--format", "json"]
        if self.model:
            cmd += ["-m", self.model]
        if self.variant:
            cmd += ["--variant", self.variant]
        cmd.append(prompt)
        with tempfile.TemporaryDirectory(prefix="opencode_") as scratch:
            try:
                proc = subprocess.run(cmd, cwd=scratch, capture_output=True, timeout=self.timeout, stdin=subprocess.DEVNULL)
            except subprocess.TimeoutExpired as e:
                raise OpenCodeError(f"opencode timed out after {self.timeout}s.") from e
        out = proc.stdout.decode("utf-8", "replace")
        texts, errors = [], []
        for line in out.splitlines():
            line = line.strip()
            if not line.startswith("{"):
                continue
            try:
                ev = json.loads(line)
            except ValueError:
                continue
            if ev.get("type") == "text":
                t = (ev.get("part") or {}).get("text")
                if isinstance(t, str):
                    texts.append(t)
            elif ev.get("type") == "error":
                errors.append(json.dumps(ev.get("error", ev))[:300])
        if errors and not texts:
            raise OpenCodeError(f"opencode error: {errors[0]}")
        text = "".join(texts).strip()
        if not text:
            # Older/newer versions may print plain text instead of JSON events.
            text = _ANSI.sub("", out).strip()
        if proc.returncode != 0 and not text:
            raise OpenCodeError(f"opencode exited with {proc.returncode}: {proc.stderr.decode('utf-8', 'replace')[:300]}")
        if not text:
            raise OpenCodeError("opencode returned an empty response.")
        return text

    # ── LangChain entry point ────────────────────────────────────────────────
    def _generate(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> ChatResult:
        system, user = _render_messages(messages)
        text = self._call_server(system, user) if self.server_url else self._call_cli(system, user)
        return ChatResult(generations=[ChatGeneration(message=AIMessage(content=text))])
