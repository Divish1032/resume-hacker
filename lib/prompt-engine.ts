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

export function generateReverseQuestionsPrompt(
  resume: ResumeData,
  jobDescription: JobDescriptionData
): string {
  return `You are a strategic career advisor helping a candidate act like a high-level insider during their job interview.
Based on the provided candidate resume and target job description, generate 3 highly strategic, impressive "Reverse Questions" for the candidate to ask the interviewer at the end of the interview.

These questions should NOT be generic (e.g., "What is the culture like?"). They should:
1. Reference specific challenges, goals, or technologies mentioned in the JD.
2. Demonstrate that the candidate is already thinking about how to solve the company's problems within the first 90 days.
3. Subtly position the candidate's specific background (from their resume) as the perfect fit for these challenges.

[CANDIDATE RESUME]
${JSON.stringify(resume, null, 2)}

[TARGET JOB DESCRIPTION]
${jobDescription.text}

[OUTPUT FORMAT]
Provide your response strictly as a JSON array of objects. Do not include any markdown formatting like \`\`\`json.
Each object must have:
- "question": The strategic question to ask.
- "rationale": A brief explanation of why this question is powerful and what it signals to the interviewer.

Example output:
[
  {
    "question": "The JD mentions scaling the core API. Given my experience migrating legacy monoliths to microservices at [Previous Company], what is the biggest technical bottleneck your team is currently facing with that scale?",
    "rationale": "Signals that you've solved this exact problem before and shifts the conversation from evaluating you to discussing their problems as peers."
  }
]
`;
}

export function generate306090PlanPrompt(
  resume: ResumeData,
  jobDescription: JobDescriptionData
): string {
  return `You are an elite executive coach. Your task is to generate a highly specific, actionable 30-60-90 Day Plan for a candidate based on their resume and the target job description. This plan is meant to be handed to the hiring manager during the interview to prove the candidate is ready to execute immediately.

[CANDIDATE RESUME]
${JSON.stringify(resume, null, 2)}

[TARGET JOB DESCRIPTION]
${jobDescription.text}

[OUTPUT FORMAT]
Provide your response strictly as a JSON object. Do not include any markdown formatting like \`\`\`json.
The object must have the following keys:
- "title": A strong, confident title for the plan (e.g., "Strategic 90-Day Execution Plan for Senior Product Manager").
- "day30": An array of 3-4 specific bullet points focusing on onboarding, learning the tech stack/product, and building relationships. Reference specific tools or processes from the JD.
- "day60": An array of 3-4 specific bullet points focusing on taking ownership, early quick wins, and identifying optimization opportunities based on the candidate's past experience.
- "day90": An array of 3-4 specific bullet points focusing on strategic impact, leading independent projects, and moving the needle on the core responsibilities listed in the JD.

Example output:
{
  "title": "90-Day Execution Plan: Lead Frontend Engineer",
  "day30": [
    "Complete deep-dive into the existing React/Redux codebase and current CI/CD pipelines.",
    "Conduct 1:1s with key stakeholders in Product and Design to align on current Q3 sprint goals."
  ],
  "day60": [
    "Lead the migration of the legacy auth flow to the new Next.js architecture as an early win.",
    "Propose a standardized component library structure to reduce design debt."
  ],
  "day90": [
    "Take full ownership of frontend performance metrics, targeting a 20% improvement in LCP.",
    "Begin mentoring junior developers on advanced React patterns."
  ]
}
`;
}

export function generateObjectionHandlingPrompt(
  resume: ResumeData,
  jobDescription: JobDescriptionData
): string {
  return `You are an expert interview coach specializing in defensive interview tactics and "objection handling." 
Compare the candidate's resume with the target job description. Identify the top 3 biggest weaknesses, missing skills, or experience gaps the candidate has for this specific role. Then, draft a persuasive, confident script for how the candidate can pivot or defend those gaps when the interviewer inevitably brings them up.

[CANDIDATE RESUME]
${JSON.stringify(resume, null, 2)}

[TARGET JOB DESCRIPTION]
${jobDescription.text}

[OUTPUT FORMAT]
Provide your response strictly as a JSON array of objects. Do not include any markdown formatting like \`\`\`json.
Each object must have:
- "objection": The likely concern the interviewer will raise (e.g., "You don't have experience with AWS.").
- "pivot_strategy": The underlying strategy for defending this (e.g., "Pivot to parallel experience in Azure and emphasize fast learning.").
- "script": The exact, word-for-word script the candidate should say to confidently handle the objection.

Example output:
[
  {
    "objection": "You haven't managed a team of this size before.",
    "pivot_strategy": "Acknowledge the gap but pivot to cross-functional leadership and scaling processes.",
    "script": "That's a fair observation. While technically my direct reports were capped at 5, I successfully led cross-functional pods of 15+ engineers and designers to deliver the Q4 roadmap. I've found that scaling processes and maintaining clear communication is the same discipline whether they report directly to me or not."
  }
]
`;
}

export function generateHiringManagerBypassPrompt(
  jobDescription: JobDescriptionData
): string {
  return `You are an expert technical recruiter and OSINT/sourcing specialist.
Based on the provided job description, generate 3 highly targeted LinkedIn "Boolean Search Strings" that the candidate can copy-paste into LinkedIn search to find the most likely Hiring Manager (NOT a recruiter, but the actual team lead, director, or VP who needs this role filled).

[TARGET JOB DESCRIPTION]
${jobDescription.text}

[OUTPUT FORMAT]
Provide your response strictly as a JSON array of objects. Do not include any markdown formatting like \`\`\`json.
Each object must have:
- "search_string": The exact boolean string to paste into LinkedIn (e.g., ("Engineering Manager" OR "Director of Engineering") AND "Stripe" AND "Payments").
- "target_persona": Who this string is trying to find (e.g., "The Direct Manager").
- "rationale": Why you chose these specific keywords based on the JD.

Example output:
[
  {
    "search_string": "(\"VP of Engineering\" OR \"Head of Engineering\") AND \"Company Name\" AND \"React\"",
    "target_persona": "The Department Head",
    "rationale": "For senior roles, the VP or Head of Engineering is often the final decision maker."
  }
]
`;
}

export function generatePainPointOutreachPrompt(
  resume: ResumeData,
  jobDescription: JobDescriptionData
): string {
  return `You are a world-class B2B SaaS salesperson and executive career coach. 
Instead of sending a generic "I applied for your job" message, your strategy is to identify the hiring manager's biggest "Pain Point" from the job description and pitch the candidate's resume as the immediate solution.

Read the JD to guess *why* they are hiring (e.g., scaling issues, high churn, launching a new product). Then, write 3 distinct, punchy cold outreach messages (LinkedIn Direct Messages or Cold Emails) that lead with a hypothesis about their problem and offer a specific achievement from the candidate's resume as proof they can solve it.

[CANDIDATE RESUME]
${JSON.stringify(resume, null, 2)}

[TARGET JOB DESCRIPTION]
${jobDescription.text}

[OUTPUT FORMAT]
Provide your response strictly as a JSON array of objects. Do not include any markdown formatting like \`\`\`json.
Each object must have:
- "pain_point_hypothesis": What you suspect their biggest problem is right now.
- "subject_line": A catchy, non-salesy subject line (under 6 words). Use "N/A" if it's meant for a LinkedIn connection request.
- "message": The cold outreach message. Keep it under 100 words. Be direct, confident, and focus entirely on solving their problem. Do NOT use generic pleasantries like "I hope this finds you well."

Example output:
[
  {
    "pain_point_hypothesis": "They are migrating to a microservices architecture and it's taking too long.",
    "subject_line": "Microservices migration bottleneck?",
    "message": "Hi [Name], I saw you're hiring for a Senior Backend Engineer to help scale the new infrastructure. I'm guessing the monolith-to-microservices migration is proving trickier than expected. At my last company, I led a similar migration that reduced latency by 40% and deploying times by half. I just submitted my application but wanted to reach out directly to see if you'd be open to a quick chat about how I tackled those bottlenecks."
  }
]
`;
}

export function generateFollowUpEmailPrompt(
  resume: ResumeData,
  jobDescription: JobDescriptionData,
  daysSinceApplied: number
): string {
  let urgencyTone = "";
  if (daysSinceApplied <= 3) {
    urgencyTone = "Tone: Enthusiastic, brief, just bubbling the application to the top of their inbox.";
  } else if (daysSinceApplied <= 7) {
    urgencyTone = "Tone: Persistent but polite, reiterating a specific piece of value from the resume.";
  } else {
    urgencyTone = "Tone: Direct, assuming they are struggling to find the right candidate, offering a quick win.";
  }

  return `You are an expert sales professional teaching a job seeker how to follow up on a job application.
The candidate applied ${daysSinceApplied} days ago and hasn't heard back yet. 
Write a short, punchy follow-up email directly to the hiring manager. 
${urgencyTone}

Do not be generic. Mention one specific, highly relevant achievement from the candidate's resume that proves they can solve the problems listed in the Job Description.

[CANDIDATE RESUME]
${JSON.stringify(resume, null, 2)}

[TARGET JOB DESCRIPTION]
${jobDescription.text}

[OUTPUT FORMAT]
Provide your response strictly as a JSON object. Do not include any markdown formatting like \`\`\`json.
The object must have:
- "subject": A brief, professional subject line.
- "body": The email body. Keep it under 150 words.

Example output:
{
  "subject": "Following up: Senior React Developer app / [Candidate Name]",
  "body": "Hi [Name], I applied for the Senior React Developer role ${daysSinceApplied} days ago and wanted to follow up directly. I noticed you're specifically looking for someone to lead the migration to Next.js. I recently led a very similar migration at Acme Corp, resulting in a 3x increase in Lighthouse scores and a 20% bump in conversion. I'd love to briefly share how we avoided the common pitfalls of that transition. Let me know if you have 10 minutes this week."
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
