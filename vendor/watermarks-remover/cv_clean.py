#!/usr/bin/env python3
"""Final step of buildcv's resume generation: strip AI watermarks.

Driver over the vendored watermarks-remover scripts (see ./README.md):

  Layer A — text_unicode.clean_text over every string in the CV JSON
            (invisible Unicode, exotic spaces, bidi and tag characters).
  Layer B — rewrite_text.apply_strategy over the prose fields only, and only
            when a rewrite backend is configured via WATERMARKS_REWRITE_*.
            Statistical watermarks live in generated prose, never in names,
            dates or links, so nothing else is ever rewritten.

Input  (stdin):  {"data": <cv json>, "options": {...}}
Output (stdout): {"cleaned": <cv json>, "report": {...}}

Fail-soft by contract: the database is never touched, and any error returns the
input unchanged with a "failed" report, so watermark removal can never break a
download. Options (all optional):

  options.layer_a: {nfkc, aggressive_homoglyphs, normalize_spaces,
                    strip_emoji_glue, strip_bidi}  — text_unicode defaults
  options.layer_b: {strategy, lang, style} — strategy defaults to the vendored
                    clean_strategy.json (WATERMARKS_CLEAN_STRATEGY_FILE wins)
"""

from __future__ import annotations

import copy
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from rewrite_text import apply_strategy, parse_strategy  # noqa: E402
from text_unicode import clean_text, inspect_text  # noqa: E402

# Layer B targets generated prose. Deliberately excludes names, headlines,
# locations, links, skills, badges and dates: a paraphrase must never move
# a job title or a date range, and a statistical watermark cannot live in a
# field nobody generates sentence-level text into.
PROSE_PATHS: tuple[tuple[str, ...], ...] = (
    ("summary",),
    ("about",),
    ("work", "*", "description", "*"),
    ("projects", "*", "description"),
)

LLM_BACKENDS = ("ollama", "openai-compatible")


def _walk(node, path=()):
    """Yields (path, holder, key) for every string leaf in a JSON blob."""
    if isinstance(node, dict):
        for key, value in node.items():
            if isinstance(value, str):
                yield (*path, key), node, key
            else:
                yield from _walk(value, (*path, key))
    elif isinstance(node, list):
        for index, value in enumerate(node):
            if isinstance(value, str):
                yield (*path, index), node, index
            else:
                yield from _walk(value, (*path, index))


def _matches(path: tuple[str, ...], pattern: tuple[str, ...]) -> bool:
    return len(path) == len(pattern) and all(
        star == "*" or star == part for part, star in zip(path, pattern)
    )


def _layer_a(data, options) -> tuple[object, dict]:
    """Applies text_unicode.clean_text to every string leaf."""
    opts = options.get("layer_a", {})
    kwargs = {
        "nfkc": bool(opts.get("nfkc", False)),
        "aggressive_homoglyphs": bool(opts.get("aggressive_homoglyphs", False)),
        "normalize_spaces": bool(opts.get("normalize_spaces", True)),
        "strip_emoji_glue": bool(opts.get("strip_emoji_glue", False)),
        "strip_bidi": bool(opts.get("strip_bidi", False)),
    }

    removed: dict[str, int] = {}
    replaced: dict[str, int] = {}
    suspicious_before = 0
    suspicious_after = 0
    touched: list[str] = []

    for path, holder, key in _walk(data):
        text = holder[key]
        suspicious_before += inspect_text(text).suspicious_total
        cleaned, stats = clean_text(text, **kwargs)
        suspicious_after += inspect_text(cleaned).suspicious_total
        if cleaned != text:
            holder[key] = cleaned
            touched.append(".".join(str(part) for part in path))
        for label, count in stats["removed"].items():
            removed[label] = removed.get(label, 0) + count
        for label, count in stats["replaced"].items():
            replaced[label] = replaced.get(label, 0) + count

    return data, {
        "ran": True,
        "changed": bool(touched),
        "removed": removed,
        "replaced": replaced,
        "removed_count": sum(removed.values()),
        "replaced_count": sum(replaced.values()),
        "suspicious_before": suspicious_before,
        "suspicious_after": suspicious_after,
        "fields_touched": touched,
    }


def _layer_b_config() -> tuple[str | None, str | None, str | None, str | None]:
    backend = os.environ.get("WATERMARKS_REWRITE_BACKEND", "").strip()
    model = os.environ.get("WATERMARKS_REWRITE_MODEL", "").strip() or None
    base_url = os.environ.get("WATERMARKS_REWRITE_BASE_URL", "").strip() or None
    api_key = os.environ.get("WATERMARKS_REWRITE_API_KEY", "").strip() or None

    if backend == "ollama":
        base_url = base_url or "http://127.0.0.1:11434"
    elif backend == "openai-compatible":
        if not base_url or not api_key:
            return backend, model, base_url, api_key
    else:
        # print-prompt is upstream's CI-safe default: it emits a prompt and
        # rewrites nothing, so there is no Layer B to run.
        return None, model, base_url, api_key

    return backend, model, base_url, api_key


def _default_strategy() -> str | None:
    env_file = os.environ.get("WATERMARKS_CLEAN_STRATEGY_FILE")
    config_path = (
        Path(env_file)
        if env_file
        else Path(__file__).resolve().parent / "clean_strategy.json"
    )
    try:
        spec = json.loads(config_path.read_text(encoding="utf-8"))
        return spec.get("default_strategy")
    except (OSError, ValueError):
        return None


def _layer_b(data, options) -> dict:
    """Applies the rewrite strategy to the prose fields, fail-soft per field."""
    backend, model, base_url, api_key = _layer_b_config()
    report: dict = {
        "ran": False,
        "status": "skipped",
        "reason": "",
        "strategy": None,
    }

    if backend not in LLM_BACKENDS:
        report["reason"] = (
            "no rewrite backend configured; set WATERMARKS_REWRITE_BACKEND "
            "= ollama or openai-compatible (plus WATERMARKS_REWRITE_MODEL / "
            "WATERMARKS_REWRITE_BASE_URL / WATERMARKS_REWRITE_API_KEY) to "
            "enable the statistical-watermark rewrite"
        )
        return report

    if not model or not base_url:
        report["reason"] = (
            f"{backend} backend selected but "
            + ("WATERMARKS_REWRITE_MODEL" if not model else "WATERMARKS_REWRITE_BASE_URL")
            + " is not set; skipping the rewrite rather than guessing"
        )
        return report

    opts = options.get("layer_b", {})
    strategy_spec = opts.get("strategy") or _default_strategy()
    report["backend"] = backend
    report["model"] = model
    report["strategy"] = strategy_spec

    if not strategy_spec:
        report["reason"] = "no Layer B strategy configured (clean_strategy.json)"
        return report

    try:
        steps = parse_strategy(strategy_spec)
    except ValueError as error:
        report["reason"] = f"invalid strategy {strategy_spec!r}: {error}"
        return report

    lang = opts.get("lang", "English")
    style = opts.get("style")
    field_reports: dict[str, dict] = {}
    field_errors: dict[str, str] = {}
    touched = False

    for pattern in PROSE_PATHS:
        for path, holder, key in _walk(data):
            if not _matches(path, pattern):
                continue
            text = holder[key]
            if not text.strip():
                continue
            label = ".".join(str(part) for part in path)
            try:
                rewritten, stats = apply_strategy(
                    text,
                    steps,
                    backend=backend,
                    model=model,
                    base_url=base_url,
                    api_key=api_key,
                    lang=lang,
                    style=style,
                    layer_a_after=True,
                )
                holder[key] = rewritten
                field_reports[label] = stats
                touched = True
            except Exception as error:  # noqa: BLE001 — per-field fail-soft
                field_errors[label] = str(error)

    report["ran"] = touched
    report["status"] = "failed" if not touched and field_errors else "applied"
    report["fields"] = field_reports
    report["field_errors"] = field_errors
    if field_errors and not touched:
        report["reason"] = "; ".join(field_errors.values())[:500]
    return report


def main() -> int:
    try:
        payload = json.loads(sys.stdin.read())
        data = payload.get("data")
        options = payload.get("options") or {}
    except ValueError as error:
        json.dump(
            {"cleaned": None, "report": {"status": "failed", "error": f"bad input: {error}"}},
            sys.stdout,
        )
        return 0

    original = copy.deepcopy(data)
    report: dict = {"status": "cleaned", "source": "watermarks-remover v0.7.0 (vendored)"}

    try:
        data, layer_a_report = _layer_a(data, options)
        layer_b_report = _layer_b(data, options)
        report["layers"] = {"a": layer_a_report, "b": layer_b_report}
        if layer_b_report.get("status") == "failed":
            # Layer A already landed; only Layer B could not run. The text is
            # strictly cleaner than the input, so this is still a success.
            report["status"] = "cleaned"
    except Exception as error:  # noqa: BLE001 — the step must never break a download
        report["status"] = "failed"
        report["error"] = str(error)
        data = original

    json.dump({"cleaned": data, "report": report}, sys.stdout, ensure_ascii=False)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
