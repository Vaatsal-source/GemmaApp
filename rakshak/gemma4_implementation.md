# VAYU Personal — Gemma 4 Implementation Map

This document maps every feature to the specific Gemma 4 model that runs it, why that model (not a bigger or smaller one), and what goes in/out of the call. Model specs referenced below (context window, modalities, on-device RAM) are current as of the Gemma 4 family's mid-2026 releases — re-check `ai.google.dev/gemma` before final build in case of version updates.

## Model lineup used in this project

| Model | Params | Runs where | Modalities | Context | Why it's in this project |
|---|---|---|---|---|---|
| **Gemma 4 E2B** | 2B (effective) | Phone, on-device | Text, image, audio | 128K | Default engine for the SOS button — lowest RAM/battery draw, fastest response, runs on mid-range Android hardware |
| **Gemma 4 E4B** | 4B (effective) | Phone, on-device (higher-end) | Text, image, audio, video | 128K | Used when device RAM allows — better accuracy on ambiguous scenes, multilingual, and multi-step reasoning (triage, counterfactuals) |
| **Gemma 4 12B Unified** | 12B | District/responder-side server or a high-RAM field laptop | Text, image, audio (native, encoder-free) | 256K | Consolidating multiple incoming reports, generating district briefs, higher-fidelity multimodal fusion when hardware is available |
| **Gemma 4 26B A4B (MoE)** | 26B total / 4B active | Cloud / district server | Text, image, audio, video | 256K | Central/pre-storm risk scoring, deployment prioritization, heavier reasoning tasks where compute is available and connectivity is up |

**Rule of thumb used throughout:** if a feature must work with zero connectivity on a phone → E2B or E4B. If it runs on the responder/district side where a server or laptop is available → 12B or 26B A4B.

---

## Feature-by-feature mapping

### 1. One-tap SOS trigger
**Model:** none (app logic only) — starts capture, no inference yet.

### 2. On-device multimodal scene understanding
**Model:** Gemma 4 E4B (falls back to E2B on low-RAM devices).
- **Input:** video frames (sampled at ~1 fps) + live audio, interleaved in one prompt.
- **Output:** structured JSON — `{situation_type, severity, hazards[], people_count_estimate}`.
- **Why E4B first:** video + audio fusion for ambiguous scenes (smoke vs. dust, panic vs. calm speech) benefits from the larger model's reasoning; E2B is the fallback so the feature degrades gracefully instead of failing on cheaper hardware.

### 3. Real-time speech-to-text + situation transcription (regional languages)
**Model:** Gemma 4 E2B (native ASR on E2B/E4B — no separate STT model needed).
- **Input:** raw audio stream.
- **Output:** transcript + detected language tag.
- **Why E2B:** ASR is the lighter task in the pipeline; keeping it on the smaller model saves battery/RAM for the heavier scene-understanding call running alongside it.

### 4. Instant spoken safety guidance
**Model:** Gemma 4 E4B, chained directly off feature 2's output (same context window, no re-encoding).
- **Input:** structured situation JSON from step 2 + a system prompt of grounded first-response guidance patterns.
- **Output:** short, spoken-language-appropriate instruction text → passed to on-device TTS.
- **Why E4B:** function-calling/structured-prompt support lets the guidance step consume step 2's JSON directly and stay grounded, rather than hallucinating generic advice.

### 5. Structured emergency report generation
**Model:** Gemma 4 E2B.
- **Input:** situation JSON + GPS + timestamp.
- **Output:** compact structured report formatted for either an SMS/data packet or a dispatcher-readable summary (native function-calling used to emit valid JSON every time).
- **Why E2B:** this is a formatting/summarization task, not open-ended reasoning — smallest model that reliably hits the schema, keeps latency low for the "call now" path.

### 6. Auto-call / auto-SMS with report attached
**Model:** none directly — Gemma 4 E2B only generates the text/summary read to the dispatcher or embedded in the SMS; the call/SMS action itself is native OS integration (Android Telephony / SMS APIs).

### 7. Offline queue + Bluetooth/Wi-Fi Direct relay
**Model:** none for transport — Gemma's only role is producing the report (feature 5) before it's queued. Relay is Android Nearby Connections / Wi-Fi Direct, model-agnostic.

### 8. Image-only mode (low battery/storage)
**Model:** Gemma 4 E2B, image + text only (drop audio/video track to save compute).
- **Input:** single photo + optional short text.
- **Output:** same structured situation JSON, lower confidence flag set.

### 9. Continuous ambient listening (distress-sound detection)
**Model:** Gemma 4 E2B, audio-only, running a lightweight polling pass (not continuous full inference — short buffered clips triggered by an on-device audio-energy threshold to save battery).
- **Input:** short audio buffer.
- **Output:** binary/graded distress likelihood → triggers full SOS pipeline (features 2–5) only if threshold crossed.

### 10. Handwriting/text note input
**Model:** Gemma 4 E4B (OCR + handwriting recognition is a listed E4B image-understanding capability).
- **Input:** photo of handwritten note.
- **Output:** transcribed text fed into feature 5's report pipeline.

### 11. Counterfactual / what-if queries post-alert
**Model:** Gemma 4 E4B, using its full 128K context to hold the original situation report + all prior Q&A in-session.
- **Input:** new user question + full prior context.
- **Output:** grounded answer, explicitly flags low confidence if the question goes beyond available data (guidance uses reasoning/thinking-mode support).

### 12. Medical triage mode
**Model:** Gemma 4 E4B, text/audio input, grounded against a bundled offline first-aid reference (retrieved via on-device function-calling into a local knowledge file, not the open web).
- **Input:** spoken/typed symptom description.
- **Output:** stepwise first-aid guidance + severity flag for the report.

### 13. Multi-person mode (consolidating headcount/needs)
**Model:** Gemma 4 E4B — merges multiple structured reports (own device + relayed reports from nearby phones) into one consolidated packet.
- **Input:** array of structured JSON reports.
- **Output:** single deduplicated report with aggregate headcount/needs.

### 14. Confidence flagging
**Model:** built into every E2B/E4B call above — the same prompt schema always requires a `confidence` field; not a separate model call.

### 15. Mesh relay prioritization
**Model:** Gemma 4 E2B, lightweight scoring pass — ranks queued reports by severity field already present in each report's JSON before relay bandwidth is allocated.

### 16. Battery-aware mode
**Model:** none — orchestration logic that switches which model tier (E2B vs. E4B) and which modalities (drop video/audio first) are used as battery drops.

### 17. Trust / evidence trail on responder side
**Model:** Gemma 4 12B Unified, server/responder-laptop side.
- **Input:** full chain of structured reports + which raw inputs produced them.
- **Output:** human-readable evidence summary responders can sanity-check (this is the same "Evidence Card" pattern from the original VAYU decision-support side).

### 18. Duplicate/spam suppression
**Model:** Gemma 4 12B Unified (or 26B A4B if cloud-side) — semantic dedup across incoming reports (same incident described differently) rather than exact-match filtering.

### 19. Responder-side re-prioritization & officer Q&A (VAYU decision-support link)
**Model:** Gemma 4 E4B on the responder's own device if offline in the field; Gemma 4 26B A4B if the responder-side system has server/cloud access.
- **Input:** all synced structured reports for a region + officer's natural-language question.
- **Output:** grounded answer/re-prioritization, same pattern as the original VAYU officer-Q&A feature.

### 20. Pre-storm risk scoring & district briefs (central, network-up phase)
**Model:** Gemma 4 26B A4B (cloud/district server) — paired with the XGBoost risk model; heaviest reasoning task in the system, runs only while connectivity is available.

### 21. Family "I'm safe" broadcast
**Model:** Gemma 4 E2B — one-line status message generation only; transport is the same relay/SMS path as feature 6/7.

### 22. Post-crisis needs check-in
**Model:** Gemma 4 E2B — reuses feature 5's report pipeline with a "needs assessment" prompt variant (water/medical/shelter) instead of "emergency" schema.

---

## Summary: which model does the heavy lifting

- **E2B** — always-on, battery-critical tasks: ASR, report formatting, ambient listening, relay prioritization, status broadcasts. Optimize for speed over depth.
- **E4B** — anything needing real reasoning on-device: scene understanding, guidance generation, counterfactual Q&A, triage, multi-report consolidation. This is the model doing the actual "decision support" work the whole pitch depends on.
- **12B Unified** — responder/district-side consolidation and evidence trails when a laptop or local server is available but full cloud isn't.
- **26B A4B** — central, pre-failure phase only: risk scoring, deployment planning, heaviest officer Q&A when cloud is reachable. This is the one model in the stack that is *not* required to survive network failure, by design.

## Open implementation questions to resolve before building
- Confirm actual on-device runtime (MediaPipe LLM Inference API vs. LiteRT-LM vs. llama.cpp/Ollama-on-Android) and quantization level (Q4 mobile checkpoints) for E2B/E4B given target demo hardware.
- Decide whether video sampling in feature 2 is full video-understanding or frame-sampled images — affects which quantized checkpoint is needed.
- Verify E2B/E4B context window and audio support against the latest official Gemma 4 model card at build time, since these figures update between point releases.
