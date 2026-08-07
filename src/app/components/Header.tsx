import { GlobeIcon } from "lucide-react"; // Only need GlobeIcon for location display
import React from "react";
import { Avatar } from "../../components/avatar";
import { RESUME_DATA } from "@/data/resume-data";

// No longer need other icon imports, button import, or specific icon/type mappings
// as we are using text links only for the main contact details.

interface LocationLinkProps {
  location: typeof RESUME_DATA.location;
  locationLink: typeof RESUME_DATA.locationLink;
}

/**
 * Renders the location as a clickable link with a GlobeIcon.
 */
function LocationLink({
  location,
  locationLink,
}: LocationLinkProps) {
  // Only render if both location and locationLink are provided
  if (!location || !locationLink) {
    return null;
  }

  return (
    <p className="max-w-md items-center text-pretty font-sans text-xs text-foreground">
      <a
        className="inline-flex gap-x-1.5 align-baseline leading-none hover:underline"
        href={locationLink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Location: ${location}`}
      >
        <GlobeIcon className="size-3" aria-hidden="true" />
        {location}
      </a>
    </p>
  );
}

interface ContactLinkProps {
  href: string;
  text: string;
}

/**
 * Renders a single contact link with consistent text styling.
 */
function ContactLink({ href, text }: ContactLinkProps) {
  return (
    <a
      className="underline hover:text-foreground/70"
      href={href}
      target="_blank" // Open in new tab for external links
      rel="noopener noreferrer"
    >
      {text}
    </a>
  );
}

/**
 * Header component displaying personal information and consolidated contact details.
 */
export function Header() {
  // Find social links if they exist
  const githubSocial = RESUME_DATA.contact.social.find(
    (s) => s.icon === "github"
  );
  const linkedinSocial = RESUME_DATA.contact.social.find(
    (s) => s.icon === "linkedin"
  );

  // Collect only the specific links for the "Email / GitHub / LinkedIn" line
  const mainContactLineLinks: { href: string; text: string }[] = [];

  // Add Email
  if (RESUME_DATA.contact.email) {
    mainContactLineLinks.push({
      href: `mailto:${RESUME_DATA.contact.email}`,
      text: "Email", // Display "Email" as text
    });
  }

  // Add GitHub
  if (githubSocial) {
    mainContactLineLinks.push({
      href: githubSocial.url,
      text: "GitHub", // Display "GitHub" as text
    });
  }

  // Add LinkedIn
  if (linkedinSocial) {
    mainContactLineLinks.push({
      href: linkedinSocial.url,
      text: "LinkedIn", // Display "LinkedIn" as text
    });
  }

  return (
    <header className="flex items-center justify-between">
      <div className="flex-1 space-y-1.5">
        <h1 className="text-2xl font-bold" id="resume-name">
          {RESUME_DATA.name}
        </h1>

        {/* Location link on its own line (renders null if data is missing) */}
        <LocationLink
          location={RESUME_DATA.location}
          locationLink={RESUME_DATA.locationLink}
        />

        {/* Consolidated main contact links line: Email / GitHub / LinkedIn */}
        {mainContactLineLinks.length > 0 && ( // Only render this div if there are links to display
          <div className="flex flex-wrap items-center gap-x-2 text-sm font-sans text-foreground/80">
            {mainContactLineLinks.map((link, index) => (
              <React.Fragment key={link.href}>
                <ContactLink href={link.href} text={link.text} />
                {/* Render separator only between links, not after the last one */}
                {index < mainContactLineLinks.length - 1 && (
                  <span aria-hidden="true">/</span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Avatar component, always present */}
      <Avatar
        className="size-28"
        src={RESUME_DATA.avatarUrl}
        alt={`${RESUME_DATA.name}'s profile picture`}
        fallback={RESUME_DATA.initials}
      />
    </header>
  );
}