"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Loader2, Copy, Download, RefreshCw, CheckCheck,
} from "lucide-react";
import type { CoverLetterTone, CoverLetterLength } from "@/lib/prompts";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CoverLetterPanelProps {
  tone: CoverLetterTone;
  length: CoverLetterLength;
  userHacks: string;
  onUserHacksChange: (v: string) => void;
  onToneChange: (t: CoverLetterTone) => void;
  onLengthChange: (l: CoverLetterLength) => void;
  onGenerate: () => void;
  onRegenerate: () => void;
  isLoading: boolean;
  streamText: string;           // live streaming text
  finalText: string;            // editable once done
  onFinalTextChange: (v: string) => void;
  canGenerate: boolean;
  isPromptOnly: boolean;
  promptText: string;           // for prompt-only mode
}

const TONES: { value: CoverLetterTone; label: string; desc: string }[] = [
  { value: "professional", label: "Professional", desc: "Formal & executive-ready" },
  { value: "conversational", label: "Conversational", desc: "Warm & genuine" },
  { value: "enthusiastic", label: "Enthusiastic", desc: "Energetic & passion-driven" },
];

const LENGTHS: { value: CoverLetterLength; label: string; desc: string }[] = [
  { value: "concise", label: "Concise", desc: "~250 words · 3 paragraphs" },
  { value: "standard", label: "Standard", desc: "~400 words · 4 paragraphs" },
  { value: "detailed", label: "Detailed", desc: "~550 words · 5 paragraphs" },
];

function RadioCard<T extends string>({
  options, value, onChange, color,
}: {
  options: { value: T; label: string; desc: string }[];
  value: T;
  onChange: (v: T) => void;
  color: string;
}) {
  return (
    <div className="flex gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-xl border text-left px-3 py-2 transition-all text-xs ${
            value === o.value
              ? `border-${color}-400 bg-${color}-50 dark:bg-${color}-900/20 ring-1 ring-${color}-400`
              : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-background"
          }`}
        >
          <span className={`font-semibold block ${value === o.value ? `text-${color}-700 dark:text-${color}-400` : "text-slate-700 dark:text-slate-300"}`}>
            {o.label}
          </span>
          <span className="text-[10px] text-slate-400 leading-tight">{o.desc}</span>
        </button>
      ))}
    </div>
  );
}

export function CoverLetterPanel({
  tone, length, userHacks, onUserHacksChange, onToneChange, onLengthChange,
  onGenerate, onRegenerate, isLoading, streamText, finalText, onFinalTextChange,
  canGenerate, isPromptOnly, promptText,
}: CoverLetterPanelProps) {
  const [copied, setCopied] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const hasResult = !!finalText;
  const isStreaming = isLoading && !!streamText;

  const handleCopy = async (text: string, setFlag: (b: boolean) => void) => {
    await navigator.clipboard.writeText(text);
    setFlag(true);
    setTimeout(() => setFlag(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([finalText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cover-letter.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Tone */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Tone</p>
        <RadioCard options={TONES} value={tone} onChange={onToneChange} color="indigo" />
      </div>

      {/* Length */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Length</p>
        <RadioCard options={LENGTHS} value={length} onChange={onLengthChange} color="emerald" />
      </div>

      {/* Custom AI Hacks */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Custom AI Hacks (Optional)</p>
          <Tooltip>
            <TooltipTrigger>
              <div className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 text-[10px] flex items-center justify-center cursor-help">?</div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs max-w-xs leading-relaxed">
              Use this cheatsheet to override the AI. Tell it to mention a specific past project, focus heavily on a certain skill, or even write in the style of Shakespeare.
            </TooltipContent>
          </Tooltip>
        </div>
        <textarea
          value={userHacks}
          onChange={(e) => onUserHacksChange(e.target.value)}
          placeholder="E.g., Emphasize my AWS certification, mention I'm willing to relocate, or write it like a pirate..."
          className="w-full h-20 text-[13px] p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-1 focus:ring-indigo-500 custom-scrollbar outline-none resize-none placeholder:text-slate-300 dark:placeholder:text-slate-600 transition-all"
        />
      </div>

      {/* Generate button */}
      <Button
        onClick={hasResult ? onRegenerate : onGenerate}
        disabled={!canGenerate || isLoading}
        className="w-full h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm"
      >
        {isLoading
          ? <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />Generating…</>
          : hasResult
            ? <><RefreshCw className="w-3.5 h-3.5 mr-2" />Regenerate</>
            : isPromptOnly
              ? <><Sparkles className="w-3.5 h-3.5 mr-2" />Generate Prompt</>
              : <><Sparkles className="w-3.5 h-3.5 mr-2" />Generate Cover Letter</>
        }
      </Button>

      {/* Empty state */}
      {!hasResult && !isLoading && !promptText && (
        <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-slate-300" />
          </div>
          <p className="text-xs text-slate-400">
            {!canGenerate
              ? "Fill your resume + job description first"
              : "Hit Generate to craft your personalised cover letter"}
          </p>
        </div>
      )}

      {/* Prompt-only output */}
      <AnimatePresence>
        {isPromptOnly && promptText && !isLoading && (
          <motion.div key="cl-prompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="rounded-xl border border-indigo-200 overflow-hidden">
            <div className="px-4 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-900 flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-700">Cover Letter Prompt</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" className="h-6 px-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => handleCopy(promptText, setPromptCopied)}>
                    {promptCopied ? <CheckCheck className="w-3 h-3" /> : <Copy className="w-3 h-3 mr-1" />}
                    {promptCopied ? "Copied!" : "Copy"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy to clipboard</TooltipContent>
              </Tooltip>
            </div>
            <div className="p-3 text-xs font-mono text-slate-500 max-h-64 overflow-y-auto whitespace-pre-wrap custom-scrollbar bg-background">
              {promptText}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Streaming */}
      <AnimatePresence>
        {isStreaming && (
          <motion.div key="cl-stream" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-900 overflow-hidden">
            <div className="px-4 py-2.5 bg-indigo-100/60 dark:bg-indigo-900/40 flex items-center gap-2 border-b border-indigo-200 dark:border-indigo-900">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
              <span className="text-xs font-medium text-indigo-700">Writing your cover letter…</span>
            </div>
            <div className="p-4 text-xs text-slate-600 max-h-64 overflow-y-auto whitespace-pre-wrap custom-scrollbar leading-relaxed">
              {streamText}
              <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-indigo-500 animate-pulse rounded-sm" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Final editable result */}
      <AnimatePresence>
        {hasResult && !isLoading && (
          <motion.div key="cl-result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Your Cover Letter <span className="text-slate-300 font-normal">· click to edit</span>
              </p>
              <span className="text-[10px] text-slate-400">
                {finalText.split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
            <textarea
              value={finalText}
              onChange={(e) => onFinalTextChange(e.target.value)}
              className="w-full min-h-[320px] max-h-[500px] text-xs text-slate-700 dark:text-slate-300 leading-relaxed border border-slate-200 dark:border-slate-800 rounded-xl p-4 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:border-indigo-400 resize-y custom-scrollbar bg-background"
            />
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline"
                    onClick={() => handleCopy(finalText, setCopied)}
                    className="h-7 px-3 text-xs border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50">
                    {copied ? <><CheckCheck className="w-3 h-3 mr-1.5 text-emerald-500" />Copied!</> : <><Copy className="w-3 h-3 mr-1.5" />Copy</>}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy to clipboard</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" onClick={handleDownload}
                    className="h-7 px-3 text-xs border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50">
                    <Download className="w-3 h-3 mr-1.5" />Download .txt
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Download as text file</TooltipContent>
              </Tooltip>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
