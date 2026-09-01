import { CommandMenu } from "@/components/command-menu";
import { Education } from "@/components/resume/Education";
import { Header } from "@/components/resume/Header";
import { Skills } from "@/components/resume/Skills";
import { Summary } from "@/components/resume/Summary";
import { WorkExperience } from "@/components/resume/WorkExperience";
import { ResumeWorkspace } from "@/components/resume-workspace";
import { SectionErrorBoundary } from "@/components/section-error-boundary";
import type { CvRow } from "@/lib/db/queries";
import { previewText } from "@/lib/edit/resume-code";
import { type EditableResume, resumeToJson } from "@/lib/resume-json";
import { generateResumeStructuredData } from "@/lib/structured-data";
import { themeAttribute } from "@/lib/themes";

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

/*
 * The sections render synchronously from data already in hand, so there is
 * nothing to Suspend on — the server HTML always carries the finished CV, and
 * the first paint is the final layout. Each section keeps its own error
 * boundary so one malformed field cannot blank the whole page.
 */
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
      {/*
        data-cv-theme drives the whole palette: globals.css lifts it to the
        root with :has(), so it is rendered by the server — the first paint
        and the PDF are themed — and swapped in place by the theme dropdown.
      */}
      <main
        className="relative min-h-screen"
        id="main-content"
        data-cv-theme-root=""
        data-cv-theme={themeAttribute(data.theme)}
      >
        <div className="sr-only">
          <h1>{data.name}&apos;s Resume</h1>
        </div>

        <ResumeWorkspace
          userId={userId}
          currentSlug={cv.slug}
          currentLabel={cv.label}
          theme={data.theme}
          json={resumeToJson(data)}
          resumes={cvs.map((entry) => ({
            slug: entry.slug,
            label: entry.label,
            // The card's body: the CV's own About text, clipped to 140 chars.
            about: previewText(entry.data.summary, 140),
            headline: entry.data.headline,
          }))}
          cv={
            <section
              className="mx-auto w-full max-w-2xl space-y-4 bg-background"
              aria-label="Resume Content"
            >
              <SectionErrorBoundary sectionName="Header">
                <Header data={data} />
              </SectionErrorBoundary>

              <div className="space-y-8">
                <SectionErrorBoundary sectionName="Summary">
                  <Summary summary={data.summary} />
                </SectionErrorBoundary>

                <SectionErrorBoundary sectionName="Work Experience">
                  <WorkExperience work={data.work} />
                </SectionErrorBoundary>

                <SectionErrorBoundary sectionName="Education">
                  <Education education={data.education} />
                </SectionErrorBoundary>

                <SectionErrorBoundary sectionName="Skills">
                  <Skills skills={data.skills} />
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
