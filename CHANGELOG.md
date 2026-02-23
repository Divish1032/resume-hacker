# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-02-23

### Added

- **Vercel deployment support** — `vercel.json` with 60 s function timeout for AI streaming
- **Serverless Ollama guard** — `/api/generate` and `/api/ollama/tags` now detect Vercel/serverless environments and gracefully disable Ollama, returning a clear user-facing error instead of a timeout
- **`isOllamaAvailable` UI state** — Ollama is hidden from the provider dropdown when running on Vercel so users are never shown an option that cannot work
- **API key security banner** — a dismissible green banner informs users that API keys are stored only in their browser (localStorage) and never sent to our servers
- **ATS score feedback in prompt engine** — when a high fabrication level is selected, missing keywords, sections, and ATS recommendations are injected directly into the LLM prompt to maximise ATS match scores

### Changed

- Unknown provider requests now return a descriptive 400 error instead of silently falling through to Ollama
- `.env.example` updated with `.env.local` naming convention and Vercel dashboard setup instructions
- README and SEO metadata updated with correct repository URLs and Open Graph tags

### Fixed

- Unused `useId` import in `app/page.tsx` (lint warning)
- Ollama stream parsing error — migrated to `ai-sdk-ollama` and `toTextStreamResponse()`

---

## [1.0.0] - 2026-02-22

### Added

- **AI Resume Optimizer** — paste your resume + job description and get a tailored, ATS-optimised resume in seconds
- **Multi-provider support** — OpenAI, Anthropic (Claude), Google Gemini, DeepSeek, and Ollama (local)
- **ATS Scoring** — pre/post ATS score comparison with keyword gap analysis and section-level breakdown
- **PDF Export** — download the optimised resume as a professionally formatted PDF (Classic or Sidebar template)
- **Fabrication level slider** — control how aggressively the AI rewrites your resume (0 = conservative, 100 = maximum optimisation)
- **Cover Letter generator** — one-click cover letter tailored to the job description
- **Resume import** — upload an existing `.pdf` or `.txt` resume to pre-fill the editor
- **Prompt-only mode** — copy the raw LLM prompt to use in any external AI tool
- **Dark/light theming**, responsive layout, and smooth animations via Framer Motion

[1.1.0]: https://github.com/Divish1032/resume-hacker/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Divish1032/resume-hacker/releases/tag/v1.0.0
