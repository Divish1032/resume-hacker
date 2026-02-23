# ✨ Resume Hacker: Free Open-Source AI Resume Optimizer & ATS Scorer

**Stop fighting with Word margins. Resume-Hacker builds ATS-optimized resumes in seconds.**

[![Latest Release](https://img.shields.io/github/v/release/Divish1032/resume-hacker?color=059669&label=Latest%20Release&style=flat-square)](https://github.com/Divish1032/resume-hacker/releases)
[![License: MIT](https://img.shields.io/github/license/Divish1032/resume-hacker?color=334155&style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=flat-square&logo=vercel)](https://resume-hacker-nine.vercel.app)

---

## 📺 Demo

![Resume Hacker UI preview showing AI ATS scoring](public/screenshot.png)

> [!TIP]
> _Video coming soon! See the tool in action to understand the "Resume Hacker" magic._

## ⚡ Quick Start

Get up and running in 30 seconds:

```bash
git clone https://github.com/Divish1032/resume-hacker.git
cd resume-hacker
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start hacking!

---

**Resume Hacker** is a free, privacy-first, open-source AI resume builder and ATS checker. It uses advanced locally-hosted AI (Ollama) or secure cloud endpoints (OpenAI, Claude, DeepSeek) to tailor your resume to any specific job description. Maximize your Application Tracking System (ATS) match score and easily bypass HR screeners.

## 🚀 Features

- **Multi-Model AI Support** — Use cloud AI (OpenAI, Anthropic, Google Gemini, DeepSeek) or fully local AI (Ollama) to optimize your resume
- **Privacy First (Local AI)** — Keep sensitive resume data 100% local by running LLaMA 3, Mistral, or Gemma via Ollama
- **Live ATS Scoring** — Real-time ATS compatibility score with a full breakdown: keyword match, action verb strength, quantification, section completeness, and role alignment
- **Before & After Comparison** — See your ATS score before and after AI optimization with an animated score delta
- **Explicit Keyword Injection** — The AI prompt automatically extracts and injects missing ATS keywords (hard skills, soft skills, missing job title/education) into the prompt mandate ensuring near-perfect ATS scores, especially at higher intensities
- **Comprehensive Sections** — Support for extended resume sections like Certifications, Languages, Awards, Volunteer Work, and Publications
- **PDF Export with 3 Templates** — Download your optimized resume in Sidebar, Classic, or Executive layouts
- **Inline PDF Preview** — See the rendered resume in real-time without downloading
- **Optimization Intensity Slider** — Control how aggressively the AI rewrites your resume (0% = rephrase only → 100% = maximum ATS match)
- **Prompt-Only Mode** — Generate an optimized prompt to paste into ChatGPT or Claude yourself
- **Frictionless Mobile UX** — Installable as a Progressive Web App (PWA) with native OS "Share" sheet integrations and direct deep-links to ChatGPT and Claude apps, bypassing clunky mobile clipboards.
- **Bulletproof Validation** — Industry-standard error handling with Zod schema validation, pre-flight CTA UI guards, strict API validation, and auto-recovery for Ollama connection drops

## 💡 Frequently Asked Questions (FAQ)

**Is my resume data kept private?**  
Yes. If you choose to use Ollama models (like LLaMA-3 or Mistral), your resume text _never_ leaves your machine. The entire optimization happens locally. If you opt to use an external API like OpenAI, data is only sent for that single completion request.

**How does the ATS Scorer work?**  
It uses a robust, heuristic-based algorithm running client-side. Instead of a basic keyword dump, it accurately categorizes Hard Skills vs Soft Skills, checks for quantifiable metrics (numbers/percentages), and validates Action Verbs, outputting specific missing keywords directly into the AI generation prompt.

**Can I modify the prompt?**  
Yes! We have a "Prompt-Only Mode" where you can use our built-in ATS heuristics to generate a mega-prompt. You can copy this and paste it directly into your favorite web-based LLM if you don't want to enter your API keys.

## 🛠 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, React 19)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **AI Integration**: [Vercel AI SDK](https://sdk.vercel.ai/)
- **PDF Generation**: [@react-pdf/renderer](https://react-pdf.org/)
- **Local AI**: [Ollama](https://ollama.com/)

## 💻 Local Setup

### Prerequisites

- **Node.js** v18+
- **Ollama** (optional) — for fully local, private AI

### Steps

```bash
# 1. Clone the open-source resume optimizer
git clone https://github.com/Divish1032/resume-hacker.git
cd resume-hacker

# 2. Install dependencies
npm install

# 3. Configure environment (optional — only needed for cloud AI providers)
cp .env.example .env.local
# Edit .env.local and add your API keys

# 4. Pull Ollama models (optional)
ollama pull llama3
ollama pull mistral

# 5. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 🔑 Environment Variables

All keys are **optional**. If you only use Ollama, no configuration is needed.

| Variable                       | Provider                |
| ------------------------------ | ----------------------- |
| `OPENAI_API_KEY`               | OpenAI (GPT-4, GPT-3.5) |
| `ANTHROPIC_API_KEY`            | Anthropic (Claude)      |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google (Gemini)         |
| `DEEPSEEK_API_KEY`             | DeepSeek                |

> API keys can also be entered directly in the UI — they are never stored server-side.

## 🛣 Roadmap

- [ ] PDF upload → auto-parse resume into form fields
- [ ] Job description URL → auto-extract JD text
- [ ] Multiple resume slots (save & compare)
- [ ] One-click deploy to Vercel

## 🤝 Contributing

Contributions are very welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

[MIT](LICENSE) — free to use, modify, and distribute.
