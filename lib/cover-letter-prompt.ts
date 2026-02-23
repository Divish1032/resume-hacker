import { ResumeData, JobDescriptionData } from "@/lib/schema";

export type CoverLetterTone = "professional" | "conversational" | "enthusiastic";
export type CoverLetterLength = "concise" | "standard" | "detailed";

function extractCompanyAndRole(jdText: string): { company: string; role: string } {
  // Try to extract role title — usually near "Job Title:", "Position:", "Role:" or the first line
  const rolePatterns = [
    /(?:job title|position|role|we are hiring(?: a| an)?)[:\s]+([A-Z][^\n,]{3,60})/i,
    /^([A-Z][^\n]{5,60})$/m,
  ];
  let role = "the position";
  for (const p of rolePatterns) {
    const m = jdText.match(p);
    if (m?.[1]?.trim()) { role = m[1].trim(); break; }
  }

  // Try to extract company name — "at <Company>", "About <Company>", "<Company> is looking"
  const companyPatterns = [
    /(?:at|join|about|company[:\s]+|©\s*)([A-Z][A-Za-z0-9&., ]{2,50})(?:\s|,|\.|\n|$)/,
    /^([A-Z][A-Za-z0-9&., ]{2,40})\s+is\s+(?:a|an|the|looking)/m,
  ];
  let company = "your company";
  for (const p of companyPatterns) {
    const m = jdText.match(p);
    if (m?.[1]?.trim()) { company = m[1].trim(); break; }
  }

  return { company, role };
}

function pickTopAchievements(resume: ResumeData): string[] {
  const bullets: string[] = [];
  for (const job of resume.workExperience ?? []) {
    // description is a plain text block — split by newlines or bullet markers
    const lines = (job.description ?? "")
      .split(/\n|•|-|\*|\d+\./)  
      .map((l) => l.trim())
      .filter((l) => l.length > 40);
    bullets.push(...lines.slice(0, 2));
    if (bullets.length >= 5) break;
  }
  return bullets.slice(0, 4);
}

const TONE_INSTRUCTIONS: Record<CoverLetterTone, string> = {
  professional:
    "Use a formal, polished tone. No contractions. Write in first person but keep language executive-ready. Emphasise measurable achievements and demonstrated expertise.",
  conversational:
    "Use a warm, confident first-person voice. Mild contractions are fine. Sound like a capable human being, not a template. Be direct and genuine.",
  enthusiastic:
    "Show genuine passion and energy for this specific role and company. Use forward-looking language. Convey excitement without hyperbole. Still keep it professional.",
};

const LENGTH_INSTRUCTIONS: Record<CoverLetterLength, string> = {
  concise:
    "Write exactly 3 short paragraphs (~250 words total): (1) opening & role hook, (2) key achievement + fit, (3) closing with CTA.",
  standard:
    "Write 4 paragraphs (~400 words total): (1) opening, (2) relevant skills/experience, (3) a specific quantified achievement, (4) closing with CTA.",
  detailed:
    "Write 5 paragraphs (~550 words total): (1) strong personal opening, (2) professional background overview, (3) skills fit to JD, (4) quantified achievement story, (5) closing with CTA and next steps.",
};

export interface CoverLetterSettings {
  tone: CoverLetterTone;
  length: CoverLetterLength;
}

export function generateCoverLetterPrompt(
  resume: ResumeData,
  jobDescription: JobDescriptionData,
  settings: CoverLetterSettings
): string {
  const { tone, length } = settings;
  const { company, role } = extractCompanyAndRole(jobDescription.text);
  const achievements = pickTopAchievements(resume);
  const candidateName = resume.personalInfo?.fullName ?? "the candidate";
  // skills is a plain text string (comma-separated or newline-separated)
  const skills = typeof resume.skills === "string"
    ? resume.skills.split(/[,\n]/).slice(0, 10).join(", ")
    : "";
  const latestTitle = resume.workExperience?.[0]?.jobTitle ?? "professional";
  const latestCompany = resume.workExperience?.[0]?.company ?? "";

  const certs = resume.certifications?.map((c) => c.name).join(", ") || "";
  const langs = resume.languages?.map((l) => `${l.language} (${l.proficiency})`).join(", ") || "";

  const achievementsBlock = achievements.length > 0
    ? `[CANDIDATE'S TOP ACHIEVEMENTS — incorporate 2-3 naturally]\n${achievements.map((a) => `  • ${a}`).join("\n")}`
    : "";

  return `You are an expert cover letter writer who specialises in ATS-optimised, human-first cover letters.

Write a tailored cover letter for the following candidate applying to the role below.

[TONE]
${TONE_INSTRUCTIONS[tone]}

[LENGTH & STRUCTURE]
${LENGTH_INSTRUCTIONS[length]}

[CANDIDATE DETAILS]
Name: ${candidateName}
Current/Latest Role: ${latestTitle}${latestCompany ? ` at ${latestCompany}` : ""}
Key Skills: ${skills}
${certs ? `Certifications: ${certs}` : ""}
${langs ? `Languages: ${langs}` : ""}
${achievementsBlock}

[TARGET ROLE]
Company: ${company}
Role: ${role}

[FULL JOB DESCRIPTION]
${jobDescription.text}

[RULES]
1. Address it to "Hiring Manager" (we don't know the name).
2. Open with a hook — never start with "I am writing to apply for…".
3. Use 2-3 specific JD keywords organically — don't keyword-stuff.
4. Reference at least one specific achievement from the candidate's background.
5. End with a confident, polite call to action.
6. Do NOT include contact info, date, or address headers — output ONLY the letter body starting from the salutation.
7. Output plain text, no markdown formatting, no JSON.

[OUTPUT]
Write the cover letter now:`;
}
