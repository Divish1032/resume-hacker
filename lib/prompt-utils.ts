export function generateResumePrompt(resumeText: string): string {
  return `
You are an expert resume parser. Your task is to extract information from the following resume text and structure it according to the JSON schema below.

JSON Schema:
{
  "personalInfo": {
    "fullName": "string",
    "email": "string",
    "phone": "string (optional)",
    "linkedin": "string (optional)",
    "website": "string (optional)",
    "location": "string (optional)"
  },
  "summary": "string (professional summary, optional)",
  "workExperience": [
    {
      "id": "string (generate a unique ID)",
      "jobTitle": "string",
      "company": "string",
      "startDate": "string",
      "endDate": "string (optional)",
      "current": "boolean",
      "description": "string"
    }
  ],
  "education": [
    {
      "id": "string (generate a unique ID)",
      "degree": "string",
      "school": "string",
      "startDate": "string",
      "endDate": "string (optional)",
      "current": "boolean"
    }
  ],
  "projects": [
    {
      "id": "string (generate a unique ID)",
      "name": "string",
      "description": "string",
      "link": "string (optional)"
    }
  ],
  "skills": "string (comma separated list)",
  "certifications": [
    {
      "id": "string (generate a unique ID)",
      "name": "string (e.g. AWS Solutions Architect, PMP, CFA Level 1)",
      "issuer": "string (optional, e.g. Amazon, PMI, CFA Institute)",
      "year": "string (optional, year obtained)",
      "expiry": "string (optional, expiry year or 'No expiry')",
      "url": "string (optional, verification URL)"
    }
  ],
  "languages": [
    {
      "id": "string (generate a unique ID)",
      "language": "string (e.g. English, Spanish, Mandarin)",
      "proficiency": "native | fluent | intermediate | basic"
    }
  ],
  "awards": [
    {
      "id": "string (generate a unique ID)",
      "title": "string (e.g. Employee of the Year, Dean's List)",
      "issuer": "string (optional, organization that issued the award)",
      "year": "string (optional)",
      "description": "string (optional, 1 sentence)"
    }
  ],
  "volunteerWork": [
    {
      "id": "string (generate a unique ID)",
      "organization": "string",
      "role": "string (optional, e.g. Mentor, Coordinator)",
      "startDate": "string (optional)",
      "endDate": "string (optional)",
      "description": "string (optional)"
    }
  ],
  "publications": [
    {
      "id": "string (generate a unique ID)",
      "title": "string (paper, article, or book title)",
      "publisher": "string (optional, journal, conference, or platform)",
      "year": "string (optional)",
      "url": "string (optional)"
    }
  ]
}

Instructions:
1. Extract the candidate's full name, email, phone, LinkedIn, website, and location.
2. Extract the professional summary if available.
3. Extract all work experience entries. For each entry, provide the job title, company, start/end dates, current status, and a description.
4. Extract all education entries.
5. Extract projects if available.
6. Extract skills as a comma-separated string.
7. Extract certifications if any are mentioned (look for "Certified", "Certificate", "Certification", "License", AWS/GCP/Azure/PMP/CFA etc.).
8. Extract languages spoken if mentioned.
9. Extract awards, honors, achievements, or recognition if mentioned.
10. Extract volunteer work or community service if mentioned.
11. Extract publications, research papers, patents, or articles if mentioned.
12. Only include sections that have actual data — do NOT include empty arrays.
13. Return ONLY the JSON object. Do not include any markdown formatting or explanation.

Resume Text:
${resumeText}
`;
}
