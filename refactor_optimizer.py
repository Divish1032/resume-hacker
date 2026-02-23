import re

with open("app/optimizer/page.tsx", "r") as f:
    code = f.read()

# 1. Add import Note: replace the old imports
code = code.replace(
    'import { Copy, Sparkles, Loader2, RefreshCw, DownloadCloud, TrendingUp, ArrowRight, ChevronDown, ChevronUp, Zap, ClipboardPaste, Share, ShieldCheck, X, Briefcase } from "lucide-react";',
    'import { Copy, Sparkles, Loader2, RefreshCw, DownloadCloud, TrendingUp, ArrowRight, ChevronDown, ChevronUp, Zap, ClipboardPaste, Share, ShieldCheck, X, Briefcase } from "lucide-react";\nimport { useAppStore } from "@/lib/store";'
)

# 2. Replace state definitions
old_state = """  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [originalResumeData, setOriginalResumeData] = useState<ResumeData | null>(null);
  const [jobData, setJobData] = useState<JobDescriptionData | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>("");
  const [fabricationLevel, setFabricationLevel] = useState<number[]>([30]);
  const [showChangelog, setShowChangelog] = useState(false);
  const [aiResponseText, setAiResponseText] = useState<string>("");
  const [promptCopied, setPromptCopied] = useState(false);
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [customModelInput, setCustomModelInput] = useState<string>("");

  // Zone 3 tabs
  const [zone3Tab, setZone3Tab] = useState<"resume" | "cover-letter">("resume");

  // Cover letter state
  const [clTone, setClTone] = useState<CoverLetterTone>("professional");
  const [clLength, setClLength] = useState<CoverLetterLength>("standard");
  const [clFinalText, setClFinalText] = useState<string>("");
  const [clPromptText, setClPromptText] = useState<string>("");

  // Provider settings
  const [provider, setProvider] = useState<"prompt-only" | "ollama" | "openai" | "anthropic" | "google" | "deepseek">("prompt-only");
  const [apiKey, setApiKey] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [isRefreshingModels, setIsRefreshingModels] = useState(false);
  const [isOllamaAvailable, setIsOllamaAvailable] = useState(true); // assume true until proven otherwise
  const [selectedTemplate, setSelectedTemplate] = useState<PdfTemplate>("sidebar");
  const [jobText, setJobText] = useState<string>("");
  const [configuredProviders, setConfiguredProviders] = useState<Record<string, boolean>>({});
  const [showKeyBanner, setShowKeyBanner] = useState(false);
  const [mobileStep, setMobileStep] = useState<1 | 2 | 3>(1);
  const [showAppTracker, setShowAppTracker] = useState(false);"""

new_state = """  const store = useAppStore();
  const { resumeData, originalResumeData, jobData, jobText, provider, apiKey, selectedModel, configuredProviders } = store;
  
  const [generatedPrompt, setGeneratedPrompt] = useState<string>("");
  const [fabricationLevel, setFabricationLevel] = useState<number[]>([30]);
  const [showChangelog, setShowChangelog] = useState(false);
  const [aiResponseText, setAiResponseText] = useState<string>("");
  const [promptCopied, setPromptCopied] = useState(false);

  // Zone 3 tabs
  const [zone3Tab, setZone3Tab] = useState<"resume" | "cover-letter">("resume");

  // Cover letter state
  const [clTone, setClTone] = useState<CoverLetterTone>("professional");
  const [clLength, setClLength] = useState<CoverLetterLength>("standard");
  const [clFinalText, setClFinalText] = useState<string>("");
  const [clPromptText, setClPromptText] = useState<string>("");

  const [selectedTemplate, setSelectedTemplate] = useState<PdfTemplate>("sidebar");
  const [mobileStep, setMobileStep] = useState<1 | 2 | 3>(1);"""

code = code.replace(old_state, new_state)

# 3. Remove useEffect and models logic that is now in Header
provider_logic = re.search(r"const fetchOllamaModels.*?const handleProviderChange.*?\};", code, re.DOTALL).group(0)
code = code.replace(provider_logic, "")

# 4. Remove Header UI and place page header
header_ui = re.search(r"\{/\* ── Dismissible Security Banner.*?</header>", code, re.DOTALL).group(0)

new_header = """      {/* ── Page Header ── */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Resume Optimizer</h1>
           <p className="text-sm text-slate-500">Tailor your resume for the ATS in seconds.</p>
        </div>
        <Button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="hidden lg:flex bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm"
        >
          {isLoading ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <><Zap className="w-3.5 h-3.5 mr-1.5" />{provider === "prompt-only" ? "Generate Prompt" : "Optimize Resume"}</>}
        </Button>
      </div>"""

code = code.replace(header_ui, new_header)

# replace setter calls
code = code.replace('setResumeData(', 'store.setResumeData(')
code = code.replace('setOriginalResumeData(', 'store.setOriginalResumeData(')
code = code.replace('setJobData(', 'store.setJobData(')
code = code.replace('setJobText(', 'store.setJobText(')

code = code.replace('            <ResumeForm onDataChange={store.setResumeData}', '            <ResumeForm onDataChange={store.setResumeData}')

with open("app/optimizer/page.tsx", "w") as f:
    f.write(code)

