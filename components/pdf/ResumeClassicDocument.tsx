"use client";

// Template 2: Classic (ATS-Friendly Single Column)
// The safest and most ATS-compatible layout — no columns, clean hierarchy.

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
} from "@react-pdf/renderer";
import { ResumeData } from "@/lib/schema";

const ACCENT = "#1e40af"; // deep blue

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: "#1e293b",
    backgroundColor: "#ffffff",
    paddingHorizontal: 36,
    paddingVertical: 32,
  },
  header: {
    textAlign: "center",
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomColor: ACCENT,
    borderBottomWidth: 2,
  },
  name: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: ACCENT,
    letterSpacing: 1,
    marginBottom: 3,
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  contactItem: {
    fontSize: 8,
    color: "#475569",
  },
  separator: {
    fontSize: 8,
    color: "#94a3b8",
  },
  section: {
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: ACCENT,
    paddingBottom: 2,
    borderBottomColor: "#dbeafe",
    borderBottomWidth: 1.5,
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 9,
    lineHeight: 1.6,
    color: "#334155",
  },
  jobEntry: {
    marginBottom: 7,
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  jobTitleCompany: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#1e293b",
  },
  jobDate: {
    fontSize: 8,
    color: "#64748b",
  },
  jobLocation: {
    fontSize: 8.5,
    color: ACCENT,
    fontFamily: "Helvetica-Oblique",
    marginBottom: 3,
  },
  bullet: {
    flexDirection: "row",
    gap: 5,
    marginBottom: 2,
  },
  bulletDot: {
    fontSize: 8,
    color: ACCENT,
  },
  bulletText: {
    fontSize: 8.5,
    lineHeight: 1.5,
    color: "#334155",
    flex: 1,
  },
  skillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  skillText: {
    fontSize: 8.5,
    color: "#334155",
  },
  eduEntry: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  eduLeft: { flex: 1 },
  eduDegree: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: "#1e293b" },
  eduSchool: { fontSize: 8.5, color: "#475569", fontFamily: "Helvetica-Oblique" },
  eduDate: { fontSize: 8, color: "#64748b" },
  projectEntry: { marginBottom: 6 },
  projectName: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: "#1e293b" },
  projectLink: { fontSize: 8, color: ACCENT },
  projectDesc: { fontSize: 8.5, lineHeight: 1.5, color: "#475569" },
});

function dateRange(start?: string, end?: string, current?: boolean) {
  if (!start) return "";
  return `${start} – ${current ? "Present" : end || "Present"}`;
}

function parseBullets(text: string): string[] {
  return text.split(/\n|•|-/).map((s) => s.trim()).filter(Boolean);
}

export function ResumeClassicDocument({ data }: { data: ResumeData }) {
  const { personalInfo, summary, workExperience, education, skills, projects, certifications, languages, awards, volunteerWork, publications } = data;
  const skillsList = skills ? skills.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const contacts = [
    personalInfo.email,
    personalInfo.phone,
    personalInfo.location,
    personalInfo.linkedin?.replace(/^https?:\/\//i, ""),
    personalInfo.website?.replace(/^https?:\/\//i, ""),
  ].filter(Boolean);

  return (
    <Document title={`${personalInfo.fullName} — Resume`} author={personalInfo.fullName}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{personalInfo.fullName.toUpperCase()}</Text>
          <View style={styles.contactRow}>
            {contacts.map((c, i) => (
              <View key={i} style={{ flexDirection: "row", gap: 8 }}>
                {i > 0 && <Text style={styles.separator}>|</Text>}
                <Text style={styles.contactItem}>{c}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Summary */}
        {summary ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Professional Summary</Text>
            <Text style={styles.summaryText}>{summary}</Text>
          </View>
        ) : null}

        {/* Experience */}
        {workExperience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Experience</Text>
            {workExperience.map((job, i) => (
              <View key={i} style={styles.jobEntry}>
                <View style={styles.jobHeader}>
                  <Text style={styles.jobTitleCompany}>{job.jobTitle} — {job.company}</Text>
                  <Text style={styles.jobDate}>{dateRange(job.startDate, job.endDate, job.current)}</Text>
                </View>
                {parseBullets(job.description).map((b, bi) => (
                  <View key={bi} style={styles.bullet}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{b}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Education</Text>
            {education.map((edu, i) => (
              <View key={i} style={styles.eduEntry}>
                <View style={styles.eduLeft}>
                  <Text style={styles.eduDegree}>{edu.degree}</Text>
                  <Text style={styles.eduSchool}>{edu.school}</Text>
                </View>
                <Text style={styles.eduDate}>{dateRange(edu.startDate, edu.endDate, edu.current)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {skillsList.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Skills</Text>
            <View style={styles.skillsRow}>
              {skillsList.map((skill, i) => (
                <Text key={i} style={styles.skillText}>
                  {skill}{i < skillsList.length - 1 ? "  •" : ""}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Projects</Text>
            {projects.map((proj, i) => (
              <View key={i} style={styles.projectEntry}>
                <Text style={styles.projectName}>{proj.name}</Text>
                {proj.link ? (
                  <Link src={proj.link} style={styles.projectLink}>
                    {proj.link.replace(/^https?:\/\//i, "")}
                  </Link>
                ) : null}
                <Text style={styles.projectDesc}>{proj.description}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Certifications */}
        {certifications && certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Certifications</Text>
            {certifications.map((cert, i) => (
              <View key={i} style={styles.jobEntry}>
                <View style={styles.jobHeader}>
                  <Text style={styles.jobTitleCompany}>{cert.name}</Text>
                  {(cert.year || cert.expiry) && (
                    <Text style={styles.jobDate}>
                      {cert.year}{cert.expiry && cert.year ? " \u2013 " : ""}{cert.expiry && cert.expiry !== "No expiry" ? cert.expiry : ""}
                    </Text>
                  )}
                </View>
                {cert.issuer && <Text style={styles.jobLocation}>{cert.issuer}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Languages */}
        {languages && languages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Languages</Text>
            <View style={styles.skillsRow}>
              {languages.map((lang, i) => (
                <Text key={i} style={styles.skillText}>
                  <Text style={{ fontFamily: "Helvetica-Bold" }}>{lang.language}</Text> ({lang.proficiency}){i < languages.length - 1 ? "  •" : ""}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Awards */}
        {awards && awards.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Awards &amp; Honors</Text>
            {awards.map((award, i) => (
               <View key={i} style={styles.jobEntry}>
                <View style={styles.jobHeader}>
                  <Text style={styles.jobTitleCompany}>{award.title}</Text>
                  {award.year && <Text style={styles.jobDate}>{award.year}</Text>}
                </View>
                {award.issuer && <Text style={styles.jobLocation}>{award.issuer}</Text>}
                {award.description && <Text style={styles.bulletText}>{award.description}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Volunteer Work */}
        {volunteerWork && volunteerWork.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Volunteer Experience</Text>
            {volunteerWork.map((vol, i) => (
              <View key={i} style={styles.jobEntry}>
                 <View style={styles.jobHeader}>
                  <Text style={styles.jobTitleCompany}>{vol.role || "Volunteer"} \u2014 {vol.organization}</Text>
                  <Text style={styles.jobDate}>{dateRange(vol.startDate, vol.endDate, false)}</Text>
                </View>
                {vol.description && <Text style={styles.bulletText}>{vol.description}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Publications */}
        {publications && publications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Publications</Text>
            {publications.map((pub, i) => (
              <View key={i} style={styles.jobEntry}>
                <View style={styles.jobHeader}>
                  <Text style={styles.jobTitleCompany}>{pub.title}</Text>
                   {pub.year && <Text style={styles.jobDate}>{pub.year}</Text>}
                </View>
                {(pub.publisher || pub.url) && (
                  <Text style={styles.jobLocation}>
                     {pub.publisher}{pub.publisher && pub.url ? " \u2014 " : ""}{pub.url ? pub.url.replace(/^https?:\/\//i, "") : ""}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}
