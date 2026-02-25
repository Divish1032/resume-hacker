"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Bookmark, Briefcase, FileText, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  saveApplication,
  saveJobApplication,
  getSavedApplications,
  getApplicationById,
  SavedApplication,
  OptimizedResumeVersion,
} from "@/lib/storage";
import { ResumeData, JobDescriptionData } from "@/lib/schema";

interface SaveApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalResumeData: ResumeData;
  optimizedResumeData: ResumeData;
  jobText: string;
  jobData: JobDescriptionData;
  atsScore?: number;
  fabricationLevel?: number;
  /** If set, we're adding a version to an existing application */
  existingApplicationId?: string | null;
  onSaved: (appId: string, versionId: string) => void;
}

/** Extract a reasonable default name from the first line(s) of a JD */
function guessAppName(jobText: string, fullName?: string): string {
  const firstLine = jobText.split("\n")[0].substring(0, 60).trim();
  return firstLine || (fullName ? `${fullName} — Job Application` : "Job Application");
}

export function SaveApplicationDialog({
  open,
  onOpenChange,
  originalResumeData,
  optimizedResumeData,
  jobText,
  jobData,
  atsScore,
  fabricationLevel,
  existingApplicationId,
  onSaved,
}: SaveApplicationDialogProps) {
  const existing = useMemo(
    () =>
      existingApplicationId
        ? getApplicationById(existingApplicationId) ?? null
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [existingApplicationId, open]
  );

  const defaultName = useMemo(
    () =>
      existing?.name ??
      guessAppName(jobText, originalResumeData?.personalInfo?.fullName),
    [existing, jobText, originalResumeData]
  );

  const [name, setName] = useState(defaultName);
  const [isSaving, setIsSaving] = useState(false);

  // Reset name when dialog opens
  const handleOpenChange = (o: boolean) => {
    if (o) setName(defaultName);
    onOpenChange(o);
  };

  const versionLabel = existing
    ? `v${existing.versions.length + 1}`
    : "v1";

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a name for this application.");
      return;
    }

    setIsSaving(true);

    try {
      const newVersion: OptimizedResumeVersion = {
        id: crypto.randomUUID(),
        label: versionLabel,
        createdAt: Date.now(),
        resumeData: optimizedResumeData,
        atsScore,
        fabricationLevel,
      };

      let app: SavedApplication;
      let jobApplicationId = existing?.jobApplicationId;

      if (existing) {
        // ── Update existing bundle with new version ─────────────────────────
        app = {
          ...existing,
          name: name.trim(),
          versions: [...existing.versions, newVersion],
          activeVersionId: newVersion.id,
          updatedAt: Date.now(),
        };
      } else {
        // ── Create brand-new bundle ─────────────────────────────────────────
        const appId = crypto.randomUUID();
        const trackerTaskId = crypto.randomUUID();

        // Auto-create job tracker entry with Bookmarked status
        const trackerEntry = {
          id: trackerTaskId,
          title: name.trim(),
          company: extractCompany(jobText),
          status: "Bookmarked" as const,
          date: Date.now(),
          savedApplicationId: appId,
          notes: jobText.substring(0, 200),
        };
        saveJobApplication(trackerEntry);
        jobApplicationId = trackerTaskId;

        app = {
          id: appId,
          name: name.trim(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          originalResumeData,
          jobText,
          jobData,
          versions: [newVersion],
          activeVersionId: newVersion.id,
          jobApplicationId: trackerTaskId,
        };
      }

      saveApplication(app);

      toast.success(
        existing
          ? `✅ New version ${versionLabel} saved to "${app.name}"`
          : `✅ Application "${app.name}" saved! A Bookmarked task was added to your tracker.`,
        { duration: 4000 }
      );

      onSaved(app.id, newVersion.id);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save application. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Bookmark className="w-4 h-4 text-indigo-500" />
            {existing ? `Save New Version (${versionLabel})` : "Save Application Bundle"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="app-name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Application Name
            </Label>
            <Input
              id="app-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='e.g. "Stripe – Senior Engineer"'
              className="h-9 text-sm"
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
            />
            <p className="text-[11px] text-slate-400">Give this application a memorable name.</p>
          </div>

          {/* Summary tiles */}
          <div className="grid grid-cols-3 gap-2">
            <SummaryTile
              icon={<FileText className="w-3.5 h-3.5 text-indigo-500" />}
              label="Resume"
              value={originalResumeData?.personalInfo?.fullName?.split(" ")[0] || "Loaded"}
            />
            <SummaryTile
              icon={<Briefcase className="w-3.5 h-3.5 text-emerald-500" />}
              label="JD Length"
              value={`${Math.ceil(jobText.length / 5)} words`}
            />
            <SummaryTile
              icon={<Sparkles className="w-3.5 h-3.5 text-amber-500" />}
              label="ATS Score"
              value={atsScore != null ? `${atsScore}/100` : "—"}
            />
          </div>

          {existing && (
            <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/40 px-3 py-2.5 text-xs text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>
                This will add <strong>{versionLabel}</strong> to &quot;{existing.name}&quot;.
                You&apos;ll be able to switch between versions in the Optimizer.
              </span>
            </div>
          )}

          {!existing && (
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/40 px-3 py-2.5 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <Bookmark className="w-3.5 h-3.5 shrink-0" />
              <span>
                A <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-emerald-400 text-emerald-600">Bookmarked</Badge> task will be automatically added to your Job Tracker.
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isSaving ? "Saving…" : existing ? `Save ${versionLabel}` : "Save Application"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SummaryTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-2.5 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
        {icon} {label}
      </div>
      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{value}</p>
    </div>
  );
}

/** Naive company extractor — grabs capitalized words from JD first line */
function extractCompany(jobText: string): string {
  const first = jobText.split("\n")[0].trim();
  // Try to grab 1-3 word company-like name from the line
  const match = first.match(/^([A-Z][a-zA-Z&.]+(?:\s+[A-Z][a-zA-Z&.]+){0,2})/);
  return match ? match[1] : "Unknown Company";
}
