import { RESUME_DATA as DEFAULT_CV } from "@/data/default-cv";
import { type EditableResume, toEditableResume } from "@/lib/resume-json";

/**
 * The CV a brand new visitor starts with.
 *
 * A real, finished CV rather than an empty skeleton, on purpose: it shows what
 * good looks like — achievement bullets with numbers in them, a headline that
 * states the target title, badges per role — which is far more useful to edit
 * down than a page of "Your Job Title" placeholders.
 *
 * It is somebody's actual CV, so it arrives carrying a real name, email, phone
 * number and employment history. A visitor who changes the name but not the
 * rest publishes a CV with someone else's contact details on it. That trade is
 * deliberate; see the note in the README.
 *
 * toEditableResume flattens the JSX summary to the string shape the database
 * stores.
 */
export const STARTER_TEMPLATE: EditableResume = toEditableResume(DEFAULT_CV);
