"use client";

import { useImperativeHandle, useRef, useState, useTransition } from "react";

import { saveProfile } from "@/actions/profile";
import type { ExtractedProfile } from "@/actions/profile";
import type { Profile } from "@/types";

type WorkExperienceEntry = {
  company: string;
  title: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  responsibilities: string;
};

export type ProfileFormHandle = {
  applyExtracted: (data: ExtractedProfile) => void;
};

type Props = {
  profile: Profile | null;
  formRef?: React.Ref<ProfileFormHandle>;
};

const defaultWorkEntry = (): WorkExperienceEntry => ({
  company: "",
  title: "",
  start_date: "",
  end_date: "",
  is_current: false,
  responsibilities: "",
});

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 40 }, (_, i) => String(CURRENT_YEAR - i));

const EXPERIENCE_LEVELS = ["Junior", "Mid-Level", "Senior", "Lead", "Manager", "Director", "Executive"];
const WORK_AUTH_OPTIONS = ["Citizen", "Permanent Resident", "Work Visa (H1B)", "Work Visa (Other)", "Student Visa (OPT/CPT)", "Requires Sponsorship"];
const DEGREE_OPTIONS = ["High School", "Associate's", "Bachelor's", "Master's", "Ph.D.", "MBA", "Bootcamp / Certificate"];
const REMOTE_OPTIONS = ["Any", "Remote Only", "Hybrid", "On-site"];
const TONE_OPTIONS = ["Professional", "Conversational", "Enthusiastic", "Concise"];

function FormLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-text-secondary">
      {children}
    </label>
  );
}

function FormInput({
  placeholder,
  value,
  onChange,
  readOnly,
  type = "text",
}: {
  placeholder?: string;
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  type?: string;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      readOnly={readOnly}
      onChange={(e) => onChange?.(e.target.value)}
      className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent disabled:bg-surface-secondary read-only:bg-surface-secondary read-only:text-text-secondary"
    />
  );
}

function FormSelect({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

function TagInput({
  tags,
  onAdd,
  onRemove,
  placeholder,
}: {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");

  function handleAdd() {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onAdd(trimmed);
      setInput("");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary"
        >
          Add
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 rounded-full bg-accent-light px-2.5 py-0.5 text-xs font-medium text-accent"
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemove(tag)}
                className="ml-0.5 leading-none hover:text-accent-dark"
                aria-label={`Remove ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-4 text-sm font-semibold text-text-primary">{children}</h3>
  );
}

function MonthYearSelect({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const parts = value ? value.split(" ") : ["", ""];
  const month = parts[0] ?? "";
  const year = parts[1] ?? "";

  function update(m: string, y: string) {
    if (m && y) onChange(`${m} ${y}`);
    else if (m) onChange(m);
    else if (y) onChange(y);
    else onChange("");
  }

  return (
    <div className="flex gap-2">
      <select
        value={month}
        onChange={(e) => update(e.target.value, year)}
        className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
      >
        <option value="">{placeholder ?? "Month"}</option>
        {MONTHS.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      <select
        value={year}
        onChange={(e) => update(month, e.target.value)}
        className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
      >
        <option value="">Year</option>
        {YEARS.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ProfileForm({ profile, formRef }: Props) {
  const [isPending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Personal Info
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [email] = useState(profile?.email ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [location, setLocation] = useState(profile?.location ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.linkedin_url ?? "");
  const [portfolioUrl, setPortfolioUrl] = useState(profile?.portfolio_url ?? "");
  const [workAuth, setWorkAuth] = useState(profile?.work_authorization ?? "");

  // Professional Info
  const [currentTitle, setCurrentTitle] = useState(profile?.current_title ?? "");
  const [experienceLevel, setExperienceLevel] = useState(profile?.experience_level ?? "");
  const [yearsExperience, setYearsExperience] = useState(
    profile?.years_experience != null ? String(profile.years_experience) : "",
  );
  const [skills, setSkills] = useState<string[]>(profile?.skills ?? []);
  const [industries, setIndustries] = useState<string[]>(profile?.industries ?? []);

  // Work Experience
  const [workEntries, setWorkEntries] = useState<WorkExperienceEntry[]>(
    profile?.work_experience?.map((w) => ({
      company: w.company,
      title: w.title,
      start_date: w.start_date,
      end_date: w.end_date ?? "",
      is_current: w.is_current,
      responsibilities: w.responsibilities,
    })) ?? [defaultWorkEntry()],
  );

  // Education
  const [degree, setDegree] = useState(profile?.education?.degree ?? "");
  const [fieldOfStudy, setFieldOfStudy] = useState(profile?.education?.field ?? "");
  const [institution, setInstitution] = useState(profile?.education?.institution ?? "");
  const [graduationYear, setGraduationYear] = useState(profile?.education?.graduation_year ?? "");

  // Job Preferences
  const [jobTitlesSeeking, setJobTitlesSeeking] = useState<string[]>(
    profile?.job_titles_seeking ?? [],
  );
  const [remotePreference, setRemotePreference] = useState(profile?.remote_preference ?? "");
  const [salaryExpectation, setSalaryExpectation] = useState(profile?.salary_expectation ?? "");
  const [preferredLocations, setPreferredLocations] = useState<string[]>(
    profile?.preferred_locations ?? [],
  );
  const [coverLetterTone, setCoverLetterTone] = useState(profile?.cover_letter_tone ?? "");

  useImperativeHandle(formRef, () => ({
    applyExtracted(data: ExtractedProfile) {
      if (data.full_name) setFullName(data.full_name);
      if (data.phone) setPhone(data.phone);
      if (data.location) setLocation(data.location);
      if (data.linkedin_url) setLinkedinUrl(data.linkedin_url);
      if (data.portfolio_url) setPortfolioUrl(data.portfolio_url);
      if (data.current_title) setCurrentTitle(data.current_title);
      if (data.experience_level) setExperienceLevel(data.experience_level);
      if (data.years_experience != null)
        setYearsExperience(String(data.years_experience));
      if (data.skills.length > 0) setSkills(data.skills);
      if (data.industries.length > 0) setIndustries(data.industries);
      if (data.work_experience.length > 0)
        setWorkEntries(
          data.work_experience.map((w) => ({
            company: w.company,
            title: w.title,
            start_date: w.start_date,
            end_date: w.end_date ?? "",
            is_current: w.is_current,
            responsibilities: w.responsibilities,
          })),
        );
      if (data.education) {
        if (data.education.degree) setDegree(data.education.degree);
        if (data.education.field) setFieldOfStudy(data.education.field);
        if (data.education.institution) setInstitution(data.education.institution);
        if (data.education.graduation_year)
          setGraduationYear(data.education.graduation_year);
      }
      if (data.job_titles_seeking.length > 0)
        setJobTitlesSeeking(data.job_titles_seeking);
    },
  }));

  function updateWorkEntry<K extends keyof WorkExperienceEntry>(
    index: number,
    key: K,
    value: WorkExperienceEntry[K],
  ) {
    setWorkEntries((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, [key]: value } : entry)),
    );
  }

  function addWorkEntry() {
    setWorkEntries((prev) => [...prev, defaultWorkEntry()]);
  }

  function removeWorkEntry(index: number) {
    setWorkEntries((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);

    startTransition(async () => {
      const result = await saveProfile({
        fullName,
        phone,
        location,
        linkedinUrl,
        portfolioUrl,
        workAuth,
        currentTitle,
        experienceLevel,
        yearsExperience,
        skills,
        industries,
        workEntries,
        degree,
        fieldOfStudy,
        institution,
        graduationYear,
        jobTitlesSeeking,
        remotePreference,
        salaryExpectation,
        preferredLocations,
        coverLetterTone,
      });

      if (result.success) {
        setSaveSuccess(true);
      } else {
        setSaveError(result.error ?? "Failed to save profile");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <section className="rounded-2xl border border-border bg-surface shadow-card">
        <div className="border-b border-border px-6 py-5">
          <h2 className="text-base font-semibold text-text-primary">
            Profile Information
          </h2>
          <p className="mt-0.5 text-sm text-text-secondary">
            Your profile information directly represents you in agent interactions.
          </p>
        </div>

        <div className="space-y-8 p-6">
          {/* Personal Info */}
          <div>
            <SectionHeading>Personal Info</SectionHeading>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <FormLabel>Full Name</FormLabel>
                <FormInput
                  placeholder="Jane Smith"
                  value={fullName}
                  onChange={setFullName}
                />
              </div>
              <div>
                <FormLabel>Email</FormLabel>
                <FormInput value={email} readOnly />
              </div>
              <div>
                <FormLabel>Phone Number</FormLabel>
                <FormInput
                  placeholder="+1 (865) 555-0100"
                  value={phone}
                  onChange={setPhone}
                />
              </div>
              <div>
                <FormLabel>Location</FormLabel>
                <FormInput
                  placeholder="New York, NY"
                  value={location}
                  onChange={setLocation}
                />
              </div>
              <div>
                <FormLabel>LinkedIn URL</FormLabel>
                <FormInput
                  placeholder="linkedin.com/in/yourname"
                  value={linkedinUrl}
                  onChange={setLinkedinUrl}
                />
              </div>
              <div>
                <FormLabel>Portfolio / GitHub</FormLabel>
                <FormInput
                  placeholder="https://github.com/yourname"
                  value={portfolioUrl}
                  onChange={setPortfolioUrl}
                />
              </div>
              <div className="sm:col-span-2">
                <FormLabel>Work Authorization</FormLabel>
                <div className="max-w-xs">
                  <FormSelect
                    options={WORK_AUTH_OPTIONS}
                    value={workAuth}
                    onChange={setWorkAuth}
                    placeholder="Select..."
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Professional Info */}
          <div>
            <SectionHeading>Professional Info</SectionHeading>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FormLabel>Current / Last Job Title</FormLabel>
                <FormInput
                  placeholder="Frontend Engineer"
                  value={currentTitle}
                  onChange={setCurrentTitle}
                />
              </div>
              <div>
                <FormLabel>Experience Level</FormLabel>
                <FormSelect
                  options={EXPERIENCE_LEVELS}
                  value={experienceLevel}
                  onChange={setExperienceLevel}
                  placeholder="Select level..."
                />
              </div>
              <div>
                <FormLabel>Years of Experience</FormLabel>
                <FormInput
                  type="number"
                  placeholder="4"
                  value={yearsExperience}
                  onChange={(v) => {
                    if (v === "" || /^\d+$/.test(v)) setYearsExperience(v);
                  }}
                />
              </div>
              <div className="sm:col-span-2">
                <FormLabel>Skills</FormLabel>
                <TagInput
                  tags={skills}
                  onAdd={(tag) => setSkills((prev) => [...prev, tag])}
                  onRemove={(tag) => setSkills((prev) => prev.filter((s) => s !== tag))}
                  placeholder="e.g. React, TypeScript"
                />
              </div>
              <div className="sm:col-span-2">
                <FormLabel>Industries Worked in (Optional)</FormLabel>
                <TagInput
                  tags={industries}
                  onAdd={(tag) => setIndustries((prev) => [...prev, tag])}
                  onRemove={(tag) => setIndustries((prev) => prev.filter((i) => i !== tag))}
                  placeholder="e.g. FinTech, Healthcare"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Work Experience */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">
                Work Experience
              </h3>
              <button
                type="button"
                onClick={addWorkEntry}
                className="text-xs font-medium text-accent transition-opacity hover:opacity-75"
              >
                + Add role
              </button>
            </div>

            <div className="space-y-6">
              {workEntries.map((entry, index) => (
                <div
                  key={index}
                  className="relative rounded-xl border border-border p-4"
                >
                  {workEntries.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeWorkEntry(index)}
                      className="absolute right-3 top-3 text-xs text-text-muted hover:text-error"
                      aria-label="Remove this role"
                    >
                      ✕
                    </button>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <FormLabel>Company Name</FormLabel>
                      <FormInput
                        placeholder="Acme Inc."
                        value={entry.company}
                        onChange={(v) => updateWorkEntry(index, "company", v)}
                      />
                    </div>
                    <div>
                      <FormLabel>Job Title</FormLabel>
                      <FormInput
                        placeholder="Frontend Engineer"
                        value={entry.title}
                        onChange={(v) => updateWorkEntry(index, "title", v)}
                      />
                    </div>
                    <div>
                      <FormLabel>Start Date</FormLabel>
                      <MonthYearSelect
                        value={entry.start_date}
                        onChange={(v) => updateWorkEntry(index, "start_date", v)}
                      />
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <FormLabel>End Date</FormLabel>
                        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-text-secondary">
                          <input
                            type="checkbox"
                            checked={entry.is_current}
                            onChange={(e) =>
                              updateWorkEntry(index, "is_current", e.target.checked)
                            }
                            className="accent-accent"
                          />
                          Currently working here
                        </label>
                      </div>
                      <MonthYearSelect
                        value={entry.is_current ? "" : entry.end_date}
                        onChange={(v) => updateWorkEntry(index, "end_date", v)}
                        placeholder={entry.is_current ? "Present" : "Month"}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <FormLabel>Key Responsibilities</FormLabel>
                      <textarea
                        placeholder="Describe your key responsibilities..."
                        value={entry.responsibilities}
                        onChange={(e) =>
                          updateWorkEntry(index, "responsibilities", e.target.value)
                        }
                        rows={3}
                        className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Education */}
          <div>
            <SectionHeading>Education</SectionHeading>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <FormLabel>Highest Degree</FormLabel>
                <FormSelect
                  options={DEGREE_OPTIONS}
                  value={degree}
                  onChange={setDegree}
                  placeholder="Select degree..."
                />
              </div>
              <div>
                <FormLabel>Field of Study</FormLabel>
                <FormInput
                  placeholder="Computer Science"
                  value={fieldOfStudy}
                  onChange={setFieldOfStudy}
                />
              </div>
              <div>
                <FormLabel>Institution Name</FormLabel>
                <FormInput
                  placeholder="e.g. State University"
                  value={institution}
                  onChange={setInstitution}
                />
              </div>
              <div>
                <FormLabel>Graduation Year</FormLabel>
                <FormInput
                  placeholder="YYYY"
                  value={graduationYear}
                  onChange={setGraduationYear}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Job Preferences */}
          <div>
            <SectionHeading>Job Preferences</SectionHeading>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FormLabel>Job Titles Seeking</FormLabel>
                <TagInput
                  tags={jobTitlesSeeking}
                  onAdd={(tag) => setJobTitlesSeeking((prev) => [...prev, tag])}
                  onRemove={(tag) =>
                    setJobTitlesSeeking((prev) => prev.filter((t) => t !== tag))
                  }
                  placeholder="Frontend Engineer, React Developer"
                />
              </div>
              <div>
                <FormLabel>Remote Preference</FormLabel>
                <FormSelect
                  options={REMOTE_OPTIONS}
                  value={remotePreference}
                  onChange={setRemotePreference}
                  placeholder="Select..."
                />
              </div>
              <div>
                <FormLabel>Salary Expectation (Optional)</FormLabel>
                <FormInput
                  placeholder="e.g. $85k+"
                  value={salaryExpectation}
                  onChange={setSalaryExpectation}
                />
              </div>
              <div>
                <FormLabel>Cover Letter Tone</FormLabel>
                <FormSelect
                  options={TONE_OPTIONS}
                  value={coverLetterTone}
                  onChange={setCoverLetterTone}
                  placeholder="Select tone..."
                />
              </div>
              <div className="sm:col-span-2">
                <FormLabel>Preferred Locations (Optional)</FormLabel>
                <TagInput
                  tags={preferredLocations}
                  onAdd={(tag) => setPreferredLocations((prev) => [...prev, tag])}
                  onRemove={(tag) =>
                    setPreferredLocations((prev) => prev.filter((l) => l !== tag))
                  }
                  placeholder="e.g. New York, London"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border px-6 py-4">
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {isPending ? "Saving..." : "Save Profile"}
          </button>
          {saveError && (
            <p className="mt-2 text-center text-sm text-error">{saveError}</p>
          )}
          {saveSuccess && (
            <p className="mt-2 text-center text-sm text-success">
              Profile saved successfully.
            </p>
          )}
        </div>
      </section>
    </form>
  );
}
