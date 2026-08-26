"use client";

import type { LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/*
 * Vendored from @shadcn-space/tabs-08, with three changes:
 *
 *  1. The demo panels and the default-exported demo were removed. Only
 *     AnimatedTabs is used here.
 *  2. The upstream file is written for Tailwind v4. This project is on v3.4,
 *     where `h-auto!`, `data-active:*` and `h-4.5` compile to nothing. They are
 *     rewritten as `!h-auto`, `data-[state=active]:*` and explicit sizes. The
 *     data-state rewrite matters: without it the base TabsTrigger keeps its own
 *     `data-[state=active]:bg-background` and paints a second pill behind the
 *     animated indicator.
 *  3. The panel slide/blur transition and the animated height were removed. The
 *     sliding pill on the tab list is kept. Panels here hold a whole CV and a
 *     text editor, and animating them moved content under the cursor.
 */

export type AnimatedTabItem = {
  value: string;
  label: string;
  icon?: LucideIcon;
  badge?: number | string;
  disabled?: boolean;
  content: ReactNode;
};

interface AnimatedTabsProps {
  tabs: AnimatedTabItem[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  listClassName?: string;
  contentClassName?: string;
  indicatorId?: string;
  /** The flex row holding the tab list and the accessory. */
  rowClassName?: string;
  /** Rendered on the same row as the tab list, after it. */
  listAccessory?: ReactNode;
}

export function AnimatedTabs({
  tabs,
  defaultValue,
  value: controlledValue,
  onValueChange,
  className,
  listClassName,
  contentClassName,
  indicatorId = "animated-tabs-indicator",
  rowClassName,
  listAccessory,
}: AnimatedTabsProps) {
  const [internalValue, setInternalValue] = useState(
    defaultValue ?? tabs[0]?.value
  );
  const value = controlledValue ?? internalValue;

  const activeTab = useMemo(
    () => tabs.find((tab) => tab.value === value),
    [tabs, value]
  );

  const handleChange = (next: string) => {
    if (controlledValue === undefined) setInternalValue(next);
    onValueChange?.(next);
  };

  return (
    <Tabs
      value={value}
      onValueChange={handleChange}
      className={cn("flex w-full flex-col gap-4", className)}
    >
      <div className={cn("flex w-full items-center gap-2", rowClassName)}>
        <TabsList
          className={cn(
            "no-scrollbar !h-auto w-auto gap-1 overflow-x-auto rounded-2xl border border-border bg-muted/40 p-1",
            listClassName
          )}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.value === value;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                disabled={tab.disabled}
                className={cn(
                  "relative z-0 h-9 shrink-0 gap-1.5 rounded-xl border-none bg-transparent px-3.5 text-sm font-medium shadow-none outline-none transition-colors data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId={indicatorId}
                    className="absolute inset-0 -z-10 rounded-xl bg-background shadow-[0_1px_2px_rgba(0,0,0,0.06),0_4px_10px_-4px_rgba(0,0,0,0.15)] ring-1 ring-border"
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 34,
                      mass: 0.9,
                    }}
                  />
                )}
                <motion.span
                  key={isActive ? "active" : "inactive"}
                  initial={isActive ? { scale: 0.85 } : false}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  className="flex items-center gap-1.5"
                >
                  {Icon && <Icon className="size-4" />}
                  <span>{tab.label}</span>
                </motion.span>
                {tab.badge !== undefined && (
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={tab.badge}
                      initial={{ opacity: 0, scale: 0.5, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.5, y: 6 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 25,
                      }}
                      className={cn(
                        "flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted-foreground/15 text-muted-foreground"
                      )}
                    >
                      {tab.badge}
                    </motion.span>
                  </AnimatePresence>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {listAccessory}
      </div>

      <div className={cn("relative", contentClassName)}>
        {activeTab && (
          <div key={activeTab.value} role="tabpanel">
            {activeTab.content}
          </div>
        )}
      </div>
    </Tabs>
  );
}
