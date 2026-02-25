"use client";

import { useEffect, useCallback } from "react";
import { Sparkles, Briefcase, SlidersHorizontal } from "lucide-react";
import { useAppStore, ProviderType } from "@/lib/store";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { ApplicationTracker } from "@/components/features/ApplicationTracker";
import { LLMSettingsModal } from "@/components/features/LLMSettingsModal";
import { useState } from "react";

export function Header() {
  const store = useAppStore();
  const [showAppTracker, setShowAppTracker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const getModelOptions = useCallback(
    (p = store.provider, ollamaModelsArg = store.ollamaModels) => {
      switch (p) {
        case "openai": return ["gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"];
        case "anthropic": return ["claude-3-5-sonnet-latest", "claude-3-opus-latest", "claude-3-haiku-20240307"];
        case "ollama": return ollamaModelsArg.length > 0 ? ollamaModelsArg : ["llama3", "mistral", "gemma3:4b"];
        case "google": return ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.0-flash-exp"];
        case "deepseek": return ["deepseek-chat", "deepseek-reasoner"];
        default: return [];
      }
    },
    [store.provider, store.ollamaModels]
  );

  // Initialize provider on mount
  useEffect(() => {
    let isMounted = true;

    const initializeProvider = async () => {
      try {
        const [configRes, ollamaModelListRes] = await Promise.all([
          fetch("/api/config").then((r) => r.json()).catch(() => ({})),
          fetch("/api/ollama/tags").then((r) => r.json()).catch(() => ({ available: false, models: [] })),
        ]);

        if (!isMounted) return;

        let ollamaModels: string[] = [];
        if (ollamaModelListRes.available !== false) {
          store.setIsOllamaAvailable(true);
          ollamaModels = ollamaModelListRes.models?.map((m: { name: string }) => m.name.replace(":latest", "")) || [];
        } else {
          store.setIsOllamaAvailable(false);
        }

        store.setConfiguredProviders(configRes);
        store.setOllamaModels(ollamaModels);

        let defaultProvider: ProviderType = "prompt-only";
        if (configRes.openai) defaultProvider = "openai";
        else if (configRes.anthropic) defaultProvider = "anthropic";
        else if (configRes.google) defaultProvider = "google";
        else if (configRes.deepseek) defaultProvider = "deepseek";
        else if (ollamaModels.length > 0) defaultProvider = "ollama";

        store.setProvider(defaultProvider);

        const models = defaultProvider === "ollama" ? ollamaModels : getModelOptions(defaultProvider, ollamaModels);
        if (models.length > 0) store.setSelectedModel(models[0]);

        const savedKey = typeof window !== "undefined" ? localStorage.getItem(`rh_apikey_${defaultProvider}`) : null;
        if (savedKey) store.setApiKey(savedKey);
      } catch (error) {
        console.error("Initialization error:", error);
      }
    };

    initializeProvider();
    return () => { isMounted = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <header className="sticky top-0 z-50 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
        <div className="w-full px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

          {/* Left: logo + theme + actions */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Resume Hacker</span>
            <span className="hidden lg:inline text-xs text-slate-400 border border-slate-200 dark:border-slate-800 px-1.5 py-0.5 rounded-md">
              AI-powered ATS optimizer
            </span>

            <div className="ml-1 sm:ml-2">
              <ThemeToggle />
            </div>

            <div className="ml-1 sm:ml-3 border-l border-slate-200 dark:border-slate-800 pl-1 sm:pl-3 flex items-center gap-1 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAppTracker(true)}
                className="h-8 gap-1.5 border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300"
              >
                <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                <span className="hidden sm:inline">Tracker</span>
              </Button>
            </div>
          </div>

          {/* Right: AI settings icon */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:border-indigo-300 dark:hover:text-indigo-400 dark:hover:border-indigo-700 transition-colors"
            title="AI Provider Settings"
            onClick={() => setShowSettings(true)}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {showAppTracker && (
        <ApplicationTracker onClose={() => setShowAppTracker(false)} />
      )}

      <LLMSettingsModal open={showSettings} onOpenChange={setShowSettings} />
    </>
  );
}
