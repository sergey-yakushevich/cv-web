import {
  GithubIcon,
  GlobeIcon,
  LinkedinIcon,
  MailIcon,
  PhoneIcon,
} from "lucide-react";
import React from "react";
import type { ResumeData } from "@/lib/types";
import { Avatar } from "../../components/avatar";

interface LocationLinkProps {
  location: ResumeData["location"];
  locationLink: ResumeData["locationLink"];
}

function LocationLink({ location, locationLink }: LocationLinkProps) {
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

type ContactIcon = typeof GlobeIcon;

interface ContactLinkProps {
  href: string;
  text: string;
  icon: ContactIcon;
}

function ContactLink({ href, text, icon: Icon }: ContactLinkProps) {
  return (
    <a
      className="inline-flex items-center gap-x-1 underline hover:text-foreground/70"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Icon className="size-3 shrink-0 no-underline" aria-hidden="true" />
      {text}
    </a>
  );
}

interface HeaderProps {
  data: ResumeData;
}

export function Header({ data: RESUME_DATA }: HeaderProps) {
  const websiteSocial = RESUME_DATA.contact.social.find(
    (s) => s.icon === "globe"
  );
  const githubSocial = RESUME_DATA.contact.social.find(
    (s) => s.icon === "github"
  );
  const linkedinSocial = RESUME_DATA.contact.social.find(
    (s) => s.icon === "linkedin"
  );

  const bareUrl = (url: string) =>
    url.replace(/^https?:\/\//, "").replace(/\/$/, "");

  /*
   * The contact line always prints literal values: the full email address, the
   * phone number, and bare URLs. Anchor text like "Email" or "GitHub" reads
   * fine on screen but is what actually reaches a résumé parser, because
   * parsers read the PDF text layer and drop the link annotations behind it —
   * so "Email" extracts as the word "Email" and the address is lost.
   */
  const mainContactLineLinks: {
    href: string;
    text: string;
    icon: ContactIcon;
  }[] = [];

  if (websiteSocial) {
    mainContactLineLinks.push({
      href: websiteSocial.url,
      text: bareUrl(websiteSocial.url),
      icon: GlobeIcon,
    });
  }

  if (RESUME_DATA.contact.email) {
    mainContactLineLinks.push({
      href: `mailto:${RESUME_DATA.contact.email}`,
      text: RESUME_DATA.contact.email,
      icon: MailIcon,
    });
  }

  if (RESUME_DATA.contact.tel) {
    mainContactLineLinks.push({
      href: `tel:${RESUME_DATA.contact.tel}`,
      text: RESUME_DATA.contact.tel,
      icon: PhoneIcon,
    });
  }

  if (githubSocial) {
    mainContactLineLinks.push({
      href: githubSocial.url,
      text: bareUrl(githubSocial.url),
      icon: GithubIcon,
    });
  }

  if (linkedinSocial) {
    mainContactLineLinks.push({
      href: linkedinSocial.url,
      text: bareUrl(linkedinSocial.url),
      icon: LinkedinIcon,
    });
  }

  return (
    <header className="flex items-center justify-between">
      <div className="flex-1 space-y-1.5">
        <h1 className="text-2xl font-bold" id="resume-name">
          {RESUME_DATA.name}
        </h1>

        {RESUME_DATA.headline && (
          <p className="font-sans text-sm font-medium text-foreground">
            {RESUME_DATA.headline}
          </p>
        )}

        <LocationLink
          location={RESUME_DATA.location}
          locationLink={RESUME_DATA.locationLink}
        />

        {mainContactLineLinks.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-2 text-sm font-sans text-foreground/80">
            {mainContactLineLinks.map((link, index) => (
              <React.Fragment key={link.href}>
                <ContactLink
                  href={link.href}
                  text={link.text}
                  icon={link.icon}
                />
                {index < mainContactLineLinks.length - 1 && (
                  <span aria-hidden="true">/</span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {RESUME_DATA.avatarUrl && (
        <Avatar
          className="size-28"
          src={RESUME_DATA.avatarUrl}
          alt={`${RESUME_DATA.name}'s profile picture`}
          fallback={RESUME_DATA.initials}
        />
      )}
    </header>
  );
}
