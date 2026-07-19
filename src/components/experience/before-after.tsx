"use client";

import * as React from "react";
import { ChevronsLeftRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { useExperienceViewport } from "@/components/experience/experience-runtime";

type BeforeAfterProps = Omit<React.ComponentProps<"div">, "children"> & {
  after: React.ReactNode;
  afterLabel?: string;
  before: React.ReactNode;
  beforeLabel?: string;
  defaultValue?: number;
  handleClassName?: string;
  handleIcon?: React.ReactNode;
  label: string;
  onValueChange?: (value: number) => void;
  /** Accessible name for the range input. Defaults to `${label} slider` so it stays distinct from the group label. */
  sliderLabel?: string;
  value?: number;
};

/** Keyboard, pointer and touch accessible comparison for two registered visuals. */
export function BeforeAfter({
  after,
  afterLabel = "After",
  before,
  beforeLabel = "Before",
  className,
  defaultValue = 50,
  handleClassName,
  handleIcon = <ChevronsLeftRight className="size-4" strokeWidth={1.75} />,
  label,
  onValueChange,
  sliderLabel,
  style,
  value: controlledValue,
  ...props
}: BeforeAfterProps) {
  const viewport = useExperienceViewport();
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const value = Math.max(0, Math.min(100, controlledValue ?? internalValue));
  const update = (next: number) => {
    if (controlledValue === undefined) setInternalValue(next);
    onValueChange?.(next);
  };

  return (
    <div
      role="group"
      aria-label={label}
      data-before-after
      data-experience-viewport={viewport}
      className={cn("group relative isolate min-w-0 touch-pan-y overflow-hidden", className)}
      style={{ "--comparison-position": `${value}%`, ...style } as React.CSSProperties}
      {...props}
    >
      <div className="absolute inset-0">{after}</div>
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: "inset(0 calc(100% - var(--comparison-position)) 0 0)" }}>
        {before}
      </div>

      <span className="pointer-events-none absolute left-2 top-2 z-10 max-w-[42%] truncate rounded-full bg-background/80 px-2.5 py-1 text-[.6875rem] font-medium text-foreground backdrop-blur sm:left-4 sm:top-4 sm:max-w-none sm:px-3 sm:text-xs">
        {beforeLabel}
      </span>
      <span className="pointer-events-none absolute right-2 top-2 z-10 max-w-[42%] truncate rounded-full bg-background/80 px-2.5 py-1 text-[.6875rem] font-medium text-foreground backdrop-blur sm:right-4 sm:top-4 sm:max-w-none sm:px-3 sm:text-xs">
        {afterLabel}
      </span>

      <div aria-hidden className="pointer-events-none absolute inset-y-0 z-20 w-px bg-background shadow-[0_0_0_1px_rgb(0_0_0/0.2)]" style={{ left: "var(--comparison-position)" }}>
        <span className={cn("absolute left-1/2 top-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-foreground/15 bg-background text-foreground shadow-lg transition-transform group-focus-within:scale-110", handleClassName)}>
          {handleIcon}
        </span>
      </div>

      {/* ui-primitive-allow-native: range input provides keyboard, touch and pointer semantics. */}<input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        aria-label={sliderLabel ?? `${label} slider`}
        aria-valuetext={`${beforeLabel} ${Math.round(value)}%, ${afterLabel} ${Math.round(100 - value)}%`}
        className="absolute inset-0 z-30 size-full cursor-ew-resize opacity-0"
        onChange={(event) => update(Number(event.currentTarget.value))}
      />
    </div>
  );
}
