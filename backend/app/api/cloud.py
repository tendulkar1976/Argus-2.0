"""NVIDIA hosted inference; credentials never leave the backend."""
import os
import time
import asyncio
import hmac
import re
from collections import deque
from typing import Literal
import httpx
from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel, Field
from app.services.task_analyzer import TaskAnalyzer
from app.services.prompt_rewriter import PromptRewriter
from app.services.candidate_validator import CandidateValidator
from app.services.ollama_service import OllamaService

router = APIRouter(prefix="/cloud", tags=["Cloud inference"])
BASE = "https://integrate.api.nvidia.com/v1"
slots = asyncio.Semaphore(1)
recent = deque()

def authorize(x_argus_access: str = Header(default="")):
    secret = os.getenv("ARGUS_ACCESS_TOKEN", "")
    if not secret or not os.getenv("NVIDIA_API_KEY"):
        raise HTTPException(503, "Cloud inference is not configured.")
    if not hmac.compare_digest(x_argus_access.encode(), secret.encode()):
        raise HTTPException(401, "Invalid access token.")

def rate_limit():
    now = time.monotonic()
    while recent and recent[0] <= now - 60:
        recent.popleft()
    if len(recent) >= 4:
        raise HTTPException(429, "Cloud request limit reached. Try again shortly.")
    recent.append(now)

class CloudRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=12000)
    model: str = Field(min_length=1, max_length=200)
    mode: Literal["balanced", "concise", "structure"] = "balanced"
    benchmark: bool = False
    output_limit: int = Field(default=4096, ge=256, le=8192)

def headers():
    return {"Authorization": "Bearer " + os.environ["NVIDIA_API_KEY"]}

async def upstream(client, method, path, **kwargs):
    try:
        response = await client.request(method, BASE + path, headers=headers(), **kwargs)
        if response.status_code == 429:
            raise HTTPException(429, "NVIDIA rate limit reached.")
        if response.status_code == 404:
            raise HTTPException(502, "Selected NVIDIA model or endpoint is unavailable for inference. Choose another model.")
        if response.status_code >= 400:
            raise HTTPException(502, f"NVIDIA request failed (HTTP {response.status_code}).")
        return response.json()
    except httpx.TimeoutException:
        raise HTTPException(504, "NVIDIA request timed out.")
    except (httpx.RequestError, ValueError):
        raise HTTPException(502, "NVIDIA service unavailable or invalid response.")

async def catalog(client):
    data = await upstream(client, "GET", "/models")
    return sorted({m["id"] for m in data.get("data", []) if isinstance(m, dict) and isinstance(m.get("id"), str)})

async def generate(client, model, messages, limit):
    start = time.monotonic()
    data = await upstream(client, "POST", "/chat/completions", json={
        "model": model, "messages": messages, "max_tokens": limit, "temperature": 0.2, "stream": False
    })
    try:
        choice = data["choices"][0]
        content = choice["message"]["content"]
        if not isinstance(content, str) or not content.strip():
            raise ValueError()
    except (KeyError, IndexError, TypeError, ValueError):
        raise HTTPException(502, "Selected model did not return usable chat text.")
    usage = data.get("usage") or {}
    return {"text": content.strip(), "usage": {k: usage.get(k) if isinstance(usage.get(k), int) else None for k in ("prompt_tokens", "completion_tokens", "total_tokens")}, "latency_ms": round((time.monotonic()-start)*1000), "finish_reason": choice.get("finish_reason")}

@router.get("/status")
async def status():
    return {"configured": bool(os.getenv("NVIDIA_API_KEY") and os.getenv("ARGUS_ACCESS_TOKEN")), "provider": "NVIDIA"}

@router.get("/models", dependencies=[Depends(authorize)])
async def models():
    rate_limit()
    async with httpx.AsyncClient(timeout=30) as client:
        return {"models": await catalog(client)}

@router.post("/optimize", dependencies=[Depends(authorize)])
async def optimize(req: CloudRequest):
    rate_limit()
    if slots.locked():
        raise HTTPException(429, "Another cloud execution is running.")
    original = req.prompt.strip()
    if not original:
        raise HTTPException(422, "Prompt cannot be blank.")
    async with slots, httpx.AsyncClient(timeout=90) as client:
        if req.model not in await catalog(client):
            raise HTTPException(422, "Select a model from the current NVIDIA catalog.")
        analysis = TaskAnalyzer.analyze(original)
        # Conservative prefix-only edits; never rewrite embedded code or quoted text.
        started = time.monotonic()
        candidate = original
        if not any(marker in original for marker in ('```', '\n', '"', "'")):
            candidate = re.sub(r"^(?:I would like you to (?:please )?|Could you please |Can you please |Please )(?=[A-Za-z])", "", original, count=1, flags=re.I)
            candidate = candidate[:1].upper() + candidate[1:]
        rewrite = {"usage":{"prompt_tokens":0,"completion_tokens":0,"total_tokens":0},
                   "latency_ms":round((time.monotonic()-started)*1000),"finish_reason":"stop"}
        validation = CandidateValidator.validate(original, candidate, analysis)
        before = OllamaService.estimate_tokens(original).estimated_tokens
        after = OllamaService.estimate_tokens(candidate).estimated_tokens
        accepted = validation.is_valid and rewrite["finish_reason"] == "stop" and after < before
        optimized = candidate if accepted else original
        result = {"original":original,"optimized":optimized,"model":req.model,
            "validation":"heuristic_pass" if accepted else "original_preserved",
            "validation_reason":None if accepted else (validation.reason or "No verified reduction or incomplete rewrite."),
            "estimated_original_tokens":before,"estimated_optimized_tokens":after if accepted else before,
            "route":"local_rules" if accepted else "bypass","optimizer_usage":rewrite["usage"],"optimizer_latency_ms":rewrite["latency_ms"],"benchmark":None}
        if req.benchmark:
            a = await generate(client, req.model, [{"role":"user","content":original}], req.output_limit)
            b = await generate(client, req.model, [{"role":"user","content":optimized}], req.output_limit)
            x,y = a["usage"]["total_tokens"],b["usage"]["total_tokens"]
            overhead = rewrite["usage"]["total_tokens"]
            result["benchmark"]={"original":a,"optimized":b,"gross_tokens_saved":x-y if x is not None and y is not None else None,
                "net_tokens_saved":x-y-overhead if x is not None and y is not None and overhead is not None else None,
                "quality_assessment":"Incomplete benchmark: at least one response did not finish normally." if a["finish_reason"] != "stop" or b["finish_reason"] != "stop" else "Responses completed; semantic quality not evaluated."}
        return result
