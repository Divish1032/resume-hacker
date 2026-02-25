"use client";

import { useAppStore } from "@/lib/store";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, MessageSquareQuote, CheckCircle2, ChevronRight, Zap, RefreshCw, MessageCircleQuestion, CalendarDays, ShieldAlert, PlusCircle, Clock, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { generateInterviewQuestionsPrompt, generateStarFlashcardPrompt } from "@/lib/prompts";
import { ReverseQuestionsTab } from "@/components/features/interview/ReverseQuestionsTab";
import { Plan306090Tab } from "@/components/features/interview/Plan306090Tab";
import { ObjectionHandlingTab } from "@/components/features/interview/ObjectionHandlingTab";
import { SavedApplicationSelector, ApplicationContext } from "@/components/features/SavedApplicationSelector";
import { ResumeData, JobDescriptionData } from "@/lib/schema";
import { makeGenCacheKey, loadCache, saveCache, appendCache, clearCache, relativeTime } from "@/lib/generation-cache";

interface InterviewQuestion {
  question: string;
  type: string;
  reasoning: string;
}

interface StarResponse {
  situation: string;
  task: string;
  action: string;
  result: string;
  tips: string;
}

const CACHE_TYPE = "interview_questions";
const PAGE_SIZE = 8;

export default function InterviewPrepPage() {
  const store = useAppStore();
  const { resumeData: storeResumeData, jobData: storeJobData, provider, selectedModel: model, apiKey, isHydrated } = store;

  const [appContext, setAppContext] = useState<ApplicationContext | null>(null);

  const resumeData: ResumeData | null = appContext?.resolvedResumeData ?? storeResumeData;
  const jobData: JobDescriptionData | null = appContext?.jobData ?? storeJobData;

  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<InterviewQuestion | null>(null);
  const [starResponse, setStarResponse] = useState<StarResponse | null>(null);
  const [isGeneratingStar, setIsGeneratingStar] = useState(false);
  const [questionsPrompt, setQuestionsPrompt] = useState("");
  const [mounted, setMounted] = useState(false);
  const [cacheKey, setCacheKey] = useState<string>("");
  const [cachedAt, setCachedAt] = useState<number | null>(null);
  // Pagination
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => { setMounted(true); }, []);

  // Recompute cache key and load from cache whenever resume/job changes
  useEffect(() => {
    if (!isHydrated) return;
    const key = makeGenCacheKey(resumeData, jobData);
    setCacheKey(key);
    setVisibleCount(PAGE_SIZE);

    const cached = loadCache<InterviewQuestion>(CACHE_TYPE, key);
    if (cached && cached.items.length > 0) {
      setQuestions(cached.items);
      setCachedAt(cached.savedAt);
      setSelectedQuestion(null);
      setStarResponse(null);
    } else {
      setQuestions([]);
      setCachedAt(null);
    }
  }, [resumeData, jobData, isHydrated]);

  const handleContextSelect = useCallback((ctx: ApplicationContext | null) => {
    setAppContext(ctx);
    setSelectedQuestion(null);
    setStarResponse(null);
    setQuestionsPrompt("");
  }, []);

  /** Fetch questions from the API and return parsed array */
  const fetchQuestions = async (): Promise<InterviewQuestion[]> => {
    const prompt = generateInterviewQuestionsPrompt(resumeData!, jobData!);

    if (provider === "prompt-only") {
      setQuestionsPrompt(prompt);
      return [];
    }

    const res = await fetch("/api/generate", {
      method: "POST",
      body: JSON.stringify({ prompt, provider: provider || "ollama", model, apiKey }),
    });
    if (!res.ok) throw new Error("Failed to generate questions");

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let accum = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      accum += decoder.decode(value, { stream: true });
    }
    const jsonMatch = accum.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("Invalid response format from AI");
    return JSON.parse(jsonMatch[0]) as InterviewQuestion[];
  };

  /** Full regenerate — clears cache */
  const generateQuestions = async () => {
    if (!resumeData || !jobData) {
      toast.error("Please ensure you have loaded a resume and job description.");
      return;
    }
    if (provider === "prompt-only") {
      const prompt = generateInterviewQuestionsPrompt(resumeData, jobData);
      setQuestionsPrompt(prompt);
      setQuestions([]);
      setSelectedQuestion(null);
      setStarResponse(null);
      return;
    }
    setIsGeneratingQuestions(true);
    setQuestions([]);
    setSelectedQuestion(null);
    setStarResponse(null);
    clearCache(CACHE_TYPE, cacheKey);
    setCachedAt(null);
    setVisibleCount(PAGE_SIZE);
    try {
      const parsed = await fetchQuestions();
      setQuestions(parsed);
      saveCache(CACHE_TYPE, cacheKey, parsed);
      setCachedAt(Date.now());
      toast.success(`${parsed.length} questions generated & cached`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate questions. Please try again.");
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  /** Append more without clearing existing cache */
  const generateMoreQuestions = async () => {
    if (!resumeData || !jobData) return;
    setIsGeneratingMore(true);
    try {
      const newItems = await fetchQuestions();
      if (newItems.length === 0) return;
      // Deduplicate by question text
      const existingTexts = new Set(questions.map((q) => q.question.toLowerCase()));
      const unique = newItems.filter((q) => !existingTexts.has(q.question.toLowerCase()));
      const merged = appendCache<InterviewQuestion>(CACHE_TYPE, cacheKey, unique);
      setQuestions(merged);
      setCachedAt(Date.now());
      setVisibleCount((v) => v + unique.length);
      toast.success(`${unique.length} new questions added`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate more questions.");
    } finally {
      setIsGeneratingMore(false);
    }
  };

  const generateStarFlashcard = async (questionObj: InterviewQuestion) => {
    if (!resumeData || !jobData) return;
    setSelectedQuestion(questionObj);
    setIsGeneratingStar(true);
    setStarResponse(null);

    const prompt = generateStarFlashcardPrompt(resumeData, jobData, questionObj.question);

    if (provider === "prompt-only") {
      navigator.clipboard.writeText(prompt);
      toast.success("STAR Prompt copied to clipboard! Paste it in your AI to get an answer.");
      setIsGeneratingStar(false);
      return;
    }

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        body: JSON.stringify({ prompt, provider: provider || "ollama", model, apiKey }),
      });
      if (!res.ok) throw new Error("Failed to generate STAR response");
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accum = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        accum += decoder.decode(value, { stream: true });
      }
      const jsonMatch = accum.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setStarResponse(parsed);
        if (window.innerWidth < 1024) window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      } else {
        throw new Error("Invalid response format from AI");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate STAR response. Please try again.");
    } finally {
      setIsGeneratingStar(false);
    }
  };

  if (!mounted || !isHydrated) return null;

  const isReady = !!resumeData && !!jobData?.text;
  const visibleQuestions = questions.slice(0, visibleCount);
  const hasMore = visibleCount < questions.length;

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 min-h-screen space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <MessageSquareQuote className="w-8 h-8 text-violet-500" />
            Interview Prep
          </h1>
          <p className="text-slate-500 mt-2">Master your next interview with AI-generated mock questions and STAR method flashcards.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Cache status */}
          {cachedAt && (
            <span className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 rounded-lg">
              <Clock className="w-3 h-3 text-emerald-500" />
              Cached {relativeTime(cachedAt)}
            </span>
          )}

          {/* Generate More — only when we already have questions */}
          {questions.length > 0 && provider !== "prompt-only" && (
            <Button
              onClick={generateMoreQuestions}
              disabled={isGeneratingMore || isGeneratingQuestions}
              variant="outline"
              className="gap-2 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
            >
              {isGeneratingMore
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</>
                : <><PlusCircle className="w-4 h-4" /> Generate More</>}
            </Button>
          )}

          {/* Main generate/regenerate */}
          <Button
            onClick={generateQuestions}
            disabled={!isReady || isGeneratingQuestions}
            className="bg-violet-600 hover:bg-violet-700 text-white shadow-sm"
          >
            {isGeneratingQuestions
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing Profile...</>
              : <><Zap className="w-4 h-4 mr-2" />{questions.length > 0 ? "Regenerate" : "Generate Mock Interview"}</>}
          </Button>
        </div>
      </div>

      {/* Saved Application Selector */}
      <SavedApplicationSelector onSelect={handleContextSelect} sourceLabel="Resume to use for interview prep" />

      {!appContext && isReady && (
        <div className="flex items-center gap-2 text-[11px] text-slate-400 px-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          Using current session resume &amp; job description
        </div>
      )}

      {!isReady && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-6 text-center max-w-2xl mx-auto">
          <p className="text-amber-800 dark:text-amber-400 font-medium mb-4">You need an active Resume and Job Description to use Interview Prep.</p>
          <p className="text-sm text-amber-700 dark:text-amber-500/70 mb-6">Load a resume in the Optimizer, or select a saved application above.</p>
          <Button variant="outline" className="bg-white dark:bg-slate-950 border-amber-200 dark:border-amber-800" onClick={() => window.location.href = "/optimizer"}>
            Go to Optimizer
          </Button>
        </div>
      )}

      {isReady && questions.length === 0 && !isGeneratingQuestions && (
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center max-w-3xl mx-auto shadow-sm">
          <MessageSquareQuote className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Ready to practice?</h3>
          <p className="text-slate-500 mb-6">
            {appContext
              ? `Using "${appContext.application.name}"${appContext.resumeSource === "optimized" && appContext.selectedVersion ? ` — ${appContext.selectedVersion.label} (Optimized)` : " — Original Resume"} as context.`
              : "We'll analyze your resume against the current job description to predict what they'll ask you."}
          </p>

          {questionsPrompt && provider === "prompt-only" ? (
            <div className="space-y-4 text-left">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <p className="text-xs font-semibold mb-2 text-violet-600 uppercase">Question Generation Prompt</p>
                <pre className="text-[10px] font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">{questionsPrompt}</pre>
                <Button size="sm" variant="outline" className="mt-3 w-full border-violet-200 text-violet-700 hover:bg-violet-50"
                  onClick={() => { navigator.clipboard.writeText(questionsPrompt); toast.success("Prompt copied!"); }}>
                  Copy Prompt &amp; Open AI
                </Button>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium">Step 2: Paste the AI response (JSON array) here</p>
                <textarea
                  className="w-full h-32 p-3 text-xs font-mono border rounded-lg dark:bg-slate-900"
                  placeholder='[{"question": "...", "type": "...", "reasoning": "..."}]'
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      if (Array.isArray(parsed)) {
                        setQuestions(parsed);
                        saveCache(CACHE_TYPE, cacheKey, parsed);
                        setCachedAt(Date.now());
                        setQuestionsPrompt("");
                        toast.success("Questions loaded!");
                      }
                    } catch { /* wait for valid JSON */ }
                  }}
                />
              </div>
            </div>
          ) : (
            <Button onClick={generateQuestions} className="bg-violet-600 hover:bg-violet-700 text-white shadow-sm">
              Generate Questions
            </Button>
          )}
        </div>
      )}

      {isReady && questions.length > 0 && (
        <Tabs defaultValue="mock" className="space-y-8">
          <div className="flex justify-center flex-wrap">
            <TabsList className="bg-slate-100 dark:bg-slate-900/50 p-1 border border-slate-200 dark:border-slate-800">
              <TabsTrigger value="mock" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">Mock Interview</TabsTrigger>
              <TabsTrigger value="reverse" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 flex items-center gap-2"><MessageCircleQuestion className="w-4 h-4 text-indigo-500" /> Reverse Questions</TabsTrigger>
              <TabsTrigger value="plan" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 flex items-center gap-2"><CalendarDays className="w-4 h-4 text-emerald-500" /> 30-60-90 Plan</TabsTrigger>
              <TabsTrigger value="objection" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-rose-500" /> Defense Scripts</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="mock" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left: Questions list with pagination */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    Predicted Questions
                    <span className="bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 py-0.5 px-2.5 rounded-full text-xs font-bold">
                      {visibleCount < questions.length ? `${visibleCount}/${questions.length}` : questions.length}
                    </span>
                  </h3>
                </div>

                <div className="space-y-3">
                  {visibleQuestions.map((q, idx) => (
                    <Card
                      key={idx}
                      className={`cursor-pointer transition-all hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md ${selectedQuestion?.question === q.question ? "border-violet-500 ring-1 ring-violet-500 shadow-md bg-violet-50/50 dark:bg-violet-900/10" : "bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-800"}`}
                      onClick={() => generateStarFlashcard(q)}
                    >
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-2 flex-1">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30 px-2 py-0.5 rounded-sm">
                              {q.type}
                            </span>
                            <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-snug">{q.question}</h4>
                            <p className="text-xs text-slate-500 italic">Why they ask: {q.reasoning}</p>
                          </div>
                          <ChevronRight className={`w-5 h-5 shrink-0 transition-transform ${selectedQuestion?.question === q.question ? "text-violet-500" : "text-slate-300"}`} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination — show more from cache */}
                {hasMore && (
                  <Button
                    variant="outline"
                    className="w-full gap-2 text-slate-600 dark:text-slate-400"
                    onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                  >
                    <ChevronDown className="w-4 h-4" />
                    Show {Math.min(PAGE_SIZE, questions.length - visibleCount)} more
                    <span className="text-slate-400 text-xs">({questions.length - visibleCount} remaining)</span>
                  </Button>
                )}

                {/* Generate more from API */}
                {!hasMore && questions.length > 0 && provider !== "prompt-only" && (
                  <Button
                    variant="outline"
                    onClick={generateMoreQuestions}
                    disabled={isGeneratingMore}
                    className="w-full gap-2 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                  >
                    {isGeneratingMore
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                      : <><PlusCircle className="w-4 h-4" /> Generate More Questions</>}
                  </Button>
                )}
              </div>

              {/* Right: STAR flashcard */}
              <div className="space-y-4 lg:sticky lg:top-20 self-start">
                <h3 className="font-semibold text-slate-900 dark:text-white">STAR Method Answer Builder</h3>

                {!selectedQuestion ? (
                  <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 border-dashed rounded-2xl h-[400px] flex items-center justify-center text-center p-8">
                    <div className="space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-slate-500 font-medium">Select a question</p>
                      <p className="text-xs text-slate-400">We&apos;ll help you build an answer using your resume experience.</p>
                    </div>
                  </div>
                ) : isGeneratingStar ? (
                  <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl h-[400px] flex flex-col items-center justify-center p-8 shadow-sm">
                    <RefreshCw className="w-8 h-8 text-violet-500 animate-spin mb-4" />
                    <p className="text-slate-700 dark:text-slate-300 font-medium">Crafting your answer...</p>
                    <p className="text-xs text-slate-500 mt-2 text-center">Finding the best experience from your resume to match the STAR framework.</p>
                  </div>
                ) : starResponse ? (
                  <div className="bg-white dark:bg-slate-950 border border-violet-200 dark:border-violet-900/50 rounded-2xl shadow-lg overflow-hidden flex flex-col">
                    <div className="bg-violet-50 dark:bg-violet-900/20 p-5 sm:p-6 border-b border-violet-100 dark:border-violet-900/30">
                      <h4 className="font-bold text-slate-900 dark:text-white leading-snug">&quot;{selectedQuestion.question}&quot;</h4>
                    </div>
                    <div className="p-5 sm:p-6 space-y-5">
                      <div className="space-y-4">
                        <StarSection letter="S" title="Situation" content={starResponse.situation} color="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400" />
                        <StarSection letter="T" title="Task" content={starResponse.task} color="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400" />
                        <StarSection letter="A" title="Action" content={starResponse.action} color="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400" />
                        <StarSection letter="R" title="Result" content={starResponse.result} color="bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400" />
                      </div>
                      <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 -mx-6 -mb-6 p-6">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Delivery Tips</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 italic flex items-start gap-2">
                          <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          {starResponse.tips}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reverse" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <ReverseQuestionsTab overrideResumeData={resumeData} overrideJobData={jobData} />
          </TabsContent>
          <TabsContent value="plan" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <Plan306090Tab overrideResumeData={resumeData} overrideJobData={jobData} />
          </TabsContent>
          <TabsContent value="objection" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <ObjectionHandlingTab overrideResumeData={resumeData} overrideJobData={jobData} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function StarSection({ letter, title, content, color }: { letter: string; title: string; content: string; color: string }) {
  return (
    <div className="flex gap-4 items-start">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg shrink-0 ${color}`}>{letter}</div>
      <div>
        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{title}</h5>
        <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">{content}</p>
      </div>
    </div>
  );
}
