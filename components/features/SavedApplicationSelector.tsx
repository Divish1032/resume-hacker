"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronUp,
  Bookmark,
  FileText,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
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
  /** Called whenever the user makes a selection */
  onSelect: (ctx: ApplicationContext | null) => void;
  /** Label for the source toggle. Default: "Resume to use" */
  sourceLabel?: string;
}

export function SavedApplicationSelector({
  onSelect,
  sourceLabel = "Resume source",
}: SavedApplicationSelectorProps) {
  const [apps, setApps] = useState<SavedApplication[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>("");
  const [resumeSource, setResumeSource] = useState<ResumeSource>("optimized");
  const [selectedVersionId, setSelectedVersionId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setApps(getSavedApplications());
  }, []);

  const selectedApp = apps.find((a) => a.id === selectedAppId) ?? null;

  const availableVersions = selectedApp?.versions ?? [];

  // When app selection changes, default to latest version
  const handleAppChange = useCallback(
    (appId: string) => {
      setSelectedAppId(appId);
      const app = apps.find((a) => a.id === appId);
      if (app && app.versions.length > 0) {
        const latestVersion = app.versions[app.versions.length - 1];
        setSelectedVersionId(latestVersion.id);
      } else {
        setSelectedVersionId("");
      }
    },
    [apps]
  );

  // When source changes, update resolved context
  useEffect(() => {
    if (!selectedApp) {
      onSelect(null);
      return;
    }

    const version =
      availableVersions.find((v) => v.id === selectedVersionId) ??
      availableVersions[availableVersions.length - 1] ??
      null;

    const resolvedResumeData =
      resumeSource === "optimized" && version
        ? version.resumeData
        : selectedApp.originalResumeData;

    onSelect({
      application: selectedApp,
      resumeSource,
      selectedVersion: resumeSource === "optimized" ? version : null,
      resolvedResumeData,
      jobText: selectedApp.jobText,
      jobData: selectedApp.jobData,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAppId, resumeSource, selectedVersionId]);

  if (!mounted) return null;

  if (apps.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 flex items-center gap-3 text-sm text-slate-500">
        <Bookmark className="w-4 h-4 shrink-0 text-slate-400" />
        <span>
          No saved applications yet. Go to the{" "}
          <a href="/optimizer" className="text-indigo-500 hover:underline font-medium">
            Optimizer
          </a>{" "}
          and save an application bundle to use it here.
        </span>
      </div>
    );
  }

  const selectedVersion =
    availableVersions.find((v) => v.id === selectedVersionId) ??
    availableVersions[availableVersions.length - 1] ??
    null;

  const isConfirmed = !!selectedApp;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
        {/* Header trigger */}
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
                <Bookmark className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Select Saved Application
                </p>
                {isConfirmed ? (
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    {selectedApp!.name}
                    {resumeSource === "optimized" && selectedVersion && (
                      <Badge variant="secondary" className="text-[9px] py-0 px-1.5 ml-1">
                        {selectedVersion.label}
                      </Badge>
                    )}
                    {resumeSource === "original" && (
                      <Badge variant="outline" className="text-[9px] py-0 px-1.5 ml-1">
                        Original
                      </Badge>
                    )}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Or uses current session data if not selected
                  </p>
                )}
              </div>
            </div>
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-4 space-y-4">
            {/* Application selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Application
              </label>
              <Select value={selectedAppId} onValueChange={handleAppChange}>
                <SelectTrigger className="h-8 text-xs w-full">
                  <SelectValue placeholder="Choose a saved application…" />
                </SelectTrigger>
                <SelectContent>
                  {apps.map((app) => (
                    <SelectItem key={app.id} value={app.id} className="text-xs">
                      <span className="font-medium">{app.name}</span>
                      <span className="text-slate-400 ml-2">
                        · {app.versions.length} version{app.versions.length !== 1 ? "s" : ""}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedApp && (
              <>
                {/* Resume source toggle */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    {sourceLabel}
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setResumeSource("original")}
                      className={`flex-1 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                        resumeSource === "original"
                          ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400"
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Original Resume + JD
                    </button>
                    <button
                      onClick={() => setResumeSource("optimized")}
                      disabled={availableVersions.length === 0}
                      className={`flex-1 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors disabled:opacity-40 ${
                        resumeSource === "optimized"
                          ? "bg-indigo-600 text-white border-transparent"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Optimized Resume + JD
                    </button>
                  </div>
                </div>

                {/* Version picker — only when optimized selected */}
                {resumeSource === "optimized" && availableVersions.length > 1 && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Version
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {availableVersions.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVersionId(v.id)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                            selectedVersionId === v.id
                              ? "bg-indigo-600 text-white border-transparent"
                              : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300"
                          }`}
                        >
                          {v.label}
                          {v.atsScore != null && (
                            <span className="ml-1 opacity-70">· {v.atsScore}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Context confirmation chip */}
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/40 px-3 py-2 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    AI will use{" "}
                    <strong>
                      {resumeSource === "optimized" && selectedVersion
                        ? `${selectedApp.name} — ${selectedVersion.label} (Optimized)`
                        : `${selectedApp.name} — Original Resume`}
                    </strong>{" "}
                    + JD as context.
                  </span>
                </div>

                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-slate-400 hover:text-red-500 h-7"
                    onClick={() => {
                      setSelectedAppId("");
                      setSelectedVersionId("");
                      onSelect(null);
                    }}
                  >
                    Clear selection
                  </Button>
                </div>
              </>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
