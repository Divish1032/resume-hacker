"use client";

import { useAppStore } from "@/lib/store";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Network, Copy, CheckCircle2, RefreshCw, Briefcase, UserCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { generateNetworkingPrompt } from "@/lib/prompt-engine";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

export default function NetworkingPage() {
  const store = useAppStore();
  const { resumeData, jobData, provider, selectedModel: model, apiKey } = store;
  
  const [response, setResponse] = useState<NetworkingResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const generateNetworkingContent = async () => {
    if (!resumeData) {
      toast.error("Please ensure you have loaded a resume in the Optimizer first.");
      return;
    }
    if (provider === "prompt-only") {
      toast.error("Please select an AI provider in the header to generate content.");
      return;
    }

    setIsGenerating(true);
    setResponse(null);

    // Pass jobData only if it has meaningful text to tailor the outreach
    const prompt = generateNetworkingPrompt(resumeData, jobData?.text ? jobData : undefined);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        body: JSON.stringify({
          prompt,
          provider: provider || 'ollama',
          model,
          apiKey,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate networking content");
      
      const stream = res.body;
      if (!stream) throw new Error("No response stream");

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let accum = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        accum += decoder.decode(value, { stream: true });
      }

      // Extract JSON object
      const jsonMatch = accum.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setResponse(parsed);
      } else {
        throw new Error("Invalid response format from AI");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate content. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!mounted) return null;

  const isReady = !!resumeData;

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 min-h-screen space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Network className="w-8 h-8 text-blue-500" />
            Networking & LinkedIn
          </h1>
          <p className="text-slate-500 mt-2">Optimize your LinkedIn profile and generate personalized cold-outreach templates.</p>
        </div>
        
        <Button 
          onClick={generateNetworkingContent} 
          disabled={!isReady || isGenerating || provider === "prompt-only"}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm self-start md:self-auto"
        >
          {isGenerating ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Crafting Profile...</>
          ) : (
            <><RefreshCw className="w-4 h-4 mr-2" /> {response ? "Regenerate Content" : "Generate Profile & Outreach"}</>
          )}
        </Button>
      </div>

      {(!isReady || provider === "prompt-only") && !isGenerating && !response && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-6 text-center max-w-2xl mx-auto mt-12">
          <p className="text-amber-800 dark:text-amber-400 font-medium mb-4">
            {!isReady ? "You need an active Resume to use the Networking tools." : "Select an AI provider to use this feature."}
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-500/70 mb-6">
            {!isReady 
              ? "Head over to the Optimizer and load your resume first. Adding a target Job Description will customize the outreach templates specifically for that role!" 
              : "Please select OpenAI, Anthropic, Gemini, DeepSeek, or a local Ollama model in the top header."}
          </p>
          {!isReady && (
            <Button variant="outline" className="bg-white dark:bg-slate-950 border-amber-200 dark:border-amber-800" onClick={() => window.location.href = '/optimizer'}>
              Go to Optimizer
            </Button>
          )}
        </div>
      )}

      {isReady && provider !== "prompt-only" && !isGenerating && !response && (
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center max-w-3xl mx-auto shadow-sm mt-12">
          <UserCircle className="w-16 h-16 text-slate-200 mx-auto mb-6" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Build Your Professional Brand</h3>
          <p className="text-slate-500 mb-8 max-w-lg mx-auto">We'll analyze your resume to generate high-converting LinkedIn headlines, an engaging &quot;About&quot; section, and personalized outreach templates.</p>
          <Button onClick={generateNetworkingContent} size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
            Generate Networking Kit
          </Button>
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
            <TabsTrigger value="outreach" className="flex items-center gap-2"><Send className="w-4 h-4" /> Outreach Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Headlines */}
              <Card className="lg:col-span-1 shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/20">
                  <CardTitle className="text-base text-slate-800 dark:text-slate-200 flex flex-col items-start gap-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-blue-500">Brand Taglines</span>
                    LinkedIn Headlines
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  {response.headlines.map((headline, idx) => (
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
                </CardContent>
              </Card>

              {/* About Section */}
              <Card className="lg:col-span-2 shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 h-fit">
                <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/20 flex flex-row items-center justify-between">
                  <CardTitle className="text-base text-slate-800 dark:text-slate-200 flex flex-col items-start gap-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-blue-500">The Story</span>
                    &quot;About&quot; Summary
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="h-8 gap-1.5 text-xs text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                    onClick={() => copyToClipboard(response.about, 'about')}
                  >
                    {copiedIndex === 'about' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedIndex === 'about' ? 'Copied' : 'Copy'}
                  </Button>
                </CardHeader>
                <CardContent className="p-5 sm:p-6">
                  <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">
                    {response.about.split('\n').map((paragraph, i) => (
                      paragraph.trim() ? <p key={i}>{paragraph}</p> : <br key={i} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="outreach" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {response.outreach.map((msg, idx) => (
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
                    <div className="flex-1 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 font-serif leading-relaxed">
                      {msg.body}
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full mt-6 flex items-center justify-center gap-2 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                      onClick={() => copyToClipboard(msg.body, `o_${idx}`)}
                    >
                      {copiedIndex === `o_${idx}` ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      {copiedIndex === `o_${idx}` ? "Copied!" : "Copy Template"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
