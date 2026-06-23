import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

import type { Profile } from "@/types";

export type GeneratedContent = {
  summary: string;
  work_experience: Array<{
    company: string;
    title: string;
    start_date: string;
    end_date: string | null;
    is_current: boolean;
    bullets: string[];
  }>;
};

type Props = {
  profile: Profile;
  generated: GeneratedContent;
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a1a",
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111111",
  },
  subtitle: {
    fontSize: 11,
    color: "#444444",
    marginTop: 3,
  },
  contact: {
    fontSize: 9,
    color: "#666666",
    marginTop: 3,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#111111",
    marginTop: 14,
    marginBottom: 4,
    paddingBottom: 3,
  },
  summaryText: {
    fontSize: 10,
    color: "#333333",
    lineHeight: 1.5,
  },
  skillsText: {
    fontSize: 9,
    color: "#444444",
    lineHeight: 1.4,
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  jobTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#111111",
  },
  jobDates: {
    fontSize: 9,
    color: "#666666",
  },
  jobEntry: {
    marginBottom: 8,
  },
  bullet: {
    fontSize: 9,
    color: "#333333",
    marginLeft: 10,
    marginBottom: 2,
    lineHeight: 1.4,
  },
  eduDegree: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#111111",
  },
  eduDetails: {
    fontSize: 9,
    color: "#555555",
    marginTop: 2,
  },
});

export function ResumePDF({ profile, generated }: Props) {
  const contactParts = [profile.email, profile.phone].filter(Boolean);
  const linkParts = [profile.linkedin_url, profile.portfolio_url].filter(Boolean);
  const subtitleParts = [profile.current_title, profile.location].filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View>
          <Text style={styles.name}>{profile.full_name ?? ""}</Text>
          {subtitleParts.length > 0 && (
            <Text style={styles.subtitle}>{subtitleParts.join("  •  ")}</Text>
          )}
          {contactParts.length > 0 && (
            <Text style={styles.contact}>{contactParts.join("  •  ")}</Text>
          )}
          {linkParts.length > 0 && (
            <Text style={styles.contact}>{linkParts.join("  •  ")}</Text>
          )}
        </View>

        {/* Professional Summary */}
        {generated.summary ? (
          <View>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Text style={styles.summaryText}>{generated.summary}</Text>
          </View>
        ) : null}

        {/* Skills */}
        {profile.skills?.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>Skills</Text>
            <Text style={styles.skillsText}>{profile.skills.join("  •  ")}</Text>
          </View>
        ) : null}

        {/* Work Experience */}
        {generated.work_experience?.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>Work Experience</Text>
            {generated.work_experience.map((job, i) => (
              <View key={i} style={styles.jobEntry}>
                <View style={styles.jobHeader}>
                  <Text style={styles.jobTitle}>
                    {job.title} — {job.company}
                  </Text>
                  <Text style={styles.jobDates}>
                    {job.start_date} –{" "}
                    {job.is_current ? "Present" : (job.end_date ?? "")}
                  </Text>
                </View>
                {job.bullets?.map((bullet, j) => (
                  <Text key={j} style={styles.bullet}>
                    • {bullet}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        ) : null}

        {/* Education */}
        {profile.education?.degree ? (
          <View>
            <Text style={styles.sectionTitle}>Education</Text>
            <Text style={styles.eduDegree}>
              {profile.education.degree}
              {profile.education.field ? ` in ${profile.education.field}` : ""}
            </Text>
            <Text style={styles.eduDetails}>
              {[profile.education.institution, profile.education.graduation_year]
                .filter(Boolean)
                .join("  •  ")}
            </Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
