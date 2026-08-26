"use client";

import { useRouter } from "next/navigation";

interface VariantSwitcherProps {
  variants: { slug: string; label: string; note: string }[];
  current: string;
}

export function VariantSwitcher({ variants, current }: VariantSwitcherProps) {
  const router = useRouter();

  return (
    <div className="mx-auto mb-4 flex w-full max-w-2xl justify-end print:hidden">
      <label className="flex items-center gap-x-2 text-xs text-muted-foreground">
        <span>Version</span>
        <select
          className="rounded-md border border-muted bg-white px-2 py-1 text-xs text-foreground"
          value={current}
          onChange={(event) => {
            const slug = event.target.value;
            router.push(slug === "" ? "/" : `/${slug}`);
          }}
        >
          {current === "" && <option value="">Default</option>}
          {variants.map(({ slug, label, note }) => (
            <option key={slug} value={slug} title={note}>
              {label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
