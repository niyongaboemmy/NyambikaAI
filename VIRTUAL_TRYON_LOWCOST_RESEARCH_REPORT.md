# Virtual Try-On: Lower-Cost / Free Solution Research Report

**Date:** 2026-07-05
**Scope:** Independent market research into virtual try-on (VTON) providers and self-hosting options, evaluated purely on quality, license safety, and cost per generation. This report does not assume or build on the try-on integration already present in the codebase (`backend/tryon.ts`, `frontend/src/app/api/tryon/*`) — it starts from a blank slate and proposes what to adopt going forward.

---

## 1. Executive summary

The cheapest way to run virtual try-on at production quality in 2026 is **not** to keep paying a third-party API per image — it's to **self-host the open-weight Leffa model (CVPR 2025) on a serverless GPU provider** (Modal.com or RunPod Serverless). Leffa is:

- **MIT licensed** — safe for unrestricted commercial use (unlike CatVTON/IDM-VTON's original CC BY-NC-SA research license).
- **State-of-the-art quality** — outperforms IDM-VTON on garment fidelity (logos, text, texture) in third-party evaluations, and is the model that PixelAPI itself resells at $0.05/image.
- **Cheap to run** — needs only 12GB VRAM and ~6 seconds on an A100-class GPU. On a pay-per-second serverless GPU this comes out to roughly **$0.002–0.004 per generation**, vs. $0.024–$0.075 for hosted APIs (see table below) — a **10–25x cost reduction**.
- **Effectively free at low/medium volume** — Modal's free-tier $30/month compute credit covers ~7,000–15,000 generations/month before any real spend starts.

Recommended path: **self-host Leffa on Modal.com** as the primary provider, keep a hosted API (PixelAPI or FASHN) only as an automatic fallback for when self-hosted capacity/cold-starts are a problem. This mirrors the two-phase pattern already used in this codebase, just swapping in a much cheaper/self-owned "phase 1".

---

## 2. Market comparison (2026 pricing, researched live)

| Provider | Model | License / commercial use | Price per image | Notes |
|---|---|---|---|---|
| **FASHN API** | proprietary | commercial, paid | **$0.075** (drops <$0.04 at volume) | Increased from $0.04 in March 2025; no free tier |
| **Replicate — cuuupid/idm-vton** | IDM-VTON | hosted commercial service (weights are CC BY-NC-SA research license, but Replicate sells inference as a service) | **$0.024–$0.053** | A100(80GB), ~18–38s/run; price has risen over time |
| **Replicate — mmezhov/catvton-flux** | CatVTON+FLUX | MIT (fork), heavier FLUX backbone | **$0.15** | More expensive than IDM-VTON — FLUX backbone is heavy |
| **fal.ai — cat-vton** | CatVTON | **"research only"** per fal's own docs | not published | Explicitly *not* licensed for commercial/production use — avoid |
| **fal.ai — fashn/tryon v1.6** | FASHN | commercial, paid | ~$0.075 | Same FASHN pricing, just via fal infra |
| **PixelAPI** | **Leffa** (CVPR 2025), resold | MIT-licensed model, commercial wrapper | **$0.05/call** (100 free credits, then paid) | This is literally Leffa behind a paid wrapper — see §3 |
| **Self-hosted Leffa** (Modal/RunPod) | Leffa | **MIT** — fully free for commercial use | **~$0.002–0.004/run** (compute cost only) | Same model quality as PixelAPI, no per-call markup |
| **HF Spaces (Kwai-Kolors, Leffa demo, IDM-VTON demo)** | various | free but shared/rate-limited ZeroGPU quota | **$0** | Fine for prototyping only — not reliable enough for production traffic, and most public Spaces disallow heavy programmatic/commercial use in their ToS |

**Key finding:** PixelAPI's own marketing/dev.to posts confirm they built their $0.05/call product *on top of* Leffa. There is no quality reason to keep paying that markup — Leffa's weights and inference code are open (MIT) and can be run directly.

---

## 3. Why Leffa specifically

- Paper: *"Learning Flow Fields in Attention for Controllable Person Image Generation"*, CVPR 2025 — [github.com/franciszzj/Leffa](https://github.com/franciszzj/Leffa).
- **License: MIT** (verified from the repo's LICENSE file) — the cleanest license of any competitive VTON model. IDM-VTON and CatVTON's original releases are CC BY-NC-SA (non-commercial), which is a real legal exposure for a commercial fashion marketplace to self-host directly; Leffa has no such restriction.
- **Quality**: attention-based flow field preserves fine garment detail (text, patterns, hardware/logos) — reviewed as outperforming IDM-VTON on these specifics, and it's the exact model a competitor (PixelAPI) chose to commercialize.
- **Hardware footprint**: virtual try-on mode needs ~12GB VRAM / 32GB RAM (pose-transfer mode needs more, but we don't need that feature). This fits comfortably on a single L4, A10G, or A100 GPU — all available on serverless GPU clouds billed per-second.
- **Inference time**: ~6 seconds per image at fp16 on an A100 (30% faster with the ref-unet acceleration flag) — fast enough for a synchronous or short-poll UX, matching what the current `try-on-widget` polling pattern already expects.

---

## 4. Recommended architecture

```
┌─────────────────┐      HTTPS (image URLs / base64)      ┌────────────────────────┐
│  Next.js API     │ ───────────────────────────────────▶ │  Modal.com serverless   │
│  route (existing │                                        │  function: leffa_tryon │
│  /api/tryon)     │ ◀─────────────────────────────────── │  (GPU: A10G/L4, MIT     │
└─────────────────┘      result image URL / base64          │  Leffa weights)         │
        │                                                    └────────────────────────┘
        │ fallback on error / timeout / cold-start > Nms
        ▼
┌─────────────────┐
│ PixelAPI (Leffa, │   ← same underlying model, used only as an availability fallback
│ hosted, $0.05)   │
└─────────────────┘
```

### 4.1 Hosting the model — Modal.com (recommended)

Modal is chosen over raw RunPod/Banana/AWS because it's Python-native, has a generous **$30/month free credit with no card required**, scales to zero (no idle cost), and per-second billing on GPUs from $0.000164/s (T4) to ~$0.0003/s (A10G/L4) — cheap enough that the free tier alone covers thousands of monthly try-ons.

Example Modal app (`modal_app/leffa_tryon.py`):

```python
import modal

app = modal.App("nyambika-leffa-tryon")

image = (
    modal.Image.debian_slim(python_version="3.10")
    .pip_install(
        "torch", "torchvision", "diffusers", "transformers",
        "accelerate", "pillow", "huggingface_hub"
    )
    .run_commands(
        "git clone https://github.com/franciszzj/Leffa.git /leffa",
    )
)

@app.cls(
    image=image,
    gpu="A10G",          # 24GB VRAM, comfortably covers Leffa's 12GB requirement
    scaledown_window=120,  # keep warm for 2 min after last request to dodge cold starts on bursty traffic
    timeout=60,
)
class LeffaTryOn:
    @modal.enter()
    def load_model(self):
        import sys
        sys.path.append("/leffa")
        from leffa.inference import LeffaInference  # actual import path per repo
        self.model = LeffaInference()  # loads weights once per container

    @modal.method()
    def run(self, person_image_b64: str, garment_image_b64: str, garment_type: str = "upper"):
        result_b64 = self.model.predict(
            person_image_b64=person_image_b64,
            garment_image_b64=garment_image_b64,
            garment_type=garment_type,
        )
        return {"image_b64": result_b64}

@app.function(image=image)
@modal.fastapi_endpoint(method="POST")
def tryon_endpoint(payload: dict):
    result = LeffaTryOn().run.remote(
        payload["person_image_b64"],
        payload["garment_image_b64"],
        payload.get("garment_type", "upper"),
    )
    return result
```

Deploy: `modal deploy modal_app/leffa_tryon.py` — Modal gives you a stable HTTPS URL for `tryon_endpoint`. Store it as `LEFFA_MODAL_URL` in `backend/.env` / `frontend/.env`.

### 4.2 Backend integration

Add a new provider function in `backend/tryon.ts`, ahead of the existing PixelAPI/Replicate phases:

```ts
// Phase 0 (cheapest): self-hosted Leffa on Modal — ~$0.002-0.004/image
const MODAL_LEFFA_URL = process.env.LEFFA_MODAL_URL;

async function tryWithSelfHostedLeffa(personB64: string, clothB64: string, garmentType: string) {
  if (!MODAL_LEFFA_URL) throw new Error("LEFFA_MODAL_URL not set");
  const resp = await fetch(MODAL_LEFFA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      person_image_b64: personB64,
      garment_image_b64: clothB64,
      garment_type: garmentType,
    }),
    signal: AbortSignal.timeout(20_000), // fail fast into fallback on cold start
  });
  if (!resp.ok) throw new Error(`Modal Leffa error ${resp.status}: ${await resp.text()}`);
  const { image_b64 } = await resp.json();
  return {
    success: true,
    tryOnImageUrl: `data:image/png;base64,${image_b64}`,
    recommendations: { fit: "good", confidence: 0.9, notes: "Virtual try-on via self-hosted Leffa" },
  };
}
```

Then in the existing `processTryOnAsync` chain, try this **before** PixelAPI and Replicate, keeping both of those as the existing fallback ladder — no other code needs to change, since the function signature matches the existing providers.

### 4.3 Handling cold starts

Modal containers spin down after idle (`scaledown_window`). A cold start adds a few seconds to load the ~2–4GB of weights. Mitigations, in order of preference:
1. Set `scaledown_window=120` (or higher) so a burst of traffic (e.g. many users trying on outfits in a shopping session) reuses a warm container.
2. Set a client-side timeout (~15–20s) on the Modal call and fall through to the PixelAPI/Replicate fallback automatically — this is the same defensive pattern the codebase already uses for the multi-base-URL fallback in `frontend/src/app/api/tryon/route.ts`.
3. Optionally keep one container always warm (`min_containers=1`) once volume justifies the small always-on cost (~$0.30/hr on A10G) — only worth it once monthly free credits are consistently exhausted.

---

## 5. Cost model (illustrative, 10,000 try-ons/month)

| Approach | Cost/image | Monthly cost @ 10k images | Notes |
|---|---|---|---|
| FASHN API | $0.075 | $750 | Cheapest hosted API on paper is still 20x pricier than self-host |
| Replicate IDM-VTON | ~$0.03 avg | $300 | Current fallback in codebase |
| PixelAPI (Leffa, hosted) | $0.05 | $500 | Same model as our recommendation, just marked up |
| **Self-hosted Leffa (Modal, A10G)** | **~$0.003** | **~$30, fully covered by free tier** | Recommended primary path |

At 10k generations/month, self-hosting saves **$470–$720/month** versus staying on a hosted API, while using the *same or better* underlying model quality.

---

## 6. Risks & mitigations

- **Cold-start latency** — mitigated via warm windows + fast fallback (see §4.3).
- **GPU availability spikes** — Modal queues requests if all GPUs of a type are busy; keep the PixelAPI fallback live so a slow Modal response never blocks the user.
- **NSFW/misuse of person photos** — add a lightweight image-safety check (e.g. an open NSFW classifier) before sending user photos to any provider, self-hosted or not; this is a general concern independent of provider choice.
- **Model drift/upstream changes** — pin the Leffa repo to a specific commit SHA in the Modal image build step rather than tracking `main`, so deployments are reproducible.
- **Secrets** — regardless of which provider is used, rotate and move any hardcoded API keys (e.g. the `tryon-api.com` key currently hardcoded as a fallback default in the frontend API routes) into environment variables only, and revoke the exposed key.

---

## 7. Recommended next steps

1. Prototype Leffa locally (or on a rented GPU) to confirm output quality against real product photos from this catalog before committing to production rollout.
2. Stand up the Modal app (§4.1), gate it behind `LEFFA_MODAL_URL`, and wire it as "Phase 0" ahead of the existing PixelAPI/Replicate chain in `backend/tryon.ts` (§4.2) — purely additive, zero risk to current fallback behavior.
3. Run both paths in parallel for a week, compare output quality and latency, then shift default traffic to the self-hosted path once validated.
4. Decommission the PixelAPI paid tier once confidence is high, keeping it only as a cold-fallback for reliability.
