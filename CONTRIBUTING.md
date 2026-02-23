# Contributing to Resume Hacker

Thank you for your interest in contributing! Resume Hacker is an open-source AI resume optimizer and we welcome contributions of all kinds.

## Getting Started

1. **Fork & Clone**

   ```bash
   git clone https://github.com/Divish1032/resume-hacker.git
   cd resume-hacker
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment**

   ```bash
   cp .env.example .env.local
   # Add your API keys for cloud providers you want to test with
   ```

4. **Start dev server**
   ```bash
   npm run dev
   ```

## Development Guidelines

### Code Style

- TypeScript strict mode — no `any` types
- Use shadcn/ui components for UI elements (don't introduce new style libraries)
- Tailwind CSS utility classes only — no inline styles except for dynamic values
- All form state/validation natively uses `react-hook-form` + `zod` via `@hookform/resolvers/zod`
- All new components go in `components/features/` or `components/ui/`
- Run `npm run lint` before opening a PR

### Project Structure

```
app/                   # Next.js App Router pages & API routes
  api/generate/        # AI streaming endpoint
  api/extract-resume-text/ # PDF text extraction
components/
  features/            # Business-logic components (ResumeForm, AtsScorePanel…)
  pdf/                 # PDF template components (react-pdf)
  ui/                  # shadcn/ui primitives
lib/
  ats-scorer.ts        # ATS scoring algorithm
  prompt-engine.ts     # AI prompt builder
  schema.ts            # TypeScript types (ResumeData, JobDescriptionData)
```

### Adding AI Providers

1. Add the provider to `app/api/generate/route.ts` (see existing providers as examples)
2. Add it to the provider dropdown in `app/page.tsx`
3. Add the API key example to `.env.example`

### Adding PDF Templates

1. Create `components/pdf/ResumeYourNameDocument.tsx`
2. Export it from `components/pdf/PdfDownloadButton.tsx`'s template switch
3. Add to `PdfPreview.tsx`'s template switch

## Pull Request Process

1. Create a branch: `git checkout -b feat/your-feature-name`
2. Make your changes
3. Run checks: `npm run lint && npm run build`
4. Open a PR with a clear description of what changes and why

## Reporting Issues

Use GitHub Issues with the following info:

- Browser + OS version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if relevant

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
