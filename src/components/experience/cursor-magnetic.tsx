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

type PointerSample = { active: boolean; x: number; y: number };
type PointerListener = (sample: PointerSample) => void;
type MagneticContextValue = {
  disabled: boolean;
  register: (listener: PointerListener) => () => void;
};

const MagneticContext = React.createContext<MagneticContextValue | null>(null);

function useFinePointer() {
  const subscribe = React.useCallback((onChange: () => void) => {
    const media = window.matchMedia("(pointer: fine)");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);
  const getSnapshot = React.useCallback(() => window.matchMedia("(pointer: fine)").matches, []);
  return React.useSyncExternalStore(subscribe, getSnapshot, () => false);
}

type MagneticFieldProps = React.ComponentProps<"div">;

/** A bounded pointer field that coordinates every nearby target. */
export function MagneticField({
  className,
  onPointerLeave,
  onPointerMove,
  ...props
}: MagneticFieldProps) {
  const listeners = React.useRef(new Set<PointerListener>());
  const reducedMotion = useReducedMotion();
  const finePointer = useFinePointer();
  const disabled = Boolean(reducedMotion) || !finePointer;
  const register = React.useCallback((listener: PointerListener) => {
    listeners.current.add(listener);
    return () => listeners.current.delete(listener);
  }, []);
  const context = React.useMemo(() => ({ disabled, register }), [disabled, register]);

  const emit = React.useCallback((sample: PointerSample) => {
    listeners.current.forEach((listener) => listener(sample));
  }, []);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    emit(disabled || event.pointerType === "touch"
      ? { active: false, x: 0, y: 0 }
      : { active: true, x: event.clientX, y: event.clientY });
    onPointerMove?.(event);
  };
  const handlePointerLeave = (event: React.PointerEvent<HTMLDivElement>) => {
    emit({ active: false, x: event.clientX, y: event.clientY });
    onPointerLeave?.(event);
  };

  return (
    <MagneticContext.Provider value={context}>
      <div
        data-magnetic-field
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
    onPointerLeave,
    onPointerMove,
    radius = 260,
    strength = 0.2,
    style,
    ...props
  }, forwardedRef) {
    const context = React.useContext(MagneticContext);
    const targetRef = React.useRef<HTMLDivElement | null>(null);
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

    const reactToPointer = React.useCallback((sample: PointerSample) => {
      const node = targetRef.current;
      if (!node || !sample.active || reducedMotion || context?.disabled) {
        reset();
        return;
      }
      const rect = node.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = sample.x - centerX;
      const deltaY = sample.y - centerY;
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
    }, [activeScale, context?.disabled, maxTilt, maxTravel, radius, rawRotateX, rawRotateY, rawScale, rawX, rawY, reducedMotion, reset, strength]);

    React.useEffect(() => {
      if (!context) return;
      return context.register(reactToPointer);
    }, [context, reactToPointer]);

    const setTargetRef = React.useCallback((node: HTMLDivElement | null) => {
      targetRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    }, [forwardedRef]);

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
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      />
    );
  },
);

export const PointerField = MagneticField;
