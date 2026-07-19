"use client";

import * as React from "react";
import { ChevronsLeftRight } from "lucide-react";

import { cn } from "@/lib/utils";

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
  value?: number;
};

/** Keyboard, pointer and touch accessible comparison for two registered visuals. */
export function BeforeAfter({
  after,
  afterLabel = "După",
  before,
  beforeLabel = "Înainte",
  className,
  defaultValue = 50,
  handleClassName,
  handleIcon = <ChevronsLeftRight className="size-4" strokeWidth={1.75} />,
  label,
  onValueChange,
  style,
  value: controlledValue,
  ...props
}: BeforeAfterProps) {
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
      className={cn("group relative isolate overflow-hidden", className)}
      style={{ "--comparison-position": `${value}%`, ...style } as React.CSSProperties}
      {...props}
    >
      <div className="absolute inset-0">{after}</div>
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: "inset(0 calc(100% - var(--comparison-position)) 0 0)" }}>
        {before}
      </div>

      <span className="pointer-events-none absolute left-4 top-4 z-10 rounded-full bg-background/80 px-3 py-1 text-xs font-medium text-foreground backdrop-blur">
        {beforeLabel}
      </span>
      <span className="pointer-events-none absolute right-4 top-4 z-10 rounded-full bg-background/80 px-3 py-1 text-xs font-medium text-foreground backdrop-blur">
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
        aria-label={label}
        aria-valuetext={`${beforeLabel} ${Math.round(value)}%, ${afterLabel} ${Math.round(100 - value)}%`}
        className="absolute inset-0 z-30 size-full cursor-ew-resize opacity-0"
        onChange={(event) => update(Number(event.currentTarget.value))}
      />
    </div>
  );
}
