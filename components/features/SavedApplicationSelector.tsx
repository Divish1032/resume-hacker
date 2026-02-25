"use client";

import { useState, useMemo, useEffect } from "react";
import { Check, Bookmark, FileText, Sparkles, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getSavedApplications, SavedApplication, OptimizedResumeVersion } from "@/lib/storage";
import { ResumeData, JobDescriptionData } from "@/lib/schema";

export type ResumeSource = "original" | "optimized";

export interface ApplicationContext {
  application: SavedApplication;
  resumeSource: ResumeSource;
  selectedVersion: OptimizedResumeVersion | null;
  resolvedResumeData: ResumeData;
  jobText: string;
  jobData: JobDescriptionData;
}

interface SavedApplicationSelectorProps {
  onSelect: (ctx: ApplicationContext | null) => void;
  sourceLabel?: string;
}

export function SavedApplicationSelector({
  onSelect,
  sourceLabel = "Select a saved application context",
}: SavedApplicationSelectorProps) {
  const [open, setOpen] = useState(false);
  const [apps, setApps] = useState<SavedApplication[]>([]);
  const [mounted, setMounted] = useState(false);
  const [selectedHash, setSelectedHash] = useState<string>("");

  useEffect(() => {
    setMounted(true);
    setApps(getSavedApplications());
  }, []);

  const handleSelect = (app: SavedApplication, source: ResumeSource, version: OptimizedResumeVersion | null) => {
    const hash = `${app.id}::${source}::${version?.id || "original"}`;
    setSelectedHash(hash);
    setOpen(false);

    onSelect({
      application: app,
      resumeSource: source,
      selectedVersion: version,
      resolvedResumeData: version ? version.resumeData : app.originalResumeData,
      jobText: app.jobText,
      jobData: app.jobData,
    });
  };

  const selectedDisplay = useMemo(() => {
    if (!selectedHash) return null;
    const [appId, source, versionId] = selectedHash.split("::");
    const app = apps.find(a => a.id === appId);
    if (!app) return null;
    if (source === "original") return `${app.name} — Original Resume`;
    const v = app.versions.find(ver => ver.id === versionId);
    return `${app.name} — ${v?.label || "Optimized"} (Optimized)`;
  }, [selectedHash, apps]);

  if (!mounted) return null;

  if (apps.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 flex items-center gap-3 text-sm text-slate-500">
        <AlertCircle className="w-4 h-4 shrink-0 text-slate-400" />
        <span>No saved applications yet. Create one in the Optimizer first.</span>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 w-full">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {sourceLabel}
      </label>
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between font-normal bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm"
            >
              {selectedDisplay || "Select a resume version..."}
              <Bookmark className="ml-2 h-4 w-4 shrink-0 opacity-50 text-indigo-500" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search applications..." className="h-9 text-xs" />
              <CommandList className="max-h-[300px] custom-scrollbar">
                <CommandEmpty>No applications found.</CommandEmpty>
                {apps.map((app) => (
                  <CommandGroup key={app.id} heading={app.name} className="border-b last:border-0 border-slate-100 dark:border-slate-800 pb-1">
                    {/* Original Resume Option */}
                    <CommandItem
                      value={`${app.name} Original Resume`}
                      onSelect={() => handleSelect(app, "original", null)}
                      className="text-xs cursor-pointer flex items-center gap-2 py-2"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      Original Resume
                      <Check
                        className={cn("ml-auto h-4 w-4 text-emerald-500", selectedHash === `${app.id}::original::original` ? "opacity-100" : "opacity-0")}
                      />
                    </CommandItem>
                    
                    {/* Optimized Versions (Reversed so newest is first) */}
                    {[...app.versions].reverse().map((v) => {
                      const hash = `${app.id}::optimized::${v.id}`;
                      return (
                        <CommandItem
                          key={v.id}
                          value={`${app.name} ${v.label} Optimized`}
                          onSelect={() => handleSelect(app, "optimized", v)}
                          className="text-xs cursor-pointer flex items-center gap-2 py-2"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="font-semibold text-indigo-700 dark:text-indigo-400">{v.label}</span>
                          <span>(Optimized)</span>
                          {v.atsScore != null && (
                            <span className="ml-2 text-[10px] text-slate-400 border border-slate-200 dark:border-slate-700 px-1.5 rounded-sm">
                              Score: {v.atsScore}
                            </span>
                          )}
                          <Check
                            className={cn("ml-auto h-4 w-4 text-emerald-500", selectedHash === hash ? "opacity-100" : "opacity-0")}
                          />
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {selectedHash && (
          <Button
            size="icon"
            variant="ghost"
            className="shrink-0 h-9 w-9 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={() => {
              setSelectedHash("");
              onSelect(null);
            }}
            title="Clear selection"
          >
            ✕
          </Button>
        )}
      </div>
    </div>
  );
}
