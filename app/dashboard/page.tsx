import { ApplicationTracker } from "@/components/features/ApplicationTracker";

export default function DashboardPage() {
  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 h-full min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Overview of your job applications and saved resumes.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Applications (Takes up 2/3 width on large screens) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <ApplicationTracker isModal={false} />
        </div>
        
        {/* Right Column - Stats / Recent Resumes */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Quick Stats</h3>
            {/* Stub for stats */}
            <p className="text-sm text-slate-500">Coming soon: Analytics on application success rates and AI usage.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
