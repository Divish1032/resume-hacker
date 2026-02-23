"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, Save, Plus, Trash2, ChevronDown } from "lucide-react";
import { getSavedResumes, saveResume, deleteResume, SavedResume } from "@/lib/storage";
import { ResumeData } from "@/lib/schema";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";

interface ResumeSelectorProps {
  currentData: ResumeData | null;
  onLoad: (
    data: ResumeData | null, 
    id: string | null,
    originalData?: ResumeData | null,
    jobData?: any | null,
    jobText?: string
  ) => void;
}

export function ResumeSelector({ currentData, onLoad }: ResumeSelectorProps) {
  const [resumes, setResumes] = useState<SavedResume[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Expose the store to get the full session context when saving
  const { originalResumeData, jobData, jobText } = useAppStore();

  useEffect(() => {
    refreshResumes();
  }, []);

  const refreshResumes = () => {
    const loaded = getSavedResumes();
    setResumes(loaded);
  };

  const handleSave = () => {
    if (!currentData || !currentData.personalInfo.fullName) {
      toast.error("Please enter at least a name to save the resume.");
      return;
    }

    const name = `${currentData.personalInfo.fullName} - ${new Date().toLocaleDateString()}`;
    const id = activeId || crypto.randomUUID();
    
    saveResume({
      id,
      name: activeId ? (resumes.find(r => r.id === activeId)?.name || name) : name,
      updatedAt: Date.now(),
      data: currentData,
      originalData: originalResumeData,
      jobData: jobData,
      jobText: jobText,
    });

    setActiveId(id);
    refreshResumes();
    toast.success("Resume saved locally");
  };

  const handleCreateNew = () => {
    setActiveId(null);
    onLoad(null, null);
    toast.info("Started a new draft.");
  };

  const handleSelect = (r: SavedResume) => {
    setActiveId(r.id);
    onLoad(r.data, r.id, r.originalData, r.jobData, r.jobText);
    toast.success(`Loaded ${r.name}`);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteResume(id);
    refreshResumes();
    if (activeId === id) {
      setActiveId(null);
      // We don't clear the screen data immediately so they don't lose it by accident
      toast.info("Resume deleted from storage. Current draft kept on screen.");
    } else {
      toast.success("Resume deleted.");
    }
  };

  const activeName = activeId ? resumes.find(r => r.id === activeId)?.name : "Unsaved Draft";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-2 border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
          <FileText className="w-3.5 h-3.5 text-indigo-500" />
          <span className="hidden sm:inline max-w-[120px] truncate">{activeName}</span>
          <ChevronDown className="w-3 h-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-slate-500">My Resumes</DropdownMenuLabel>
        
        {resumes.map((r) => (
          <DropdownMenuItem key={r.id} className="text-xs cursor-pointer flex items-center justify-between group" onClick={() => handleSelect(r)}>
            <div className="flex flex-col gap-0.5 overflow-hidden">
              <span className={`truncate ${r.id === activeId ? "font-bold text-indigo-600 dark:text-indigo-400" : ""}`}>
                {r.name}
              </span>
              <span className="text-[9px] text-slate-400">
                {new Date(r.updatedAt).toLocaleString()}
              </span>
            </div>
            <button
              onClick={(e) => handleDelete(r.id, e)}
              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-opacity"
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </DropdownMenuItem>
        ))}

        {resumes.length === 0 && (
          <div className="px-2 py-3 text-xs text-slate-400 text-center italic">
            No saved resumes
          </div>
        )}

        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleSave} className="text-xs cursor-pointer text-emerald-600 dark:text-emerald-400 focus:text-emerald-700 focus:bg-emerald-50 dark:focus:bg-emerald-950">
          <Save className="w-3.5 h-3.5 mr-2" />
          Save Current
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCreateNew} className="text-xs cursor-pointer">
          <Plus className="w-3.5 h-3.5 mr-2" />
          New Draft
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
