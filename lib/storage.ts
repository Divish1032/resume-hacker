import { ResumeData, JobDescriptionData } from "./schema";

const RESUMES_STORAGE_KEY = "rh_saved_resumes";
const APPLICATIONS_STORAGE_KEY = "rh_job_applications";

export interface SavedResume {
  id: string;
  name: string;
  updatedAt: number;
  data: ResumeData;
  originalData?: ResumeData | null;
  jobData?: JobDescriptionData | null;
  jobText?: string;
}

export type ApplicationStatus = "Bookmarked" | "Applied" | "Interviewing" | "Offer" | "Rejected";

export interface JobApplication {
  id: string;
  company: string;
  title: string;
  status: ApplicationStatus;
  date: number;
  resumeId?: string;
  url?: string;
  notes?: string;
}

// --- Resumes ---

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

// --- Job Applications ---

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
