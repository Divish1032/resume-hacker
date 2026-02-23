import { ResumeData } from "./schema";

// ─── Role Category Definitions ─────────────────────────────────────────────────
export const ROLE_CATEGORIES = {
  "Software Engineering": {
    label: "Software Engineering",
    coreTech: [
      "javascript", "typescript", "python", "java", "c++", "c#", "go", "rust", "kotlin", "swift",
      "react", "vue", "angular", "next.js", "node.js", "express", "fastapi", "django", "spring",
      "rest", "restful", "graphql", "grpc", "api", "microservices", "docker", "kubernetes", "ci/cd",
      "aws", "azure", "gcp", "cloud", "sql", "postgresql", "mysql", "mongodb", "redis",
      "git", "github", "agile", "scrum", "testing", "unit test", "tdd", "system design",
    ],
    actionVerbs: ["built", "developed", "architected", "designed", "engineered", "implemented",
      "deployed", "optimized", "refactored", "shipped", "migrated", "integrated"],
  },
  "Data Science / ML": {
    label: "Data Science / ML",
    coreTech: [
      "python", "r", "sql", "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "keras",
      "machine learning", "deep learning", "nlp", "computer vision", "llm", "neural network",
      "regression", "classification", "clustering", "feature engineering", "data pipeline",
      "spark", "hadoop", "airflow", "mlflow", "a/b testing", "statistics", "hypothesis",
      "tableau", "power bi", "jupyter", "databricks", "bigquery", "snowflake",
    ],
    actionVerbs: ["analyzed", "modeled", "trained", "predicted", "evaluated", "visualized",
      "discovered", "quantified", "experimented", "deployed"],
  },
  "Product Management": {
    label: "Product Management",
    coreTech: [
      "product roadmap", "product strategy", "user stories", "okr", "kpi", "jira", "confluence",
      "agile", "scrum", "kanban", "sprint", "stakeholder", "go-to-market", "gtm",
      "user research", "customer discovery", "ux", "a/b testing", "metrics", "analytics",
      "competitive analysis", "market research", "growth", "retention", "conversion", "nps",
      "figma", "wireframe", "prototype", "backlog", "prioritization", "mvp",
    ],
    actionVerbs: ["launched", "drove", "led", "defined", "prioritized", "collaborated",
      "aligned", "delivered", "grew", "identified", "executed", "shipped"],
  },
  "Marketing": {
    label: "Marketing",
    coreTech: [
      "seo", "sem", "ppc", "google ads", "facebook ads", "email marketing", "content marketing",
      "social media", "brand", "campaign", "conversion rate", "ctr", "cpa", "cpm", "roas",
      "hubspot", "salesforce", "mailchimp", "google analytics", "copywriting", "lead generation",
      "funnel", "crm", "influencer", "affiliate", "b2b", "b2c", "demand generation",
    ],
    actionVerbs: ["launched", "grew", "increased", "optimized", "managed", "created",
      "executed", "driven", "generated", "analyzed"],
  },
  "Finance": {
    label: "Finance",
    coreTech: [
      "financial modeling", "excel", "valuation", "dcf", "lbo", "m&a", "investment",
      "portfolio", "risk management", "derivatives", "equity", "fixed income", "compliance",
      "gaap", "ifrs", "financial statements", "budgeting", "forecasting", "variance analysis",
      "bloomberg", "capital markets", "private equity", "venture capital", "accounting",
    ],
    actionVerbs: ["analyzed", "modeled", "valued", "managed", "executed", "closed",
      "structured", "advised", "led", "presented"],
  },
  "Design (UX/UI)": {
    label: "Design (UX/UI)",
    coreTech: [
      "figma", "sketch", "adobe xd", "invision", "zeplin", "user research", "usability testing",
      "wireframe", "prototype", "information architecture", "interaction design", "visual design",
      "design system", "accessibility", "wcag", "heuristic evaluation", "user journey",
      "persona", "design thinking", "adobe illustrator", "photoshop", "after effects",
    ],
    actionVerbs: ["designed", "created", "developed", "improved", "tested", "iterated",
      "facilitated", "delivered", "built", "led"],
  },
  "General / Other": {
    label: "General / Other",
    coreTech: [],
    actionVerbs: ["led", "managed", "created", "developed", "improved", "delivered",
      "coordinated", "executed", "analyzed", "communicated"],
  },
} as const;

export type RoleCategory = keyof typeof ROLE_CATEGORIES;

// ─── Score Result ────────────────────────────────────────────────────────────
export interface AtsScoreResult {
  total: number; // 0–100
  breakdown: {
    hardSkills: { score: number; max: number; matched: string[]; missing: string[] };
    softSkills: { score: number; max: number; matched: string[]; missing: string[] };
    jobTitleMatch: { score: number; max: number; found: boolean; title: string };
    educationMatch: { score: number; max: number; requested: string[]; found: string[] };
    sectionCompleteness: { score: number; max: number; present: string[]; missing: string[] };
    actionVerbStrength: { score: number; max: number; found: string[]; suggested: string[] };
    quantification: { score: number; max: number; found: string[]; tip: string };
    roleAlignment: { score: number; max: number; detected: string; matchedTech: string[] };
  };
  suggestions: { priority: "high" | "medium" | "low"; text: string; howToFix: string }[];
  grade: "A" | "B" | "C" | "D" | "F";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s\-/.+#&]/g, " ").replace(/\s+/g, " ").trim();
}

function containsPhrase(haystack: string, phrase: string): boolean {
  return normalize(haystack).includes(normalize(phrase));
}

function detectRole(jd: string): RoleCategory {
  const text = normalize(jd);
  const scores: [RoleCategory, number][] = (
    Object.entries(ROLE_CATEGORIES) as [RoleCategory, (typeof ROLE_CATEGORIES)[RoleCategory]][]
  ).map(([role, cfg]) => {
    const count = cfg.coreTech.filter((k) => containsPhrase(text, k)).length;
    return [role, count];
  });
  scores.sort((a, b) => b[1] - a[1]);
  return scores[0][1] >= 3 ? scores[0][0] : "General / Other";
}

// ─── Keyword Extraction (Hard vs Soft Skills) ────────────────────────────────
const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "for", "with", "is", "are",
  "as", "at", "by", "on", "be", "will", "you", "we", "our", "that", "this",
  "have", "has", "from", "your", "their", "its", "they", "it", "not", "but",
  "can", "if", "who", "also", "all", "about", "would", "when", "what", "such",
  "been", "being", "each", "other", "more", "than", "into", "these", "those",
  "should", "could", "shall", "may", "might", "must", "need", "able", "well",
  "like", "just", "over", "only", "very", "most", "some", "any", "few",
  "how", "where", "which", "while", "through", "during", "before", "after",
  "above", "below", "between", "under", "same", "different", "here", "there",
  "every", "both", "either", "neither", "too", "so", "nor", "no", "yes",
  "etc", "e.g", "i.e", "per", "via", "vs", "including", "include", "using",
  "work", "working", "experience", "role", "position", "job", "team", "company",
  "looking", "join", "opportunity", "strong", "ability", "skills", "requirements",
  "required", "preferred", "ideal", "candidate", "responsible", "responsibilities",
  "qualifications", "minimum", "years", "year", "plus", "knowledge", "understanding",
]);

const SOFT_SKILLS_LIST = [
  "communication", "leadership", "problem solving", "critical thinking", "teamwork",
  "collaboration", "adaptability", "time management", "organization", "creativity",
  "emotional intelligence", "conflict resolution", "decision making", "interpersonal",
  "work ethic", "attention to detail", "flexibility", "self-motivated", "analytical",
  "independent", "mentoring", "coaching", "presentation skills", "public speaking"
];

const KNOWN_HARD_SKILLS = [
  "machine learning", "deep learning", "natural language processing", "computer vision",
  "data science", "data engineering", "data pipeline", "ci/cd", "a/b testing",
  "react native", "next.js", "node.js", "vue.js", "angular.js", "express.js",
  "unit test", "unit testing", "system design", "design system", "user research",
  "user experience", "product management", "project management", "cloud architecture",
  "full stack", "full-stack", "front end", "front-end", "back end", "back-end",
  "rest api", "restful api", "restful apis", "graphql api", "api design",
  "version control", "code review", "pull request", "agile methodology",
  "scrum master", "sprint planning", "technical leadership", "tech lead",
  "software architecture", "microservices architecture",
  "react.js", "typescript", "javascript", "python", "golang",
  "spring boot", "fastapi", "docker", "kubernetes", "terraform",
  "aws", "azure", "gcp", "google cloud",
  "postgresql", "mysql", "mongodb", "redis", "elasticsearch",
  "github actions", "jenkins", "gitlab ci",
  "web components", "server side rendering", "server-side rendering",
  "cross browser", "cross-browser", "responsive design", "mobile first",
  "mobile-first", "web performance", "performance optimization",
  "accessibility standards", "wcag", "html5", "css3", "es6",
  "javascript es6", "redux", "webpack", "eslint", "nuxt.js",
  "build tools", "git",
];

function extractKeywords(jd: string) {
  let workingJd = jd;
  const requirementsStart = jd.search(
    /\b(description|responsibilities|requirements?|qualifications?|what you.ll do|minimum qualifications?|about the role|the role|duties)\b/i
  );
  if (requirementsStart > 100) {
    workingJd = jd.slice(requirementsStart);
  }

  const text = normalize(workingJd);
  const cleanWords = text.split(" ").filter(
    (w) => w.length > 1 && !STOP_WORDS.has(w) && !/[.,!?;:()"'`]/.test(w)
  );

  const hardPhrases = new Set<string>();
  const softPhrases = new Set<string>();
  const workingNorm = normalize(workingJd);

  // Soft Skills
  for (const skill of SOFT_SKILLS_LIST) {
     if (containsPhrase(workingJd, skill)) softPhrases.add(skill);
  }

  // Hard Skills - Known Phrases
  for (const phrase of KNOWN_HARD_SKILLS) {
    if (containsPhrase(workingJd, phrase)) hardPhrases.add(phrase);
  }

  // Hard Skills - Single technical words
  for (const word of cleanWords) {
    if (word.length > 2 && !softPhrases.has(word)) hardPhrases.add(word);
  }

  // Hard Skills - Bigrams
  for (let i = 0; i < cleanWords.length - 1; i++) {
    const w1 = cleanWords[i], w2 = cleanWords[i + 1];
    if (w1.length >= 2 && w2.length >= 2 && !STOP_WORDS.has(w1) && !STOP_WORDS.has(w2)) {
      const bigram = `${w1} ${w2}`;
      if (!SOFT_SKILLS_LIST.includes(bigram)) hardPhrases.add(bigram);
    }
  }

  // Score and rank Hard Skills
  const scoredHard = [...hardPhrases].map((p) => {
    let importance = 0;
    const regex = new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const count = (workingNorm.match(regex) || []).length;
    importance += count * 2;
    if (KNOWN_HARD_SKILLS.includes(p)) importance += 8;
    if (p.includes(" ")) importance += 3;
    if (/[.#+/]/.test(p)) importance += 4;
    return { phrase: p, importance };
  });

  scoredHard.sort((a, b) => b.importance - a.importance);

  return {
    hardSkills: scoredHard.filter(s => s.importance >= 2).slice(0, 30).map(s => s.phrase),
    softSkills: [...softPhrases]
  };
}

// ─── Education Matching ──────────────────────────────────────────────────────
const EDU_LEVELS = [
  { level: "phd", regex: /\b(ph\.?d|doctorate)\b/i },
  { level: "masters", regex: /\b(master'?s|ms|ma|m\.?s|m\.?a)\b/i },
  { level: "bachelors", regex: /\b(bachelor'?s|bs|ba|b\.?s|b\.?a|undergraduate)\b/i }
];

function extractEducationRequirements(jd: string): string[] {
  const reqs: string[] = [];
  for (const edu of EDU_LEVELS) {
    if (edu.regex.test(jd)) reqs.push(edu.level);
  }
  return reqs.length ? reqs : ["bachelors"]; // Default expectation if none specified
}

function checkEducationMatch(resumeText: string, reqs: string[]): string[] {
  const matched: string[] = [];
  for (const req of reqs) {
    const eduLevel = EDU_LEVELS.find(e => e.level === req);
    if (eduLevel && eduLevel.regex.test(resumeText)) matched.push(req);
  }
  return matched;
}

// ─── Job Title Matching ──────────────────────────────────────────────────────
function extractJobTitle(jd: string): string {
  // Very rough heuristic to grab the first common title-looking phrase before description
  // In a real world this would be a specific input field from the user
  const titleRegex = /(?:software engineer|data scientist|product manager|full stack developer|frontend developer|backend developer|marketing manager|accountant|designer|analyst)\b/i;
  const match = jd.match(titleRegex);
  return match ? match[0] : "";
}


// Count quantifiers in text
function findQuantifiers(text: string): string[] {
  const found: string[] = [];
  const numericPattern = /\d+[\w%$]*[-\w]*/gi;
  const matches = text.match(numericPattern) || [];
  if (matches.length) found.push(...matches.slice(0, 10));
  const quantWords = ["increased", "reduced", "improved", "decreased", "grew", "saved",
    "generated", "accelerated", "boosted", "cut", "doubled", "tripled"];
  for (const q of quantWords) {
    if (containsPhrase(text, q)) found.push(q);
  }
  return [...new Set(found)].slice(0, 12);
}

// ─── Main Scorer ─────────────────────────────────────────────────────────────
export function scoreResume(resume: ResumeData, jd: string): AtsScoreResult {
  const resumeText = buildResumeText(resume);
  const detectedRole = detectRole(jd);
  const roleCfg = ROLE_CATEGORIES[detectedRole];

  const suggestions: { priority: "high" | "medium" | "low"; text: string; howToFix: string }[] = [];

  // ── 1. Keyword Match: Hard & Soft Skills (35 pts total: 25 Hard, 10 Soft) ──
  const { hardSkills: reqHard, softSkills: reqSoft } = extractKeywords(jd);
  
  const matchedHard = reqHard.filter(p => containsPhrase(resumeText, p));
  const missingHard = reqHard.filter(p => !containsPhrase(resumeText, p));
  const hardScoreRatio = reqHard.length > 0 ? matchedHard.length / reqHard.length : 1;
  const hardScore = Math.round(hardScoreRatio * 25);

  const matchedSoft = reqSoft.filter(p => containsPhrase(resumeText, p));
  const missingSoft = reqSoft.filter(p => !containsPhrase(resumeText, p));
  const softScoreRatio = reqSoft.length > 0 ? matchedSoft.length / reqSoft.length : 1;
  const softScore = Math.round(softScoreRatio * 10);

  // ── 2. Job Title Match (5 pts) ─────────────────────────────────────────────
  const targetTitle = extractJobTitle(jd);
  const titleMatched = targetTitle ? containsPhrase(resumeText, targetTitle) : true; // default true if we can't guess title
  const titleScore = titleMatched ? 5 : 0;

  // ── 3. Education Match (5 pts) ─────────────────────────────────────────────
  const reqEducation = extractEducationRequirements(jd);
  const matchedEducation = checkEducationMatch(resumeText, reqEducation);
  const eduScore = matchedEducation.length > 0 || reqEducation.length === 0 ? 5 : 0;

  // ── 4. Section Completeness (15 pts) ──────────────────────────────────────
  const sections: { name: string; present: boolean }[] = [
    { name: "Full Name", present: !!resume.personalInfo?.fullName },
    { name: "Email", present: !!resume.personalInfo?.email },
    { name: "Phone", present: !!resume.personalInfo?.phone },
    { name: "LinkedIn", present: !!resume.personalInfo?.linkedin },
    { name: "Professional Summary", present: !!resume.summary && resume.summary.length > 20 },
    { name: "Work Experience", present: !!resume.workExperience?.length },
    { name: "Education", present: !!resume.education?.length },
    { name: "Skills", present: !!resume.skills && resume.skills.length > 5 },
  ];
  const sectionPresent = sections.filter((s) => s.present).map((s) => s.name);
  const sectionMissing = sections.filter((s) => !s.present).map((s) => s.name);
  const sectionScore = Math.round((sectionPresent.length / sections.length) * 15);

  // ── 5. Action Verb Strength (15 pts) ───────────────────────────────────────
  const universalVerbs = [
    "achieved", "accelerated", "managed", "spearheaded", "established", "created",
    "launched", "drove", "streamlined", "generated", "coordinated", "facilitated",
    "transformed", "pioneered", "championed", "mentored", "scaled", "automated",
    "negotiated", "orchestrated", "consolidated", "revamped",
  ];
  const allActionVerbs = [...new Set([...roleCfg.actionVerbs, ...universalVerbs])];
  const foundVerbs = allActionVerbs.filter(v => containsPhrase(resumeText, v));
  const suggestedVerbs = allActionVerbs.filter(v => !containsPhrase(resumeText, v));
  const actionScore = Math.round(Math.min((foundVerbs.length / 8) * 15, 15));

  // ── 6. Quantification (15 pts) ─────────────────────────────────────────────
  const experienceText = [
    ...(resume.workExperience?.map((w) => w.description) || []),
    ...(resume.projects?.map((p) => p.description) || []),
    resume.summary || "",
  ].join(" ");
  const quantifiers = findQuantifiers(experienceText);
  const quantScore = Math.round(Math.min((quantifiers.length / 5) * 15, 15));
  const quantTip = quantifiers.length < 5
    ? `Add ${5 - quantifiers.length} more metrics. Try: team size, revenue impact, % improvement, user count, response time.`
    : "Good quantification coverage!";

  // ── 7. Role Alignment (10 pts) ─────────────────────────────────────────────
  const matchedTech = roleCfg.coreTech.filter((k) => containsPhrase(resumeText, k));
  const alignScore = detectedRole === "General / Other"
    ? 10
    : Math.round(Math.min((matchedTech.length / 6) * 10, 10));

  const total = hardScore + softScore + titleScore + eduScore + sectionScore + actionScore + quantScore + alignScore;

  // ── Generating Suggestions ─────────────────────────────────────────────────
  
  if (missingHard.length > 0) {
    if (hardScoreRatio < 0.6) {
       suggestions.push({
          priority: "high",
          text: `Critical Hard Skills Missing (${missingHard.length})`,
          howToFix: `Integrate these terms into your experience: ${missingHard.slice(0, 5).join(", ")}`
       });
    } else {
       suggestions.push({
          priority: "medium",
          text: `Important Hard Skills Missing`,
          howToFix: `Consider adding: ${missingHard.slice(0, 3).join(", ")}`
       });
    }
  }

  if (missingSoft.length > 0 && softScoreRatio < 0.7) {
     suggestions.push({
        priority: "medium",
        text: `Soft Skills Missing`,
        howToFix: `Show leadership/culture fit by adding: ${missingSoft.slice(0, 3).join(", ")}`
     });
  }

  if (!titleMatched && targetTitle) {
    suggestions.push({
       priority: "high",
       text: `Target Job Title Missing`,
       howToFix: `Ensure "${targetTitle}" appears somewhere in your summary or past titles.`
    });
  }

  if (matchedEducation.length === 0 && reqEducation.length > 0 && !reqEducation.includes("bachelors")) {
    suggestions.push({
      priority: "medium",
      text: `Education Requirement Not Met`,
      howToFix: `The JD mentions ${reqEducation[0].toUpperCase()}. Ensure this is clearly listed if you possess it.`
    });
  }

  if (sectionMissing.length > 0) {
    suggestions.push({
      priority: sectionMissing.length > 2 ? "high" : "medium",
      text: `Missing sections: ${sectionMissing.join(", ")}.`,
      howToFix: `Fill in the missing fields in your resume form.`
    });
  }

  if (actionScore < 10) {
    suggestions.push({
      priority: "medium",
      text: `Weak Action Verbs`,
      howToFix: `Start bullets with verbs like: ${suggestedVerbs.slice(0, 5).join(", ")}`
    });
  }

  if (quantScore < 10) {
    suggestions.push({
      priority: quantScore < 5 ? "high" : "medium",
      text: `Lacking Quantified Results`,
      howToFix: `Add numbers (%, $, time) to prove your impact.`
    });
  }

  const grade = total >= 80 ? "A" : total >= 65 ? "B" : total >= 50 ? "C" : total >= 35 ? "D" : "F";

  return {
    total,
    grade,
    breakdown: {
      hardSkills: { score: hardScore, max: 25, matched: matchedHard, missing: missingHard },
      softSkills: { score: softScore, max: 10, matched: matchedSoft, missing: missingSoft },
      jobTitleMatch: { score: titleScore, max: 5, found: titleMatched, title: targetTitle },
      educationMatch: { score: eduScore, max: 5, requested: reqEducation, found: matchedEducation },
      sectionCompleteness: { score: sectionScore, max: 15, present: sectionPresent, missing: sectionMissing },
      actionVerbStrength: { score: actionScore, max: 15, found: foundVerbs, suggested: suggestedVerbs.slice(0, 6) },
      quantification: { score: quantScore, max: 15, found: quantifiers, tip: quantTip },
      roleAlignment: { score: alignScore, max: 10, detected: roleCfg.label, matchedTech },
    },
    suggestions,
  };
}

function buildResumeText(resume: ResumeData): string {
  return [
    resume.personalInfo?.fullName,
    resume.personalInfo?.email,
    resume.personalInfo?.linkedin,
    resume.summary,
    resume.skills,
    ...(resume.workExperience?.map((w) => `${w.jobTitle} ${w.company} ${w.description}`) || []),
    ...(resume.education?.map((e) => `${e.degree} ${e.school}`) || []),
    ...(resume.projects?.map((p) => `${p.name} ${p.description}`) || []),
    ...(resume.certifications?.map((c) => `${c.name} ${c.issuer || ""}`) || []),
    ...(resume.languages?.map((l) => `${l.language} ${l.proficiency}`) || []),
    ...(resume.awards?.map((a) => `${a.title} ${a.issuer || ""} ${a.description || ""}`) || []),
    ...(resume.volunteerWork?.map((v) => `${v.organization} ${v.role || ""} ${v.description || ""}`) || []),
    ...(resume.publications?.map((p) => `${p.title} ${p.publisher || ""}`) || []),
  ]
    .filter(Boolean)
    .join(" ");
}
