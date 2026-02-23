"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { ResumeForm } from "@/components/features/ResumeForm";
import { JobDescriptionForm } from "@/components/features/JobDescriptionForm";
import { JobDescriptionData } from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Sparkles, Loader2, TrendingUp, ArrowRight, ChevronDown, ChevronUp, Zap, ClipboardPaste, Share } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { CoverLetterPanel } from "@/components/features/CoverLetterPanel";
import { generateCoverLetterPrompt } from "@/lib/cover-letter-prompt";
import type { CoverLetterTone, CoverLetterLength } from "@/lib/cover-letter-prompt";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { PdfTemplate } from "@/components/pdf/PdfDownloadButton";
import { AtsReport } from "@/components/features/AtsReport";
import { scoreResume } from "@/lib/ats-scorer";
import { generatePrompt } from "@/lib/prompt-engine";
import { useCompletion } from "@ai-sdk/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";


const PdfDownloadButton = dynamic(
  () => import("@/components/pdf/PdfDownloadButton").then((mod) => mod.PdfDownloadButton),
  { ssr: false, loading: () => null }
);
const PdfPreview = dynamic(
  () => import("@/components/pdf/PdfPreview").then((mod) => mod.PdfPreview),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-64 text-slate-400 text-sm">Loading preview…</div> }
);

// ── Section card wrapper ───────────────────────────────────────────────────
function ZoneCard({ accent, title, children, className = "" }: {
  accent: string; title: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col ${className}`}>
      <div className={`h-1 ${accent}`} />
      <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">{title}</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar min-h-0">
        {children}
      </div>
    </div>
  );
}

// ── ATS Score Delta Banner ─────────────────────────────────────────────────
function ScoreDeltaBanner({ before, after }: { before: number; after: number; }) {
  const delta = after - before;
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
      <div className="text-center flex-1">
        <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Before</div>
        <div className={`text-2xl font-black ${before >= 70 ? "text-emerald-500" : before >= 50 ? "text-amber-500" : "text-red-400"}`}>{before}</div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <ArrowRight className="w-4 h-4 text-slate-300" />
        {delta !== 0 && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${delta > 0 ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-500"}`}>
            {delta > 0 ? `+${delta}` : delta}
          </span>
        )}
      </div>
      <div className="text-center flex-1">
        <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">After</div>
        <div className={`text-2xl font-black ${after >= 70 ? "text-emerald-500" : after >= 50 ? "text-amber-500" : "text-red-400"}`}>{after}</div>
      </div>
    </div>
  );
}

export default function Home() {
  const store = useAppStore();
  const { resumeData, originalResumeData, jobData, jobText, provider, apiKey, selectedModel, configuredProviders } = store;
  
  const [generatedPrompt, setGeneratedPrompt] = useState<string>("");
  const [fabricationLevel, setFabricationLevel] = useState<number[]>([30]);
  const [showChangelog, setShowChangelog] = useState(false);
  const [aiResponseText, setAiResponseText] = useState<string>("");
  const [promptCopied, setPromptCopied] = useState(false);

  // Zone 3 tabs
  const [zone3Tab, setZone3Tab] = useState<"resume" | "cover-letter">("resume");

  // Cover letter state
  const [clTone, setClTone] = useState<CoverLetterTone>("professional");
  const [clLength, setClLength] = useState<CoverLetterLength>("standard");
  const [clFinalText, setClFinalText] = useState<string>("");
  const [clPromptText, setClPromptText] = useState<string>("");

  const [selectedTemplate, setSelectedTemplate] = useState<PdfTemplate>("sidebar");
  const [mobileStep, setMobileStep] = useState<1 | 2 | 3>(1);

  // ATS scores
  const preAtsScore = useMemo(() => {
    const baseData = originalResumeData || resumeData;
    if (!baseData || !jobText) return null;
    return scoreResume(baseData, jobText);
  }, [originalResumeData, resumeData, jobText]);

  const postAtsScore = useMemo(() => {
    if (!resumeData || !jobText) return null;
    return scoreResume(resumeData, jobText);
  }, [resumeData, jobText]);

  

  const { complete, completion, isLoading, setCompletion } = useCompletion({
    api: "/api/generate",
    streamProtocol: "text",
    body: { provider, model: selectedModel, apiKey },
    onFinish: (_prompt, finalCompletion) => {
      const strategies = [
        () => { const m = finalCompletion.match(/```json\s*([\s\S]*?)\s*```/); return m ? m[1] : null; },
        () => { const m = finalCompletion.match(/```\s*(\{[\s\S]*?\})\s*```/); return m ? m[1] : null; },
        () => { const m = finalCompletion.match(/(\{[\s\S]*\})\s*$/); return m ? m[1] : null; },
      ];
      for (const strategy of strategies) {
        const candidate = strategy();
        if (!candidate) continue;
        try {
          const parsed = JSON.parse(candidate);
          if (parsed && (parsed.personalInfo || parsed.workExperience || parsed.summary)) {
            store.setResumeData(parsed);
            toast.success("\u2705 Resume updated \u2014 ATS score and PDF recalculated.");
            return;
          }
        } catch { /* try next */ }
      }
      toast.info("Optimization complete. Review the change log below.");
    },
    onError: (err) => { toast.error(`Generation failed: ${err.message}`); },
  });

  // ── Cover Letter completion ─────────────────────────────────────
  const {
    complete: clComplete,
    completion: clCompletion,
    isLoading: clIsLoading,
    setCompletion: setClCompletion,
  } = useCompletion({
    api: "/api/generate",
    streamProtocol: "text",
    body: { provider, model: selectedModel, apiKey },
    onFinish: (_prompt, finalText) => {
      setClFinalText(finalText.trim());
      toast.success("\u2709\ufe0f Cover letter ready!");
    },
    onError: (err) => { toast.error(`Cover letter failed: ${err.message}`); },
  });

  // ── Pre-flight validation guard ──────────────────────────────────────────
  const validateBeforeGenerate = (): string | null => {
    if (!resumeData?.personalInfo?.fullName?.trim()) {
      return "Please add your full name to the resume form before generating.";
    }
    if (!jobText || jobText.trim().length < 30) {
      return "Please add a job description (at least 30 characters) before generating.";
    }
    if (!resumeData.workExperience || resumeData.workExperience.length === 0) {
      return "Please add at least one work experience entry to your resume.";
    }
    if (provider !== "prompt-only") {
      if (!selectedModel?.trim()) {
        return "Please select or enter a model name from the settings.";
      }
      const hasEnvKey = configuredProviders[provider];
      const needsKey = ["openai", "anthropic", "google", "deepseek"].includes(provider);
      if (needsKey && !apiKey && !hasEnvKey) {
        const label = provider === "google" ? "Gemini" : provider.charAt(0).toUpperCase() + provider.slice(1);
        return `Please provide an API key for ${label} in the settings.`;
      }
    }
    return null;
  };

  const handleClGenerate = async () => {
    const validationError = validateBeforeGenerate();
    if (validationError) { toast.error(validationError); return; }
    if (!jobData?.text || jobData.text.trim().length < 30) {
      toast.error("Please add a full job description before generating a cover letter.");
      return;
    }
    const clPrompt = generateCoverLetterPrompt(
      resumeData!, jobData, { tone: clTone, length: clLength }
    );
    setClFinalText("");
    setClCompletion("");
    if (provider === "prompt-only") {
      setClPromptText(clPrompt);
      setZone3Tab("cover-letter");
    } else {
      setClPromptText("");
      setZone3Tab("cover-letter");
      await clComplete(clPrompt);
    }
    if (typeof window !== "undefined" && window.innerWidth < 1024) setMobileStep(3);
  };

  const handleClRegenerate = async () => {
    setClFinalText("");
    await handleClGenerate();
  };

  const handleJobDataChange = useCallback((data: JobDescriptionData) => {
    store.setJobData(data);
    store.setJobText(data.text || "");
  }, [store]);

  const handleGenerate = async () => {
    const validationError = validateBeforeGenerate();
    if (validationError) { toast.error(validationError); return; }
    const prompt = generatePrompt(resumeData!, jobData!, { fabricationLevel: fabricationLevel[0] });
    setGeneratedPrompt(prompt.trim());
    if (!originalResumeData) store.setOriginalResumeData(resumeData);
    if (provider !== "prompt-only") {
      setCompletion("");
      await complete(prompt);
    }
    if (typeof window !== "undefined" && window.innerWidth < 1024) setMobileStep(3);
  };

  const hasOutput = provider !== "prompt-only" && (completion || isLoading);
  const hasPromptOutput = generatedPrompt && provider === "prompt-only";
  const canGenerate = !!(resumeData && jobData && !isLoading &&
    resumeData.personalInfo?.fullName?.trim() &&
    jobText.trim().length >= 30 &&
    (resumeData.workExperience?.length ?? 0) > 0 &&
    (provider === "prompt-only" || selectedModel?.trim())
  );
  const afterScore = postAtsScore && originalResumeData ? postAtsScore.total : null;

  const parseAiResponse = (text: string) => {
    const strategies = [
      () => { const m = text.match(/```json\s*([\s\S]*?)\s*```/); return m ? m[1] : null; },
      () => { const m = text.match(/```\s*(\{[\s\S]*?\})\s*```/); return m ? m[1] : null; },
      () => { const m = text.match(/(\{[\s\S]*\})\s*$/); return m ? m[1] : null; },
    ];
    for (const strategy of strategies) {
      const candidate = strategy();
      if (!candidate) continue;
      try {
        const parsed = JSON.parse(candidate);
        if (parsed && (parsed.personalInfo || parsed.workExperience || parsed.summary)) {
          if (!originalResumeData) store.setOriginalResumeData(resumeData);
          store.setResumeData(parsed);
          toast.success("✅ Resume updated — ATS score and PDF recalculated.");
          return true;
        }
      } catch { /* try next */ }
    }
    toast.warning("No resume JSON found in response. Manually copy the text into your resume form.");
    return false;
  };

  // Auto-scroll to results on mobile
  const zone3Ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if ((hasOutput || hasPromptOutput) && window.innerWidth < 1024) {
      setTimeout(() => {
        zone3Ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [hasOutput, hasPromptOutput]);

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans transition-colors duration-200">
            {/* ── Page Header ── */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Resume Optimizer</h1>
           <p className="text-sm text-slate-500">Tailor your resume for the ATS in seconds.</p>
        </div>
        <Button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="hidden lg:flex bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm"
        >
          {isLoading ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <><Zap className="w-3.5 h-3.5 mr-1.5" />{provider === "prompt-only" ? "Generate Prompt" : "Optimize Resume"}</>}
        </Button>
      </div>

      {/* ── Mobile Stepper Navigation ── */}
      <div className="lg:hidden bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between sticky top-14 z-40">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-full">
          {[1, 2, 3].map((step) => (
            <button
              key={step}
              onClick={() => setMobileStep(step as 1 | 2 | 3)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold rounded-lg transition-all ${
                mobileStep === step
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                mobileStep === step ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300"
              }`}>
                {step}
              </span>
              <span className="hidden xs:inline">
                {step === 1 ? "Resume" : step === 2 ? "Jobs" : "Result"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── 3-Zone Layout ───────────────────────────────────────────── */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[calc(100vh-3.5rem)] overflow-y-auto lg:overflow-hidden min-h-0">

        {/* ── ZONE 1: Resume Form ──────────────────────────────────── */}
        <div className={`${mobileStep === 1 ? "block" : "hidden lg:block"} h-full min-h-0`}>
          <ZoneCard accent="bg-indigo-500" title={<><span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-[10px] font-bold shrink-0">1</span> Your Resume</>} className="h-full min-h-0">
            <ResumeForm onDataChange={store.setResumeData} provider={provider} model={selectedModel} apiKey={apiKey} />
            
            {/* Mobile Footer Nav */}
            <div className="lg:hidden pt-4 mt-4 border-t border-slate-100 flex justify-end">
              <Button onClick={() => setMobileStep(2)} className="bg-indigo-600 text-white gap-2">
                Next: Job Details <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </ZoneCard>
        </div>

        {/* ── ZONE 2: Job Description ──────────────────── */}
        <div className={`${mobileStep === 2 ? "block" : "hidden lg:block"} h-full min-h-0`}>
          <ZoneCard accent="bg-emerald-500" title={<><span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-[10px] font-bold shrink-0">2</span> Target Job</>} className="h-full min-h-0">

          <JobDescriptionForm onDataChange={handleJobDataChange} />

          {/* Fabrication slider */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-slate-600">Optimization Intensity</Label>
              <span className="text-xs font-bold text-indigo-600">{fabricationLevel[0]}%</span>
            </div>
            <Slider
              value={fabricationLevel}
              onValueChange={(val: number[]) => setFabricationLevel(val)}
              max={100} step={10}
              className="w-full"
            />
            <p className="text-[10px] text-slate-400">
              {fabricationLevel[0] < 20 ? "Strict — only rephrase"
                : fabricationLevel[0] < 50 ? "Moderate — imply skills"
                : fabricationLevel[0] < 80 ? "Aggressive — embellish"
                : "Maximum — 100% ATS match"}
            </p>
          </div>

          {/* ATS Before score — shown when JD + resume is filled */}
          <AnimatePresence>
            {preAtsScore && resumeData && jobText && (
              <motion.div
                key="ats-before"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
                  ATS Breakdown
                </div>
                <AtsReport score={preAtsScore!} />
              </motion.div>
            )}
          </AnimatePresence>

            {/* Mobile Footer Nav */}
            <div className="lg:hidden pt-4 mt-4 border-t border-slate-100 flex justify-between gap-3">
              <Button variant="outline" onClick={() => setMobileStep(1)} className="gap-2">
                Back
              </Button>
              <Button onClick={() => setMobileStep(3)} className="bg-rose-600 hover:bg-rose-700 text-white gap-2">
                {canGenerate ? "Review Analysis" : "Next Step"} <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </ZoneCard>
        </div>

        {/* ── ZONE 3: Results (tabbed) ────────────────────────────── */}
        <div ref={zone3Ref} className={`${mobileStep === 3 ? "block" : "hidden lg:block"} rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full`}>
          <div className={`h-1 ${zone3Tab === "cover-letter" ? "bg-violet-500" : "bg-emerald-500"}`} />
          {/* Tab bar header */}
          <div className="border-b border-slate-100 flex items-center px-2 shrink-0">
            <button
              onClick={() => setZone3Tab("resume")}
              className={`flex items-center gap-1.5 px-3 py-3 text-xs font-semibold border-b-2 transition-colors mr-1 ${
                zone3Tab === "resume"
                  ? "border-emerald-500 text-emerald-700"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-[9px] font-bold">3</span>
              Optimized Resume
            </button>
            <button
              onClick={() => setZone3Tab("cover-letter")}
              className={`flex items-center gap-1.5 px-3 py-3 text-xs font-semibold border-b-2 transition-colors ${
                zone3Tab === "cover-letter"
                  ? "border-violet-500 text-violet-700"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <span className="text-base leading-none">✉️</span>
              Cover Letter
              {(clFinalText || clPromptText) && (
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 ml-0.5" />
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">

            {/* ─── Resume Tab ──────────────────────────────────────────── */}
            {zone3Tab === "resume" && (
              <AnimatePresence>
                {!hasOutput && !hasPromptOutput && (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-16 text-center text-slate-400 gap-3"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-slate-300" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">Results will appear here</p>
                      <p className="text-xs mt-1">
                        {!resumeData?.personalInfo?.fullName ? "Fill your resume to begin" :
                          !jobText ? "Paste a job description" :
                            provider === "prompt-only" ? "Hit Generate Prompt above" :
                            "Hit Optimize Resume above"}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* ── Prompt-Only guided flow ── */}
                {hasPromptOutput && (
                  <motion.div key="prompt-flow" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                    <div className="rounded-xl border border-slate-200 overflow-hidden">
                      <div className="px-4 py-2.5 bg-indigo-50 border-b border-indigo-100 flex flex-wrap items-center justify-between gap-y-2 gap-x-4">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">1</span>
                          <span className="text-xs font-semibold text-indigo-700">Copy this optimized prompt</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" className="h-7 px-3 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800"
                            onClick={async () => {
                              if (navigator.share) {
                                try {
                                  await navigator.share({ title: "Resume Prompt", text: generatedPrompt });
                                } catch {
                                  // User cancelled or share failed
                                }
                              } else {
                                toast.error("Sharing not supported on this device/browser.");
                              }
                            }}>
                            <Share className="w-3 h-3 mr-1.5" />Share Prompt
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" className="h-7 px-3 text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
                                <Zap className="w-3 h-3 mr-1.5" />Open in AI App
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 text-xs">
                              <DropdownMenuItem className="cursor-pointer" onClick={() => {
                                navigator.clipboard.writeText(generatedPrompt);
                                window.open(`https://chatgpt.com/?q=${encodeURIComponent(generatedPrompt)}`, "_blank");
                              }}>
                                🟢 ChatGPT
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer" onClick={() => {
                                navigator.clipboard.writeText(generatedPrompt);
                                window.open(`https://www.perplexity.ai/?q=${encodeURIComponent(generatedPrompt)}`, "_blank");
                              }}>
                                🔵 Perplexity
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer" onClick={() => {
                                navigator.clipboard.writeText(generatedPrompt);
                                toast.success("Prompt copied! Paste it in Claude.");
                                window.open("https://claude.ai/new", "_blank");
                              }}>
                                🟠 Claude
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer" onClick={() => {
                                navigator.clipboard.writeText(generatedPrompt);
                                toast.success("Prompt copied! Paste it in Gemini.");
                                window.open("https://gemini.google.com/app", "_blank");
                              }}>
                                🟣 Gemini
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="secondary" className="h-7 px-3 text-xs bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                                onClick={async () => { await navigator.clipboard.writeText(generatedPrompt); setPromptCopied(true); toast.success("Prompt copied!"); setTimeout(() => setPromptCopied(false), 3000); }}>
                                {promptCopied ? "✓ Copied!" : <><Copy className="w-3 h-3 mr-1.5" />Copy</>}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copy prompt to clipboard</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                      <div className="p-3 text-xs font-mono text-slate-500 max-h-48 overflow-y-auto whitespace-pre-wrap custom-scrollbar bg-white">{generatedPrompt}</div>
                    </div>
                    
                    {/* Mobile Quick Apps */}
                    <div className="lg:hidden grid grid-cols-2 gap-2 mt-2">
                       <Button variant="outline" className="h-9 text-xs border-indigo-100 text-indigo-700 bg-indigo-50/50"
                        onClick={() => {
                          const text = generatedPrompt;
                          navigator.clipboard.writeText(text);
                          toast.success("Prompt copied!");
                          // Attempt deep link, fallback to web
                          window.location.href = "chatgpt://";
                          setTimeout(() => { if (document.hasFocus()) window.open(`https://chatgpt.com/?q=${encodeURIComponent(text)}`, "_blank"); }, 300);
                        }}>
                        🟢 ChatGPT
                      </Button>
                      <Button variant="outline" className="h-9 text-xs border-orange-100 text-orange-700 bg-orange-50/50"
                        onClick={() => {
                          const text = generatedPrompt;
                          navigator.clipboard.writeText(text);
                          toast.success("Prompt copied!");
                          window.location.href = "claude://";
                          setTimeout(() => { if (document.hasFocus()) window.open("https://claude.ai/new", "_blank"); }, 300);
                        }}>
                        🟠 Claude
                      </Button>
                      <Button variant="outline" className="h-9 text-xs border-blue-100 text-blue-700 bg-blue-50/50"
                        onClick={() => {
                          const text = generatedPrompt;
                          navigator.clipboard.writeText(text);
                          toast.success("Prompt copied!");
                          window.location.href = "google-gemini://";
                          setTimeout(() => { if (document.hasFocus()) window.open("https://gemini.google.com/app", "_blank"); }, 300);
                        }}>
                        🟣 Gemini
                      </Button>
                      <Button variant="outline" className="h-9 text-xs border-slate-200 text-slate-600"
                        onClick={() => {
                          const text = generatedPrompt;
                          navigator.clipboard.writeText(text);
                          toast.success("Prompt copied!");
                          window.open(`https://www.perplexity.ai/?q=${encodeURIComponent(text)}`, "_blank");
                        }}>
                        🔵 Perplexity
                      </Button>
                    </div>
                    <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                      <p className="text-xs font-semibold text-amber-800 mb-1.5 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-amber-200 flex items-center justify-center text-amber-800 text-[10px] font-bold">2</span>
                        Paste into ChatGPT, Claude, or Gemini
                      </p>
                      <ol className="text-xs text-amber-700 space-y-0.5 ml-7 list-decimal">
                        <li>Open <a href="https://chat.openai.com" target="_blank" rel="noreferrer" className="underline font-medium">ChatGPT</a>, <a href="https://claude.ai" target="_blank" rel="noreferrer" className="underline font-medium">Claude</a>, or <a href="https://gemini.google.com" target="_blank" rel="noreferrer" className="underline font-medium">Gemini</a></li>
                        <li>Paste the prompt above and send it</li>
                        <li>Copy the AI&apos;s full response</li>
                        <li>Paste it in the box below ↓</li>
                      </ol>
                    </div>
                    <div className="rounded-xl border border-slate-200 overflow-hidden">
                      <div className="px-4 py-2.5 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">3</span>
                        <span className="text-xs font-semibold text-emerald-700">Paste the AI response — we&apos;ll extract your optimized resume</span>
                      </div>
                      <div className="p-3 space-y-2">
                        <textarea value={aiResponseText} onChange={(e) => setAiResponseText(e.target.value)}
                          placeholder="Paste the full AI response here (including the ```json block)…"
                          className="w-full min-h-[120px] max-h-[200px] text-xs font-mono border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 resize-none custom-scrollbar bg-white text-slate-700 placeholder:text-slate-400" />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={async () => { let text = aiResponseText; if (!text) { try { text = await navigator.clipboard.readText(); setAiResponseText(text); } catch { toast.info("Paste the response above first."); return; } } parseAiResponse(text); }}
                            className="h-7 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                            <ClipboardPaste className="w-3 h-3 mr-1.5" />Extract &amp; Update Resume
                          </Button>
                          {aiResponseText && (<Button size="sm" variant="ghost" onClick={() => setAiResponseText("")} className="h-7 px-2 text-xs text-slate-400 hover:text-red-500">Clear</Button>)}
                        </div>
                      </div>
                    </div>
                    {originalResumeData && resumeData && resumeData !== originalResumeData && jobText && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                        <ScoreDeltaBanner before={preAtsScore?.total ?? 0} after={postAtsScore?.total ?? 0} />
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />Optimized ATS Score
                        </div>
                        <AtsReport score={postAtsScore!} />
                        {resumeData.personalInfo?.fullName && (
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 mt-4">
                            <div className="flex items-center gap-2 flex-1">
                              <Label className="text-xs font-semibold text-slate-700 shrink-0">Template</Label>
                              <Select value={selectedTemplate} onValueChange={(v) => setSelectedTemplate(v as PdfTemplate)}>
                                <SelectTrigger className="h-8 text-xs w-36 bg-white border-slate-200 shadow-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="sidebar" className="text-xs">🎨 Sidebar</SelectItem>
                                  <SelectItem value="classic" className="text-xs">📄 Classic</SelectItem>
                                  <SelectItem value="executive" className="text-xs">💼 Executive</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <PdfDownloadButton data={resumeData} template={selectedTemplate} label="Export PDF"
                              className="h-8 px-4 flex items-center gap-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors shadow-sm shrink-0" />
                          </div>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* ── AI Output flow ── */}
                {hasOutput && (
                  <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                    {preAtsScore && afterScore !== null && !isLoading && (
                      <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />ATS Score Impact
                        </div>
                        <ScoreDeltaBanner before={preAtsScore.total} after={afterScore} />
                      </div>
                    )}
                    {isLoading && (
                      <div className="rounded-xl bg-indigo-50 border border-indigo-200 overflow-hidden">
                        <div className="px-4 py-2.5 bg-indigo-100/50 flex items-center gap-2 border-b border-indigo-200">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                          <span className="text-xs font-medium text-indigo-700">AI Optimizing…</span>
                        </div>
                        <div className="p-4 text-xs font-mono text-slate-600 max-h-48 overflow-y-auto whitespace-pre-wrap custom-scrollbar">
                          {completion.replace(/```json[\s\S]*?```/, "").trim()}
                          <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-indigo-500 animate-pulse rounded-sm" />
                        </div>
                      </div>
                    )}
                    {!isLoading && completion && (
                      <div className="rounded-xl border border-slate-200 overflow-hidden">
                        <button onClick={() => setShowChangelog((p) => !p)}
                          className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors text-xs font-medium text-slate-600">
                          <span className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-indigo-500" />AI Change Log</span>
                          {showChangelog ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                        <AnimatePresence>
                          {showChangelog && (
                            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                              <div className="p-4 text-xs font-mono text-slate-500 whitespace-pre-wrap max-h-52 overflow-y-auto custom-scrollbar border-t border-slate-100">
                                {completion.replace(/```json[\s\S]*?```/, "").trim()}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                    {!isLoading && resumeData && jobText && (
                      <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />Optimized ATS Score Breakdown
                        </div>
                        <AtsReport score={postAtsScore!} />
                      </div>
                    )}
                    {!isLoading && resumeData?.personalInfo?.fullName && (
                      <div className="space-y-4 mt-2">
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1">
                            <Label className="text-xs font-semibold text-slate-700 shrink-0">Template Options</Label>
                            <Select value={selectedTemplate} onValueChange={(v) => setSelectedTemplate(v as PdfTemplate)}>
                              <SelectTrigger className="h-8 text-xs w-40 bg-white border-slate-200 shadow-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sidebar" className="text-xs">🎨 Sidebar</SelectItem>
                                <SelectItem value="classic" className="text-xs">📄 Classic</SelectItem>
                                <SelectItem value="executive" className="text-xs">💼 Executive</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <PdfDownloadButton data={resumeData} template={selectedTemplate} label="Export PDF"
                            className="h-8 px-4 flex items-center gap-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors shadow-sm shrink-0" />
                        </div>
                        <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100" style={{ height: "600px" }}>
                          <PdfPreview data={resumeData} template={selectedTemplate} />
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {/* ─── Cover Letter Tab ──────────────────────────────────── */}
            {zone3Tab === "cover-letter" && (
              <CoverLetterPanel
                tone={clTone}
                length={clLength}
                onToneChange={setClTone}
                onLengthChange={setClLength}
                onGenerate={handleClGenerate}
                onRegenerate={handleClRegenerate}
                isLoading={clIsLoading}
                streamText={clCompletion}
                finalText={clFinalText}
                onFinalTextChange={setClFinalText}
                canGenerate={!!(resumeData && jobData)}
                isPromptOnly={provider === "prompt-only"}
                promptText={clPromptText}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
