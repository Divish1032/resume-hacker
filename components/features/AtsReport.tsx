"use client";

import { motion } from "framer-motion";
import { type AtsScoreResult } from "@/lib/ats-scorer";
import {
  CheckCircle2, XCircle, AlertTriangle, ArrowRight,
  Target, BookOpen, Briefcase, ListChecks, PieChart
} from "lucide-react";


interface AtsReportProps {
  score: AtsScoreResult;
}

export function AtsReport({ score }: AtsReportProps) {
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A": return "text-emerald-500";
      case "B": return "text-blue-500";
      case "C": return "text-amber-500";
      case "D": return "text-orange-500";
      case "F": return "text-red-500";
      default: return "text-slate-500";
    }
  };

  const MetricRow = ({ label, current, max, icon: Icon }: { label: string, current: number, max: number, icon: React.ElementType }) => (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white rounded-md shadow-sm">
          <Icon className="w-4 h-4 text-slate-500" />
        </div>
        <span className="text-sm font-medium text-slate-700">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-slate-900">{current}</span>
        <span className="text-xs text-slate-400">/ {max} pts</span>
      </div>
    </div>
  );

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 md:p-6 space-y-6">
      {/* Overview Section */}
      <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-xl border border-slate-100">
        <div className="relative flex items-center justify-center w-32 h-32 mb-4">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="45"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="10"
              className="text-slate-200"
            />
            <motion.circle
              cx="50" cy="50" r="45"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="10"
              strokeDasharray={283}
              strokeDashoffset={283 - (283 * score.total) / 100}
              className={`${getGradeColor(score.grade)} transition-all duration-1000 ease-out`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className={`text-3xl font-black tracking-tight ${getGradeColor(score.grade)}`}>
              {score.total}
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400 mt-1">
              Score
            </span>
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-bold text-slate-800">
            Grade: <span className={getGradeColor(score.grade)}>{score.grade}</span>
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm">
            {score.total >= 80 ? "Great job! Your resume is highly optimized." :
             score.total >= 60 ? "Good start, but needs specific improvements to pass ATS filters." :
             "Significant changes needed to align with this job description."}
          </p>
        </div>
      </div>

      {/* Breakdown Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricRow label="Hard Skills Match" current={score.breakdown.hardSkills.score} max={score.breakdown.hardSkills.max} icon={Target} />
        <MetricRow label="Soft Skills Match" current={score.breakdown.softSkills.score} max={score.breakdown.softSkills.max} icon={PieChart} />
        <MetricRow label="Action Verbs" current={score.breakdown.actionVerbStrength.score} max={score.breakdown.actionVerbStrength.max} icon={Briefcase} />
        <MetricRow label="Measurable Results" current={score.breakdown.quantification.score} max={score.breakdown.quantification.max} icon={PieChart} />
        <MetricRow label="Completeness & Formatting" current={score.breakdown.sectionCompleteness.score} max={score.breakdown.sectionCompleteness.max} icon={ListChecks} />
        <MetricRow label="Job Title & Education" current={score.breakdown.jobTitleMatch.score + score.breakdown.educationMatch.score} max={10} icon={BookOpen} />
      </div>

      {/* Actionable Insights */}
      {score.suggestions.length > 0 && (
        <div className="mt-8 space-y-3">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Areas for Improvement
          </h4>
          <div className="space-y-3">
            {score.suggestions.map((suggestion, idx) => (
              <div key={idx} className={`p-4 rounded-xl border text-sm flex items-start gap-4 ${
                suggestion.priority === 'high' ? 'bg-red-50/50 border-red-100 text-red-900' :
                suggestion.priority === 'medium' ? 'bg-amber-50/50 border-amber-100 text-amber-900' :
                'bg-blue-50/50 border-blue-100 text-blue-900'
              }`}>
                <div className="mt-0.5">
                  {suggestion.priority === 'high' ? <XCircle className="w-4 h-4 text-red-500" /> :
                   suggestion.priority === 'medium' ? <AlertTriangle className="w-4 h-4 text-amber-500" /> :
                   <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                </div>
                <div>
                  <p className="font-semibold mb-1">{suggestion.text}</p>
                  <div className="flex items-start gap-2 text-xs opacity-80 mt-2 bg-white/50 p-2 rounded-md">
                    <ArrowRight className="w-3 h-3 mt-0.5 shrink-0" />
                    <p>{suggestion.howToFix}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Keyword Deep Dive */}
      {(score.breakdown.hardSkills.missing.length > 0 || score.breakdown.softSkills.missing.length > 0) && (
        <div className="pt-6 border-t border-slate-100">
           <div className="flex items-center gap-2 mb-4">
             <Target className="w-4 h-4 text-indigo-500" />
             <h4 className="text-sm font-bold text-slate-800">Missing Key Terms</h4>
           </div>
           
           <div className="space-y-4">
             {score.breakdown.hardSkills.missing.length > 0 && (
               <div>
                 <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">Hard Skills</p>
                 <div className="flex flex-wrap gap-2">
                   {score.breakdown.hardSkills.missing.slice(0, 10).map((missing, i) => (
                     <span key={`hard-${i}`} className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded-md text-xs border border-rose-100 font-medium shadow-sm">
                       {missing}
                     </span>
                   ))}
                   {score.breakdown.hardSkills.missing.length > 10 && (
                     <span className="px-2.5 py-1 bg-slate-50 text-slate-500 rounded-md text-xs border border-slate-200">
                       +{score.breakdown.hardSkills.missing.length - 10} more
                     </span>
                   )}
                 </div>
               </div>
             )}

             {score.breakdown.softSkills.missing.length > 0 && (
               <div>
                 <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">Soft Skills</p>
                 <div className="flex flex-wrap gap-2">
                   {score.breakdown.softSkills.missing.slice(0, 10).map((missing, i) => (
                     <span key={`soft-${i}`} className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-md text-xs border border-amber-100 font-medium shadow-sm">
                       {missing}
                     </span>
                   ))}
                   {score.breakdown.softSkills.missing.length > 10 && (
                     <span className="px-2.5 py-1 bg-slate-50 text-slate-500 rounded-md text-xs border border-slate-200">
                       +{score.breakdown.softSkills.missing.length - 10} more
                     </span>
                   )}
                 </div>
               </div>
             )}
           </div>
        </div>
      )}
    </div>
  );
}
