"use client";

// Template 3: Executive (Bold top banner, clean minimal sections)
// Premium look for senior professionals. Strong name branding at top.

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
} from "@react-pdf/renderer";
import { ResumeData } from "@/lib/schema";

const DARK = "#0f172a";
const ACCENT = "#7c3aed"; // violet
const MID = "#64748b";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: DARK,
    backgroundColor: "#ffffff",
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 28,
  },
  // ── Top Banner ────────────────────────────────────────────────────────────
  banner: {
    backgroundColor: DARK,
    paddingHorizontal: 36,
    paddingTop: 24,
    paddingBottom: 20,
    marginBottom: 20,
  },
  name: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  currentRole: {
    fontSize: 11,
    color: "#a5b4fc",
    fontFamily: "Helvetica-Oblique",
    marginBottom: 10,
  },
  bannerContacts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  bannerContact: {
    fontSize: 8,
    color: "#cbd5e1",
  },
  // ── Body ──────────────────────────────────────────────────────────────────
  body: {
    paddingHorizontal: 36,
  },
  section: {
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: ACCENT,
    marginBottom: 8,
    borderBottomColor: "#ede9fe",
    borderBottomWidth: 1.5,
    paddingBottom: 3,
  },
  summaryText: {
    fontSize: 9,
    lineHeight: 1.65,
    color: "#334155",
  },
  jobEntry: {
    marginBottom: 10,
    paddingLeft: 8,
    borderLeftColor: "#e2d9f3",
    borderLeftWidth: 2,
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 1,
  },
  jobTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: DARK,
  },
  jobDate: {
    fontSize: 8,
    color: MID,
    textAlign: "right",
  },
  jobCompany: {
    fontSize: 9,
    color: ACCENT,
    fontFamily: "Helvetica-Oblique",
    marginBottom: 4,
  },
  bullet: {
    flexDirection: "row",
    gap: 5,
    marginBottom: 2.5,
  },
  bulletDot: {
    fontSize: 8,
    color: ACCENT,
    marginTop: 1,
  },
  bulletText: {
    fontSize: 8.5,
    lineHeight: 1.5,
    color: "#334155",
    flex: 1,
  },
  // Two-column lower section
  twoCol: {
    flexDirection: "row",
    gap: 20,
  },
  colLeft: { flex: 1 },
  colRight: { flex: 1 },
  skillChip: {
    backgroundColor: "#f5f3ff",
    color: ACCENT,
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    fontSize: 7.5,
    marginBottom: 3,
    marginRight: 3,
  },
  skillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 2,
  },
  eduEntry: { marginBottom: 7 },
  eduDegree: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  eduSchool: { fontSize: 8.5, color: MID, fontFamily: "Helvetica-Oblique" },
  eduDate: { fontSize: 7.5, color: "#94a3b8" },
  projectName: { fontSize: 9, fontFamily: "Helvetica-Bold", color: DARK },
  projectLink: { fontSize: 7.5, color: ACCENT },
  projectDesc: { fontSize: 8, lineHeight: 1.5, color: MID },
  projectEntry: { marginBottom: 7 },
});

function dateRange(start?: string, end?: string, current?: boolean) {
  if (!start) return "";
  return `${start} – ${current ? "Present" : end || "Present"}`;
}

function parseBullets(text: string): string[] {
  return text.split(/\n|•|-/).map((s) => s.trim()).filter(Boolean);
}

export function ResumeExecutiveDocument({ data }: { data: ResumeData }) {
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
        {/* Banner */}
        <View style={styles.banner}>
          <Text style={styles.name}>{personalInfo.fullName}</Text>
          {workExperience[0]?.jobTitle && (
            <Text style={styles.currentRole}>{workExperience[0].jobTitle} · {workExperience[0].company}</Text>
          )}
          <View style={styles.bannerContacts}>
            {contacts.map((c, i) => (
              <Text key={i} style={styles.bannerContact}>{c}</Text>
            ))}
          </View>
        </View>

        {/* Body */}
        <View style={styles.body}>
          {/* Summary */}
          {summary ? (
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>Profile</Text>
              <Text style={styles.summaryText}>{summary}</Text>
            </View>
          ) : null}

          {/* Experience */}
          {workExperience.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>Career History</Text>
              {workExperience.map((job, i) => (
                <View key={i} style={styles.jobEntry}>
                  <View style={styles.jobHeader}>
                    <Text style={styles.jobTitle}>{job.jobTitle}</Text>
                    <Text style={styles.jobDate}>{dateRange(job.startDate, job.endDate, job.current)}</Text>
                  </View>
                  <Text style={styles.jobCompany}>{job.company}</Text>
                  {parseBullets(job.description).map((b, bi) => (
                    <View key={bi} style={styles.bullet}>
                      <Text style={styles.bulletDot}>›</Text>
                      <Text style={styles.bulletText}>{b}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}

          {/* Two-column: Skills + Education/Projects */}
          <View style={styles.twoCol}>
            <View style={styles.colLeft}>
              {skillsList.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionHeading}>Skills</Text>
                  <View style={styles.skillsWrap}>
                    {skillsList.map((skill, i) => (
                      <Text key={i} style={styles.skillChip}>{skill}</Text>
                    ))}
                  </View>
                </View>
              )}
              {certifications && certifications.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionHeading}>Certifications</Text>
                  {certifications.map((cert, i) => (
                    <View key={i} style={styles.eduEntry}>
                      <Text style={styles.eduDegree}>{cert.name}</Text>
                      {cert.issuer && <Text style={styles.eduSchool}>{cert.issuer}</Text>}
                      {(cert.year || cert.expiry) && (
                        <Text style={styles.eduDate}>
                          {cert.year}{cert.expiry && cert.year ? " \u2013 " : ""}{cert.expiry && cert.expiry !== "No expiry" ? cert.expiry : ""}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
              {languages && languages.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionHeading}>Languages</Text>
                  {languages.map((lang, i) => (
                    <View key={i} style={{ marginBottom: 4, flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
                      <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: DARK }}>{lang.language}</Text>
                      <Text style={{ fontSize: 8, color: MID, textTransform: "capitalize" }}>{lang.proficiency}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
            <View style={styles.colRight}>
              {education.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionHeading}>Education</Text>
                  {education.map((edu, i) => (
                    <View key={i} style={styles.eduEntry}>
                      <Text style={styles.eduDegree}>{edu.degree}</Text>
                      <Text style={styles.eduSchool}>{edu.school}</Text>
                      <Text style={styles.eduDate}>{dateRange(edu.startDate, edu.endDate, edu.current)}</Text>
                    </View>
                  ))}
                </View>
              )}
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
              {awards && awards.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionHeading}>Awards &amp; Honors</Text>
                  {awards.map((award, i) => (
                    <View key={i} style={styles.projectEntry}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text style={styles.projectName}>{award.title}</Text>
                        {award.year && <Text style={styles.eduDate}>{award.year}</Text>}
                      </View>
                      {award.issuer && <Text style={styles.eduSchool}>{award.issuer}</Text>}
                      {award.description && <Text style={styles.projectDesc}>{award.description}</Text>}
                    </View>
                  ))}
                </View>
              )}
              {volunteerWork && volunteerWork.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionHeading}>Volunteer Experience</Text>
                  {volunteerWork.map((vol, i) => (
                    <View key={i} style={styles.projectEntry}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text style={styles.projectName}>{vol.role || "Volunteer"}</Text>
                        <Text style={styles.eduDate}>{dateRange(vol.startDate, vol.endDate, false)}</Text>
                      </View>
                      <Text style={styles.eduSchool}>{vol.organization}</Text>
                      {vol.description && <Text style={styles.projectDesc}>{vol.description}</Text>}
                    </View>
                  ))}
                </View>
              )}
              {publications && publications.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionHeading}>Publications</Text>
                  {publications.map((pub, i) => (
                    <View key={i} style={styles.projectEntry}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text style={styles.projectName}>{pub.title}</Text>
                        {pub.year && <Text style={styles.eduDate}>{pub.year}</Text>}
                      </View>
                      {(pub.publisher || pub.url) && (
                        <Text style={styles.eduSchool}>
                          {pub.publisher}{pub.publisher && pub.url ? " \u2014 " : ""}{pub.url ? pub.url.replace(/^https?:\/\//i, "") : ""}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
