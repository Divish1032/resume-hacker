import { ResumeData } from "@/lib/schema";
import { JobDescriptionData } from "@/lib/schema";

export interface CachedEntry<T> {
  key: string;
  items: T[];
  savedAt: number; // unix ms
}

const MAX_ENTRIES = 10;

/** Deterministic, non-cryptographic hash (djb2) over a string */
function djb2(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

/**
 * Stable cache key scoped to the (resume identity, job description) pair.
 * Changing either the person's name/experience/skills or the job text
 * produces a different key → cache miss → user must regenerate.
 */
export function makeGenCacheKey(
  resumeData: ResumeData | null,
  jobData: JobDescriptionData | null
): string {
  if (!resumeData) return "no_resume";
  const resumeSig = [
    resumeData.personalInfo?.fullName ?? "",
    (resumeData.workExperience ?? []).map((e) => `${e.company}|${e.jobTitle}`).join(","),
    resumeData.skills ?? "",
  ].join("::");
  const jobSig = (jobData?.text ?? "").slice(0, 300);
  return djb2(resumeSig + "||" + jobSig);
}

function storageKey(type: string, cacheKey: string): string {
  return `rh_gen_cache_${type}_${cacheKey}`;
}

function indexKey(type: string): string {
  return `rh_gen_cache_index_${type}`;
}

/** Load all keys for this type (for LRU eviction) */
function getIndex(type: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(indexKey(type)) ?? "[]");
  } catch {
    return [];
  }
}

function saveIndex(type: string, keys: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(indexKey(type), JSON.stringify(keys));
}

/** Evict oldest entry if over limit */
function evictIfNeeded(type: string, currentKey: string) {
  const keys = getIndex(type).filter((k) => k !== currentKey);
  keys.push(currentKey); // move to end (most-recently-used)
  if (keys.length > MAX_ENTRIES) {
    const evicted = keys.shift()!;
    localStorage.removeItem(storageKey(type, evicted));
  }
  saveIndex(type, keys);
}

export function loadCache<T>(type: string, key: string): CachedEntry<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(type, key));
    if (!raw) return null;
    return JSON.parse(raw) as CachedEntry<T>;
  } catch {
    return null;
  }
}

export function saveCache<T>(type: string, key: string, items: T[]): void {
  if (typeof window === "undefined") return;
  const entry: CachedEntry<T> = { key, items, savedAt: Date.now() };
  try {
    localStorage.setItem(storageKey(type, key), JSON.stringify(entry));
    evictIfNeeded(type, key);
  } catch (e) {
    // localStorage quota exceeded — silently skip
    console.warn("gen-cache: write failed", e);
  }
}

export function appendCache<T>(type: string, key: string, newItems: T[]): T[] {
  const existing = loadCache<T>(type, key);
  const merged = [...(existing?.items ?? []), ...newItems];
  saveCache(type, key, merged);
  return merged;
}

export function clearCache(type: string, key: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(storageKey(type, key));
  const keys = getIndex(type).filter((k) => k !== key);
  saveIndex(type, keys);
}

/** Human-readable relative time: "just now", "3h ago", "2 days ago" */
export function relativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
