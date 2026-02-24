"use client";

import { useState, useEffect } from "react";
import { getJobApplications, saveJobApplication, deleteJobApplication, JobApplication, ApplicationStatus } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  X, 
  Briefcase, 
  Plus, 
  Trash2, 
  Calendar, 
  Building, 
  Link as LinkIcon, 
  Edit2, 
  ExternalLink, 
  Zap,
  Mail,
  Copy,
  RefreshCw 
} from "lucide-react";
import { useFollowUpAI } from "@/hooks/useFollowUpAI";
import { generateFollowUpEmailPrompt } from "@/lib/prompts";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

interface ApplicationTrackerProps {
  onClose?: () => void;
  isModal?: boolean;
  onUpdate?: () => void;
}

export function ApplicationTracker({ onClose, isModal = true, onUpdate }: ApplicationTrackerProps) {
  const router = useRouter();
  const { resumeData, provider } = useAppStore();
  const [apps, setApps] = useState<JobApplication[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingApp, setEditingApp] = useState<Partial<JobApplication>>({});
  
  const [activeFollowUpApp, setActiveFollowUpApp] = useState<JobApplication | null>(null);
  const [followUpResponse, setFollowUpResponse] = useState<{subject: string, body: string} | null>(null);
  const [trackerUserHacks, setTrackerUserHacks] = useState("");
  const { generateWithAI, isLoading, error } = useFollowUpAI();

  const openFollowUpModal = (app: JobApplication) => {
    setActiveFollowUpApp(app);
    setFollowUpResponse(null);
    setTrackerUserHacks("");
  };

  const executeFollowUpAI = async () => {
    if (!activeFollowUpApp) return;
    setFollowUpResponse(null);
    if (!resumeData) {
      toast.error("Please load a resume in the Optimizer first.");
      return;
    }

    const days = Math.max(0, Math.floor((Date.now() - activeFollowUpApp.date) / (1000 * 60 * 60 * 24)));
    const prompt = generateFollowUpEmailPrompt(resumeData, { text: `${activeFollowUpApp.title} at ${activeFollowUpApp.company}. ${activeFollowUpApp.notes}` }, days, trackerUserHacks);
    
    if (provider === "prompt-only") {
      setFollowUpResponse({
        subject: "(Prompt Only Mode) Required AI Prompt:",
        body: prompt
      });
      return;
    }

    const res = await generateWithAI(prompt);
    if (res) setFollowUpResponse(res);
  };

  useEffect(() => {
    refreshApps();
  }, []);

  const refreshApps = () => {
    setApps(getJobApplications().sort((a, b) => b.date - a.date));
  };

  const startNewApp = () => {
    // Try to prefill from current screen if possible
    setEditingApp({
      id: crypto.randomUUID(),
      company: "",
      title: "",
      status: "Bookmarked",
      date: Date.now(),
      notes: "",
      url: ""
    });
    setIsEditing(true);
  };

  const editApp = (app: JobApplication) => {
    setEditingApp({ ...app });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!editingApp.company || !editingApp.title) {
      toast.error("Company and Title are required");
      return;
    }
    
    saveJobApplication({
      id: editingApp.id || crypto.randomUUID(),
      company: editingApp.company,
      title: editingApp.title,
      status: editingApp.status as ApplicationStatus || "Bookmarked",
      date: editingApp.date || Date.now(),
      notes: editingApp.notes || "",
      url: editingApp.url || "",
    });
    
    setIsEditing(false);
    refreshApps();
    toast.success("Application saved");
    onUpdate?.();
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this tracked application?")) {
      deleteJobApplication(id);
      refreshApps();
      toast.success("Deleted application");
      onUpdate?.();
    }
  };

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case "Bookmarked": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "Applied": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "Interviewing": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      case "Offer": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "Rejected": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default: return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  const trackerContent = (
    <div className={`w-full ${isModal ? "max-w-4xl max-h-[90vh]" : "h-full min-h-[500px]"} bg-white dark:bg-slate-950 rounded-2xl ${isModal ? "shadow-2xl" : "shadow-sm border border-slate-200 dark:border-slate-800"} overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Job Applications</h2>
              <p className="text-xs text-slate-500">Track your progress and interview stages</p>
            </div>
          </div>
          {isModal && onClose && (
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {activeFollowUpApp ? (
            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between mb-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Mail className="w-4 h-4 text-emerald-500" />
                    1-Click Follow Up
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Generating a personalized email for {activeFollowUpApp.company}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setActiveFollowUpApp(null)}>Close</Button>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                   <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
                   <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Writing custom follow up...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">
                  <p className="text-sm">{error}</p>
                  <Button variant="outline" size="sm" className="mt-4 border-red-200 text-red-700" onClick={executeFollowUpAI}>Try Again</Button>
                </div>
              ) : followUpResponse ? (
                <div className="space-y-4">
                  <div className="bg-white dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 rounded-lg">
                     <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">Subject</p>
                     <p className="text-sm font-medium text-slate-900 dark:text-white mb-4">{followUpResponse.subject}</p>
                     
                     <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">Body</p>
                     <div className="text-sm text-slate-700 dark:text-slate-300 font-serif whitespace-pre-wrap">
                       {followUpResponse.body}
                     </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => {
                        navigator.clipboard.writeText(`Subject: ${followUpResponse.subject}\n\n${followUpResponse.body}`);
                        toast.success("Copied to clipboard!");
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" /> Copy Email
                    </Button>
                    <Button variant="outline" onClick={executeFollowUpAI}>
                      <RefreshCw className="w-4 h-4 mr-2" /> Regenerate
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Custom AI Hacks (Optional)</Label>
                    <textarea
                      value={trackerUserHacks}
                      onChange={(e) => setTrackerUserHacks(e.target.value)}
                      placeholder="E.g., Emphasize my enthusiasm for their recent product launch, or write in a casual tone..."
                      className="w-full h-20 text-[13px] p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-1 focus:ring-emerald-500 custom-scrollbar outline-none resize-none placeholder:text-slate-300 dark:placeholder:text-slate-600 transition-all"
                    />
                  </div>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={executeFollowUpAI}>
                    <Zap className="w-4 h-4 mr-2" /> Generate Email
                  </Button>
                </div>
              )}
            </div>
          ) : isEditing ? (
            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  {editingApp.company ? "Edit Application" : "New Application"}
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Company *</Label>
                  <Input 
                    value={editingApp.company} 
                    onChange={e => setEditingApp({...editingApp, company: e.target.value})}
                    placeholder="e.g. Acme Corp"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Job Title *</Label>
                  <Input 
                    value={editingApp.title} 
                    onChange={e => setEditingApp({...editingApp, title: e.target.value})}
                    placeholder="e.g. Senior Frontend Engineer"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Status</Label>
                  <Select value={editingApp.status || "Bookmarked"} onValueChange={v => setEditingApp({...editingApp, status: v as ApplicationStatus})}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bookmarked">Bookmarked</SelectItem>
                      <SelectItem value="Applied">Applied</SelectItem>
                      <SelectItem value="Interviewing">Interviewing</SelectItem>
                      <SelectItem value="Offer">Offer</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Link / Details (Optional)</Label>
                  <Input 
                    value={editingApp.url} 
                    onChange={e => setEditingApp({...editingApp, url: e.target.value})}
                    placeholder="https://..."
                    className="h-9"
                  />
                </div>
              </div>
              
              <div className="pt-2 flex justify-end">
                <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Save Application
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {apps.length} Tracked Roles
                </h3>
                <Button onClick={startNewApp} size="sm" className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add New
                </Button>
              </div>

              {apps.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <Briefcase className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">You haven't tracked any applications yet.</p>
                  <Button variant="link" onClick={startNewApp} className="text-indigo-500 mt-2">Add your first role</Button>
                </div>
              ) : (
                <div className="grid gap-3">
                  {apps.map(app => (
                    <div key={app.id} 
                      className="group flex flex-col sm:flex-row gap-3 sm:items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors"
                    >
                      <div className="min-w-0 pr-4 flex-1">
                        <h4 className="font-semibold text-slate-900 dark:text-white truncate flex items-center gap-2">
                          {app.title}
                          {app.url && app.url.includes('.') && !app.url.includes(' ') && (
                            <a 
                              href={/^https?:\/\//i.test(app.url) ? app.url : `https://${app.url}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-slate-400 hover:text-indigo-500" 
                              onClick={e => e.stopPropagation()}
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </h4>
                        <div className="mt-1 flex items-center gap-3 text-xs text-slate-500 truncate">
                          <span className="flex items-center gap-1 font-medium"><Building className="w-3.5 h-3.5" /> {app.company}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(app.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end gap-3 mt-2 sm:mt-0 shrink-0">
                        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${getStatusColor(app.status)}`}>
                          {app.status}
                        </span>
                        
                        <div className="flex items-center opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    useAppStore.getState().setJobText(app.title + (app.company ? ` at ${app.company}` : ""));
                                    useAppStore.getState().setJobData({ text: app.notes || app.title });
                                    router.push('/optimizer');
                                    if (onClose) onClose();
                                  }}
                                >
                                  <Zap className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Load into Optimizer</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-slate-400 hover:text-emerald-500"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    openFollowUpModal(app);
                                  }}
                                >
                                  <Mail className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>1-Click Follow Up</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-slate-400 hover:text-indigo-500"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    editApp(app);
                                  }}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-slate-400 hover:text-red-500"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleDelete(app.id);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
    </div>
  );

  if (!isModal) return trackerContent;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 sm:p-6" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-4xl flex justify-center"
        onClick={e => e.stopPropagation()}
      >
        {trackerContent}
      </motion.div>
    </div>
  );
}
