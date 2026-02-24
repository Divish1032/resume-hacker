import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { useInterviewAI } from "@/hooks/useInterviewAI";
import { generateReverseQuestionsPrompt } from "@/lib/prompts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, MessageCircleQuestion, HelpCircle, Zap } from "lucide-react";
import { toast } from "sonner";

interface ReverseQuestion {
  question: string;
  rationale: string;
}

export function ReverseQuestionsTab() {
  const { resumeData, jobData, provider } = useAppStore();
  const { generateWithAI, isLoading } = useInterviewAI();
  const [questions, setQuestions] = useState<ReverseQuestion[]>([]);
  const [promptOnlyText, setPromptOnlyText] = useState("");

  const handleGenerate = async () => {
    if (!resumeData || !jobData) return;
    
    const prompt = generateReverseQuestionsPrompt(resumeData, jobData);
    
    if (provider === "prompt-only") {
      setPromptOnlyText(prompt);
      return;
    }

    const data = await generateWithAI(prompt);
    if (data && Array.isArray(data)) {
      setQuestions(data);
      toast.success("Strategic questions generated successfully.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 shadow-sm">
        <div className="flex-1 space-y-2 text-center md:text-left">
          <h3 className="text-xl font-bold flex items-center justify-center md:justify-start gap-2 text-slate-900 dark:text-white">
            <MessageCircleQuestion className="w-6 h-6 text-indigo-500" />
            Reverse Interview Questions
          </h3>
          <p className="text-slate-500 text-sm">
            Don't ask generic questions at the end of the interview. Generate highly strategic, insider-level questions based on the job description to prove you're already thinking like a senior hire.
          </p>
        </div>
        <Button 
          onClick={handleGenerate} 
          disabled={isLoading || (!resumeData || !jobData)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[200px]"
        >
          {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</> : <><Zap className="w-4 h-4 mr-2" /> Generate Questions</>}
        </Button>
      </div>

      {promptOnlyText && (
        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
          <p className="text-xs font-semibold text-indigo-600 uppercase">Prompt Only Mode</p>
          <pre className="text-[10px] font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">{promptOnlyText}</pre>
          <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(promptOnlyText); toast.success("Prompt copied!"); }}>
                  Copy Prompt
              </Button>
              <p className="text-xs text-slate-500">Run this prompt in ChatGPT/Claude and you're good to go.</p>
          </div>
        </div>
      )}

      {questions.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Strategic Questions to Ask</h4>
          <div className="grid gap-4 md:grid-cols-1">
            {questions.map((q, idx) => (
              <Card key={idx} className="bg-white dark:bg-slate-950/50 border-indigo-100 dark:border-indigo-900/30 shadow-sm relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500"></div>
                <CardContent className="p-5 sm:p-6 pl-6 sm:pl-8">
                  <h5 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 mb-3 pr-8 leading-snug">
                    "{q.question}"
                  </h5>
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-100 dark:border-slate-800 flex gap-3 text-sm">
                    <HelpCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Why ask this?</span>
                      <span className="text-slate-600 dark:text-slate-400 leading-relaxed">{q.rationale}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
