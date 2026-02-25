import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { useNetworkingAI } from "@/hooks/useNetworkingAI";
import { generateHiringManagerBypassPrompt } from "@/lib/prompts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Search, Target, Zap } from "lucide-react";
import { toast } from "sonner";
import { ResumeData, JobDescriptionData } from "@/lib/schema";

interface BooleanSearch {
  search_string: string;
  target_persona: string;
  rationale: string;
}

interface HiringManagerTabProps {
  overrideResumeData?: ResumeData | null;
  overrideJobData?: JobDescriptionData | null;
}

export function HiringManagerTab({ overrideResumeData, overrideJobData }: HiringManagerTabProps = {}) {
  const store = useAppStore();
  const { provider } = store;
  const jobData = overrideJobData ?? store.jobData;
  const { generateWithAI, isLoading } = useNetworkingAI();
  const [searches, setSearches] = useState<BooleanSearch[]>([]);
  const [promptOnlyText, setPromptOnlyText] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  void overrideResumeData;

  const handleGenerate = async () => {
    if (!jobData) return;
    
    const prompt = generateHiringManagerBypassPrompt(jobData);
    
    if (provider === "prompt-only") {
      setPromptOnlyText(prompt);
      return;
    }

    const data = await generateWithAI(prompt);
    if (data && Array.isArray(data)) {
      setSearches(data);
      toast.success("Bypass strings generated successfully.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 shadow-sm">
        <div className="flex-1 space-y-2 text-center md:text-left">
          <h3 className="text-xl font-bold flex items-center justify-center md:justify-start gap-2 text-slate-900 dark:text-white">
            <Target className="w-6 h-6 text-fuchsia-500" />
            Hiring Manager Bypass
          </h3>
          <p className="text-slate-500 text-sm">
            Stop applying into the void. We analyze the JD to generate precise LinkedIn "Boolean Search Strings" so you can bypass HR and find the actual team leaders and decision-makers.
          </p>
        </div>
        <Button 
          onClick={handleGenerate} 
          disabled={isLoading || !jobData}
          className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white min-w-[200px]"
        >
          {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mining Data...</> : <><Zap className="w-4 h-4 mr-2" /> Find Hiring Manager</>}
        </Button>
      </div>

      {!jobData && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4 text-center">
            <p className="text-sm text-amber-800 dark:text-amber-400">Please load a Job Description in the Optimizer first.</p>
        </div>
      )}

      {promptOnlyText && (
        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
          <p className="text-xs font-semibold text-fuchsia-600 uppercase">Prompt Only Mode</p>
          <pre className="text-[10px] font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">{promptOnlyText}</pre>
          <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(promptOnlyText); toast.success("Prompt copied!"); }}>
                  Copy Prompt
              </Button>
          </div>
        </div>
      )}

      {searches.length > 0 && (
        <div className="grid gap-4">
          <h4 className="font-semibold text-slate-900 dark:text-white">Targeted Search Queries</h4>
          {searches.map((search, idx) => (
            <Card key={idx} className="bg-white dark:bg-slate-950/50 border-fuchsia-100 dark:border-fuchsia-900/30 shadow-sm relative overflow-hidden group">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-fuchsia-500"></div>
              <CardContent className="p-5 sm:p-6 pl-6 sm:pl-8 space-y-4">
                
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-100 dark:bg-fuchsia-900/30 px-2 py-0.5 rounded-sm">
                      {search.target_persona}
                    </span>
                    <p className="text-xs text-slate-500 mt-2 indent-1">Why: {search.rationale}</p>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between overflow-hidden">
                    <code className="text-sm font-mono text-slate-800 dark:text-slate-200 p-3 select-all overflow-x-auto whitespace-nowrap scrollbar-hide">
                        {search.search_string}
                    </code>
                    <div className="bg-slate-100 dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 self-stretch flex">
                        <Button 
                            variant="ghost" 
                            className="h-full rounded-none hover:bg-fuchsia-50 hover:text-fuchsia-600 px-4 flex items-center gap-2"
                            onClick={() => {
                                navigator.clipboard.writeText(search.search_string);
                                toast.success("Copied boolean string to clipboard!");
                                window.open("https://www.linkedin.com/search/results/people/", "_blank");
                            }}
                        >
                            <Search className="w-4 h-4" /> <span className="hidden sm:inline">Search LinkedIn</span>
                        </Button>
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
