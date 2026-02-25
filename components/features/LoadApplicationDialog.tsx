"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bookmark, Sparkles, FolderOpen, Calendar, ArrowRight } from "lucide-react";
import { getSavedApplications, SavedApplication } from "@/lib/storage";

interface LoadApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (app: SavedApplication) => void;
}

export function LoadApplicationDialog({ open, onOpenChange, onSelect }: LoadApplicationDialogProps) {
  const [apps, setApps] = useState<SavedApplication[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setApps(getSavedApplications().sort((a, b) => b.updatedAt - a.updatedAt));
    }
  }, [open]);

  if (!mounted) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col pt-6 px-0 pb-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <FolderOpen className="w-5 h-5 text-indigo-500" />
            Load Saved Application
          </DialogTitle>
          <p className="text-sm text-slate-500 font-normal mt-1">
            Pick up where you left off. Loading an application lets you save new variations without creating duplicates.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50/50 dark:bg-slate-900/20 custom-scrollbar">
          {apps.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
              <Bookmark className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No saved applications found.</p>
              <p className="text-xs text-slate-400 mt-1">When you optimize a resume and click Save, it will appear here.</p>
            </div>
          ) : (
            apps.map((app) => (
              <button
                key={app.id}
                onClick={() => {
                  onSelect(app);
                  onOpenChange(false);
                }}
                className="w-full text-left bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all group flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-slate-900 dark:text-white truncate max-w-[300px]">{app.name}</h4>
                    <Badge variant="secondary" className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-900/50 px-2 py-0 text-[10px]">
                      {app.versions.length} version{app.versions.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5 truncate">
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      {app.jobText.substring(0, 40).replace(/\n/g, " ")}...
                    </span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(app.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Load Context <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            ))
          )}
        </div>
        
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 flex justify-end shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-9">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
