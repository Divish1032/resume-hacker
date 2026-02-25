import { ResumeData, JobDescriptionData } from "./schema";

const RESUMES_STORAGE_KEY = "rh_saved_resumes";
const APPLICATIONS_STORAGE_KEY = "rh_job_applications";
const SAVED_APPS_STORAGE_KEY = "rh_saved_applications";

// ─────────────────────────────────────────────────────────────────────────────
// Legacy: SavedResume (kept for backwards compat, not primary storage anymore)
// ─────────────────────────────────────────────────────────────────────────────

export interface SavedResume {
  id: string;
  name: string;
  updatedAt: number;
  data: ResumeData;
  originalData?: ResumeData | null;
  jobData?: JobDescriptionData | null;
  jobText?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Job Application Tracker
// ─────────────────────────────────────────────────────────────────────────────

export type ApplicationStatus =
  | "Bookmarked"
  | "Applied"
  | "Interviewing"
  | "Offer"
  | "Rejected";

export interface JobApplication {
  id: string;
  company: string;
  title: string;
  status: ApplicationStatus;
  date: number;
  resumeId?: string;
  savedApplicationId?: string; // links to SavedApplication bundle
  url?: string;
  notes?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// New: SavedApplication — application bundle with versioned resume outputs
// ─────────────────────────────────────────────────────────────────────────────

/** One AI-optimized resume output. Saved every time the user regenerates. */
export interface OptimizedResumeVersion {
  id: string;
  label: string;        // e.g. "v1", "v2" or user-defined
  createdAt: number;
  resumeData: ResumeData;
  atsScore?: number;    // optional cached ATS total
  fabricationLevel?: number;
}

/** Full application bundle: original resume + JD + all optimized versions */
export interface SavedApplication {
  id: string;
  name: string;          // e.g. "Stripe – Senior Engineer"
  createdAt: number;
  updatedAt: number;
  originalResumeData: ResumeData;
  jobText: string;
  jobData: JobDescriptionData;
  versions: OptimizedResumeVersion[];
  activeVersionId: string | null;
  jobApplicationId?: string; // auto-created tracker task id
}

// ─────────────────────────────────────────────────────────────────────────────
// CRUD: Resumes (legacy)
// ─────────────────────────────────────────────────────────────────────────────

export function getSavedResumes(): SavedResume[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RESUMES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to parse saved resumes", e);
    return [];
  }
}

export function saveResume(resume: SavedResume): void {
  if (typeof window === "undefined") return;
  const resumes = getSavedResumes();
  const existingIndex = resumes.findIndex((r) => r.id === resume.id);

  resume.updatedAt = Date.now();
  if (existingIndex >= 0) {
    resumes[existingIndex] = resume;
  } else {
    resumes.push(resume);
  }

  localStorage.setItem(RESUMES_STORAGE_KEY, JSON.stringify(resumes));
}

export function deleteResume(id: string): void {
  if (typeof window === "undefined") return;
  let resumes = getSavedResumes();
  resumes = resumes.filter((r) => r.id !== id);
  localStorage.setItem(RESUMES_STORAGE_KEY, JSON.stringify(resumes));
}

export function getResumeById(id: string): SavedResume | undefined {
  const resumes = getSavedResumes();
  return resumes.find((r) => r.id === id);
}

// ─────────────────────────────────────────────────────────────────────────────
// CRUD: Job Applications (tracker)
// ─────────────────────────────────────────────────────────────────────────────

export function getJobApplications(): JobApplication[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(APPLICATIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to parse job applications", e);
    return [];
  }
}

export function saveJobApplication(app: JobApplication): void {
  if (typeof window === "undefined") return;
  const apps = getJobApplications();
  const existingIndex = apps.findIndex((a) => a.id === app.id);

  if (existingIndex >= 0) {
    apps[existingIndex] = app;
  } else {
    apps.push(app);
  }

  localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(apps));
}

export function deleteJobApplication(id: string): void {
  if (typeof window === "undefined") return;
  let apps = getJobApplications();
  apps = apps.filter((a) => a.id !== id);
  localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(apps));
}

// ─────────────────────────────────────────────────────────────────────────────
// CRUD: SavedApplications (new primary bundle storage)
// ─────────────────────────────────────────────────────────────────────────────

export function getSavedApplications(): SavedApplication[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVED_APPS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to parse saved applications", e);
    return [];
  }
}

export function saveApplication(app: SavedApplication): void {
  if (typeof window === "undefined") return;
  const apps = getSavedApplications();
  const existingIndex = apps.findIndex((a) => a.id === app.id);

  app.updatedAt = Date.now();
  if (existingIndex >= 0) {
    apps[existingIndex] = app;
  } else {
    apps.push(app);
  }

  localStorage.setItem(SAVED_APPS_STORAGE_KEY, JSON.stringify(apps));
}

export function deleteApplication(id: string): void {
  if (typeof window === "undefined") return;
  let apps = getSavedApplications();
  apps = apps.filter((a) => a.id !== id);
  localStorage.setItem(SAVED_APPS_STORAGE_KEY, JSON.stringify(apps));
}

export function getApplicationById(id: string): SavedApplication | undefined {
  const apps = getSavedApplications();
  return apps.find((a) => a.id === id);
}
