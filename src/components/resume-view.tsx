import { Suspense } from "react";
import { Education } from "@/app/components/Education";
import { Header } from "@/app/components/Header";
import { Skills } from "@/app/components/Skills";
import { Summary } from "@/app/components/Summary";
import { WorkExperience } from "@/app/components/WorkExperience";
import { CommandMenu } from "@/components/command-menu";
import { ResumeWorkspace } from "@/components/resume-workspace";
import { SectionErrorBoundary } from "@/components/section-error-boundary";
import { SectionSkeleton } from "@/components/section-skeleton";
import type { CvRow } from "@/lib/db/queries";
import { type EditableResume, resumeToJson } from "@/lib/resume-json";
import { generateResumeStructuredData } from "@/lib/structured-data";

/**
 * Links for the command menu, de-duplicated by URL.
 *
 * personalWebsiteUrl is often also listed under contact.social — "Portfolio"
 * and "Personal Website" point at the same page today. That produced two menu
 * rows going to the same place, and the menu keys by URL, so React warned about
 * duplicate keys. First entry wins.
 */
function getCommandMenuLinks(data: EditableResume) {
  const links: { url: string; title: string }[] = [];

  if (data.personalWebsiteUrl) {
    links.push({ url: data.personalWebsiteUrl, title: "Personal Website" });
  }

  for (const social of data.contact.social) {
    links.push({ url: social.url, title: social.name });
  }

  const seen = new Set<string>();

  return links.filter(({ url }) => !seen.has(url) && seen.add(url));
}

interface ResumeViewProps {
  cv: CvRow;
  /** Every CV belonging to the same user, for the "My resumes" tab. */
  cvs: CvRow[];
  userId: string;
}

export function ResumeView({ cv, cvs, userId }: ResumeViewProps) {
  const data = cv.data;
  const structuredData = generateResumeStructuredData(data);

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Safe for JSON-LD structured data
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      {/*
        No padding at the top, and no overflow container: the toolbar hangs from
        the very top of the page, and `position: sticky` resolves against the
        nearest scrolling ancestor — an `overflow-auto` here would make that
        this element rather than the viewport. Horizontal padding belongs to the
        content column, which sets its own.
      */}
      <main className="relative min-h-screen" id="main-content">
        <div className="sr-only">
          <h1>{data.name}&apos;s Resume</h1>
        </div>

        <ResumeWorkspace
          userId={userId}
          currentSlug={cv.slug}
          json={resumeToJson(data)}
          resumes={cvs.map((entry) => ({
            slug: entry.slug,
            label: entry.label,
            about: entry.data.about,
            headline: entry.data.headline,
          }))}
          cv={
            <section
              className="mx-auto w-full max-w-2xl space-y-4 bg-white "
              aria-label="Resume Content"
            >
              <SectionErrorBoundary sectionName="Header">
                <Suspense fallback={<SectionSkeleton lines={4} />}>
                  <Header data={data} />
                </Suspense>
              </SectionErrorBoundary>

              <div className="space-y-8">
                <SectionErrorBoundary sectionName="Summary">
                  <Suspense fallback={<SectionSkeleton lines={2} />}>
                    <Summary summary={data.summary} />
                  </Suspense>
                </SectionErrorBoundary>

                <SectionErrorBoundary sectionName="Work Experience">
                  <Suspense fallback={<SectionSkeleton lines={6} />}>
                    <WorkExperience work={data.work} />
                  </Suspense>
                </SectionErrorBoundary>

                <SectionErrorBoundary sectionName="Education">
                  <Suspense fallback={<SectionSkeleton lines={3} />}>
                    <Education education={data.education} />
                  </Suspense>
                </SectionErrorBoundary>

                <SectionErrorBoundary sectionName="Skills">
                  <Suspense fallback={<SectionSkeleton lines={2} />}>
                    <Skills skills={data.skills} />
                  </Suspense>
                </SectionErrorBoundary>
              </div>
            </section>
          }
        />

        <nav className="print:hidden" aria-label="Quick navigation">
          <CommandMenu
            links={getCommandMenuLinks(data)}
            variants={cvs.map(({ slug, label }) => ({ slug, label }))}
            currentSlug={cv.slug}
            userId={userId}
          />
        </nav>
      </main>
    </>
  );
}
