import { z } from "zod";

export const personalInfoSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  linkedin: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  website: z.string().url("Invalid Website URL").optional().or(z.literal("")),
  location: z.string().optional(),
});

export const workExperienceSchema = z.object({
  id: z.string(),
  jobTitle: z.string().min(1, "Job title is required"),
  company: z.string().min(1, "Company name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  current: z.boolean(),
  description: z.string().min(1, "Description is required"),
});

export const educationSchema = z.object({
  id: z.string(),
  degree: z.string().min(1, "Degree is required"),
  school: z.string().min(1, "School is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  current: z.boolean(),
});

export const projectSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Project name is required"),
  description: z.string().min(1, "Description is required"),
  link: z.string().url("Invalid URL").optional().or(z.literal("")),
});

// ── New sections ─────────────────────────────────────────────────────────────

export const certificationSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Certification name is required"),
  issuer: z.string().optional(),        // e.g. "AWS", "Google", "PMI"
  year: z.string().optional(),          // e.g. "2023"
  expiry: z.string().optional(),        // e.g. "2026" or "No Expiry"
  url: z.string().url().optional().or(z.literal("")),
});

export const languageSchema = z.object({
  id: z.string(),
  language: z.string().min(1, "Language is required"),
  proficiency: z.enum(["native", "fluent", "intermediate", "basic"]),
});

export const awardSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Award title is required"),
  issuer: z.string().optional(),
  year: z.string().optional(),
  description: z.string().optional(),
});

export const volunteerSchema = z.object({
  id: z.string(),
  organization: z.string().min(1, "Organization is required"),
  role: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().optional(),
});

export const publicationSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  publisher: z.string().optional(),     // journal, conference, or platform
  year: z.string().optional(),
  url: z.string().url().optional().or(z.literal("")),
});

// ─────────────────────────────────────────────────────────────────────────────

export const resumeSchema = z.object({
  personalInfo: personalInfoSchema,
  summary: z.string().optional(),
  workExperience: z.array(workExperienceSchema),
  education: z.array(educationSchema),
  skills: z.string().optional(),
  projects: z.array(projectSchema),
  // New optional sections
  certifications: z.array(certificationSchema).optional(),
  languages: z.array(languageSchema).optional(),
  awards: z.array(awardSchema).optional(),
  volunteerWork: z.array(volunteerSchema).optional(),
  publications: z.array(publicationSchema).optional(),
});

export type ResumeData = z.infer<typeof resumeSchema>;

export const jobDescriptionSchema = z.object({
  text: z.string().min(10, "Job description must be at least 10 characters"),
});

export type JobDescriptionData = z.infer<typeof jobDescriptionSchema>;
