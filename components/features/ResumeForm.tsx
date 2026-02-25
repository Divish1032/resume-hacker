"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ResumeData, resumeSchema } from "@/lib/schema";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Trash2, FileText, X, Loader2, Copy, Upload, Award, Globe, BookOpen, Heart, BadgeCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { generateResumePrompt } from "@/lib/prompts";
import { toast } from "sonner";

interface ResumeFormProps {
  onDataChange: (data: ResumeData) => void;
  defaultValues?: Partial<ResumeData>;
  provider?: string;
  model?: string;
  apiKey?: string;
}

export function ResumeForm({ onDataChange, defaultValues, provider, model, apiKey }: ResumeFormProps) {
  const form = useForm<ResumeData>({
    resolver: zodResolver(resumeSchema),
    defaultValues: defaultValues || ({
      personalInfo: {
        fullName: "",
        email: "",
        phone: "",
        linkedin: "",
        website: "",
        location: "",
      },
      workExperience: [],
      education: [],
      projects: [],
      skills: "",
      summary: "",
      certifications: [],
      languages: [],
      awards: [],
      volunteerWork: [],
      publications: [],
    } as ResumeData),
    mode: "onChange",
  });

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const [importMode, setImportMode] = useState<'auto' | 'manual'>('auto');
  const [prompt, setPrompt] = useState("");
  const [jsonInput, setJsonInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (provider === "prompt-only") {
      setImportMode('manual');
    }
  }, [provider]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File type guard — only accept PDFs
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Only PDF files are supported. Please upload a .pdf file.");
      e.target.value = "";
      return;
    }

    // File size guard — 10 MB max
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File is too large. Please upload a PDF smaller than 10 MB.");
      e.target.value = "";
      return;
    }

    setIsExtracting(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/extract-resume-text", {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Server Error Response:", errorText);
        let errorMessage = "Failed to extract text";
        try {
            const errJson = JSON.parse(errorText);
            errorMessage = errJson.error || errorMessage;
        } catch {
            errorMessage = `Server Error: ${res.status} ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      if (data.text) {
        setResumeText(data.text);
        setPrompt(generateResumePrompt(data.text));
        toast.success("Resume text extracted successfully!");
      } else {
        throw new Error("No text found in PDF");
      }
    } catch (err: unknown) {
      console.error(err);
      toast.error((err as Error).message || "Failed to upload resume");
      // Reset input if needed
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAutoImport = async () => {
    if (!resumeText.trim()) {
      toast.error("No resume text to import. Please upload a PDF first.");
      return;
    }
    if (!prompt.trim()) {
      toast.error("Extraction prompt is empty. Please re-upload your resume.");
      return;
    }
    if (provider === "prompt-only") {
      toast.error("Auto-import requires an AI provider. Select one in the top bar, or use Manual mode to paste JSON.");
      return;
    }
    if (!model?.trim()) {
      toast.error("Please select a model from the settings before auto-importing.");
      return;
    }

    setIsGenerating(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        body: JSON.stringify({
          prompt: prompt,
          provider: provider || 'ollama',
          model: model,
          apiKey: apiKey,
        }),
      });
      
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(errText || `Generation failed (${res.status})`);
      }

      const stream = res.body;
      if (!stream) throw new Error("No stream response");

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accum = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        accum += decoder.decode(value, { stream: !doneReading });
      }
      
      // Attempt to find JSON in the response (it might be wrapped in ```json ... ```)
      const jsonMatch = accum.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        try {
          const data = JSON.parse(jsonStr);
          // Populate form
          form.reset(data);
          setIsImportOpen(false);
          toast.success("Resume auto-filled successfully!");
        } catch {
             throw new Error("Failed to parse AI response as JSON");
        }
      } else {
          throw new Error("AI did not return valid JSON");
      }
    } catch (err: unknown) {
      console.error(err);
      toast.error((err as Error).message || "Auto-import failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleManualParse = () => {
    if (!jsonInput.trim()) {
      toast.error("Please paste JSON data before importing.");
      return;
    }
    try {
      // Clean JSON input (remove markdown code blocks if present)
      const cleanJson = jsonInput.replace(/```json/g, "").replace(/```/g, "").trim();
      const raw = JSON.parse(cleanJson);
      // Validate against the resume schema
      const result = resumeSchema.safeParse(raw);
      if (!result.success) {
        const firstError = result.error.errors[0];
        const fieldPath = firstError.path.join(" → ");
        toast.error(
          `Invalid resume JSON: ${fieldPath ? `"${fieldPath}":` : ""} ${firstError.message}`,
          { duration: 6000 }
        );
        return;
      }
      form.reset(result.data);
      setIsImportOpen(false);
      toast.success("Form filled from JSON!");
    } catch {
      toast.error("Invalid JSON format — could not parse. Check for syntax errors like missing quotes or trailing commas.");
    }
  };

  const { register, control, watch, formState: { errors } } = form;

  // Watch all fields
  const values = watch();

  useEffect(() => {
    onDataChange(values as ResumeData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(values), onDataChange]);

  // Update form when defaultValues (from store) change
  useEffect(() => {
    if (defaultValues) {
      form.reset(defaultValues as ResumeData);
    }
  }, [defaultValues]);

  const { fields: workFields, append: appendWork, remove: removeWork } = useFieldArray({
    control,
    name: "workExperience",
  });

  const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({
    control,
    name: "education",
  });

   const { fields: projFields, append: appendProj, remove: removeProj } = useFieldArray({
    control,
    name: "projects",
  });

  const { fields: certFields, append: appendCert, remove: removeCert } = useFieldArray({
    control,
    name: "certifications",
  });

  const { fields: langFields, append: appendLang, remove: removeLang } = useFieldArray({
    control,
    name: "languages",
  });

  const { fields: awardFields, append: appendAward, remove: removeAward } = useFieldArray({
    control,
    name: "awards",
  });

  const { fields: volFields, append: appendVol, remove: removeVol } = useFieldArray({
    control,
    name: "volunteerWork",
  });

  const { fields: pubFields, append: appendPub, remove: removePub } = useFieldArray({
    control,
    name: "publications",
  });

  // Watch for changes to update parent state
  // In a real app, you might use a debounce here
  // For now, we'll just expose the form methods or data via a save button or effect
  // But let's keep it simple: manual save or auto-save on blur?
  // Let's rely on a "Save" or "Generate" button at the parent level, but since we are splitting views,
  // we might want to lift the state up.
  // For this component, let's just render the form.

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => { setIsImportOpen(true); setResumeText(""); setImportMode("auto"); setJsonInput(""); }} className="gap-2">
          <Upload className="w-4 h-4" />
          Import Resume
        </Button>
      </div>
      {/* Personal Info */}
      <Card className="bg-white/50 dark:bg-transparent border-none shadow-none p-0">
        <CardContent className="space-y-4 p-0">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label className="text-xs font-medium text-muted-foreground">Full Name</Label>
              <Input {...register("personalInfo.fullName")} placeholder="John Doe" className="bg-background" />
              {errors.personalInfo?.fullName && <p className="text-red-500 text-xs">{errors.personalInfo.fullName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Email</Label>
              <Input {...register("personalInfo.email")} placeholder="john@example.com" className="bg-background" />
               {errors.personalInfo?.email && <p className="text-red-500 text-xs">{errors.personalInfo.email.message}</p>}
            </div>
             <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Phone</Label>
              <Input {...register("personalInfo.phone")} placeholder="+1 234 567 890" className="bg-background" />
            </div>
             <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">LinkedIn</Label>
              <Input {...register("personalInfo.linkedin")} placeholder="linkedin.com/in/johndoe" className="bg-background" />
            </div>
             <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Website</Label>
              <Input {...register("personalInfo.website")} placeholder="johndoe.com" className="bg-background" />
            </div>
             <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Location</Label>
              <Input {...register("personalInfo.location")} placeholder="New York, NY" className="bg-background" />
            </div>
          </div>
          <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Professional Summary</Label>
              <Textarea {...register("summary")} placeholder="Experienced software engineer..." className="bg-background min-h-[100px]" />
          </div>
        </CardContent>
      </Card>

      {/* Work Experience */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Work Experience</Label>
                <Button variant="ghost" size="sm" onClick={() => appendWork({ id: crypto.randomUUID(), jobTitle: "", company: "", startDate: "", description: "", current: false })} className="h-6 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 dark:text-indigo-400">
                <Plus className="w-3 h-3 mr-1" /> Add
            </Button>
        </div>
        <div className="space-y-4">
          {workFields.map((field, index) => (
             <div key={field.id} className="group relative bg-white dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 dark:border-slate-800 rounded-lg p-4 space-y-3 hover:border-indigo-200 dark:hover:border-indigo-900 transition-colors shadow-sm">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6 text-slate-400 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeWork(index)}>
                        <Trash2 className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Remove experience</TooltipContent>
                </Tooltip>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <Input {...register(`workExperience.${index}.jobTitle`)} placeholder="Job Title" className={`bg-background ${errors.workExperience?.[index]?.jobTitle ? 'border-red-400 focus:border-red-400' : ''}`} />
                        {errors.workExperience?.[index]?.jobTitle && <p className="text-red-500 text-[10px] mt-0.5">{errors.workExperience[index]!.jobTitle!.message}</p>}
                    </div>
                     <div className="space-y-1">
                        <Input {...register(`workExperience.${index}.company`)} placeholder="Company" className={`bg-background ${errors.workExperience?.[index]?.company ? 'border-red-400 focus:border-red-400' : ''}`} />
                        {errors.workExperience?.[index]?.company && <p className="text-red-500 text-[10px] mt-0.5">{errors.workExperience[index]!.company!.message}</p>}
                    </div>
                     <div className="space-y-1">
                        <Input {...register(`workExperience.${index}.startDate`)} placeholder="Start Date" className={`bg-background text-xs text-muted-foreground ${errors.workExperience?.[index]?.startDate ? 'border-red-400' : ''}`} />
                        {errors.workExperience?.[index]?.startDate && <p className="text-red-500 text-[10px] mt-0.5">{errors.workExperience[index]!.startDate!.message}</p>}
                    </div>
                     <div className="space-y-1">
                        <Input {...register(`workExperience.${index}.endDate`)} placeholder="End Date" className="bg-background text-xs text-muted-foreground" />
                    </div>
                </div>
                 <div className="space-y-1">
                    <Textarea className={`min-h-[80px] bg-background ${errors.workExperience?.[index]?.description ? 'border-red-400' : ''}`} {...register(`workExperience.${index}.description`)} placeholder="Responsibilities..." />
                    {errors.workExperience?.[index]?.description && <p className="text-red-500 text-[10px] mt-0.5">{errors.workExperience[index]!.description!.message}</p>}
                </div>
             </div>
          ))}
          {workFields.length === 0 && <p className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded-lg">No work experience added.</p>}
        </div>
      </div>

      {/* Education */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Education</Label>
            <Button variant="ghost" size="sm" onClick={() => appendEdu({ id: crypto.randomUUID(), degree: "", school: "", startDate: "", current: false })} className="h-6 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 dark:text-indigo-400">
            <Plus className="w-3 h-3 mr-1" /> Add
          </Button>
        </div>
        <div className="space-y-4">
          {eduFields.map((field, index) => (
            <div key={field.id} className="group relative bg-white dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 dark:border-slate-800 rounded-lg p-4 space-y-3 hover:border-indigo-200 dark:hover:border-indigo-900 transition-colors shadow-sm">
                 <Tooltip>
                   <TooltipTrigger asChild>
                     <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6 text-slate-400 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeEdu(index)}>
                        <Trash2 className="w-3 h-3" />
                    </Button>
                   </TooltipTrigger>
                   <TooltipContent>Remove education</TooltipContent>
                 </Tooltip>
                 <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                         <Input {...register(`education.${index}.degree`)} placeholder="Degree" className={`bg-background ${errors.education?.[index]?.degree ? 'border-red-400 focus:border-red-400' : ''}`} />
                         {errors.education?.[index]?.degree && <p className="text-red-500 text-[10px] mt-0.5">{errors.education[index]!.degree!.message}</p>}
                    </div>
                     <div className="space-y-1">
                          <Input {...register(`education.${index}.school`)} placeholder="School" className={`bg-background ${errors.education?.[index]?.school ? 'border-red-400 focus:border-red-400' : ''}`} />
                          {errors.education?.[index]?.school && <p className="text-red-500 text-[10px] mt-0.5">{errors.education[index]!.school!.message}</p>}
                    </div>
                     <div className="space-y-1">
                          <Input {...register(`education.${index}.startDate`)} placeholder="Start Year" className={`bg-background text-xs text-muted-foreground ${errors.education?.[index]?.startDate ? 'border-red-400' : ''}`} />
                          {errors.education?.[index]?.startDate && <p className="text-red-500 text-[10px] mt-0.5">{errors.education[index]!.startDate!.message}</p>}
                    </div>
                     <div className="space-y-1">
                          <Input {...register(`education.${index}.endDate`)} placeholder="End Year" className="bg-background text-xs text-muted-foreground" />
                    </div>
                 </div>
            </div>
          ))}
        </div>
      </div>

      {/* Projects */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Projects</Label>
            <Button variant="ghost" size="sm" onClick={() => appendProj({ id: crypto.randomUUID(), name: "", description: "", link: "" })} className="h-6 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 dark:text-indigo-400">
            <Plus className="w-3 h-3 mr-1" /> Add
          </Button>
        </div>
        <div className="space-y-4">
          {projFields.map((field, index) => (
            <div key={field.id} className="group relative bg-white dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 dark:border-slate-800 rounded-lg p-4 space-y-3 hover:border-indigo-200 dark:hover:border-indigo-900 transition-colors shadow-sm">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6 text-slate-400 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeProj(index)}>
                        <Trash2 className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Remove project</TooltipContent>
                </Tooltip>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <Input {...register(`projects.${index}.name`)} placeholder="Project Name" className={`bg-background ${errors.projects?.[index]?.name ? 'border-red-400 focus:border-red-400' : ''}`} />
                        {errors.projects?.[index]?.name && <p className="text-red-500 text-[10px] mt-0.5">{errors.projects[index]!.name!.message}</p>}
                    </div>
                     <div className="space-y-1">
                        <Input {...register(`projects.${index}.link`)} placeholder="Link (github...)" className={`bg-background text-xs text-muted-foreground ${errors.projects?.[index]?.link ? 'border-red-400' : ''}`} />
                        {errors.projects?.[index]?.link && <p className="text-red-500 text-[10px] mt-0.5">{errors.projects[index]!.link!.message}</p>}
                    </div>
                </div>
                 <div className="space-y-1">
                    <Textarea className={`min-h-[60px] bg-background ${errors.projects?.[index]?.description ? 'border-red-400' : ''}`} {...register(`projects.${index}.description`)} placeholder="Description..." />
                    {errors.projects?.[index]?.description && <p className="text-red-500 text-[10px] mt-0.5">{errors.projects[index]!.description!.message}</p>}
                </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">Skills</Label>
        <Textarea {...register("skills")} placeholder="React, Node.js, TypeScript, Python..." className="bg-background" />
        <p className="text-[10px] text-muted-foreground">Comma separated.</p>
      </div>

      {/* ── Certifications ──────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold flex items-center gap-1.5"><BadgeCheck className="w-3.5 h-3.5 text-indigo-500" />Certifications</Label>
          <Button variant="ghost" size="sm" onClick={() => appendCert({ id: crypto.randomUUID(), name: "", issuer: "", year: "", expiry: "", url: "" })} className="h-6 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 dark:text-indigo-400">
            <Plus className="w-3 h-3 mr-1" /> Add
          </Button>
        </div>
        <div className="space-y-3">
          {certFields.map((field, index) => (
            <div key={field.id} className="group relative bg-white dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-2 hover:border-indigo-200 transition-colors shadow-sm">
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6 text-slate-400 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeCert(index)}>
                <Trash2 className="w-3 h-3" />
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <div><Input {...register(`certifications.${index}.name`)} placeholder="e.g. AWS Solutions Architect" className="bg-background" /></div>
                <div><Input {...register(`certifications.${index}.issuer`)} placeholder="Issuer (e.g. Amazon)" className="bg-background" /></div>
                <div><Input {...register(`certifications.${index}.year`)} placeholder="Year obtained" className="bg-background text-xs text-muted-foreground" /></div>
                <div><Input {...register(`certifications.${index}.expiry`)} placeholder="Expiry / No expiry" className="bg-background text-xs text-muted-foreground" /></div>
              </div>
            </div>
          ))}
          {certFields.length === 0 && <p className="text-xs text-muted-foreground text-center py-3 border border-dashed rounded-lg">No certifications added.</p>}
        </div>
      </div>

      {/* ── Languages ───────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-emerald-500" />Languages</Label>
          <Button variant="ghost" size="sm" onClick={() => appendLang({ id: crypto.randomUUID(), language: "", proficiency: "fluent" })} className="h-6 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 dark:text-indigo-400">
            <Plus className="w-3 h-3 mr-1" /> Add
          </Button>
        </div>
        <div className="space-y-2">
          {langFields.map((field, index) => (
            <div key={field.id} className="group relative flex items-center gap-3 bg-white dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-lg p-3 hover:border-emerald-200 transition-colors shadow-sm">
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6 text-slate-400 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeLang(index)}>
                <Trash2 className="w-3 h-3" />
              </Button>
              <div className="flex-1"><Input {...register(`languages.${index}.language`)} placeholder="Language (e.g. Spanish)" className="bg-background" /></div>
              <select {...register(`languages.${index}.proficiency`)} className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-400 shrink-0">
                <option value="native">Native</option>
                <option value="fluent">Fluent</option>
                <option value="intermediate">Intermediate</option>
                <option value="basic">Basic</option>
              </select>
            </div>
          ))}
          {langFields.length === 0 && <p className="text-xs text-muted-foreground text-center py-3 border border-dashed rounded-lg">No languages added.</p>}
        </div>
      </div>

      {/* ── Awards & Honors ─────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-amber-500" />Awards &amp; Honors</Label>
          <Button variant="ghost" size="sm" onClick={() => appendAward({ id: crypto.randomUUID(), title: "", issuer: "", year: "", description: "" })} className="h-6 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 dark:text-indigo-400">
            <Plus className="w-3 h-3 mr-1" /> Add
          </Button>
        </div>
        <div className="space-y-3">
          {awardFields.map((field, index) => (
            <div key={field.id} className="group relative bg-white dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-2 hover:border-amber-200 transition-colors shadow-sm">
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6 text-slate-400 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeAward(index)}>
                <Trash2 className="w-3 h-3" />
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <div><Input {...register(`awards.${index}.title`)} placeholder="Award title" className="bg-background" /></div>
                <div><Input {...register(`awards.${index}.issuer`)} placeholder="Issuing organization" className="bg-background" /></div>
                <div className="col-span-2"><Input {...register(`awards.${index}.year`)} placeholder="Year" className="bg-background text-xs text-muted-foreground" /></div>
              </div>
              <Textarea className="min-h-[48px] bg-background" {...register(`awards.${index}.description`)} placeholder="Brief description (optional)" />
            </div>
          ))}
          {awardFields.length === 0 && <p className="text-xs text-muted-foreground text-center py-3 border border-dashed rounded-lg">No awards added.</p>}
        </div>
      </div>

      {/* ── Volunteer Work ──────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-rose-500" />Volunteer Work</Label>
          <Button variant="ghost" size="sm" onClick={() => appendVol({ id: crypto.randomUUID(), organization: "", role: "", startDate: "", endDate: "", description: "" })} className="h-6 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 dark:text-indigo-400">
            <Plus className="w-3 h-3 mr-1" /> Add
          </Button>
        </div>
        <div className="space-y-3">
          {volFields.map((field, index) => (
            <div key={field.id} className="group relative bg-white dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-2 hover:border-rose-200 transition-colors shadow-sm">
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6 text-slate-400 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeVol(index)}>
                <Trash2 className="w-3 h-3" />
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <div><Input {...register(`volunteerWork.${index}.organization`)} placeholder="Organization" className="bg-background" /></div>
                <div><Input {...register(`volunteerWork.${index}.role`)} placeholder="Role (e.g. Mentor)" className="bg-background" /></div>
                <div><Input {...register(`volunteerWork.${index}.startDate`)} placeholder="Start date" className="bg-background text-xs text-muted-foreground" /></div>
                <div><Input {...register(`volunteerWork.${index}.endDate`)} placeholder="End date" className="bg-background text-xs text-muted-foreground" /></div>
              </div>
              <Textarea className="min-h-[48px] bg-background" {...register(`volunteerWork.${index}.description`)} placeholder="Brief description (optional)" />
            </div>
          ))}
          {volFields.length === 0 && <p className="text-xs text-muted-foreground text-center py-3 border border-dashed rounded-lg">No volunteer work added.</p>}
        </div>
      </div>

      {/* ── Publications & Research ─────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-violet-500" />Publications &amp; Research</Label>
          <Button variant="ghost" size="sm" onClick={() => appendPub({ id: crypto.randomUUID(), title: "", publisher: "", year: "", url: "" })} className="h-6 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 dark:text-indigo-400">
            <Plus className="w-3 h-3 mr-1" /> Add
          </Button>
        </div>
        <div className="space-y-3">
          {pubFields.map((field, index) => (
            <div key={field.id} className="group relative bg-white dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-2 hover:border-violet-200 transition-colors shadow-sm">
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6 text-slate-400 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removePub(index)}>
                <Trash2 className="w-3 h-3" />
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Input {...register(`publications.${index}.title`)} placeholder="Title of paper / article / book" className="bg-background" /></div>
                <div><Input {...register(`publications.${index}.publisher`)} placeholder="Journal / Conference / Platform" className="bg-background" /></div>
                <div><Input {...register(`publications.${index}.year`)} placeholder="Year" className="bg-background text-xs text-muted-foreground" /></div>
                <div className="col-span-2"><Input {...register(`publications.${index}.url`)} placeholder="URL (optional)" className="bg-background text-xs text-muted-foreground" /></div>
              </div>
            </div>
          ))}
          {pubFields.length === 0 && <p className="text-xs text-muted-foreground text-center py-3 border border-dashed rounded-lg">No publications added.</p>}
        </div>
      </div>

      {/* Import Modal */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold text-lg">Import from PDF</h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => setIsImportOpen(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Close</TooltipContent>
              </Tooltip>
            </div>
            
            <div className="p-6 space-y-6">
              {!resumeText ? (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg p-8 flex flex-col items-center justify-center text-center space-y-2 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <FileText className="w-8 h-8 text-slate-400" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Upload your resume PDF</p>
                      <p className="text-xs text-muted-foreground">We&apos;ll extract the details for you.</p>
                    </div>
                    <Input 
                      type="file" 
                      className="hidden" 
                      id="resume-upload" 
                      accept=".pdf"
                      onChange={handleFileUpload}
                    />
                    <Button variant="outline" size="sm" onClick={() => document.getElementById('resume-upload')?.click()} disabled={isExtracting}>
                      {isExtracting ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
                      {isExtracting ? "Extracting..." : "Select PDF"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {provider !== "prompt-only" && (
                    <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
                      <button 
                        className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-all ${importMode === 'auto' ? 'bg-white dark:bg-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'}`}
                        onClick={() => setImportMode('auto')}
                      >
                        Auto-Fill (AI)
                      </button>
                      <button 
                        className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-all ${importMode === 'manual' ? 'bg-white dark:bg-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'}`}
                        onClick={() => setImportMode('manual')}
                      >
                        Manual (Free)
                      </button>
                    </div>
                  )}

                  {importMode === 'auto' && provider !== "prompt-only" ? (
                    <div className="space-y-4 py-4">
                      <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                        <p>
                          {provider === "ollama"
                            ? "We'll use your local Ollama model to strictly parse the resume into structured data."
                            : provider === "openai"
                            ? "We'll use OpenAI to strictly parse the resume into structured data."
                            : provider === "anthropic"
                            ? "We'll use Anthropic Claude to strictly parse the resume into structured data."
                            : provider === "google"
                            ? "We'll use Google Gemini to strictly parse the resume into structured data."
                            : provider === "deepseek"
                            ? "We'll use DeepSeek to strictly parse the resume into structured data."
                            : "We'll use AI to strictly parse the resume into structured data."}
                        </p>
                      </div>
                      <Button className="w-full" onClick={handleAutoImport} disabled={isGenerating}>
                        {isGenerating ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
                        {isGenerating ? "Analyzing Resume..." : "Auto-Fill Form"}
                      </Button>
                    </div>
                  ) : (
                       <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">1. Copy this prompt (includes extracted text)</Label>
                          <div className="relative">
                            <Textarea 
                              value={prompt} 
                              readOnly 
                              className="h-24 text-xs font-mono resize-none pr-10 bg-slate-50 dark:bg-slate-900" 
                            />
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="absolute top-2 right-2 h-6 w-6"
                                  onClick={() => {
                                    navigator.clipboard.writeText(prompt);
                                    toast.success("Prompt copied to clipboard!");
                                  }}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Copy Prompt</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800 dark:border-slate-800 space-y-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground italic">AI Tool Suggestions</p>
                          <div className="flex flex-wrap gap-2">
                            <a href="https://gemini.google.com" target="_blank" rel="noreferrer" className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded hover:underline">Gemini</a>
                            <a href="https://chat.openai.com" target="_blank" rel="noreferrer" className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded hover:underline">ChatGPT</a>
                            <a href="https://claude.ai" target="_blank" rel="noreferrer" className="text-[10px] bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded hover:underline">Claude</a>
                          </div>
                          <p className="text-[10px] text-muted-foreground">Paste the prompt into any AI tool above, then copy the <b>JSON code block</b> it generates.</p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">2. Paste AI response (JSON block) here</Label>
                          <Textarea 
                            value={jsonInput} 
                            onChange={(_e) => setJsonInput(_e.target.value)} 
                            placeholder='{ "personalInfo": { ... } }' 
                            className="h-24 text-xs font-mono resize-none bg-slate-50 dark:bg-slate-900" 
                          />
                        </div>

                        <Button className="w-full" onClick={handleManualParse} disabled={!jsonInput}>
                          Fill Form from JSON
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
