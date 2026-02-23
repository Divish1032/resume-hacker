"use client";

import { useEffect, useState } from "react";
import { ApplicationTracker } from "@/components/features/ApplicationTracker";
import { useAppStore } from "@/lib/store";
import { getJobApplications, getSavedResumes, JobApplication, SavedResume } from "@/lib/storage";
import Link from "next/link";
import { Briefcase, FileText, Zap, MessageSquareQuote, Network, Award, Send, Bookmark, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const store = useAppStore();
  const userName = store.resumeData?.personalInfo?.fullName || "Hacker";
  const firstName = userName.split(" ")[0];

  const [apps, setApps] = useState<JobApplication[]>([]);
  const [resumes, setResumes] = useState<SavedResume[]>([]);
  const [mounted, setMounted] = useState(false);

  const refreshStats = () => {
    setApps(getJobApplications());
    setResumes(getSavedResumes());
  };

  useEffect(() => {
    refreshStats();
    setMounted(true);
  }, []);

  // Stats calculation
  const totalApps = apps.length;
  const interviewing = apps.filter(a => a.status === "Interviewing").length;
  const offers = apps.filter(a => a.status === "Offer").length;
  const applied = apps.filter(a => a.status === "Applied").length;
  const bookmarked = apps.filter(a => a.status === "Bookmarked").length;

  if (!mounted) return null; // Prevent hydration mismatch for localstorage reads

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 h-full min-h-screen space-y-8">
      
      {/* Welcome & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Welcome back, <span className="text-indigo-600 dark:text-indigo-400">{firstName}</span>!
          </h1>
          <p className="text-slate-500 mt-2">Here is your job hunt overview. What would you like to do today?</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Link href="/optimizer">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              <Zap className="w-4 h-4" /> Optimize Resume
            </Button>
          </Link>
          <Link href="/interview">
            <Button variant="outline" className="gap-2 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
              <MessageSquareQuote className="w-4 h-4 text-violet-500" /> Prep Interview
            </Button>
          </Link>
          <Link href="/networking">
            <Button variant="outline" className="gap-2 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
              <Network className="w-4 h-4 text-blue-500" /> Network
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <StatCard 
          icon={<FileText className="w-5 h-5 text-indigo-500" />}
          label="Saved Resumes"
          value={resumes.length.toString()}
          bgColor="bg-indigo-50 dark:bg-indigo-900/20"
        />
        <StatCard 
          icon={<Briefcase className="w-5 h-5 text-slate-500" />}
          label="Total Tracked"
          value={totalApps.toString()}
          bgColor="bg-slate-50 dark:bg-slate-800/50"
        />
        <StatCard 
          icon={<Bookmark className="w-5 h-5 text-blue-500" />}
          label="Bookmarked"
          value={bookmarked.toString()}
          bgColor="bg-blue-50 dark:bg-blue-900/20"
        />
        <StatCard 
          icon={<Send className="w-5 h-5 text-amber-500" />}
          label="Applied"
          value={applied.toString()}
          bgColor="bg-amber-50 dark:bg-amber-900/20"
        />
        <StatCard 
          icon={<MessageSquareQuote className="w-5 h-5 text-purple-500" />}
          label="Interviewing"
          value={interviewing.toString()}
          bgColor="bg-purple-50 dark:bg-purple-900/20"
        />
      </div>
      
      {/* Main Content Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Applications Tracker */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <ApplicationTracker isModal={false} onUpdate={refreshStats} />
        </div>
        
        {/* Right Column - Highlights / Insights */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-500" />
              Success Metrics
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Interview Rate</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {totalApps > 0 ? Math.round((interviewing + offers) / totalApps * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-2 rounded-full" 
                  style={{ width: `${totalApps > 0 ? ((interviewing + offers) / totalApps * 100) : 0}%` }}
                />
              </div>

              <div className="flex items-center justify-between mt-6">
                <span className="text-sm text-slate-500">Offers</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {offers}
                </span>
              </div>
              
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 shadow-sm text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-2">Ready to apply?</h3>
              <p className="text-indigo-100 text-sm mb-4">
                Tailor your resume to a new job description to maximize your ATS score.
              </p>
              <Link href="/optimizer">
                <Button className="w-full bg-white text-indigo-600 hover:bg-slate-50 shadow-sm border-0">
                  Optimizer Tool &rarr;
                </Button>
              </Link>
            </div>
            <Sparkles className="absolute -right-4 -top-4 w-24 h-24 text-white opacity-10" />
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ icon, label, value, bgColor }: { icon: React.ReactNode, label: string, value: string, bgColor: string }) {
  return (
    <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bgColor}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}
