"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
} from "@react-pdf/renderer";
import { ResumeData } from "@/lib/schema";

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const ACCENT = "#4F46E5";
const SIDEBAR_BG = "#F0F0FF";
const SIDEBAR_WIDTH = "33%";
const MAIN_WIDTH = "67%";

const styles = StyleSheet.create({
  page: {
    flexDirection: "row",
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#1e293b",
    backgroundColor: "#ffffff",
  },

  // ── Sidebar ───────────────────────────────────────────────────────────────
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: SIDEBAR_BG,
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 12,
  },
  sidebarName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: ACCENT,
    flexWrap: "wrap",
    lineHeight: 1.3,
    marginBottom: 2,
  },
  sidebarTitle: {
    fontSize: 9,
    color: "#64748b",
    marginBottom: 8,
  },
  divider: {
    borderBottomColor: ACCENT,
    borderBottomWidth: 1.5,
    marginVertical: 8,
    opacity: 0.4,
  },
  sectionHeading: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: ACCENT,
    marginBottom: 5,
  },
  contactRow: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 3,
    flexWrap: "wrap",
  },
  contactLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#475569",
    width: 42,
  },
  contactValue: {
    fontSize: 7.5,
    color: "#1e293b",
    flex: 1,
    flexWrap: "wrap",
  },
  skillPill: {
    backgroundColor: "#e0e7ff",
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
  eduEntry: {
    marginBottom: 8,
  },
  eduDegree: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#1e293b",
  },
  eduSchool: {
    fontSize: 8,
    color: "#475569",
    marginTop: 1,
  },
  eduDate: {
    fontSize: 7.5,
    color: "#94a3b8",
    marginTop: 1,
  },

  // ── Main body ─────────────────────────────────────────────────────────────
  main: {
    width: MAIN_WIDTH,
    paddingHorizontal: 22,
    paddingVertical: 24,
  },
  summaryText: {
    fontSize: 8.5,
    lineHeight: 1.6,
    color: "#334155",
  },
  mainSectionHeading: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: ACCENT,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomColor: "#c7d2fe",
    borderBottomWidth: 1,
  },
  section: {
    marginBottom: 14,
  },
  jobEntry: {
    marginBottom: 9,
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 1,
  },
  jobTitle: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#1e293b",
  },
  jobDate: {
    fontSize: 7.5,
    color: "#94a3b8",
    textAlign: "right",
  },
  jobCompany: {
    fontSize: 8.5,
    color: ACCENT,
    marginBottom: 4,
    fontFamily: "Helvetica-Oblique",
  },
  bullet: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 2,
  },
  bulletDot: {
    fontSize: 8,
    color: ACCENT,
    marginTop: 1,
  },
  bulletText: {
    fontSize: 8,
    lineHeight: 1.5,
    color: "#334155",
    flex: 1,
  },
  projectEntry: {
    marginBottom: 8,
  },
  projectName: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#1e293b",
  },
  projectLink: {
    fontSize: 7.5,
    color: ACCENT,
    marginBottom: 2,
  },
  projectDesc: {
    fontSize: 8,
    lineHeight: 1.5,
    color: "#475569",
  },
});

// ─── Helpers ───────────────────────────────────────────────────────────────────
function dateRange(start?: string, end?: string, current?: boolean) {
  if (!start) return "";
  return `${start} – ${current ? "Present" : end || "Present"}`;
}

function parseBullets(text: string): string[] {
  return text
    .split(/\n|•|-/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// ─── Component ─────────────────────────────────────────────────────────────────
interface Props {
  data: ResumeData;
}

export function ResumePdfDocument({ data }: Props) {
  const { personalInfo, summary, workExperience, education, skills, projects, certifications, languages, awards, volunteerWork, publications } = data;

  const skillsList = skills
    ? skills.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <Document
      title={`${personalInfo.fullName} — Resume`}
      author={personalInfo.fullName}
    >
      <Page size="A4" style={styles.page}>
        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <View style={styles.sidebar}>
          <Text style={styles.sidebarName}>{personalInfo.fullName}</Text>
          {workExperience[0]?.jobTitle && (
            <Text style={styles.sidebarTitle}>{workExperience[0].jobTitle}</Text>
          )}

          <View style={styles.divider} />

          {/* Contact */}
          <View>
            <Text style={styles.sectionHeading}>Contact</Text>
            {personalInfo.email ? (
              <View style={styles.contactRow}>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactValue}>{personalInfo.email}</Text>
              </View>
            ) : null}
            {personalInfo.phone ? (
              <View style={styles.contactRow}>
                <Text style={styles.contactLabel}>Phone</Text>
                <Text style={styles.contactValue}>{personalInfo.phone}</Text>
              </View>
            ) : null}
            {personalInfo.location ? (
              <View style={styles.contactRow}>
                <Text style={styles.contactLabel}>Location</Text>
                <Text style={styles.contactValue}>{personalInfo.location}</Text>
              </View>
            ) : null}
            {personalInfo.linkedin ? (
              <View style={styles.contactRow}>
                <Text style={styles.contactLabel}>LinkedIn</Text>
                <Link src={personalInfo.linkedin} style={styles.contactValue}>
                  {personalInfo.linkedin.replace(/^https?:\/\//i, "")}
                </Link>
              </View>
            ) : null}
            {personalInfo.website ? (
              <View style={styles.contactRow}>
                <Text style={styles.contactLabel}>Website</Text>
                <Link src={personalInfo.website} style={styles.contactValue}>
                  {personalInfo.website.replace(/^https?:\/\//i, "")}
                </Link>
              </View>
            ) : null}
          </View>

          {/* Skills */}
          {skillsList.length > 0 && (
            <View>
              <View style={styles.divider} />
              <Text style={styles.sectionHeading}>Skills</Text>
              <View style={styles.skillsWrap}>
                {skillsList.map((skill, i) => (
                  <Text key={i} style={styles.skillPill}>
                    {skill}
                  </Text>
                ))}
              </View>
            </View>
          )}

          {/* Education */}
          {education && education.length > 0 && (
            <View>
              <View style={styles.divider} />
              <Text style={styles.sectionHeading}>Education</Text>
              {education.map((edu, i) => (
                <View key={i} style={styles.eduEntry}>
                  <Text style={styles.eduDegree}>{edu.degree}</Text>
                  <Text style={styles.eduSchool}>{edu.school}</Text>
                  <Text style={styles.eduDate}>
                    {dateRange(edu.startDate, edu.endDate, edu.current)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Certifications */}
          {certifications && certifications.length > 0 && (
            <View>
              <View style={styles.divider} />
              <Text style={styles.sectionHeading}>Certifications</Text>
              {certifications.map((cert, i) => (
                <View key={i} style={{ marginBottom: 6 }}>
                  <Text style={{ fontSize: 8.5, fontFamily: "Helvetica-Bold", color: "#1e293b" }}>{cert.name}</Text>
                  {cert.issuer && <Text style={{ fontSize: 8, color: "#475569", marginTop: 1 }}>{cert.issuer}</Text>}
                  {(cert.year || cert.expiry) && (
                    <Text style={{ fontSize: 7.5, color: "#94a3b8", marginTop: 1 }}>
                      {cert.year}{cert.expiry && cert.year ? " \u2013 " : ""}{cert.expiry && cert.expiry !== "No expiry" ? cert.expiry : ""}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Languages */}
          {languages && languages.length > 0 && (
            <View>
              <View style={styles.divider} />
              <Text style={styles.sectionHeading}>Languages</Text>
              {languages.map((lang, i) => (
                <View key={i} style={{ marginBottom: 4, flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
                  <Text style={{ fontSize: 8.5, color: "#1e293b", fontFamily: "Helvetica-Bold" }}>{lang.language}</Text>
                  <Text style={{ fontSize: 7.5, color: "#64748b", textTransform: "capitalize" }}>{lang.proficiency}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Main Body ───────────────────────────────────────────────────── */}
        <View style={styles.main}>
          {/* Summary */}
          {summary ? (
            <View style={styles.section}>
              <Text style={styles.mainSectionHeading}>Summary</Text>
              <Text style={styles.summaryText}>{summary}</Text>
            </View>
          ) : null}

          {/* Work Experience */}
          {workExperience && workExperience.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.mainSectionHeading}>Experience</Text>
              {workExperience.map((job, i) => (
                <View key={i} style={styles.jobEntry}>
                  <View style={styles.jobHeader}>
                    <Text style={styles.jobTitle}>{job.jobTitle}</Text>
                    <Text style={styles.jobDate}>
                      {dateRange(job.startDate, job.endDate, job.current)}
                    </Text>
                  </View>
                  <Text style={styles.jobCompany}>{job.company}</Text>
                  {parseBullets(job.description).map((bullet, bi) => (
                    <View key={bi} style={styles.bullet}>
                      <Text style={styles.bulletDot}>▸</Text>
                      <Text style={styles.bulletText}>{bullet}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}

          {/* Projects */}
          {projects && projects.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.mainSectionHeading}>Projects</Text>
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

          {/* Awards */}
          {awards && awards.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.mainSectionHeading}>Awards &amp; Honors</Text>
              {awards.map((award, i) => (
                <View key={i} style={styles.jobEntry}>
                  <View style={styles.jobHeader}>
                    <Text style={styles.jobTitle}>{award.title}</Text>
                    <Text style={styles.jobDate}>{award.year || ""}</Text>
                  </View>
                  {award.issuer && <Text style={styles.jobCompany}>{award.issuer}</Text>}
                  {award.description && <Text style={{ fontSize: 8, lineHeight: 1.5, color: "#475569" }}>{award.description}</Text>}
                </View>
              ))}
            </View>
          )}

          {/* Volunteer */}
          {volunteerWork && volunteerWork.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.mainSectionHeading}>Volunteer Experience</Text>
              {volunteerWork.map((vol, i) => (
                <View key={i} style={styles.jobEntry}>
                  <View style={styles.jobHeader}>
                    <Text style={styles.jobTitle}>{vol.role || "Volunteer"}</Text>
                    <Text style={styles.jobDate}>{dateRange(vol.startDate, vol.endDate, false)}</Text>
                  </View>
                  <Text style={styles.jobCompany}>{vol.organization}</Text>
                  {vol.description && <Text style={{ fontSize: 8, lineHeight: 1.5, color: "#475569" }}>{vol.description}</Text>}
                </View>
              ))}
            </View>
          )}

          {/* Publications */}
          {publications && publications.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.mainSectionHeading}>Publications</Text>
              {publications.map((pub, i) => (
                <View key={i} style={styles.projectEntry}>
                  <Text style={styles.projectName}>{pub.title}</Text>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
                    {pub.publisher && <Text style={styles.jobCompany}>{pub.publisher}</Text>}
                    <Text style={styles.jobDate}>{pub.year || ""}</Text>
                  </View>
                  {pub.url && <Link src={pub.url} style={styles.projectLink}>{pub.url.replace(/^https?:\/\//i, "")}</Link>}
                </View>
              ))}
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
}
