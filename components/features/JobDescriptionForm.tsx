"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { JobDescriptionData, jobDescriptionSchema } from "@/lib/schema";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";
import { ClipboardPaste, X } from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface JobDescriptionFormProps {
  onDataChange: (data: JobDescriptionData) => void;
  defaultValues?: Partial<JobDescriptionData>;
}

export function JobDescriptionForm({ onDataChange, defaultValues }: JobDescriptionFormProps) {
  const form = useForm<JobDescriptionData>({
    resolver: zodResolver(jobDescriptionSchema),
    defaultValues: defaultValues || { text: "" },
    mode: "onChange",
  });

  const { register, watch, setValue, formState: { errors } } = form;
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { ref: registerRef, ...registerRest } = register("text");

  const values = watch();
  const currentText = values.text || "";

  useEffect(() => {
    onDataChange(values as JobDescriptionData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(values), onDataChange]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        setValue("text", text, { shouldValidate: true, shouldDirty: true });
        toast.success("Job description pasted!");
      } else {
        toast.warning("Clipboard is empty.");
      }
    } catch {
      // Clipboard permission denied on some browsers — focus so user can Ctrl+V manually
      textareaRef.current?.focus();
      toast.info("Clipboard access denied — press Ctrl+V / ⌘V to paste manually.");
    }
  };

  const handleClear = () => {
    setValue("text", "", { shouldValidate: true });
  };

  return (
    <Card className="h-full bg-transparent border-none shadow-none p-0">
      <CardContent className="space-y-2 h-full p-0 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePaste}
                className="h-7 px-3 text-xs font-medium border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition-colors"
              >
                <ClipboardPaste className="w-3.5 h-3.5 mr-1.5" />
                Paste JD
              </Button>
            </TooltipTrigger>
            <TooltipContent>Paste job description from clipboard</TooltipContent>
          </Tooltip>

          {currentText && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="h-7 px-2 text-xs text-slate-400 hover:text-red-500"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Clear
                </Button>
              </TooltipTrigger>
              <TooltipContent>Clear job description</TooltipContent>
            </Tooltip>
          )}

          {currentText && (
            <span className="ml-auto text-[10px] text-slate-400 shrink-0">
              {currentText.length.toLocaleString()} chars
            </span>
          )}
        </div>

        {/* Textarea */}
        <div className="flex flex-col flex-1">
          <Textarea
            {...registerRest}
            ref={(el) => {
              registerRef(el);
              textareaRef.current = el;
            }}
            className="flex-1 min-h-[320px] border-slate-200 dark:border-slate-800 bg-background focus:ring-indigo-500/20 focus:border-indigo-400 dark:focus:border-indigo-500 transition-all font-mono text-sm leading-relaxed resize-none"
            placeholder="Paste the full job description here... or tap the Paste button above ↑"
          />
          {errors.text && <p className="text-red-500 text-xs mt-1">{errors.text.message}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
