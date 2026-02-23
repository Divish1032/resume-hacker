import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { useNetworkingAI } from "@/hooks/useNetworkingAI";
import { generatePainPointOutreachPrompt } from "@/lib/prompt-engine";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Mail, Send, Copy, AlertCircle, Zap } from "lucide-react";
import { toast } from "sonner";

interface OutreachMessage {
  pain_point_hypothesis: string;
  subject_line: string;
  message: string;
}

export function PainPointOutreachTab() {
  const { resumeData, jobData, provider } = useAppStore();
  const { generateWithAI, isLoading } = useNetworkingAI();
  const [messages, setMessages] = useState<OutreachMessage[]>([]);
  const [promptOnlyText, setPromptOnlyText] = useState("");

  const handleGenerate = async () => {
    if (!resumeData || !jobData) return;
    
    const prompt = generatePainPointOutreachPrompt(resumeData, jobData);
    
    if (provider === "prompt-only") {
      setPromptOnlyText(prompt);
      return;
    }

    const data = await generateWithAI(prompt);
    if (data && Array.isArray(data)) {
      setMessages(data);
      toast.success("Outreach templates generated successfully.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 shadow-sm">
        <div className="flex-1 space-y-2 text-center md:text-left">
          <h3 className="text-xl font-bold flex items-center justify-center md:justify-start gap-2 text-slate-900 dark:text-white">
            <Mail className="w-6 h-6 text-blue-500" />
            "Pain-Point" Cold Outreach
          </h3>
          <p className="text-slate-500 text-sm">
            Generic "I just applied" messages get ignored. We use AI to guess the hiring manager's biggest problem based on the JD, and draft a cold email pitching your resume as the exact solution.
          </p>
        </div>
        <Button 
          onClick={handleGenerate} 
          disabled={isLoading || (!resumeData || !jobData)}
          className="bg-blue-600 hover:bg-blue-700 text-white min-w-[200px]"
        >
          {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Drafting Pitches...</> : <><Zap className="w-4 h-4 mr-2" /> Generate Outreach</>}
        </Button>
      </div>

      {(!resumeData || !jobData) && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4 text-center">
            <p className="text-sm text-amber-800 dark:text-amber-400">Please load both a Resume and Job Description in the Optimizer first.</p>
        </div>
      )}

      {promptOnlyText && (
        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
          <p className="text-xs font-semibold text-blue-600 uppercase">Prompt Only Mode</p>
          <pre className="text-[10px] font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">{promptOnlyText}</pre>
          <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(promptOnlyText); toast.success("Prompt copied!"); }}>
                  Copy Prompt
              </Button>
          </div>
        </div>
      )}

      {messages.length > 0 && (
        <div className="grid gap-6">
          <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Targeted Outreach Angles</h4>
          {messages.map((msg, idx) => (
            <Card key={idx} className="bg-white dark:bg-slate-950/50 border-blue-100 dark:border-blue-900/30 overflow-hidden shadow-sm">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 border-b border-blue-100 dark:border-blue-900/30 flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-blue-100 text-sm sm:text-base leading-snug">
                    Hypothesis: {msg.pain_point_hypothesis}
                  </h4>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                    Angle {idx + 1}
                  </p>
                </div>
              </div>
              <CardContent className="p-5 sm:p-6 space-y-6">
                
                {msg.subject_line !== "N/A" && (
                    <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">Subject Line</span>
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100 w-full truncate pr-4">{msg.subject_line}</span>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={() => { navigator.clipboard.writeText(msg.subject_line); toast.success("Subject copied!"); }}>
                            <Copy className="w-4 h-4" />
                        </Button>
                    </div>
                  </div>
                )}
                
                
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 block flex items-center gap-2">
                    <Send className="w-3 h-3" /> The Message
                  </span>
                  <div className="relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-300 dark:bg-blue-700/50 rounded-l"></div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 ml-4 relative">
                        <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {msg.message}
                        </p>
                        <Button 
                            variant="secondary" 
                            size="icon" 
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-full"
                            onClick={() => { navigator.clipboard.writeText(msg.message); toast.success("Message copied!"); }}
                        >
                            <Copy className="w-4 h-4 text-slate-500" />
                        </Button>
                    </div>
                    
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
