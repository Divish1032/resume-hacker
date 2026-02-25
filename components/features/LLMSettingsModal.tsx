"use client";

import { useCallback, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ClipboardPaste, Cpu, KeyRound, Zap, CheckCircle2, ShieldCheck, Download, PackagePlus } from "lucide-react";
import { useAppStore, ProviderType } from "@/lib/store";
import { toast } from "sonner";
import { OllamaInstallModal } from "@/components/features/OllamaInstallModal";

interface LLMSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PROVIDER_LABELS: Record<ProviderType, string> = {
  "prompt-only": "Prompt Only (no AI)",
  ollama: "Ollama (Local)",
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Gemini",
  deepseek: "DeepSeek",
};

const PROVIDER_COLORS: Record<ProviderType, string> = {
  "prompt-only": "text-slate-500",
  ollama: "text-emerald-600",
  openai: "text-teal-600",
  anthropic: "text-orange-600",
  google: "text-blue-600",
  deepseek: "text-indigo-600",
};

export function LLMSettingsModal({ open, onOpenChange }: LLMSettingsModalProps) {
  const store = useAppStore();
  const [installTarget, setInstallTarget] = useState<string | null>(null);

  const getModelOptions = useCallback(
    (p = store.provider, ollamaModelsArg = store.ollamaModels) => {
      switch (p) {
        case "openai": return ["gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"];
        case "anthropic": return ["claude-3-5-sonnet-latest", "claude-3-opus-latest", "claude-3-haiku-20240307"];
        case "ollama":
          // Only show actually-installed models, no hard-coded fallbacks
          return ollamaModelsArg.map((m: { name?: string } | string) =>
            typeof m === "string" ? m : (m.name ?? "")
          ).filter(Boolean);
        case "google": return ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.0-flash-exp"];
        case "deepseek": return ["deepseek-chat", "deepseek-reasoner"];
        default: return [];
      }
    },
    [store.provider, store.ollamaModels]
  );

  const handleProviderChange = (newProvider: ProviderType) => {
    store.setProvider(newProvider);
    const models = getModelOptions(newProvider);
    store.setSelectedModel(models.length > 0 ? models[0] : "");
    store.setIsCustomModel(false);
    store.setCustomModelInput("");

    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem(`rh_apikey_${newProvider}`);
      store.setApiKey(savedKey || "");

      const savedModel = localStorage.getItem(`rh_model_${newProvider}`);
      if (savedModel) {
        if (getModelOptions(newProvider).includes(savedModel)) {
          store.setSelectedModel(savedModel);
        } else {
          store.setIsCustomModel(true);
          store.setCustomModelInput(savedModel);
          store.setSelectedModel(savedModel);
        }
      }
    }
  };

  // After a model is successfully installed, refresh the Ollama model list
  const handleModelInstalled = async (modelName: string) => {
    setInstallTarget(null);
    try {
      const res = await fetch("/api/ollama/tags");
      if (res.ok) {
        const data = await res.json();
        const names: string[] = (data.models ?? []).map((m: { name: string }) => m.name.replace(":latest", ""));
        store.setOllamaModels(names as never[]);
        store.setSelectedModel(modelName.replace(":latest", ""));
        store.setIsCustomModel(false);
        store.setCustomModelInput("");
      }
    } catch {
      // Refresh failed — model is still installed, user can re-open settings
    }
    toast.success(`${modelName} ready! Selected as active model.`);
  };

  const needsApiKey = ["openai", "anthropic", "google", "deepseek"].includes(store.provider);
  const isConfigured =
    store.provider === "prompt-only" ||
    (store.provider === "ollama" && store.isOllamaAvailable && !!store.selectedModel) ||
    store.configuredProviders[store.provider] ||
    !!store.apiKey;

  const modelOptions = getModelOptions();
  const isOllama = store.provider === "ollama";

  // For Ollama custom model entry — detect if user typed a name that could be installed
  const customModelTrimmed = store.customModelInput.trim();
  const canInstall = isOllama && store.isCustomModel && customModelTrimmed.length > 1;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-slate-900 dark:text-white">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              AI Provider Settings
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-1">

            {/* Provider tiles */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Provider
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(PROVIDER_LABELS) as ProviderType[]).map((p) => {
                  const isActive = store.provider === p;
                  const isOllamaUnavailable = p === "ollama" && !store.isOllamaAvailable;
                  return (
                    <button
                      key={p}
                      disabled={isOllamaUnavailable}
                      onClick={() => handleProviderChange(p)}
                      className={`relative flex flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                        isActive
                          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-400"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600"
                      }`}
                    >
                      {isActive && <CheckCircle2 className="absolute top-2 right-2 w-3.5 h-3.5 text-indigo-500" />}
                      <span className={`text-xs font-semibold ${isActive ? "text-indigo-700 dark:text-indigo-300" : PROVIDER_COLORS[p]}`}>
                        {p === "prompt-only" ? "Prompt Only" : p === "ollama" ? "Ollama" : PROVIDER_LABELS[p]}
                      </span>
                      <span className="text-[10px] text-slate-400 leading-tight">
                        {p === "prompt-only" && "Copy prompts manually"}
                        {p === "ollama" && (store.isOllamaAvailable ? `${getModelOptions(p, store.ollamaModels).length} model(s) installed` : "Not detected")}
                        {p === "openai" && "GPT-4o, GPT-4-turbo"}
                        {p === "anthropic" && "Claude 3.5 Sonnet"}
                        {p === "google" && "Gemini 1.5 Pro"}
                        {p === "deepseek" && "DeepSeek Chat"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* API Key — cloud providers only */}
            {needsApiKey && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" /> API Key
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="password"
                    value={store.apiKey}
                    onChange={(e) => {
                      const val = e.target.value;
                      store.setApiKey(val);
                      if (typeof window !== "undefined") {
                        if (val) localStorage.setItem(`rh_apikey_${store.provider}`, val);
                        else localStorage.removeItem(`rh_apikey_${store.provider}`);
                      }
                    }}
                    placeholder={store.configuredProviders[store.provider] ? "Set via environment variable" : "sk-…"}
                    className="flex-1 h-9 text-sm font-mono"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    title="Paste from clipboard"
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText();
                        if (text.trim()) {
                          store.setApiKey(text.trim());
                          if (typeof window !== "undefined")
                            localStorage.setItem(`rh_apikey_${store.provider}`, text.trim());
                          toast.success("API key pasted!");
                        } else {
                          toast.warning("Clipboard is empty.");
                        }
                      } catch {
                        toast.info("Clipboard access denied — paste manually.");
                      }
                    }}
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="flex items-start gap-1.5 text-[11px] text-slate-400">
                  <ShieldCheck className="w-3 h-3 shrink-0 mt-0.5 text-emerald-500" />
                  Your key is stored only in your browser and sent directly to the provider. We never log it.
                </div>
              </div>
            )}

            {/* Model picker */}
            {store.provider !== "prompt-only" && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> Model
                  {isOllama && (
                    <span className="ml-auto text-[10px] font-normal text-slate-400 normal-case">
                      {modelOptions.length} installed
                    </span>
                  )}
                </Label>

                {/* Ollama: show a simple select of installed models (no hard-coded fallbacks) */}
                {isOllama ? (
                  <div className="space-y-2">
                    {modelOptions.length > 0 ? (
                      <Select
                        value={store.isCustomModel ? "__custom__" : (store.selectedModel || "none")}
                        onValueChange={(val) => {
                          if (val === "__custom__") {
                            store.setIsCustomModel(true);
                            store.setSelectedModel(store.customModelInput || "");
                          } else {
                            store.setIsCustomModel(false);
                            store.setCustomModelInput("");
                            store.setSelectedModel(val);
                            if (typeof window !== "undefined")
                              localStorage.setItem(`rh_model_${store.provider}`, val);
                          }
                        }}
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Select installed model">
                            {store.isCustomModel ? (store.customModelInput || "Custom / install new") : store.selectedModel}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {modelOptions.map((m) => (
                            <SelectItem key={m} value={m} className="text-sm font-mono">{m}</SelectItem>
                          ))}
                          <SelectItem value="__custom__" className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                            <PackagePlus className="w-3.5 h-3.5 inline mr-1.5" />
                            Install new model…
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div
                        className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10 cursor-pointer"
                        onClick={() => { store.setIsCustomModel(true); store.setSelectedModel(""); }}
                      >
                        <PackagePlus className="w-4 h-4 text-emerald-500 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">No models installed</p>
                          <p className="text-[11px] text-emerald-600/70 dark:text-emerald-500/70">Click to install one from the Ollama library</p>
                        </div>
                      </div>
                    )}

                    {/* Custom / install new model input */}
                    {store.isCustomModel && (
                      <div className="space-y-2">
                        <Input
                          value={store.customModelInput}
                          onChange={(e) => {
                            store.setCustomModelInput(e.target.value);
                            store.setSelectedModel(e.target.value);
                          }}
                          placeholder="e.g. llama3:8b, mistral, gemma3:4b"
                          className="h-9 text-sm font-mono"
                          autoFocus
                        />
                        {canInstall && (
                          <Button
                            onClick={() => setInstallTarget(customModelTrimmed)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-9"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Install &quot;{customModelTrimmed}&quot; from Ollama library
                          </Button>
                        )}
                        <p className="text-[11px] text-slate-400">
                          Find model names at{" "}
                          <a href="https://ollama.com/library" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                            ollama.com/library
                          </a>
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Cloud providers: standard dropdown */
                  <div className="space-y-1.5">
                    <Select
                      value={store.isCustomModel ? "__custom__" : (store.selectedModel || "none")}
                      onValueChange={(val) => {
                        if (val === "__custom__") {
                          store.setIsCustomModel(true);
                          store.setSelectedModel(store.customModelInput || "");
                        } else {
                          store.setIsCustomModel(false);
                          store.setCustomModelInput("");
                          store.setSelectedModel(val);
                          if (typeof window !== "undefined")
                            localStorage.setItem(`rh_model_${store.provider}`, val);
                        }
                      }}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select a model">
                          {store.isCustomModel ? (store.customModelInput || "Custom model") : store.selectedModel}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {modelOptions.map((m) => (
                          <SelectItem key={m} value={m} className="text-sm">{m}</SelectItem>
                        ))}
                        <SelectItem value="__custom__" className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                          ✏️ Custom model…
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {store.isCustomModel && (
                      <Input
                        value={store.customModelInput}
                        onChange={(e) => {
                          store.setCustomModelInput(e.target.value);
                          store.setSelectedModel(e.target.value);
                        }}
                        placeholder="e.g. gpt-4o-mini"
                        className="h-9 text-sm font-mono"
                        autoFocus
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Status pill */}
            <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium ${
              isConfigured
                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/40"
                : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40"
            }`}>
              <div className={`w-2 h-2 rounded-full ${isConfigured ? "bg-emerald-500" : "bg-amber-400"} shrink-0`} />
              {isConfigured
                ? `Ready — using ${PROVIDER_LABELS[store.provider]}${store.selectedModel ? ` (${store.selectedModel})` : ""}`
                : isOllama
                  ? "Select or install a model to get started"
                  : `Enter an API key for ${PROVIDER_LABELS[store.provider]} to enable AI generation`}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ollama install modal */}
      {installTarget && (
        <OllamaInstallModal
          modelName={installTarget}
          open={!!installTarget}
          onOpenChange={(v) => { if (!v) setInstallTarget(null); }}
          onInstalled={handleModelInstalled}
        />
      )}
    </>
  );
}
