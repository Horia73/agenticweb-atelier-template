"use client";

import * as React from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";

import { cn } from "@/lib/utils";
import { useExperienceViewport, useFinePointer, usePrefersReducedMotion } from "@/components/experience/experience-runtime";

export type SharedElementZoomItem = {
  id: string;
  /** Accessible name for the trigger and the expanded dialog. */
  label: string;
};

export type SharedElementZoomProps<T extends SharedElementZoomItem> = Omit<React.ComponentProps<"section">, "children"> & {
  label: string;
  items: T[];
  /** Grid cell content. Rendered inside a button; keep it non-interactive. */
  renderThumb: (item: T, state: { active: boolean }) => React.ReactNode;
  /** Expanded content. Call `close` from your own controls if needed. */
  renderDetail: (item: T, actions: { close: () => void }) => React.ReactNode;
  /** Pointer-following badge shown over cells on fine pointers (e.g. "Open"). */
  cursorLabel?: string;
  closeLabel?: string;
  gridClassName?: string;
  itemClassName?: string | ((item: T, index: number) => string);
  overlayClassName?: string;
  detailClassName?: string;
  cursorClassName?: string;
  onActiveChange?: (id: string | null) => void;
};

const MORPH_TRANSITION = { type: "spring", stiffness: 300, damping: 36, mass: 0.9 } as const;
const MORPH_RADIUS = 16;

/**
 * Grid-to-detail shared-element zoom: a cell morphs continuously into a modal
 * detail view and back. Focus is managed, Escape and the backdrop close, and
 * reduced-motion users get a plain fade. `cursorLabel` adds a pointer-following
 * badge so cells read as openable.
 */
export function SharedElementZoom<T extends SharedElementZoomItem>({
  className,
  closeLabel = "Close",
  cursorClassName,
  cursorLabel,
  detailClassName,
  gridClassName,
  itemClassName,
  items,
  label,
  onActiveChange,
  overlayClassName,
  renderDetail,
  renderThumb,
  onPointerLeave,
  onPointerMove,
  ...props
}: SharedElementZoomProps<T>) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [cursorHot, setCursorHot] = React.useState(false);
  const triggerRefs = React.useRef(new Map<string, HTMLButtonElement>());
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const finePointer = useFinePointer();
  const viewport = useExperienceViewport();
  const activeItem = items.find((item) => item.id === activeId) ?? null;

  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const cursorSpringX = useSpring(cursorX, { stiffness: 520, damping: 42, mass: 0.6 });
  const cursorSpringY = useSpring(cursorY, { stiffness: 520, damping: 42, mass: 0.6 });
  const cursorEnabled = Boolean(cursorLabel) && finePointer && !reducedMotion;

  const close = React.useCallback(() => {
    setActiveId((current) => {
      if (current) {
        const trigger = triggerRefs.current.get(current);
        window.setTimeout(() => trigger?.focus({ preventScroll: true }), 0);
      }
      return null;
    });
  }, []);

  React.useEffect(() => {
    onActiveChange?.(activeId);
  }, [activeId, onActiveChange]);

  React.useEffect(() => {
    if (!activeItem) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", handleKeyDown);
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus({ preventScroll: true }), 30);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [activeItem, close]);

  const layoutIdFor = (id: string) => (reducedMotion ? undefined : `shared-element-zoom-${id}`);
  const morphTransition = reducedMotion ? { duration: 0 } : MORPH_TRANSITION;

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (cursorEnabled) {
      const rect = event.currentTarget.getBoundingClientRect();
      cursorX.set(event.clientX - rect.left);
      cursorY.set(event.clientY - rect.top);
      const overTrigger = Boolean((event.target as Element | null)?.closest?.("[data-zoom-trigger]"));
      setCursorHot((current) => (current === overTrigger ? current : overTrigger));
    }
    onPointerMove?.(event);
  };
  const handlePointerLeave = (event: React.PointerEvent<HTMLElement>) => {
    setCursorHot(false);
    onPointerLeave?.(event);
  };

  return (
    <section
      aria-label={label}
      data-shared-element-zoom
      data-experience-viewport={viewport}
      className={cn("relative", className)}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      {...props}
    >
      <div className={cn("grid grid-cols-2 gap-4 md:grid-cols-3", gridClassName)}>
        {items.map((item, index) => {
          const active = item.id === activeId;
          return (
            <React.Fragment key={item.id}>
              {/* ui-primitive-allow-native: morph trigger carries bespoke morph styling; keeps the registry item dependency-free. */}<button
                ref={(node) => {
                if (node) triggerRefs.current.set(item.id, node);
                else triggerRefs.current.delete(item.id);
              }}
              type="button"
              data-zoom-trigger
              aria-label={item.label}
              aria-expanded={active}
              data-active={active || undefined}
              onClick={() => setActiveId(item.id)}
              className={cn(
                "group relative block w-full cursor-pointer overflow-hidden text-left transition-[transform,box-shadow] duration-300 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-2xl",
                typeof itemClassName === "function" ? itemClassName(item, index) : itemClassName,
              )}
              style={{ borderRadius: MORPH_RADIUS }}
            >
              {!active && (
                <motion.div layoutId={layoutIdFor(item.id)} transition={morphTransition} className="size-full overflow-hidden" style={{ borderRadius: MORPH_RADIUS }}>
                  {renderThumb(item, { active })}
                </motion.div>
              )}
                {active && <div aria-hidden className="size-full opacity-0">{renderThumb(item, { active })}</div>}
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {cursorEnabled && (
        <motion.div aria-hidden className="pointer-events-none absolute left-0 top-0 z-30" style={{ x: cursorSpringX, y: cursorSpringY }}>
          <motion.span
            initial={false}
            animate={{ scale: cursorHot && !activeItem ? 1 : 0, opacity: cursorHot && !activeItem ? 1 : 0 }}
            transition={{ type: "spring", stiffness: 480, damping: 34 }}
            className={cn(
              "flex size-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-center text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-black shadow-[0_10px_40px_rgba(0,0,0,.35)]",
              cursorClassName,
            )}
          >
            {cursorLabel}
          </motion.span>
        </motion.div>
      )}

      <AnimatePresence>
        {activeItem && (
          <motion.div
            key="shared-element-zoom-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn("fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-2 backdrop-blur-sm sm:items-center sm:p-8", overlayClassName)}
            onClick={close}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={activeItem.label}
              layoutId={layoutIdFor(activeItem.id)}
              transition={morphTransition}
              className={cn("relative max-h-[calc(100svh-.5rem)] w-full max-w-3xl overflow-auto overscroll-contain bg-background shadow-2xl sm:max-h-full", detailClassName)}
              style={{ borderRadius: MORPH_RADIUS }}
              onClick={(event) => event.stopPropagation()}
            >
              {/* ui-primitive-allow-native: overlay close control with bespoke styling. */}<button
                ref={closeButtonRef}
                type="button"
                aria-label={closeLabel}
                onClick={close}
                className="absolute right-3 top-3 z-10 flex size-11 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70 focus-visible:outline-2"
              >
                <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
              {renderDetail(activeItem, { close })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
