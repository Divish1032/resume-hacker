"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle2, XCircle, Cpu, HardDrive, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface OllamaInstallModalProps {
  modelName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInstalled: (modelName: string) => void;
}

interface ModelInfo {
  details?: {
    family?: string;
    parameter_size?: string;
    quantization_level?: string;
  };
  size?: number; // bytes, present when the model is already installed
}

interface PullProgress {
  status: string;
  digest?: string;
  total?: number;
  completed?: number;
}

type InstallState = "idle" | "fetching-info" | "ready" | "downloading" | "done" | "error";

function fmtBytes(bytes: number) {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(0)} MB`;
  return `${(bytes / 1e3).toFixed(0)} KB`;
}

export function OllamaInstallModal({ modelName, open, onOpenChange, onInstalled }: OllamaInstallModalProps) {
  const [state, setState] = useState<InstallState>("idle");
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [infoError, setInfoError] = useState<string | null>(null);

  // Per-layer download progress
  const [layers, setLayers] = useState<Map<string, { total: number; completed: number }>>(new Map());
  const [currentStatus, setCurrentStatus] = useState("");
  const [overallTotal, setOverallTotal] = useState(0);
  const [overallCompleted, setOverallCompleted] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  // Fetch model info from Ollama registry / local cache
  const fetchInfo = useCallback(async () => {
    if (!modelName) return;
    setState("fetching-info");
    setInfoError(null);
    setModelInfo(null);
    try {
      const res = await fetch(`/api/ollama/show?name=${encodeURIComponent(modelName)}`);
      if (!res.ok) {
        // Model might not be cached yet — that's fine, we just show the name
        setInfoError(null);
      } else {
        const data: ModelInfo = await res.json();
        setModelInfo(data);
      }
    } catch {
      // Ignore — show minimal UI
    } finally {
      setState("ready");
    }
  }, [modelName]);

  useEffect(() => {
    if (open && modelName) {
      // Reset all state
      setState("idle");
      setLayers(new Map());
      setCurrentStatus("");
      setOverallTotal(0);
      setOverallCompleted(0);
      setErrorMessage(null);
      fetchInfo();
    }
  }, [open, modelName, fetchInfo]);

  const startDownload = async () => {
    setState("downloading");
    setLayers(new Map());
    setOverallTotal(0);
    setOverallCompleted(0);
    setCurrentStatus("Initializing...");
    setErrorMessage(null);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/ollama/pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: modelName }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`Server returned ${res.status}`);
      }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.replace(/^data: /, "").trim();
          if (!trimmed) continue;
          try {
            const ev: PullProgress & { error?: string } = JSON.parse(trimmed);

            if (ev.error) {
              setErrorMessage(ev.error);
              setState("error");
              return;
            }

            if (ev.status === "success") {
              setState("done");
              toast.success(`${modelName} installed successfully!`);
              onInstalled(modelName);
              return;
            }

            setCurrentStatus(ev.status);

            if (ev.digest && ev.total) {
              setLayers((prev) => {
                const next = new Map(prev);
                next.set(ev.digest!, { total: ev.total!, completed: ev.completed ?? 0 });
                // Compute totals in the same pass — no double-update
                let tot = 0;
                let comp = 0;
                next.forEach((l) => { tot += l.total; comp += l.completed; });
                setOverallTotal(tot);
                setOverallCompleted(comp);
                return next;
              });
            }
          } catch {
            // Skip malformed events
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        setState("ready");
        setCurrentStatus("Cancelled");
      } else {
        setErrorMessage(String(err));
        setState("error");
      }
    }
  };

  const cancelDownload = () => {
    abortRef.current?.abort();
  };

  const percent = overallTotal > 0 ? Math.min(100, Math.round((overallCompleted / overallTotal) * 100)) : 0;

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (!v && state === "downloading") cancelDownload();
      onOpenChange(v);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-slate-900 dark:text-white">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
              <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            Install Ollama Model
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {/* Model name + info card */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono font-bold text-slate-900 dark:text-white">{modelName}</p>
                {modelInfo?.details?.family && (
                  <p className="text-xs text-slate-500 mt-0.5">{modelInfo.details.family}</p>
                )}
              </div>
              {state === "fetching-info" && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
            </div>

            {/* Info pills */}
            <div className="flex flex-wrap gap-2">
              {modelInfo?.details?.parameter_size && (
                <span className="flex items-center gap-1 text-[11px] font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                  <Cpu className="w-3 h-3" /> {modelInfo.details.parameter_size}
                </span>
              )}
              {modelInfo?.details?.quantization_level && (
                <span className="text-[11px] font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
                  {modelInfo.details.quantization_level}
                </span>
              )}
              {modelInfo?.size && (
                <span className="flex items-center gap-1 text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">
                  <HardDrive className="w-3 h-3" /> {fmtBytes(modelInfo.size)}
                </span>
              )}
              {!modelInfo && state === "ready" && (
                <span className="text-[11px] text-slate-400 italic">Model info unavailable — will pull from Ollama library</span>
              )}
            </div>

            {infoError && (
              <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0" /> {infoError}
              </p>
            )}
          </div>

          {/* Progress section — shown during/after download */}
          {(state === "downloading" || state === "done" || state === "error") && (
            <div className="space-y-3">
              {/* Overall bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span className="truncate mr-2">{currentStatus}</span>
                  <span className="shrink-0 font-mono">
                    {overallTotal > 0
                      ? `${fmtBytes(overallCompleted)} / ${fmtBytes(overallTotal)} (${percent}%)`
                      : state === "done" ? "Complete" : "—"}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      state === "done" ? "bg-emerald-500" :
                      state === "error" ? "bg-red-500" :
                      "bg-indigo-500"
                    }`}
                    style={{ width: state === "done" ? "100%" : `${percent}%` }}
                  />
                </div>
              </div>

              {/* Per-layer breakdown */}
              {layers.size > 1 && state === "downloading" && (
                <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                  {Array.from(layers.entries()).map(([digest, layer]) => {
                    const lp = Math.min(100, Math.round((layer.completed / layer.total) * 100));
                    return (
                      <div key={digest} className="flex items-center gap-2">
                        <span className="font-mono text-[9px] text-slate-400 w-16 shrink-0 truncate">{digest.slice(7, 19)}</span>
                        <div className="flex-1 bg-slate-200 dark:bg-slate-800 rounded-full h-1">
                          <div
                            className="h-full bg-indigo-400 rounded-full transition-all duration-200"
                            style={{ width: `${lp}%` }}
                          />
                        </div>
                        <span className="font-mono text-[9px] text-slate-400 w-8 text-right">{lp}%</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {state === "error" && errorMessage && (
                <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2.5">
                  <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 dark:text-red-400">{errorMessage}</p>
                </div>
              )}

              {state === "done" && (
                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/40 rounded-lg px-3 py-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                    {modelName} is ready to use!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            {state === "idle" || state === "fetching-info" || state === "ready" ? (
              <>
                <Button
                  onClick={startDownload}
                  disabled={state === "fetching-info"}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download & Install
                </Button>
                <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                  Cancel
                </Button>
              </>
            ) : state === "downloading" ? (
              <Button
                onClick={cancelDownload}
                variant="destructive"
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel Download
              </Button>
            ) : state === "done" ? (
              <Button onClick={() => onOpenChange(false)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Done
              </Button>
            ) : (
              <div className="flex gap-2 w-full">
                <Button onClick={startDownload} className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Retry
                </Button>
                <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                  Close
                </Button>
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 text-center">
            Requires Ollama running locally at <span className="font-mono">localhost:11434</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
