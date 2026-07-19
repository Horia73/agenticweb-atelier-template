"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void | Promise<void>) => {
    ready: Promise<void>;
    finished: Promise<void>;
    updateCallbackDone: Promise<void>;
    skipTransition: () => void;
  };
};

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function supportsViewTransitions() {
  return typeof document !== "undefined" && typeof (document as ViewTransitionDocument).startViewTransition === "function";
}

/**
 * Runs a DOM/state update inside a View Transition when the browser supports
 * it and the user allows motion; otherwise runs the update directly.
 */
export function withViewTransition(update: () => void | Promise<void>) {
  const doc = typeof document !== "undefined" ? (document as ViewTransitionDocument) : null;
  if (!doc?.startViewTransition || prefersReducedMotion()) {
    void update();
    return null;
  }
  return doc.startViewTransition(update);
}

/** Next App Router navigation wrapped in View Transitions (with graceful fallback). */
export function useViewTransitionRouter() {
  const router = useRouter();
  return React.useMemo(
    () => ({
      push: (href: string) => withViewTransition(() => router.push(href)),
      replace: (href: string) => withViewTransition(() => router.replace(href)),
      back: () => withViewTransition(() => router.back()),
    }),
    [router],
  );
}

export type ViewTransitionLinkProps = React.ComponentProps<typeof Link>;

/** A drop-in `next/link` that navigates inside a View Transition. */
export function ViewTransitionLink({ href, onClick, ...props }: ViewTransitionLinkProps) {
  const { push } = useViewTransitionRouter();
  return (
    <Link
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
        if (typeof href !== "string") return;
        if (!supportsViewTransitions()) return;
        event.preventDefault();
        push(href);
      }}
      {...props}
    />
  );
}

/** Style helper for shared-element continuity: give both routes the same name. */
export function sharedElementStyle(name: string): React.CSSProperties {
  return { viewTransitionName: name } as React.CSSProperties;
}

export type ThemeWipeOptions = {
  /** Wipe origin in client coordinates (e.g. the toggle button center). Defaults to the viewport center. */
  origin?: { x: number; y: number };
  durationMs?: number;
  easing?: string;
};

/**
 * Applies a state change (e.g. toggling the dark class) behind a circular wipe
 * that grows from `origin`. Falls back to applying the change directly.
 */
export function startThemeWipe(apply: () => void, { durationMs, easing = "cubic-bezier(0.4, 0, 0.2, 1)", origin }: ThemeWipeOptions = {}) {
  const transition = withViewTransition(apply);
  if (!transition) return;
  void transition.ready.then(() => {
    const x = origin?.x ?? window.innerWidth / 2;
    const y = origin?.y ?? window.innerHeight / 2;
    const responsiveDuration = durationMs ?? (window.innerWidth < 640 ? 260 : window.innerWidth < 1025 ? 360 : 480);
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: responsiveDuration, easing, pseudoElement: "::view-transition-new(root)" },
    );
  });
}

/**
 * Opt-in stylesheet: disables the default root cross-fade so custom wipes and
 * shared elements stay crisp. Render once, e.g. in the root layout.
 */
export function ViewTransitionStyles() {
  return (
    <style>{`
      ::view-transition-old(root),
      ::view-transition-new(root) {
        animation: none;
        mix-blend-mode: normal;
      }
      @media (prefers-reduced-motion: reduce) {
        ::view-transition-group(*),
        ::view-transition-old(*),
        ::view-transition-new(*) {
          animation: none !important;
        }
      }
    `}</style>
  );
}
