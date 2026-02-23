import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { useInterviewAI } from "@/hooks/useInterviewAI";
import { generate306090PlanPrompt } from "@/lib/prompt-engine";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CalendarDays, CheckCircle2, Zap } from "lucide-react";
import { toast } from "sonner";

interface Plan306090 {
  title: string;
  day30: string[];
  day60: string[];
  day90: string[];
}

export function Plan306090Tab() {
  const { resumeData, jobData, provider } = useAppStore();
  const { generateWithAI, isLoading } = useInterviewAI();
  const [plan, setPlan] = useState<Plan306090 | null>(null);
  const [promptOnlyText, setPromptOnlyText] = useState("");

  const handleGenerate = async () => {
    if (!resumeData || !jobData) return;
    
    const prompt = generate306090PlanPrompt(resumeData, jobData);
    
    if (provider === "prompt-only") {
      setPromptOnlyText(prompt);
      return;
    }

    const data = await generateWithAI(prompt);
    if (data && data.title && data.day30) {
      setPlan(data);
      toast.success("Strategic plan generated successfully.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 shadow-sm">
        <div className="flex-1 space-y-2 text-center md:text-left">
          <h3 className="text-xl font-bold flex items-center justify-center md:justify-start gap-2 text-slate-900 dark:text-white">
            <CalendarDays className="w-6 h-6 text-emerald-500" />
            30-60-90 Day Plan Generator
          </h3>
          <p className="text-slate-500 text-sm">
            Hiring managers love candidates who are ready to execute. Generate a highly specific 90-day action plan based on the job description to bring to your interview.
          </p>
        </div>
        <Button 
          onClick={handleGenerate} 
          disabled={isLoading || (!resumeData || !jobData)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[200px]"
        >
          {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Drafting Plan...</> : <><Zap className="w-4 h-4 mr-2" /> Generate 90-Day Plan</>}
        </Button>
      </div>

      {promptOnlyText && (
        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
          <p className="text-xs font-semibold text-emerald-600 uppercase">Prompt Only Mode</p>
          <pre className="text-[10px] font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">{promptOnlyText}</pre>
          <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(promptOnlyText); toast.success("Prompt copied!"); }}>
                  Copy Prompt
              </Button>
          </div>
        </div>
      )}

      {plan && (
        <Card className="bg-white dark:bg-slate-950 border border-emerald-100 dark:border-emerald-900/30 overflow-hidden shadow-md">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 border-b border-emerald-100 dark:border-emerald-900/30 text-center">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{plan.title}</h2>
                <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-2">Strategic Execution Outline for the First 3 Months</p>
            </div>
            <CardContent className="p-0">
                <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
                    <PlanPhase title="First 30 Days" subtitle="Learn & Absorb" items={plan.day30} color="emerald" />
                    <PlanPhase title="Days 31-60" subtitle="Align & Execute" items={plan.day60} color="emerald" />
                    <PlanPhase title="Days 61-90" subtitle="Scale & Optimize" items={plan.day90} color="emerald" />
                </div>
            </CardContent>
        </Card>
      )}
    </div>
  );
}

function PlanPhase({ title, subtitle, items, color }: { title: string, subtitle: string, items: string[], color: string }) {
    return (
        <div className="p-6 sm:p-8 space-y-6">
            <div className="text-center">
                <h3 className={`font-bold text-lg text-${color}-600 dark:text-${color}-400 mb-1`}>{title}</h3>
                <span className="text-xs font-medium uppercase tracking-widest text-slate-400">{subtitle}</span>
            </div>
            <ul className="space-y-4">
                {items.map((item, idx) => (
                    <li key={idx} className="flex gap-3 text-sm text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className={`w-5 h-5 shrink-0 text-${color}-500/70`} />
                        <span className="leading-relaxed">{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    )
}
