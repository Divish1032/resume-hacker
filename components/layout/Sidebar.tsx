"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  MessageSquareQuote,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Briefcase,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
import { useAppStore, ProviderType } from "@/lib/store";
import { ThemeToggle } from "@/components/theme-toggle";
import { ApplicationTracker } from "@/components/features/ApplicationTracker";
import { LLMSettingsModal } from "@/components/features/LLMSettingsModal";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const NAV_ITEMS = [
  {
    title: "Optimizer",
    href: "/optimizer",
    icon: FileText,
    description: "Tailor resume to job descriptions",
  },
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Track applications & saved resumes",
  },
  {
    title: "Interview Prep",
    href: "/interview",
    icon: MessageSquareQuote,
    description: "Mock questions & STAR flashcards",
  },
  {
    title: "Networking",
    href: "/networking",
    icon: Network,
    description: "LinkedIn outreach & headlines",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showAppTracker, setShowAppTracker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const store = useAppStore();

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

  // Initialize providers on mount (moved from Header)
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
      <aside
        className={cn(
          "flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col transition-all duration-300 relative",
          isCollapsed ? "w-16" : "w-16 lg:w-64"
        )}
      >
        {/* ── Sidebar Header: Logo + Branding ── */}
        <div
          className={cn(
            "flex items-center gap-2.5 px-4 py-4 border-b border-slate-200 dark:border-slate-800",
            isCollapsed && "justify-center px-0"
          )}
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          {!isCollapsed && (
            <div className={cn("overflow-hidden hidden lg:block")}>
              <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
                Resume Hacker
              </p>
              <p className="text-[10px] text-slate-400 truncate">AI-powered ATS optimizer</p>
            </div>
          )}
        </div>

        {/* ── Nav Items ── */}
        <div className="flex flex-col gap-1 p-3 flex-1 overflow-hidden">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname.startsWith(item.href) ||
              (pathname === "/" && item.href === "/optimizer");
            const Icon = item.icon;

            return (
              <Tooltip key={item.href} delayDuration={300}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all text-sm font-medium",
                      isActive
                        ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200",
                      isCollapsed && "justify-center px-0 lg:px-0"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5 shrink-0",
                        isActive
                          ? "text-indigo-600 dark:text-indigo-500"
                          : "text-slate-400 dark:text-slate-500"
                      )}
                    />
                    <div
                      className={cn(
                        "flex-col overflow-hidden",
                        isCollapsed ? "hidden" : "hidden lg:flex"
                      )}
                    >
                      <span className="truncate">{item.title}</span>
                      {isActive && (
                        <span className="text-[10px] font-normal opacity-80 truncate hidden xl:inline-block">
                          {item.description}
                        </span>
                      )}
                    </div>
                  </Link>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right">{item.title}</TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </div>

        {/* ── Bottom: action icons + collapse ── */}
        <div className="border-t border-slate-200 dark:border-slate-800 p-3 space-y-1 hidden lg:block">
          {/* Row of action icons */}
          <div
            className={cn(
              "flex items-center gap-1 pb-1",
              isCollapsed ? "flex-col" : "flex-row"
            )}
          >
            {/* Theme Toggle */}
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <div className="h-9 w-9 flex items-center justify-center">
                  <ThemeToggle />
                </div>
              </TooltipTrigger>
              {isCollapsed && <TooltipContent side="right">Toggle Theme</TooltipContent>}
            </Tooltip>

            {/* Application Tracker */}
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShowAppTracker(true)}
                  className="h-9 w-9 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  title="Application Tracker"
                >
                  <Briefcase className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              {isCollapsed && <TooltipContent side="right">Application Tracker</TooltipContent>}
            </Tooltip>

            {/* AI Settings */}
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShowSettings(true)}
                  className="h-9 w-9 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  title="AI Provider Settings"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              {isCollapsed && <TooltipContent side="right">AI Provider Settings</TooltipContent>}
            </Tooltip>
          </div>

          {/* Collapse toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "flex w-full items-center rounded-lg px-2 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200 transition-colors",
              isCollapsed ? "justify-center" : "gap-3"
            )}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-5 h-5" />
            ) : (
              <PanelLeftClose className="w-5 h-5 shrink-0" />
            )}
            {!isCollapsed && <span className="truncate">Collapse</span>}
          </button>
        </div>
      </aside>

      {showAppTracker && (
        <ApplicationTracker onClose={() => setShowAppTracker(false)} />
      )}
      <LLMSettingsModal open={showSettings} onOpenChange={setShowSettings} />
    </>
  );
}
