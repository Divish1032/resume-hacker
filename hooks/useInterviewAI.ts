import { useState } from "react";
import { useAppStore } from "@/lib/store";

export function useInterviewAI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { provider, selectedModel, apiKey } = useAppStore();

  const generateWithAI = async (promptText: string) => {
    setIsLoading(true);
    setError(null);
    let fullText = "";

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptText,
          provider: provider,
          model: selectedModel,
          apiKey: apiKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
      }

      // We expect JSON output from the prompts, so we attempt to parse it
      // The AI might sometimes wrap it in ```json codeblocks, so we strip that out.
      const cleanedText = fullText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      
      try {
        const parsedJson = JSON.parse(cleanedText);
        return parsedJson;
      } catch (parseError) {
        console.error("Failed to parse AI response as JSON:", cleanedText);
        throw new Error("AI returned an invalid format. Please try again.");
      }

    } catch (err: any) {
      console.error("AI Generation Error:", err);
      setError(err.message || "An unexpected error occurred.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { generateWithAI, isLoading, error };
}
