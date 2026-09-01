import { COCKS_RESUME_DATA } from "@/data/cocks-cv";
import { RESUME_DATA as DEFAULT_CV } from "@/data/default-cv";
import { type EditableResume, toEditableResume } from "@/lib/resume-json";

/**
 * The two CVs a brand new visitor starts with.
 *
 * COCKS_TEMPLATE is the default: a cat's CV, obviously safe to overwrite,
 * with no contact details to leak — yet still shaped like a good CV, with
 * achievement bullets and badges per role.
 *
 * STARTER_TEMPLATE is the human example next to it. A real, finished CV
 * rather than an empty skeleton, on purpose: it shows what good looks like —
 * achievement bullets with numbers in them, a headline that states the target
 * title — which is far more useful to edit down than a page of "Your Job
 * Title" placeholders.
 *
 * It is somebody's actual CV, so it arrives carrying a real name, email, phone
 * number and employment history. A visitor who changes the name but not the
 * rest publishes a CV with someone else's contact details on it. That trade is
 * deliberate; see the note in the README.
 *
 * toEditableResume flattens a JSX summary to the string shape the database
 * stores.
 */
export const STARTER_TEMPLATE: EditableResume = toEditableResume(DEFAULT_CV);

export const COCKS_TEMPLATE: EditableResume =
  toEditableResume(COCKS_RESUME_DATA);
