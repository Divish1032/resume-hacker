import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { useInterviewAI } from "@/hooks/useInterviewAI";
import { generateObjectionHandlingPrompt } from "@/lib/prompt-engine";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ShieldAlert, AlertTriangle, MessageSquareQuote, Zap } from "lucide-react";
import { toast } from "sonner";

interface ObjectionScript {
  objection: string;
  pivot_strategy: string;
  script: string;
}

export function ObjectionHandlingTab() {
  const { resumeData, jobData, provider } = useAppStore();
  const { generateWithAI, isLoading } = useInterviewAI();
  const [scripts, setScripts] = useState<ObjectionScript[]>([]);
  const [promptOnlyText, setPromptOnlyText] = useState("");

  const handleGenerate = async () => {
    if (!resumeData || !jobData) return;
    
    const prompt = generateObjectionHandlingPrompt(resumeData, jobData);
    
    if (provider === "prompt-only") {
      setPromptOnlyText(prompt);
      return;
    }

    const data = await generateWithAI(prompt);
    if (data && Array.isArray(data)) {
      setScripts(data);
      toast.success("Defensive scripts generated successfully.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 shadow-sm">
        <div className="flex-1 space-y-2 text-center md:text-left">
          <h3 className="text-xl font-bold flex items-center justify-center md:justify-start gap-2 text-slate-900 dark:text-white">
            <ShieldAlert className="w-6 h-6 text-rose-500" />
            Objection Handling Scripts
          </h3>
          <p className="text-slate-500 text-sm">
            AI identifies the biggest gaps between your resume and the job description, then writes persuasive scripts to help you defend and pivot away from those weaknesses during the interview.
          </p>
        </div>
        <Button 
          onClick={handleGenerate} 
          disabled={isLoading || (!resumeData || !jobData)}
          className="bg-rose-600 hover:bg-rose-700 text-white min-w-[200px]"
        >
          {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Drafting Defenses...</> : <><Zap className="w-4 h-4 mr-2" /> Generate Defense Scripts</>}
        </Button>
      </div>

      {promptOnlyText && (
        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
          <p className="text-xs font-semibold text-rose-600 uppercase">Prompt Only Mode</p>
          <pre className="text-[10px] font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">{promptOnlyText}</pre>
          <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(promptOnlyText); toast.success("Prompt copied!"); }}>
                  Copy Prompt
              </Button>
          </div>
        </div>
      )}

      {scripts.length > 0 && (
        <div className="grid gap-6">
          {scripts.map((script, idx) => (
            <Card key={idx} className="bg-white dark:bg-slate-950/50 border-rose-100 dark:border-rose-900/30 overflow-hidden shadow-sm">
              <div className="bg-rose-50 dark:bg-rose-900/20 p-4 border-b border-rose-100 dark:border-rose-900/30 flex gap-3 items-center">
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                <h4 className="font-bold text-slate-900 dark:text-rose-100 text-sm sm:text-base leading-snug">
                  "{script.objection}"
                </h4>
              </div>
              <CardContent className="p-5 sm:p-6 space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">The Pivot Strategy</span>
                  <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    {script.pivot_strategy}
                  </p>
                </div>
                
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block flex items-center gap-2">
                    <MessageSquareQuote className="w-4 h-4" /> Word-for-Word Script
                  </span>
                  <div className="relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-300 dark:bg-rose-700/50 rounded-l"></div>
                    <p className="text-base sm:text-lg italic font-medium text-slate-800 dark:text-slate-200 pl-4 py-1 leading-relaxed">
                      "{script.script}"
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
