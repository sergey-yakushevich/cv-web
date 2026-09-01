/*
 * Direct-DOM edit helpers for Guides mode.
 *
 * The CV subtree is server-rendered markup, not React state, so adding a
 * badge or previewing a photo means editing the live DOM the same way the
 * user does. Kept out of the workspace component so the component stays
 * orchestration and these stay testable.
 */

/**
 * Appends an empty, focused badge to the clicked "+"'s list. The new badge is
 * cloned from a sibling so it always matches the real markup; a list that is
 * empty gets the same structure built by hand. Returns true when a badge was
 * actually added, so the caller can mark the CV dirty.
 */
export function appendBadge(button: HTMLElement): boolean {
  const list = button.closest("[data-edit-list]");
  const addItem = button.closest("li");
  if (!list || !addItem) return false;

  let item: HTMLElement;
  const prototype = list.querySelector("[data-edit-item]")?.closest("li");
  if (prototype) {
    item = prototype.cloneNode(true) as HTMLElement;
    const badge = item.querySelector<HTMLElement>("[data-edit-item]");
    if (badge) {
      badge.textContent = "";
      badge.removeAttribute("aria-label");
    }
  } else {
    item = document.createElement("li");
    item.className = "relative";
    item.innerHTML =
      '<span data-edit-item="" class="inline-flex items-center rounded-md border border-transparent bg-secondary px-2.5 py-0.5 align-middle text-xs font-semibold text-secondary-foreground"></span>' +
      '<button type="button" data-remove-badge="" aria-label="Remove badge" class="badge-remove absolute -right-1.5 -top-1.5 hidden size-4 cursor-pointer items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm hover:text-foreground print:hidden">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-2.5" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>' +
      "</button>";
  }

  list.insertBefore(item, addItem);
  const badge = item.querySelector<HTMLElement>("[data-edit-item]");
  badge?.setAttribute("contenteditable", "plaintext-only");
  badge?.focus();
  return true;
}

/** Shows a freshly cropped photo in place before it is saved. */
export function previewAvatarInSlot(root: HTMLElement, dataUrl: string): void {
  const slot = root.querySelector<HTMLElement>("[data-avatar-slot]");
  if (!slot) return;

  const img = slot.querySelector("img");
  if (img) {
    // next/image sets srcset, which would win over a plain src swap.
    img.srcset = "";
    img.src = dataUrl;
    return;
  }

  // No photo yet: paint the ghost circle with the picture.
  const ghost = slot.querySelector<HTMLElement>(".avatar-ghost");
  if (!ghost) return;
  ghost.style.backgroundImage = `url(${dataUrl})`;
  ghost.style.backgroundSize = "cover";
  ghost.style.backgroundPosition = "center";
  ghost.style.borderStyle = "solid";
  for (const child of Array.from(ghost.children)) {
    (child as HTMLElement).style.visibility = "hidden";
  }
}
