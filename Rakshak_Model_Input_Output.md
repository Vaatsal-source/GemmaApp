# Rakshak AI Model: Inputs and Outputs

## Model

**Ollama gemma4:e2b** running locally on-device via `ollama serve`.
API endpoint: `http://localhost:11434/api/generate`
Fallback: Deterministic rule-based engine (no network required).

---

## Model Inputs

The Rakshak system is multimodal and accepts multiple sources of
information simultaneously. All inputs are fused into a single structured
text prompt before being sent to Gemma.

  --------------------------------------------------------------------------
  Input Source         What the Model Receives              Example
  -------------------- ------------------------------------ ----------------
  Camera (Vision)      Semantic perception tags extracted   smoke, flames,
                       from on-device image classification  lpg_cylinder,
                                                            water_rising,
                                                            exposed_wires

  Video Recording      Multi-frame visual evidence of the   45-second clip
                       incident captured by device camera.  of kitchen fire;
                       Treated as stronger evidence than    treated as
                       a single photo (continuous scene     continuous
                       evolution).                          scene evolution

  Photo Capture        Still image captured by device       Photo of flooded
                       camera. Provides a snapshot of the   room taken at
                       scene at a moment in time.           SOS trigger

  Microphone (Audio)   Environmental sound event tags and   crackling_fire,
                       any audio note recorded by user.     screaming,
                                                            structural_
                                                            collapse

  Voice Note           User's recorded verbal description   "My grandmother
  (Audio Log)          of the incident. Treated as a        cannot walk and
                       first-person witness account.        smoke is dense"

  Text                 User-entered text description of     "Someone has
                       the emergency.                       been bitten by a
                                                            snake on the leg"

  Family Profile       Vulnerability context for on-site    hasElderly,
                       household members. Used to escalate  hasChildren,
                       severity and prioritize evacuation   hasPregnant,
                       of vulnerable people.                hasDisabled

  Elapsed Time         Minutes since the SOS was triggered. 8 minutes
                       Used for timeline-based severity     (escalates
                       escalation (longer = higher risk).   severity)

  Community Context    Offline community knowledge base:    nearestShelter,
  (Offline Knowledge   nearest shelter, snake habitat risk, floodSafeRoute,
  Base)                and designated flood safe route.     knownSnakeHabitat

  Previous Context     Injected scenario presets or prior   Earlier simulated
                       session state passed to the engine.  fire scenario

  --------------------------------------------------------------------------

---

## Processing Pipeline

```text
Camera Visual Tags ──┐
Video Clip ──────────┤
Photo Capture ───────┤
Audio Sound Tags ────┼──► Feature Extraction / Tag Fusion
Voice Note ──────────┤
Text Description ────┤
Family Profile ──────┤
Elapsed Time ────────┘
        │
        ▼
  Context Fusion
  (Structured prompt assembled combining all inputs
   + Offline Emergency Knowledge Base snippets)
        │
        ▼
  Ollama gemma4:e2b Reasoning
  (Local inference via http://localhost:11434/api/generate)
        │
        ├── If Ollama unreachable / timeout ──► Rule-Based Fallback Engine
        │
        ▼
  Structured Decision Engine
  (JSON response parsed and validated)
        │
        ▼
  Action Generation + UI Update
```

Lightweight perception modules first convert raw inputs (camera, audio) into
structured tags before Gemma performs reasoning over the fused prompt.
If Ollama is unavailable (true offline field use), the deterministic rule-based
engine produces an equivalent assessment to keep the app fully functional.

---

## Model Outputs

Gemma returns a single JSON object. The app validates and maps it to
the `SituationAssessment` interface.

1.  **Emergency Classification** (`emergencyType`)
    -   Fire Emergency
    -   Flood Emergency
    -   LPG Gas Cylinder Leak / Explosion Risk
    -   Electrical Shock / Electrical Failure
    -   Earthquake Collapse Emergency
    -   Snake Bite Incident
    -   Cardiac / Medical Emergency
    -   Choking Incident
    -   Undetermined Incident (fallback)

2.  **Risk Assessment** (`severity`, `primaryHazards`, `secondaryHazards`)
    -   Severity level: CRITICAL | HIGH | MODERATE | LOW
    -   Primary hazards (active, immediate threats)
    -   Secondary hazards (predicted, cascading risks)

3.  **Active Protocol Mode** (`mode`)
    -   `Home Response Mode` — single-household incident
    -   `Community Disaster Mode` — village/street-scale disaster

4.  **Prioritized Action Plan** (`priorityActions`)
    -   Ordered list of `{ action, why, order }` objects
    -   Each action includes an explainability rationale

5.  **Voice Guidance** (`voiceGuidance`)
    -   1–2 concise spoken sentences for TTS playback
    -   Designed for a panicking user; calm and directive

6.  **Situation Report — SITREP** (`sitrep`)
    -   Compact structured text suitable for SMS / mesh radio relay
    -   Includes: incident type, severity, elapsed time, mode, people count,
        hazards, captured media evidence, and GPS status line

7.  **Confidence Score** (`confidenceScore`)
    -   0–100 integer
    -   Boosted when video / photo / voice note evidence is present

8.  **Reasoning Trail** (`reasoningTrail`)
    -   Human-readable trace of how the model reached its conclusion
    -   Prefixed with `[FALLBACK]` when rule-based engine was used

---

## Structured Reasoning Framework

For every emergency, Gemma follows four stages:

1.  **IDENTIFY** the emergency category from the multimodal input evidence.
2.  **ESTIMATE** the risk level — factoring in elapsed time, secondary hazards,
    captured video/photo evidence, and vulnerable family members.
3.  **DETERMINE** the highest-priority action the user must take right now.
4.  **GENERATE** concise, immediately executable instructions + a short voice
    guidance sentence for TTS.

Video clips are treated as **stronger evidence** than photos because they
represent continuous scene evolution across multiple frames. Voice notes
are treated as first-person verbal witness accounts.

---

## Overall Flow

```text
Inputs
(Camera Tags + Video + Photo + Audio Tags + Voice Note
 + Text + Family Profile + Elapsed Time + Community Context)
                |
                ▼
      Feature Extraction + Context Fusion
      (Structured prompt with offline knowledge base)
                |
                ▼
     Ollama gemma4:e2b Local Inference
     (http://localhost:11434 — no internet required)
                |
          [if unreachable]
                |
                ▼
     Rule-Based Fallback Engine
     (Identical output shape, deterministic logic)
                |
                ▼
Outputs:
- Emergency Classification (emergencyType)
- Risk Assessment (severity, primaryHazards, secondaryHazards)
- Active Protocol Mode (mode)
- Prioritized Action Plan (priorityActions[].action + .why)
- Voice Guidance (voiceGuidance) ← NEW
- Situation Report / SITREP (sitrep)
- Confidence Score (confidenceScore)
- Reasoning Trail (reasoningTrail)
```
