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
import { RESUME_VARIANTS, type ResumeVariant } from "@/data/resumes";
import { resumeToJson } from "@/lib/resume-json";
import { generateResumeStructuredData } from "@/lib/structured-data";

function getCommandMenuLinks(variant: ResumeVariant) {
  const { data } = variant;
  const links = [];

  if (data.personalWebsiteUrl) {
    links.push({
      url: data.personalWebsiteUrl,
      title: "Personal Website",
    });
  }

  return [
    ...links,
    ...data.contact.social.map((socialMediaLink) => ({
      url: socialMediaLink.url,
      title: socialMediaLink.name,
    })),
  ];
}

interface ResumeViewProps {
  variant: ResumeVariant;
}

export function ResumeView({ variant }: ResumeViewProps) {
  const data = variant.data;
  const headings = variant.headings;
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
      <main
        className="container relative mx-auto scroll-my-12 overflow-auto p-8"
        id="main-content"
      >
        <div className="sr-only">
          <h1>{data.name}&apos;s Resume</h1>
        </div>

        <ResumeWorkspace
          currentSlug={variant.slug}
          json={resumeToJson(data)}
          resumes={RESUME_VARIANTS.map(
            ({ slug, label, note, location, experience }) => ({
              slug,
              label,
              note,
              location,
              experience,
            })
          )}
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
                    <Summary summary={data.summary} heading={headings?.about} />
                  </Suspense>
                </SectionErrorBoundary>

                <SectionErrorBoundary sectionName="Work Experience">
                  <Suspense fallback={<SectionSkeleton lines={6} />}>
                    <WorkExperience work={data.work} heading={headings?.work} />
                  </Suspense>
                </SectionErrorBoundary>

                <SectionErrorBoundary sectionName="Education">
                  <Suspense fallback={<SectionSkeleton lines={3} />}>
                    <Education
                      education={data.education}
                      heading={headings?.education}
                    />
                  </Suspense>
                </SectionErrorBoundary>

                <SectionErrorBoundary sectionName="Skills">
                  <Suspense fallback={<SectionSkeleton lines={2} />}>
                    <Skills skills={data.skills} heading={headings?.skills} />
                  </Suspense>
                </SectionErrorBoundary>
              </div>
            </section>
          }
        />

        <nav className="print:hidden" aria-label="Quick navigation">
          <CommandMenu
            links={getCommandMenuLinks(variant)}
            variants={RESUME_VARIANTS.map(({ slug, label }) => ({
              slug,
              label,
            }))}
            currentSlug={variant.slug}
          />
        </nav>
      </main>
    </>
  );
}
