# watermarks-remover (vendored)

Strips multi-vendor AI provenance marks from text and files. This is a vendored
subset of [guillaumemeyer/watermarks-remover](https://github.com/guillaumemeyer/watermarks-remover)
(MIT, see `LICENSE`), pinned at upstream commit `d9e9590` (release v0.7.0).

Vendored here, unmodified, because the PDF pipeline runs them as its final step:

| File | Role |
| --- | --- |
| `text_unicode.py` | **Layer A** — deterministic strip of invisible Unicode (soft hyphens, zero-width chars, bidi marks, tag chars, exotic spaces) |
| `rewrite_text.py` | **Layer B** — statistical (token-sampling) watermark rewrite over a configurable LLM backend |
| `common.py`, `humanize_pass.py`, `text_detectors.py`, `detect_gumbel.py` | stdlib-only imports of the two layers above |
| `clean_strategy.json` | the upstream default Layer B strategy (`paraphrase@0.8,mlm@0.2`) |

Everything is Python 3.10+ **stdlib only** — no pip dependencies. The optional
Layer B backends (Ollama or any OpenAI-compatible endpoint) are read from the
`WATERMARKS_REWRITE_*` environment, exactly as upstream reads them.

`cv_clean.py` is the one file that is ours, not upstream's: a thin driver that
applies Layer A to every string of a CV JSON blob and Layer B to its prose
fields, so `src/lib/pdf/strip-watermarks.ts` can call the whole step as one
`python3` process. The upstream repo deliberately keeps this shape too — its
own skill is "a thin client" over the same scripts.

To update the vendoring, copy the same file list from a newer upstream release
and record the new commit hash here.
