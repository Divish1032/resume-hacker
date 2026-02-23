"use client";

import { useEffect, useCallback } from "react";
import { Sparkles, ClipboardPaste, ShieldCheck, X, Briefcase } from "lucide-react";
import { useAppStore, ProviderType } from "@/lib/store";
import { ThemeToggle } from "@/components/theme-toggle";
import { ResumeSelector } from "@/components/features/ResumeSelector";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ApplicationTracker } from "@/components/features/ApplicationTracker";
import { useState } from "react";

export function Header() {
  const store = useAppStore();
  const [showKeyBanner, setShowKeyBanner] = useState(false);
  const [showAppTracker, setShowAppTracker] = useState(false);

  // Initialize providers
  useEffect(() => {
    let isMounted = true;
    
    const initializeProvider = async () => {
      try {
        const [configRes, ollamaModelListRes] = await Promise.all([
          fetch("/api/config").then((r) => r.json()).catch(() => ({})),
          fetch("/api/ollama/tags").then((r) => r.json()).catch(() => ({ available: false, models: [] }))
        ]);
        
        if (!isMounted) return;
        
        let ollamaModels = [];
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
        if (models.length > 0) {
          store.setSelectedModel(models[0]);
        }
        
        const savedKey = typeof window !== "undefined" ? localStorage.getItem(`rh_apikey_${defaultProvider}`) : null;
        if (savedKey) store.setApiKey(savedKey);
      } catch (error) {
        console.error("Initialization error:", error);
      }
    };

    initializeProvider();
    return () => { isMounted = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getModelOptions = useCallback((p = store.provider, ollamaModelsArg = store.ollamaModels) => {
    switch (p) {
      case "openai": return ["gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"];
      case "anthropic": return ["claude-3-5-sonnet-latest", "claude-3-opus-latest", "claude-3-haiku-20240307"];
      case "ollama": return ollamaModelsArg.length > 0 ? ollamaModelsArg : ["llama3", "mistral", "gemma3:4b"];
      case "google": return ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.0-flash-exp"];
      case "deepseek": return ["deepseek-chat", "deepseek-reasoner"];
      default: return [];
    }
  }, [store.provider, store.ollamaModels]);

  const handleProviderChange = (newProvider: ProviderType) => {
    store.setProvider(newProvider);
    const models = getModelOptions(newProvider);
    if (models.length > 0) {
      store.setSelectedModel(models[0]);
    } else {
      store.setSelectedModel("");
    }
    
    // Restore or clear API key when switching providers
    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem(`rh_apikey_${newProvider}`);
      store.setApiKey(savedKey || "");
      
      const savedModel = localStorage.getItem(`rh_model_${newProvider}`);
      if (savedModel) {
        if (models.includes(savedModel)) {
          store.setSelectedModel(savedModel);
          store.setIsCustomModel(false);
          store.setCustomModelInput("");
        } else {
          store.setIsCustomModel(true);
          store.setCustomModelInput(savedModel);
          store.setSelectedModel(savedModel);
        }
      } else {
        store.setIsCustomModel(false);
        store.setCustomModelInput("");
      }
    }
  };

  return (
    <>
      {showKeyBanner && (
        <div className="relative flex items-center justify-center gap-2.5 bg-emerald-600 text-white text-xs px-4 py-2.5">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span>
            <strong>Your API key is safe.</strong> It is stored only in your browser (localStorage) and sent directly to the provider. We never store or log it on our servers.
          </span>
          <button
            onClick={() => {
              setShowKeyBanner(false);
              localStorage.setItem("rh_key_banner_dismissed", "1");
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <header className="sticky top-0 z-50 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
        <div className="w-full px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Resume Hacker</span>
            <span className="hidden lg:inline text-xs text-slate-400 border border-slate-200 dark:border-slate-800 px-1.5 py-0.5 rounded-md">AI-powered ATS optimizer</span>
            
            <div className="ml-1 sm:ml-2">
              <ThemeToggle />
            </div>

            <div className="ml-1 sm:ml-3 border-l border-slate-200 dark:border-slate-800 pl-1 sm:pl-3 flex items-center gap-1 sm:gap-2">
              <ResumeSelector
                currentData={store.resumeData}
                onLoad={store.loadResume}
              />
              <Button variant="outline" size="sm" onClick={() => setShowAppTracker(true)} className="h-8 gap-1.5 border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                <span className="hidden sm:inline">Tracker</span>
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap justify-end">
            <div className="flex items-center gap-1.5 min-w-[110px] xs:min-w-[120px]">
              <Label className="text-[10px] xs:text-xs text-slate-500 shrink-0 hidden sm:inline">Provider</Label>
              <Select value={store.provider} onValueChange={(v) => handleProviderChange(v as ProviderType)}>
                <SelectTrigger className="h-8 flex-1 sm:w-32 text-[10px] xs:text-xs border-slate-200 dark:border-slate-800 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prompt-only" className="text-xs">Prompt Only</SelectItem>
                  {store.isOllamaAvailable && (
                    <SelectItem value="ollama" className="text-xs">Ollama (Local)</SelectItem>
                  )}
                  <SelectItem value="openai" className="text-xs">OpenAI</SelectItem>
                  <SelectItem value="anthropic" className="text-xs">Anthropic</SelectItem>
                  <SelectItem value="google" className="text-xs">Gemini</SelectItem>
                  <SelectItem value="deepseek" className="text-xs">DeepSeek</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {store.provider !== "prompt-only" && (
              <div className="flex items-center gap-2 sm:gap-3">
                {["openai", "anthropic", "google", "deepseek"].includes(store.provider) && (
                  <div className="flex items-center gap-1.5 min-w-[130px] xs:min-w-[140px]">
                    <Label className="text-[10px] xs:text-xs text-slate-500 shrink-0 hidden sm:inline">Key</Label>
                    <div className="flex items-center gap-1 flex-1">
                      <Input
                        type="password"
                        value={store.apiKey}
                        onChange={(e) => {
                          const val = e.target.value;
                          store.setApiKey(val);
                          if (typeof window !== "undefined") {
                            if (val) {
                              localStorage.setItem(`rh_apikey_${store.provider}`, val);
                              if (!localStorage.getItem("rh_key_banner_dismissed")) setShowKeyBanner(true);
                            } else {
                              localStorage.removeItem(`rh_apikey_${store.provider}`);
                            }
                          }
                        }}
                        placeholder={store.configuredProviders[store.provider] ? "Env setup" : "sk-..."}
                        className="h-8 flex-1 sm:w-32 text-[10px] xs:text-xs border-slate-200 dark:border-slate-800 bg-background"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const text = await navigator.clipboard.readText();
                            if (text.trim()) { 
                              const val = text.trim();
                              store.setApiKey(val); 
                              if (typeof window !== "undefined") localStorage.setItem(`rh_apikey_${store.provider}`, val);
                              toast.success("API key pasted!"); 
                            }
                            else toast.warning("Clipboard is empty.");
                          } catch { toast.info("Clipboard denied — paste manually."); }
                        }}
                        className="h-7 w-7 flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                      >
                        <ClipboardPaste className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <Label className="text-[10px] xs:text-xs text-slate-500 shrink-0 hidden sm:inline">Model</Label>
                  <Select
                    value={store.isCustomModel ? "__custom__" : store.selectedModel}
                    onValueChange={(val) => {
                      if (val === "__custom__") {
                        store.setIsCustomModel(true);
                        store.setSelectedModel(store.customModelInput || "");
                      } else {
                        store.setIsCustomModel(false);
                        store.setCustomModelInput("");
                        store.setSelectedModel(val);
                        localStorage.setItem(`rh_model_${store.provider}`, val);
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 w-28 xs:w-32 sm:w-36 text-[10px] xs:text-xs border-slate-200 dark:border-slate-800 bg-background">
                      <SelectValue>
                        {store.isCustomModel ? (store.customModelInput || "Custom") : store.selectedModel}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {getModelOptions().map((m) => (
                        <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
                      ))}
                      <SelectItem value="__custom__" className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">✏️ Custom…</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {showAppTracker && (
        <ApplicationTracker onClose={() => setShowAppTracker(false)} />
      )}
    </>
  );
}
