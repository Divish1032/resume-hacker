"use client";

import { useState, useEffect } from "react";
import { getJobApplications, saveJobApplication, deleteJobApplication, JobApplication, ApplicationStatus } from "@/lib/storage";
import { JobDescriptionData, ResumeData } from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Briefcase, Plus, Trash2, Calendar, Building, MapPin, Link as LinkIcon, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface ApplicationTrackerProps {
  onClose: () => void;
  currentResume?: ResumeData | null;
  currentJob?: JobDescriptionData | null;
}

export function ApplicationTracker({ onClose, currentResume, currentJob }: ApplicationTrackerProps) {
  const [apps, setApps] = useState<JobApplication[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingApp, setEditingApp] = useState<Partial<JobApplication>>({});

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
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this tracked application?")) {
      deleteJobApplication(id);
      refreshApps();
      toast.success("Deleted application");
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 sm:p-6" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-4xl bg-white dark:bg-slate-950 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
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
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {isEditing ? (
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
                    <div key={app.id} className="group flex flex-col sm:flex-row gap-3 sm:items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                      <div className="min-w-0 pr-4">
                        <h4 className="font-semibold text-slate-900 dark:text-white truncate flex items-center gap-2">
                          {app.title}
                          {app.url && (
                            <a href={app.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-indigo-500" onClick={e => e.stopPropagation()}>
                              <LinkIcon className="w-3.5 h-3.5" />
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
                          <button onClick={() => editApp(app)} className="p-1.5 text-slate-400 hover:text-indigo-500 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/30">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(app.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
