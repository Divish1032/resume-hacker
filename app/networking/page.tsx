"use client";

import { useAppStore } from "@/lib/store";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Network, Copy, CheckCircle2, RefreshCw, Briefcase, UserCircle, Send, Target, Mail, PlusCircle, Clock, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { generateNetworkingPrompt } from "@/lib/prompts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HiringManagerTab } from "@/components/features/networking/HiringManagerTab";
import { PainPointOutreachTab } from "@/components/features/networking/PainPointOutreachTab";
import { SavedApplicationSelector, ApplicationContext } from "@/components/features/SavedApplicationSelector";
import { ResumeData, JobDescriptionData } from "@/lib/schema";
import { makeGenCacheKey, loadCache, saveCache, appendCache, clearCache, relativeTime } from "@/lib/generation-cache";

interface OutreachTemplate {
  type: string;
  subject: string;
  body: string;
}

interface NetworkingResponse {
  headlines: string[];
  about: string;
  outreach: OutreachTemplate[];
}

const CACHE_TYPE_NET = "networking";
const HEADLINES_PAGE = 3;
const OUTREACH_PAGE = 3;

export default function NetworkingPage() {
  const store = useAppStore();
  const { resumeData: storeResumeData, jobData: storeJobData, provider, selectedModel: model, apiKey, isHydrated } = store;

  const [appContext, setAppContext] = useState<ApplicationContext | null>(null);
  const resumeData: ResumeData | null = appContext?.resolvedResumeData ?? storeResumeData;
  const jobData: JobDescriptionData | null = appContext?.jobData ?? storeJobData;

  const [response, setResponse] = useState<NetworkingResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [networkingPrompt, setNetworkingPrompt] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [cacheKey, setCacheKey] = useState<string>("");
  const [cachedAt, setCachedAt] = useState<number | null>(null);
  // Pagination state
  const [visibleHeadlines, setVisibleHeadlines] = useState(HEADLINES_PAGE);
  const [visibleOutreach, setVisibleOutreach] = useState(OUTREACH_PAGE);

  useEffect(() => { setMounted(true); }, []);

  // Load from cache whenever resume/job changes
  useEffect(() => {
    if (!isHydrated) return;
    const key = makeGenCacheKey(resumeData, jobData);
    setCacheKey(key);
    setVisibleHeadlines(HEADLINES_PAGE);
    setVisibleOutreach(OUTREACH_PAGE);

    const cached = loadCache<NetworkingResponse>(CACHE_TYPE_NET, key);
    if (cached && cached.items.length > 0) {
      setResponse(cached.items[0]); // networking stores the whole object as items[0]
      setCachedAt(cached.savedAt);
    } else {
      setResponse(null);
      setCachedAt(null);
    }
  }, [resumeData, jobData, isHydrated]);

  const handleContextSelect = useCallback((ctx: ApplicationContext | null) => {
    setAppContext(ctx);
    setResponse(null);
    setNetworkingPrompt("");
  }, []);

  /** Fetch a fresh NetworkingResponse from the API */
  const fetchNetworking = async (): Promise<NetworkingResponse | null> => {
    const prompt = generateNetworkingPrompt(resumeData!, jobData?.text ? jobData : undefined);
    if (provider === "prompt-only") {
      setNetworkingPrompt(prompt);
      setResponse(null);
      return null;
    }
    const res = await fetch("/api/generate", {
      method: "POST",
      body: JSON.stringify({ prompt, provider: provider || "ollama", model, apiKey }),
    });
    if (!res.ok) throw new Error("Failed to generate networking content");
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let accum = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      accum += decoder.decode(value, { stream: true });
    }
    const jsonMatch = accum.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid response format from AI");
    return JSON.parse(jsonMatch[0]) as NetworkingResponse;
  };

  /** Full regenerate — clears cache */
  const generateNetworkingContent = async () => {
    if (!resumeData) {
      toast.error("Please ensure you have loaded a resume in the Optimizer first.");
      return;
    }
    if (provider === "prompt-only") {
      await fetchNetworking();
      return;
    }
    setIsGenerating(true);
    setResponse(null);
    clearCache(CACHE_TYPE_NET, cacheKey);
    setCachedAt(null);
    setVisibleHeadlines(HEADLINES_PAGE);
    setVisibleOutreach(OUTREACH_PAGE);
    try {
      const parsed = await fetchNetworking();
      if (!parsed) return;
      setResponse(parsed);
      saveCache<NetworkingResponse>(CACHE_TYPE_NET, cacheKey, [parsed]);
      setCachedAt(Date.now());
      toast.success("Networking kit generated & cached");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate content. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  /** Append more headlines + outreach templates; keep existing about section */
  const generateMore = async () => {
    if (!resumeData) return;
    setIsGeneratingMore(true);
    try {
      const parsed = await fetchNetworking();
      if (!parsed || !response) return;

      const existingHeadlines = new Set(response.headlines.map((h) => h.toLowerCase()));
      const newHeadlines = parsed.headlines.filter((h) => !existingHeadlines.has(h.toLowerCase()));
      const existingOutreach = new Set(response.outreach.map((o) => o.type.toLowerCase()));
      const newOutreach = parsed.outreach.filter((o) => !existingOutreach.has(o.type.toLowerCase()));

      const merged: NetworkingResponse = {
        headlines: [...response.headlines, ...newHeadlines],
        about: response.about, // keep existing about
        outreach: [...response.outreach, ...newOutreach],
      };
      setResponse(merged);
      setVisibleHeadlines((v) => v + newHeadlines.length);
      setVisibleOutreach((v) => v + newOutreach.length);
      saveCache<NetworkingResponse>(CACHE_TYPE_NET, cacheKey, [merged]);
      setCachedAt(Date.now());
      toast.success(`${newHeadlines.length} headlines + ${newOutreach.length} templates added`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate more content.");
    } finally {
      setIsGeneratingMore(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!mounted || !isHydrated) return null;
  const isReady = !!resumeData;

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 min-h-screen space-y-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Network className="w-8 h-8 text-blue-500" />
            Networking &amp; LinkedIn
          </h1>
          <p className="text-slate-500 mt-2">Optimize your LinkedIn profile and generate personalized cold-outreach templates.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {cachedAt && (
            <span className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 rounded-lg">
              <Clock className="w-3 h-3 text-emerald-500" />
              Cached {relativeTime(cachedAt)}
            </span>
          )}

          {response && provider !== "prompt-only" && (
            <Button
              onClick={generateMore}
              disabled={isGeneratingMore || isGenerating}
              variant="outline"
              className="gap-2 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              {isGeneratingMore
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</>
                : <><PlusCircle className="w-4 h-4" /> Generate More</>}
            </Button>
          )}

          <Button
            onClick={generateNetworkingContent}
            disabled={!isReady || isGenerating}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm self-start md:self-auto"
          >
            {isGenerating
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Crafting Profile...</>
              : <><RefreshCw className="w-4 h-4 mr-2" />{response || networkingPrompt ? "Regenerate" : "Generate Profile & Outreach"}</>}
          </Button>
        </div>
      </div>

      {/* Saved Application Selector */}
      <SavedApplicationSelector onSelect={handleContextSelect} sourceLabel="Resume to use for networking" />

      <Tabs defaultValue="profile_maker" className="space-y-4 w-full">
        <div className="flex justify-center flex-wrap">
          <TabsList className="bg-slate-100 dark:bg-slate-900/50 p-1 border border-slate-200 dark:border-slate-800">
            <TabsTrigger value="profile_maker" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 flex items-center gap-2"><UserCircle className="w-4 h-4 text-blue-500" /> Web Presence</TabsTrigger>
            <TabsTrigger value="bypass" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 flex items-center gap-2"><Target className="w-4 h-4 text-fuchsia-500" /> Hiring Manager Bypass</TabsTrigger>
            <TabsTrigger value="outreach" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 flex items-center gap-2"><Mail className="w-4 h-4 text-emerald-500" /> Pain-Point Outreach</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="profile_maker" className="mt-0 focus-visible:outline-none focus-visible:ring-0 space-y-8 w-full">
          {!isReady && !isGenerating && !response && (
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-6 text-center max-w-2xl mx-auto mt-12">
              <p className="text-amber-800 dark:text-amber-400 font-medium mb-4">You need an active Resume to use the Networking tools.</p>
              <p className="text-sm text-amber-700 dark:text-amber-500/70 mb-6">Head over to the Optimizer and load your resume first.</p>
              <Button variant="outline" className="bg-white dark:bg-slate-950 border-amber-200 dark:border-amber-800" onClick={() => window.location.href = "/optimizer"}>Go to Optimizer</Button>
            </div>
          )}

          {isReady && !isGenerating && !response && (
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center max-w-3xl mx-auto shadow-sm mt-12">
              <UserCircle className="w-16 h-16 text-slate-200 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Build Your Professional Brand</h3>
              <p className="text-slate-500 mb-8 max-w-lg mx-auto">We&apos;ll analyze your resume to generate high-converting LinkedIn headlines, an engaging &quot;About&quot; section, and personalized outreach templates.</p>

              {networkingPrompt && provider === "prompt-only" ? (
                <div className="space-y-4 text-left">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <p className="text-xs font-semibold mb-2 text-blue-600 uppercase">Networking Generation Prompt</p>
                    <pre className="text-[10px] font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">{networkingPrompt}</pre>
                    <Button size="sm" variant="outline" className="mt-3 w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                      onClick={() => { navigator.clipboard.writeText(networkingPrompt); toast.success("Prompt copied!"); }}>
                      Copy Prompt &amp; Open AI
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium">Step 2: Paste the AI response (JSON) here</p>
                    <textarea
                      className="w-full h-32 p-3 text-xs font-mono border rounded-lg dark:bg-slate-900"
                      placeholder='{"headlines": ["..."], "about": "...", "outreach": [...]}'
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          if (parsed.headlines) {
                            setResponse(parsed);
                            saveCache<NetworkingResponse>(CACHE_TYPE_NET, cacheKey, [parsed]);
                            setCachedAt(Date.now());
                            setNetworkingPrompt("");
                            toast.success("Content loaded!");
                          }
                        } catch { /* wait for valid JSON */ }
                      }}
                    />
                  </div>
                </div>
              ) : (
                <Button onClick={generateNetworkingContent} size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                  Generate Networking Kit
                </Button>
              )}

              {jobData?.text && (
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-4 flex items-center justify-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" /> Will be tailored for: Your targeted job description
                </p>
              )}
            </div>
          )}

          {isGenerating && (
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl h-[400px] flex flex-col items-center justify-center p-8 shadow-sm">
              <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mb-6" />
              <p className="text-lg text-slate-700 dark:text-slate-300 font-medium">Analyzing your experience...</p>
              <p className="text-sm text-slate-500 mt-2 text-center max-w-md">Writing SEO-optimized headlines and crafting personalized networking templates.</p>
            </div>
          )}

          {response && !isGenerating && (
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-8">
                <TabsTrigger value="profile" className="flex items-center gap-2"><UserCircle className="w-4 h-4" /> LinkedIn Profile</TabsTrigger>
                <TabsTrigger value="outreach_tab" className="flex items-center gap-2"><Send className="w-4 h-4" /> Outreach Templates</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-6">
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Headlines with pagination */}
                  <Card className="lg:col-span-1 shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                    <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/20">
                      <CardTitle className="text-base text-slate-800 dark:text-slate-200 flex flex-col items-start gap-1">
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-blue-500">Brand Taglines</span>
                          <span className="text-[10px] text-slate-400">{Math.min(visibleHeadlines, response.headlines.length)}/{response.headlines.length}</span>
                        </div>
                        LinkedIn Headlines
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 space-y-3">
                      {response.headlines.slice(0, visibleHeadlines).map((headline, idx) => (
                        <div key={idx} className="group relative border border-slate-200 dark:border-slate-800 rounded-lg p-3 sm:p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors bg-white dark:bg-slate-950">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-snug pr-8">{headline}</p>
                          <button
                            onClick={() => copyToClipboard(headline, `h_${idx}`)}
                            className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-50 dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Copy headline"
                          >
                            {copiedIndex === `h_${idx}` ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      ))}

                      {/* Show more from cache */}
                      {visibleHeadlines < response.headlines.length && (
                        <Button variant="outline" size="sm" className="w-full gap-1 text-xs" onClick={() => setVisibleHeadlines((v) => v + HEADLINES_PAGE)}>
                          <ChevronDown className="w-3 h-3" /> {Math.min(HEADLINES_PAGE, response.headlines.length - visibleHeadlines)} more
                        </Button>
                      )}

                      {/* Generate more from API */}
                      {visibleHeadlines >= response.headlines.length && provider !== "prompt-only" && (
                        <Button variant="outline" size="sm" className="w-full gap-1 text-xs border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                          onClick={generateMore} disabled={isGeneratingMore}>
                          {isGeneratingMore ? <><Loader2 className="w-3 h-3 animate-spin" /> Adding...</> : <><PlusCircle className="w-3 h-3" /> Generate more</>}
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  {/* About Section */}
                  <Card className="lg:col-span-2 shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 h-fit">
                    <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/20 flex flex-row items-center justify-between">
                      <CardTitle className="text-base text-slate-800 dark:text-slate-200 flex flex-col items-start gap-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-blue-500">The Story</span>
                        &quot;About&quot; Summary
                      </CardTitle>
                      <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                        onClick={() => copyToClipboard(response.about, "about")}>
                        {copiedIndex === "about" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedIndex === "about" ? "Copied" : "Copy"}
                      </Button>
                    </CardHeader>
                    <CardContent className="p-5 sm:p-6">
                      <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">
                        {response.about.split("\n").map((paragraph, i) =>
                          paragraph.trim() ? <p key={i}>{paragraph}</p> : <br key={i} />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="outreach_tab" className="space-y-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {response.outreach.slice(0, visibleOutreach).map((msg, idx) => (
                    <Card key={idx} className="shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col">
                      <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/20">
                        <CardTitle className="text-base text-slate-800 dark:text-slate-200 flex flex-col items-start gap-1">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-blue-500">Template</span>
                          {msg.type}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-5 flex-1 flex flex-col">
                        {msg.subject && (
                          <div className="mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">Subject</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{msg.subject}</p>
                          </div>
                        )}
                        <div className="flex-1 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 font-serif leading-relaxed">{msg.body}</div>
                        <Button variant="outline" className="w-full mt-6 flex items-center justify-center gap-2 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                          onClick={() => copyToClipboard(msg.body, `o_${idx}`)}>
                          {copiedIndex === `o_${idx}` ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                          {copiedIndex === `o_${idx}` ? "Copied!" : "Copy Template"}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Outreach pagination */}
                {visibleOutreach < response.outreach.length && (
                  <Button variant="outline" className="w-full gap-2 text-slate-600 dark:text-slate-400"
                    onClick={() => setVisibleOutreach((v) => v + OUTREACH_PAGE)}>
                    <ChevronDown className="w-4 h-4" />
                    Show {Math.min(OUTREACH_PAGE, response.outreach.length - visibleOutreach)} more templates
                  </Button>
                )}

                {visibleOutreach >= response.outreach.length && provider !== "prompt-only" && (
                  <Button variant="outline" className="w-full gap-2 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    onClick={generateMore} disabled={isGeneratingMore}>
                    {isGeneratingMore ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</> : <><PlusCircle className="w-4 h-4" /> Generate More Templates</>}
                  </Button>
                )}
              </TabsContent>
            </Tabs>
          )}
        </TabsContent>

        <TabsContent value="bypass" className="mt-0 focus-visible:outline-none focus-visible:ring-0 w-full">
          <HiringManagerTab overrideResumeData={resumeData} overrideJobData={jobData} />
        </TabsContent>
        <TabsContent value="outreach" className="mt-0 focus-visible:outline-none focus-visible:ring-0 w-full">
          <PainPointOutreachTab overrideResumeData={resumeData} overrideJobData={jobData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
