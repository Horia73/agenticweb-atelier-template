"use client";

import * as React from "react";
import {
  motion,
  type HTMLMotionProps,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";

import { cn } from "@/lib/utils";
import { useExperienceViewport, useFinePointer } from "@/components/experience/experience-runtime";

type PointerSample = { active: boolean; x: number; y: number };
type PointerListener = (sample: PointerSample) => void;
type MagneticTargetHandle = {
  element: HTMLElement;
  onSample: PointerListener;
  refresh: () => void;
};
type MagneticContextValue = {
  disabled: boolean;
  register: (target: MagneticTargetHandle) => () => void;
};

const MagneticContext = React.createContext<MagneticContextValue | null>(null);

type MagneticFieldProps = React.ComponentProps<"div">;

/** A bounded pointer field that coordinates every nearby target. */
export function MagneticField({
  className,
  onPointerLeave,
  onPointerMove,
  ...props
}: MagneticFieldProps) {
  const fieldRef = React.useRef({
    targets: new Set<MagneticTargetHandle>(),
    observer: null as ResizeObserver | null,
    refreshFrame: 0,
    flushFrame: 0,
    sample: { active: false, x: 0, y: 0 } as PointerSample,
  });
  const reducedMotion = useReducedMotion();
  const finePointer = useFinePointer();
  const viewport = useExperienceViewport();
  const disabled = Boolean(reducedMotion) || !finePointer;

  // One shared, rAF-coalesced rect refresh for every registered target.
  const scheduleRefresh = React.useCallback(() => {
    const field = fieldRef.current;
    if (field.refreshFrame) return;
    field.refreshFrame = requestAnimationFrame(() => {
      field.refreshFrame = 0;
      field.targets.forEach((target) => target.refresh());
    });
  }, []);

  const register = React.useCallback((target: MagneticTargetHandle) => {
    const field = fieldRef.current;
    field.targets.add(target);
    field.observer ??= new ResizeObserver(scheduleRefresh);
    field.observer.observe(target.element);
    target.refresh();
    return () => {
      field.targets.delete(target);
      field.observer?.unobserve(target.element);
    };
  }, [scheduleRefresh]);
  const context = React.useMemo(() => ({ disabled, register }), [disabled, register]);

  // Pointer samples land in a ref; a single rAF flush notifies every target.
  const scheduleEmit = React.useCallback((sample: PointerSample) => {
    const field = fieldRef.current;
    field.sample = sample;
    if (field.flushFrame) return;
    field.flushFrame = requestAnimationFrame(() => {
      field.flushFrame = 0;
      field.targets.forEach((target) => target.onSample(field.sample));
    });
  }, []);

  React.useEffect(() => {
    const field = fieldRef.current;
    window.addEventListener("scroll", scheduleRefresh, { passive: true });
    window.addEventListener("resize", scheduleRefresh, { passive: true });
    return () => {
      window.removeEventListener("scroll", scheduleRefresh);
      window.removeEventListener("resize", scheduleRefresh);
      cancelAnimationFrame(field.refreshFrame);
      cancelAnimationFrame(field.flushFrame);
      field.refreshFrame = 0;
      field.flushFrame = 0;
      field.observer?.disconnect();
      field.observer = null;
    };
  }, [scheduleRefresh]);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    scheduleEmit(disabled || event.pointerType === "touch"
      ? { active: false, x: 0, y: 0 }
      : { active: true, x: event.clientX, y: event.clientY });
    onPointerMove?.(event);
  };
  const handlePointerLeave = (event: React.PointerEvent<HTMLDivElement>) => {
    scheduleEmit({ active: false, x: event.clientX, y: event.clientY });
    onPointerLeave?.(event);
  };

  return (
    <MagneticContext.Provider value={context}>
      <div
        data-magnetic-field
        data-experience-viewport={viewport}
        data-magnetic-disabled={disabled || undefined}
        className={cn("relative", className)}
        {...props}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      />
    </MagneticContext.Provider>
  );
}

type MagneticTargetProps = Omit<HTMLMotionProps<"div">, "ref"> & {
  activeScale?: number;
  maxTilt?: number;
  maxTravel?: number;
  radius?: number;
  strength?: number;
};

/** Pulls a target toward a nearby pointer before direct hover. */
export const MagneticTarget = React.forwardRef<HTMLDivElement, MagneticTargetProps>(
  function MagneticTarget({
    activeScale = 1.025,
    className,
    maxTilt = 4,
    maxTravel = 30,
    onPointerEnter,
    onPointerLeave,
    onPointerMove,
    radius = 260,
    strength = 0.2,
    style,
    ...props
  }, forwardedRef) {
    const context = React.useContext(MagneticContext);
    const targetRef = React.useRef<HTMLDivElement | null>(null);
    const centerRef = React.useRef<{ x: number; y: number } | null>(null);
    const rawX = useMotionValue(0);
    const rawY = useMotionValue(0);
    const rawRotateX = useMotionValue(0);
    const rawRotateY = useMotionValue(0);
    const rawScale = useMotionValue(1);
    const x = useSpring(rawX, { stiffness: 190, damping: 22, mass: 0.35 });
    const y = useSpring(rawY, { stiffness: 190, damping: 22, mass: 0.35 });
    const rotateX = useSpring(rawRotateX, { stiffness: 170, damping: 24, mass: 0.4 });
    const rotateY = useSpring(rawRotateY, { stiffness: 170, damping: 24, mass: 0.4 });
    const scale = useSpring(rawScale, { stiffness: 200, damping: 24, mass: 0.3 });
    const reducedMotion = useReducedMotion();

    const reset = React.useCallback(() => {
      rawX.set(0);
      rawY.set(0);
      rawRotateX.set(0);
      rawRotateY.set(0);
      rawScale.set(1);
    }, [rawRotateX, rawRotateY, rawScale, rawX, rawY]);

    // Cache the rest-space center (minus the live spring offset) so pointer
    // moves never read layout.
    const measure = React.useCallback(() => {
      const node = targetRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      centerRef.current = {
        x: rect.left + rect.width / 2 - x.get(),
        y: rect.top + rect.height / 2 - y.get(),
      };
    }, [x, y]);

    const reactToPointer = React.useCallback((sample: PointerSample) => {
      const node = targetRef.current;
      if (!node || !sample.active || reducedMotion || context?.disabled) {
        reset();
        return;
      }
      if (!centerRef.current) measure();
      const center = centerRef.current;
      if (!center) return;
      const deltaX = sample.x - center.x;
      const deltaY = sample.y - center.y;
      const distance = Math.hypot(deltaX, deltaY);
      if (distance >= radius) {
        reset();
        return;
      }
      const influence = Math.pow(1 - distance / Math.max(radius, 1), 1.5);
      const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));
      rawX.set(clamp(deltaX * strength * influence, maxTravel));
      rawY.set(clamp(deltaY * strength * influence, maxTravel));
      rawRotateX.set(clamp((-deltaY / Math.max(radius, 1)) * maxTilt * influence, maxTilt));
      rawRotateY.set(clamp((deltaX / Math.max(radius, 1)) * maxTilt * influence, maxTilt));
      rawScale.set(1 + (activeScale - 1) * influence);
    }, [activeScale, context?.disabled, maxTilt, maxTravel, measure, radius, rawRotateX, rawRotateY, rawScale, rawX, rawY, reducedMotion, reset, strength]);

    React.useEffect(() => {
      const node = targetRef.current;
      if (!context || !node) return;
      return context.register({ element: node, onSample: reactToPointer, refresh: measure });
    }, [context, measure, reactToPointer]);

    const setTargetRef = React.useCallback((node: HTMLDivElement | null) => {
      targetRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    }, [forwardedRef]);

    const handlePointerEnter = (event: React.PointerEvent<HTMLDivElement>) => {
      if (!context) measure();
      onPointerEnter?.(event);
    };
    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
      if (!context) reactToPointer({ active: event.pointerType !== "touch", x: event.clientX, y: event.clientY });
      onPointerMove?.(event);
    };
    const handlePointerLeave = (event: React.PointerEvent<HTMLDivElement>) => {
      if (!context) reset();
      onPointerLeave?.(event);
    };

    return (
      <motion.div
        ref={setTargetRef}
        data-magnetic-target
        className={cn("will-change-transform [transform-style:preserve-3d]", className)}
        style={{ ...style, rotateX, rotateY, scale, x, y }}
        {...props}
        onPointerEnter={handlePointerEnter}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      />
    );
  },
);

export const PointerField = MagneticField;
