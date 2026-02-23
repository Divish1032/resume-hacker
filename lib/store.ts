import { create } from "zustand";
import { ResumeData, JobDescriptionData } from "./schema";

export type ProviderType = "prompt-only" | "ollama" | "openai" | "anthropic" | "google" | "deepseek";

export interface AppState {
  // Provider Settings
  provider: ProviderType;
  apiKey: string;
  selectedModel: string;
  ollamaModels: string[];
  isOllamaAvailable: boolean;
  configuredProviders: Record<string, boolean>;
  isCustomModel: boolean;
  customModelInput: string;
  
  // Active Content
  resumeData: ResumeData | null;
  originalResumeData: ResumeData | null;
  activeResumeId: string | null;
  jobData: JobDescriptionData | null;
  jobText: string;

  // Actions
  setProvider: (provider: ProviderType) => void;
  setApiKey: (key: string) => void;
  setSelectedModel: (model: string) => void;
  setOllamaModels: (models: string[]) => void;
  setIsOllamaAvailable: (isAvailable: boolean) => void;
  setConfiguredProviders: (providers: Record<string, boolean>) => void;
  setIsCustomModel: (isCustom: boolean) => void;
  setCustomModelInput: (input: string) => void;
  
  setResumeData: (data: ResumeData | null) => void;
  setOriginalResumeData: (data: ResumeData | null) => void;
  setActiveResumeId: (id: string | null) => void;
  setJobData: (data: JobDescriptionData | null) => void;
  setJobText: (text: string) => void;

  loadResume: (data: ResumeData | null, id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  provider: "prompt-only",
  apiKey: "",
  selectedModel: "",
  ollamaModels: [],
  isOllamaAvailable: true,
  configuredProviders: {},
  isCustomModel: false,
  customModelInput: "",

  resumeData: null,
  originalResumeData: null,
  activeResumeId: null,
  jobData: null,
  jobText: "",

  setProvider: (provider) => set({ provider }),
  setApiKey: (apiKey) => set({ apiKey }),
  setSelectedModel: (selectedModel) => set({ selectedModel }),
  setOllamaModels: (ollamaModels) => set({ ollamaModels }),
  setIsOllamaAvailable: (isOllamaAvailable) => set({ isOllamaAvailable }),
  setConfiguredProviders: (configuredProviders) => set({ configuredProviders }),
  setIsCustomModel: (isCustomModel) => set({ isCustomModel }),
  setCustomModelInput: (customModelInput) => set({ customModelInput }),

  setResumeData: (resumeData) => set({ resumeData }),
  setOriginalResumeData: (originalResumeData) => set({ originalResumeData }),
  setActiveResumeId: (activeResumeId) => set({ activeResumeId }),
  setJobData: (jobData) => set({ jobData }),
  setJobText: (jobText) => set({ jobText }),

  loadResume: (data, id) => set({
    resumeData: data,
    originalResumeData: data, // deep clone would be better, but assuming `storage` gives distinct objects
    activeResumeId: id,
  }),
}));
