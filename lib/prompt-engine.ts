import { JobDescriptionData, ResumeData } from "./schema";
import { scoreResume } from "./ats-scorer";

export interface PromptSettings {
  fabricationLevel: number; // 0 to 100
}

export function generateInterviewQuestionsPrompt(
  resume: ResumeData,
  jobDescription: JobDescriptionData
): string {
  return `You are an expert technical recruiter and hiring manager.
Based on the provided candidate resume and target job description, generate 5 highly relevant and challenging interview questions.
These questions should probe the candidate's specific experiences, their alignment with the role's requirements, and potential areas of weakness or gaps.

[CANDIDATE RESUME]
${JSON.stringify(resume, null, 2)}

[TARGET JOB DESCRIPTION]
${jobDescription.text}

[OUTPUT FORMAT]
Provide your response strictly as a JSON array of objects. Do not include any markdown formatting like \`\`\`json.
Each object must have:
- "question": The interview question.
- "type": Choose one of: "Technical", "Behavioral", "Experience", or "Situational".
- "reasoning": A brief explanation of why this question is being asked based on their resume and the JD.

Example output:
[
  {
    "question": "Can you walk me through your experience building scalable microservices?",
    "type": "Technical",
    "reasoning": "JD requires microservices experience, and resume mentions it but lacks specific scaling metrics."
  }
]
`;
}

export function generateStarFlashcardPrompt(
  resume: ResumeData,
  jobDescription: JobDescriptionData,
  question: string
): string {
  return `You are an expert interview coach helping a candidate prepare using the STAR (Situation, Task, Action, Result) method.
Given the candidate's resume, the target job description, and a specific interview question, generate a comprehensive STAR method response that the candidate can use to answer the question effectively. Draw ONLY on experiences listed in the candidate's resume. 

[INTERVIEW QUESTION]
"${question}"

[CANDIDATE RESUME]
${JSON.stringify(resume, null, 2)}

[TARGET JOB DESCRIPTION]
${jobDescription.text}

[OUTPUT FORMAT]
Provide your response strictly as a JSON object. Do not include any markdown formatting like \`\`\`json.
The object must have the following keys:
- "situation": Setting the scene and giving necessary context.
- "task": Describe what their responsibility was in that situation.
- "action": Explain exactly what steps they took to address it.
- "result": Share what outcomes their actions achieved (use metrics from the resume if available).
- "tips": A short string with 1-2 tips on how to deliver this answer effectively.

Example output:
{
  "situation": "Our main API was struggling under peak load, causing timeouts for 15% of our users.",
  "task": "I was tasked with identifying the bottleneck and improving response times without rewriting the entire service.",
  "action": "I implemented Redis caching for the most frequently accessed endpoints and optimized our primary database queries with proper indexing.",
  "result": "API response times dropped by 70%, completely eliminating the timeout errors during peak hours.",
  "tips": "Emphasize your proactive approach to monitoring and how you prioritized which queries to index."
}
`;
}

export function generateNetworkingPrompt(
  resume: ResumeData,
  jobDescription?: JobDescriptionData
): string {
  const contextInstruction = jobDescription 
    ? `\n[TARGET JOB DESCRIPTION]\n${jobDescription.text}\n\nTailor the LinkedIn profile and outreach templates specifically to attract recruiters hiring for this exact role or similar roles.`
    : `\nTailor the LinkedIn profile and outreach templates broadly based on the candidate's existing experience and top skills.`;

  return `You are an expert career coach and LinkedIn branding specialist.
Based on the provided candidate resume and optional target job description, generate optimized LinkedIn profile content and networking outreach templates.

[CANDIDATE RESUME]
${JSON.stringify(resume, null, 2)}
${contextInstruction}

[OUTPUT FORMAT]
Provide your response strictly as a JSON object. Do not include any markdown formatting like \`\`\`json.
The object must have the following keys:
- "headlines": An array of 3 strong, SEO-optimized LinkedIn headlines (under 120 characters each).
- "about": A compelling "About" section summary (2-3 short paragraphs) that tells their professional story, highlights key achievements, and includes a call to action.
- "outreach": An array of 3 distinct networking templates:
    1. "Recruiter Connection": A short, impactful connection request to a recruiter or hiring manager.
    2. "Informational Interview": A message asking an industry peer for a brief chat.
    3. "Follow-up": A polite follow-up message after an application or initial contact.

Each outreach object in the array should have:
  - "type": The name of the template (e.g., "Recruiter Connection").
  - "subject": The subject line (if applicable, or empty string).
  - "body": The message template with placeholders like [Hiring Manager Name] or [Company Name].

Example output:
{
  "headlines": [
    "Senior Frontend Engineer | React & Next.js Expert | Building Scalable Web Apps",
    ...
  ],
  "about": "As a passionate software engineer...",
  "outreach": [
    {
      "type": "Recruiter Connection",
      "subject": "",
      "body": "Hi [Name], I recently applied for..."
    }
  ]
}
`;
}

export function generatePrompt(
  resume: ResumeData,
  jobDescription: JobDescriptionData,
  settings: PromptSettings
): string {
  const { fabricationLevel } = settings;

  // Run the ATS scorer on the current resume to find exact gaps
  const atsFeedback = scoreResume(resume, jobDescription.text);
  
  const { hardSkills, softSkills, sectionCompleteness, jobTitleMatch, educationMatch } = atsFeedback.breakdown;
  const missingHard = hardSkills.missing;
  const missingSoft = softSkills.missing;
  const missingSections = sectionCompleteness.missing;

  let feedbackMandate = "";
  
  if (missingHard.length > 0 || missingSoft.length > 0 || missingSections.length > 0 || !jobTitleMatch.found || educationMatch.found.length < educationMatch.requested.length) {
    feedbackMandate += "\n[ATS SCORER FEEDBACK — ADDRESS THESE GAPS]\n";
    feedbackMandate += "The current resume was analyzed against the ATS system and found the following critical gaps. You MUST address these in your optimized version to improve the score.\n\n";
    
    if (missingHard.length > 0) {
      feedbackMandate += "MISSING HARD SKILLS (Must be added to Skills section and woven into Experience bullets):\n";
      missingHard.forEach(skill => { feedbackMandate += `  • ${skill}\n`; });
      feedbackMandate += "\n";
    }
    
    if (missingSoft.length > 0) {
      feedbackMandate += "MISSING SOFT SKILLS (Must be demonstrated in Summary or Experience metrics):\n";
      missingSoft.forEach(skill => { feedbackMandate += `  • ${skill}\n`; });
      feedbackMandate += "\n";
    }
    
    if (missingSections.length > 0) {
      feedbackMandate += "MISSING SECTIONS (Must be populated in the JSON output):\n";
      missingSections.forEach(sec => { feedbackMandate += `  • ${sec}\n`; });
      feedbackMandate += "\n";
    }

    if (!jobTitleMatch.found && jobTitleMatch.title) {
      feedbackMandate += `MISSING TARGET JOB TITLE:\n  • Must explicitly state the title "${jobTitleMatch.title}" in the Summary or recent experience.\n\n`;
    }

    const missingEdu = educationMatch.requested.filter(req => !educationMatch.found.includes(req));
    if (missingEdu.length > 0) {
      feedbackMandate += `MISSING EDUCATION REQUIREMENTS:\n  • Ensure the candidate's degree is explicitly listed as: ${missingEdu.join(", ")}.\n\n`;
    }
  }

  let fabricationInstructions = "";
  if (fabricationLevel < 20) {
    fabricationInstructions = `
FABRICATION LEVEL: STRICT (${fabricationLevel}%)
- Do not invent any skills, experiences, or achievements.
- Only rephrase existing content to include the missing ATS keywords exactly.
- If the candidate lacks a specific required skill, reframe adjacent experience to imply it, but do not outright lie.
- You MUST still embed the missing ATS keywords above — find a way to do so truthfully.
`;
  } else if (fabricationLevel < 50) {
    fabricationInstructions = `
FABRICATION LEVEL: MODERATE (${fabricationLevel}%)
- You may infer skills implied by the candidate's existing experience to cover the missing ATS keywords.
- Reframe and strengthen bullet points to align with JD language.
- You may add specific tools/technologies if the candidate's work strongly implies them.
- All missing ATS keywords above must appear in the output.
`;
  } else if (fabricationLevel < 80) {
    fabricationInstructions = `
FABRICATION LEVEL: AGGRESSIVE (${fabricationLevel}%)
- Embellish experiences to strongly align with the JD and missing ATS keywords. 
- If a skill is critical (like a missing hard skill) and the candidate has adjacent experience, explicitly claim the skill.
- Add specific numbers and metrics that are plausible given the context.
- All missing ATS keywords MUST appear in the output. Embed them even if it requires creative interpretation.
`;
  } else {
    fabricationInstructions = `
FABRICATION LEVEL: MAXIMUM (${fabricationLevel}%) — Target 100% ATS Score
- Your PRIMARY goal is to pass the ATS target with a perfect score.
- You MUST weave EVERY SINGLE missing hard skill and soft skill into the resume.
- Add all missing technologies to the Skills section.
- Invent plausible quantified achievements (%, $, users, team sizes) that are consistent with the resume's seniority level to boost the 'Measurable Results' ATS metric.
- Make the candidate appear to be the perfect match for this role, even if it requires inventing plausible experiences or tools.
`;
  }

  return `You are an expert ATS-optimization specialist and resume writer.
Your task: Rewrite the candidate's resume to achieve the HIGHEST possible ATS match score for the target job.

${fabricationInstructions}
${feedbackMandate}

[SCORING PRIORITIES — in order of impact]
1. Keyword Coverage (35pts): Every missing hard/soft skill listed above MUST be added.
2. Section Completeness (20pts): All missing sections mentioned above MUST be filled.
3. Action Verb Power (20pts): Start every bullet point with a strong action verb (Built, Developed, Architected, Led, Optimized, Deployed, Shipped, Drove, Scaled, etc.)
4. Quantification (15pts): Every work experience bullet should have at least one numeric metric (%, $, users, team size, performance gain, time saved).
5. Role Alignment (10pts): The overall tone and technology stack should clearly match the target role.

[INSTRUCTIONS]
1. Read the Job Description and identify the role title, required tech stack, and soft skills needed.
2. Rewrite the Summary (3-4 sentences) to mirror the JD's language and embed top keywords.
3. Rewrite each Work Experience bullet to: start with an action verb, include at least one metric, and use JD-specific terminology.
4. Rewrite the Skills section to lead with the most JD-relevant tech first, and explicitly append ALL missing hard skills.
5. Do NOT remove existing companies, dates, or education — only rewrite the content within them.

[CANDIDATE RESUME]
${JSON.stringify(resume, null, 2)}

[TARGET JOB DESCRIPTION]
${jobDescription.text}

[OUTPUT FORMAT]
Provide your response in two parts:
PART 1: A brief "Change Log" (Markdown) — list the key changes made, which missing ATS keywords were added and where.
PART 2: The complete optimized resume as a valid JSON object with the EXACT SAME structure as the [CANDIDATE RESUME] input above. Wrap it in a \`\`\`json codeblock. This JSON will be used to re-render the user's resume — it is critical that the structure matches exactly.

IMPORTANT — New optional fields: If the candidate's resume contains certifications, languages, awards, volunteerWork, or publications, preserve them in the JSON output. These sections help ATS systems identify qualified candidates. You may also ADD certifications to the certifications array if the JD implies a certification that aligns with the candidate's background (only at fabrication level > 50%).
`;
}
