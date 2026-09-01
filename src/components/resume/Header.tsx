import {
  GithubIcon,
  GlobeIcon,
  ImagePlusIcon,
  LinkedinIcon,
  MailIcon,
  PhoneIcon,
  XIcon,
} from "lucide-react";
import { Avatar } from "@/components/avatar";
import type { ResumeData } from "@/lib/types";

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
        <span data-edit-path="location">{location}</span>
      </a>
    </p>
  );
}

type ContactIcon = typeof GlobeIcon;

interface ContactLinkProps {
  href: string;
  text: string;
  icon: ContactIcon;
  /** Where this text lives in the CV JSON, for editing in Guides mode. */
  editPath: string;
  /** How the shown text maps back to the stored value ("url" = add https://). */
  editFormat?: "url";
}

function ContactLink({
  href,
  text,
  icon: Icon,
  editPath,
  editFormat,
}: ContactLinkProps) {
  return (
    <a
      className="inline-flex items-center gap-x-1 underline hover:text-foreground/70"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Icon className="size-3 shrink-0 no-underline" aria-hidden="true" />
      <span data-edit-path={editPath} data-edit-format={editFormat}>
        {text}
      </span>
    </a>
  );
}

interface HeaderProps {
  data: ResumeData;
}

export function Header({ data: RESUME_DATA }: HeaderProps) {
  const socialIndex = (icon: string) =>
    RESUME_DATA.contact.social.findIndex((s) => s.icon === icon);
  const websiteIndex = socialIndex("globe");
  const githubIndex = socialIndex("github");
  const linkedinIndex = socialIndex("linkedin");
  const websiteSocial = RESUME_DATA.contact.social[websiteIndex];
  const githubSocial = RESUME_DATA.contact.social[githubIndex];
  const linkedinSocial = RESUME_DATA.contact.social[linkedinIndex];

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
    editPath: string;
    editFormat?: "url";
  }[] = [];

  if (websiteSocial) {
    mainContactLineLinks.push({
      href: websiteSocial.url,
      text: bareUrl(websiteSocial.url),
      icon: GlobeIcon,
      editPath: `contact.social.${websiteIndex}.url`,
      editFormat: "url",
    });
  }

  if (RESUME_DATA.contact.email) {
    mainContactLineLinks.push({
      href: `mailto:${RESUME_DATA.contact.email}`,
      text: RESUME_DATA.contact.email,
      icon: MailIcon,
      editPath: "contact.email",
    });
  }

  if (RESUME_DATA.contact.tel) {
    mainContactLineLinks.push({
      href: `tel:${RESUME_DATA.contact.tel}`,
      text: RESUME_DATA.contact.tel,
      icon: PhoneIcon,
      editPath: "contact.tel",
    });
  }

  if (githubSocial) {
    mainContactLineLinks.push({
      href: githubSocial.url,
      text: bareUrl(githubSocial.url),
      icon: GithubIcon,
      editPath: `contact.social.${githubIndex}.url`,
      editFormat: "url",
    });
  }

  if (linkedinSocial) {
    mainContactLineLinks.push({
      href: linkedinSocial.url,
      text: bareUrl(linkedinSocial.url),
      icon: LinkedinIcon,
      editPath: `contact.social.${linkedinIndex}.url`,
      editFormat: "url",
    });
  }

  return (
    <header className="flex items-center justify-between">
      <div className="flex-1 space-y-1.5">
        <h1
          className="text-2xl font-bold"
          id="resume-name"
          data-edit-path="name"
        >
          {RESUME_DATA.name}
        </h1>

        {RESUME_DATA.headline && (
          <p
            className="font-sans text-sm font-medium text-foreground"
            data-edit-path="headline"
          >
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
              /*
               * data-removable makes the whole item one hover zone in Guides
               * mode: the dashed outline and the corner "x" appear together
               * (see globals.css), and the x deletes the item. The leading
               * separator travels with its item, so a deleted link takes its
               * slash along.
               */
              <span
                key={link.href}
                data-removable=""
                className="relative inline-flex items-center gap-x-2"
              >
                {index > 0 && <span aria-hidden="true">/</span>}
                <ContactLink
                  href={link.href}
                  text={link.text}
                  icon={link.icon}
                  editPath={link.editPath}
                  editFormat={link.editFormat}
                />
                <button
                  type="button"
                  data-remove-badge=""
                  aria-label={`Remove ${link.text}`}
                  className="badge-remove absolute -right-3 -top-3 hidden size-4 cursor-pointer items-center justify-center rounded-full bg-[#ffdede] text-destructive shadow-sm hover:bg-destructive hover:text-destructive-foreground print:hidden"
                >
                  <XIcon className="size-2.5" aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/*
        The photo slot. In Guides mode the workspace makes it clickable (it
        opens the crop dialog) and the overlay below appears on hover; outside
        Guides it is inert. The wrapper takes no size of its own, so when there
        is no photo and no guides, nothing occupies the corner.
      */}
      <div data-avatar-slot={true} className="relative shrink-0">
        {RESUME_DATA.avatarUrl ? (
          <Avatar
            className="size-28"
            src={RESUME_DATA.avatarUrl}
            alt={`${RESUME_DATA.name}'s profile picture`}
            fallback={RESUME_DATA.initials}
          />
        ) : (
          /*
           * Where a photo would go, shown only while Guides are on (the
           * .cv-guides rules in globals.css make it visible). Screen-only,
           * like every other guide.
           */
          <div
            aria-hidden="true"
            className="avatar-ghost hidden size-28 shrink-0 flex-col items-center justify-center gap-1 rounded-full border-2 border-dashed text-muted-foreground/70"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-5"
            >
              <path d="M10.3 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              <circle cx={9} cy={9} r={2} />
              <path d="M19 22v-6" />
              <path d="m22 19-3-3-3 3" />
            </svg>
            <span className="font-mono text-[10px]">photo</span>
          </div>
        )}

        {/*
          Hover cue for Guides mode: an "Upload photo" cover over the slot.
          globals.css turns it on under `.cv-guides [data-avatar-slot]:hover`;
          the Tailwind `hidden` keeps it off everywhere else, print included.
          It takes the slot's own shape — the photo is a rounded square, the
          empty ghost is a circle — and its background is opaque so the
          current photo does not show through.
        */}
        <div
          aria-hidden="true"
          className={`avatar-overlay pointer-events-none absolute inset-0 hidden flex-col items-center justify-center gap-1.5 border-2 border-dashed bg-background text-secondary-foreground ${
            RESUME_DATA.avatarUrl ? "rounded-xl" : "rounded-full"
          }`}
          style={{ borderColor: "hsl(var(--guide-line))" }}
        >
          <div className="flex size-9 items-center justify-center rounded-md border-[1.5px] border-dashed border-muted-foreground/40 text-muted-foreground">
            <ImagePlusIcon className="size-4" aria-hidden="true" />
          </div>
          <span className="text-[11px] font-medium">Upload photo</span>
        </div>
      </div>
    </header>
  );
}
