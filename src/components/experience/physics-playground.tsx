"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { damp, usePrefersReducedMotion } from "@/components/experience/experience-runtime";

export type PhysicsPlaygroundItem = {
  id: string;
  content: React.ReactNode;
  /** Collision radius in px; defaults to 92% of half the larger rendered dimension. */
  radius?: number;
};

export type PhysicsPlaygroundProps = Omit<React.ComponentProps<"section">, "children"> & {
  label: string;
  items: PhysicsPlaygroundItem[];
  /** Downward acceleration in px/s². */
  gravity?: number;
  /** Bounce energy kept on impact, 0 to 1. */
  restitution?: number;
  /** Per-frame velocity multiplier at 60fps; scaled by delta time. */
  airFriction?: number;
  /** Milliseconds between staggered drops. */
  dropStagger?: number;
  /** Cap for the release velocity in px/s. */
  maxTossSpeed?: number;
  /** Non-physics content rendered above the stage. */
  header?: React.ReactNode;
  stageClassName?: string;
  itemClassName?: string | ((index: number) => string);
};

type StageBounds = { width: number; height: number };

type TossSample = { x: number; y: number; t: number };

type PlaygroundBody = {
  id: string;
  element: HTMLElement;
  spawnIndex: number;
  spawnAt: number;
  spawned: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  radius: number;
  mass: number;
  halfWidth: number;
  halfHeight: number;
  dragging: boolean;
  pointerId: number;
  grabOffsetX: number;
  grabOffsetY: number;
  dragTargetX: number;
  dragTargetY: number;
  dragStartX: number;
  dragStartY: number;
  samples: TossSample[];
};

type PlaygroundEngine = {
  wake: () => void;
  grab: (id: string, event: React.PointerEvent<HTMLDivElement>) => void;
  drag: (id: string, event: React.PointerEvent<HTMLDivElement>) => void;
  release: (id: string, event: React.PointerEvent<HTMLDivElement>) => void;
  cancel: (id: string, event: React.PointerEvent<HTMLDivElement>) => void;
};

const SUBSTEPS = 2;
const GOLDEN_RATIO_FRACT = 0.6180339887498949;
const WALL_TANGENT_FRICTION = 0.92;
const ROLL_BLEND = 0.25;
const SPIN_TRANSFER = 0.12;
const BOUNCE_KILL_SPEED = 90;
const REST_SPEED = 18;
const REST_SPIN = 0.25;
const REST_FRAME_LIMIT = 30;
const TOSS_SAMPLE_WINDOW_MS = 80;
const MAX_RELEASE_SPIN = 9;
const DRAG_FOLLOW_SMOOTHING = 35;
const CLICK_SUPPRESS_DISTANCE = 8;

function clampValue(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Deterministic pseudo-random fraction from an index, so SSR markup stays stable. */
function spawnFraction(index: number) {
  const value = 0.24 + index * GOLDEN_RATIO_FRACT;
  return value - Math.floor(value);
}

/** Semi-implicit Euler: velocity first (gravity + drag), then position and angle. */
function integrateBody(body: PlaygroundBody, gravity: number, airFriction: number, maxSpeed: number, h: number) {
  const drag = Math.pow(airFriction, h * 60);
  body.vy += gravity * h;
  body.vx *= drag;
  body.vy *= drag;
  body.spin *= drag;
  const speed = Math.hypot(body.vx, body.vy);
  if (speed > maxSpeed) {
    const scale = maxSpeed / speed;
    body.vx *= scale;
    body.vy *= scale;
  }
  body.x += body.vx * h;
  body.y += body.vy * h;
  body.angle += body.spin * h;
}

/** Kinematic damped follow toward the drag target; velocity is derived for collisions. */
function followPointer(body: PlaygroundBody, maxSpeed: number, h: number) {
  const nextX = damp(body.x, body.dragTargetX, DRAG_FOLLOW_SMOOTHING, h);
  const nextY = damp(body.y, body.dragTargetY, DRAG_FOLLOW_SMOOTHING, h);
  body.vx = clampValue((nextX - body.x) / h, -maxSpeed, maxSpeed);
  body.vy = clampValue((nextY - body.y) / h, -maxSpeed, maxSpeed);
  body.x = nextX;
  body.y = nextY;
  body.spin = 0;
  body.angle = damp(body.angle, clampValue(body.vx * 0.00035, -0.28, 0.28), 8, h);
}

/**
 * Side and floor collisions; the top stays open so drops enter and tosses can
 * fly out and fall back. Tiny bounces are killed so stacks can reach rest, and
 * contact blends the spin toward rolling without slipping.
 */
function collideWithWalls(body: PlaygroundBody, bounds: StageBounds, restitution: number) {
  const r = body.radius;
  const right = Math.max(r, bounds.width - r);
  const floor = Math.max(r, bounds.height - r);
  if (body.x < r) {
    body.x = r;
    if (body.vx < 0) {
      const incoming = -body.vx;
      body.vx = incoming < BOUNCE_KILL_SPEED ? 0 : incoming * restitution;
      body.vy *= WALL_TANGENT_FRICTION;
      body.spin += (body.vy / r - body.spin) * ROLL_BLEND;
    }
  } else if (body.x > right) {
    body.x = right;
    if (body.vx > 0) {
      const incoming = body.vx;
      body.vx = incoming < BOUNCE_KILL_SPEED ? 0 : -incoming * restitution;
      body.vy *= WALL_TANGENT_FRICTION;
      body.spin += (-body.vy / r - body.spin) * ROLL_BLEND;
    }
  }
  if (body.y > floor) {
    body.y = floor;
    if (body.vy > 0) {
      const incoming = body.vy;
      body.vy = incoming < BOUNCE_KILL_SPEED ? 0 : -incoming * restitution;
      body.vx *= WALL_TANGENT_FRICTION;
      body.spin += (body.vx / r - body.spin) * ROLL_BLEND;
    }
  }
}

/** Circle pair: half-and-half positional correction plus a normal impulse with restitution. */
function collideBodies(a: PlaygroundBody, b: PlaygroundBody, restitution: number) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const minDistance = a.radius + b.radius;
  const distanceSq = dx * dx + dy * dy;
  if (distanceSq >= minDistance * minDistance) return;
  const distance = Math.sqrt(distanceSq);
  const nx = distance > 0.0001 ? dx / distance : 0;
  const ny = distance > 0.0001 ? dy / distance : -1;
  const overlap = minDistance - distance;
  const invMassA = a.dragging ? 0 : 1 / a.mass;
  const invMassB = b.dragging ? 0 : 1 / b.mass;
  if (invMassA + invMassB === 0) return;
  const pushA = invMassA === 0 ? 0 : invMassB === 0 ? overlap : overlap / 2;
  const pushB = invMassB === 0 ? 0 : invMassA === 0 ? overlap : overlap / 2;
  a.x -= nx * pushA;
  a.y -= ny * pushA;
  b.x += nx * pushB;
  b.y += ny * pushB;
  const relativeX = b.vx - a.vx;
  const relativeY = b.vy - a.vy;
  const normalSpeed = relativeX * nx + relativeY * ny;
  if (normalSpeed >= 0) return;
  const bounce = -normalSpeed < BOUNCE_KILL_SPEED ? 0 : restitution;
  const impulse = (-(1 + bounce) * normalSpeed) / (invMassA + invMassB);
  a.vx -= impulse * invMassA * nx;
  a.vy -= impulse * invMassA * ny;
  b.vx += impulse * invMassB * nx;
  b.vy += impulse * invMassB * ny;
  const tangentSpeed = relativeX * -ny + relativeY * nx;
  a.spin += (tangentSpeed / a.radius) * SPIN_TRANSFER;
  b.spin += (tangentSpeed / b.radius) * SPIN_TRANSFER;
}

/** Pull a body back inside the stage after a resize; the open top only clamps downward. */
function clampIntoBounds(body: PlaygroundBody, bounds: StageBounds) {
  const r = body.radius;
  body.x = clampValue(body.x, Math.min(r, bounds.width / 2), Math.max(r, bounds.width - r));
  body.y = Math.min(body.y, Math.max(r, bounds.height - r));
}

/** A gravity sticker stage: items drop in, collide, and can be grabbed, dragged and tossed. */
export function PhysicsPlayground({
  airFriction = 0.995,
  className,
  dropStagger = 90,
  gravity = 1600,
  header,
  itemClassName,
  items,
  label,
  maxTossSpeed = 2600,
  restitution = 0.3,
  stageClassName,
  ...props
}: PhysicsPlaygroundProps) {
  const rootRef = React.useRef<HTMLElement>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const itemRefs = React.useRef(new Map<string, HTMLDivElement>());
  const itemsRef = React.useRef(items);
  const engineRef = React.useRef<PlaygroundEngine | null>(null);
  const suppressClickRef = React.useRef(new Set<string>());
  const reducedMotion = usePrefersReducedMotion();

  React.useEffect(() => {
    itemsRef.current = items;
  });

  React.useEffect(() => {
    if (reducedMotion) return;
    const stage = stageRef.current;
    if (!stage) return;
    const itemElements = itemRefs.current;
    const suppressClick = suppressClickRef.current;
    const bodies = new Map<string, PlaygroundBody>();
    const bounds: StageBounds = { width: stage.clientWidth, height: stage.clientHeight };
    const dragOrigin = { x: 0, y: 0 };
    let disposed = false;
    let running = false;
    let intersecting = false;
    let frame = 0;
    let previous = performance.now();
    let spawnElapsed = 0;
    let lastScheduledSpawn = -dropStagger;
    let nextSpawnIndex = 0;
    let restFrames = 0;
    let dragDepth = 0;

    // New elements are measured exactly once, on creation; the steady-state loop never reads layout.
    const syncBodies = () => {
      bodies.forEach((body, id) => {
        if (!itemElements.has(id)) bodies.delete(id);
      });
      itemElements.forEach((element, id) => {
        const existing = bodies.get(id);
        if (existing) {
          if (existing.element !== element) {
            existing.element = element;
            element.style.visibility = existing.spawned ? "" : "hidden";
          }
          return;
        }
        const item = itemsRef.current.find((candidate) => candidate.id === id);
        const halfWidth = element.offsetWidth / 2;
        const halfHeight = element.offsetHeight / 2;
        const radius = Math.max(6, item?.radius ?? Math.max(halfWidth, halfHeight) * 0.92);
        const spawnAt = Math.max(spawnElapsed, lastScheduledSpawn + dropStagger);
        lastScheduledSpawn = spawnAt;
        bodies.set(id, {
          id,
          element,
          spawnIndex: nextSpawnIndex,
          spawnAt,
          spawned: false,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          angle: 0,
          spin: 0,
          radius,
          mass: radius * radius,
          halfWidth,
          halfHeight,
          dragging: false,
          pointerId: -1,
          grabOffsetX: 0,
          grabOffsetY: 0,
          dragTargetX: 0,
          dragTargetY: 0,
          dragStartX: 0,
          dragStartY: 0,
          samples: [],
        });
        nextSpawnIndex += 1;
      });
    };

    const spawnBody = (body: PlaygroundBody) => {
      const margin = Math.min(bounds.width / 2, body.radius + 12);
      body.spawned = true;
      body.x = margin + spawnFraction(body.spawnIndex) * Math.max(0, bounds.width - margin * 2);
      body.y = -(body.radius + body.halfHeight);
      body.vx = 0;
      body.vy = 120;
      body.angle = (spawnFraction(body.spawnIndex + 5) - 0.5) * 0.5;
      body.spin = (spawnFraction(body.spawnIndex + 11) - 0.5) * 3;
      body.element.style.visibility = "";
    };

    const render = (time: number) => {
      if (disposed) return;
      frame = 0;
      if (!intersecting || document.visibilityState !== "visible") {
        running = false;
        return;
      }
      const delta = Math.min(1 / 30, Math.max(0.001, (time - previous) / 1000));
      previous = time;
      syncBodies();
      if (bodies.size === 0 || bounds.width < 4 || bounds.height < 4) {
        // Nothing to simulate; the item ref callback and ResizeObserver wake us.
        running = false;
        return;
      }
      spawnElapsed += delta * 1000;
      let pendingSpawns = 0;
      const active: PlaygroundBody[] = [];
      bodies.forEach((body) => {
        if (!body.spawned && spawnElapsed >= body.spawnAt) spawnBody(body);
        if (body.spawned) active.push(body);
        else pendingSpawns += 1;
      });
      const h = delta / SUBSTEPS;
      for (let step = 0; step < SUBSTEPS; step += 1) {
        for (const body of active) {
          if (body.dragging) followPointer(body, maxTossSpeed, h);
          else integrateBody(body, gravity, airFriction, maxTossSpeed * 1.2, h);
        }
        for (let i = 0; i < active.length; i += 1) {
          for (let j = i + 1; j < active.length; j += 1) {
            collideBodies(active[i], active[j], restitution);
          }
        }
        for (const body of active) {
          if (!body.dragging) collideWithWalls(body, bounds, restitution);
        }
      }
      let settled = pendingSpawns === 0 && dragDepth === 0;
      for (const body of active) {
        body.element.style.transform = `translate3d(${body.x - body.halfWidth}px, ${body.y - body.halfHeight}px, 0) rotate(${body.angle}rad)`;
        if (Math.hypot(body.vx, body.vy) > REST_SPEED || Math.abs(body.spin) > REST_SPIN) settled = false;
      }
      restFrames = settled ? restFrames + 1 : 0;
      if (restFrames >= REST_FRAME_LIMIT) {
        // Sleep: everything has idled for 30 consecutive frames; stop scheduling until a wake event.
        for (const body of active) {
          body.vx = 0;
          body.vy = 0;
          body.spin = 0;
        }
        running = false;
        return;
      }
      frame = requestAnimationFrame(render);
    };

    const wake = () => {
      if (disposed || running) return;
      running = true;
      restFrames = 0;
      previous = performance.now();
      frame = requestAnimationFrame(render);
    };

    const grab: PlaygroundEngine["grab"] = (id, event) => {
      const body = bodies.get(id);
      if (!body || !body.spawned || body.dragging) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        return;
      }
      // One layout read per grab; pointermove reuses the cached stage origin.
      const stageRect = stage.getBoundingClientRect();
      dragOrigin.x = stageRect.left;
      dragOrigin.y = stageRect.top;
      body.dragging = true;
      dragDepth += 1;
      body.pointerId = event.pointerId;
      body.grabOffsetX = event.clientX - dragOrigin.x - body.x;
      body.grabOffsetY = event.clientY - dragOrigin.y - body.y;
      body.dragTargetX = body.x;
      body.dragTargetY = body.y;
      body.dragStartX = event.clientX;
      body.dragStartY = event.clientY;
      body.samples.length = 0;
      body.samples.push({ x: event.clientX, y: event.clientY, t: performance.now() });
      body.vx = 0;
      body.vy = 0;
      body.spin = 0;
      body.element.style.cursor = "grabbing";
      body.element.style.zIndex = String(10 + body.spawnIndex);
      wake();
    };

    const drag: PlaygroundEngine["drag"] = (id, event) => {
      const body = bodies.get(id);
      if (!body || !body.dragging || body.pointerId !== event.pointerId) return;
      const pointerX = event.clientX - dragOrigin.x;
      const pointerY = event.clientY - dragOrigin.y;
      body.dragTargetX = clampValue(pointerX - body.grabOffsetX, body.radius, Math.max(body.radius, bounds.width - body.radius));
      body.dragTargetY = clampValue(pointerY - body.grabOffsetY, body.radius, Math.max(body.radius, bounds.height - body.radius));
      const now = performance.now();
      body.samples.push({ x: event.clientX, y: event.clientY, t: now });
      while (body.samples.length > 2 && now - body.samples[0].t > TOSS_SAMPLE_WINDOW_MS) body.samples.shift();
      wake();
    };

    const release: PlaygroundEngine["release"] = (id, event) => {
      const body = bodies.get(id);
      if (!body || !body.dragging || body.pointerId !== event.pointerId) return;
      body.dragging = false;
      dragDepth = Math.max(0, dragDepth - 1);
      body.pointerId = -1;
      body.element.style.cursor = "";
      const now = performance.now();
      // Toss velocity comes from the pointer's travel over the last ~80ms, not the damped follow.
      let reference = body.samples.length > 0 ? body.samples[0] : null;
      for (const sample of body.samples) {
        if (now - sample.t <= TOSS_SAMPLE_WINDOW_MS) {
          reference = sample;
          break;
        }
      }
      if (reference) {
        const span = Math.max(1 / 60, (now - reference.t) / 1000);
        let tossX = (event.clientX - reference.x) / span;
        let tossY = (event.clientY - reference.y) / span;
        const speed = Math.hypot(tossX, tossY);
        if (speed > maxTossSpeed) {
          tossX *= maxTossSpeed / speed;
          tossY *= maxTossSpeed / speed;
        }
        body.vx = tossX;
        body.vy = tossY;
        body.spin = clampValue(
          (body.grabOffsetX * tossY - body.grabOffsetY * tossX) / Math.max(600, body.radius * body.radius),
          -MAX_RELEASE_SPIN,
          MAX_RELEASE_SPIN,
        );
      }
      body.samples.length = 0;
      const travel = Math.hypot(event.clientX - body.dragStartX, event.clientY - body.dragStartY);
      if (travel > CLICK_SUPPRESS_DISTANCE) suppressClick.add(id);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      wake();
    };

    const cancel: PlaygroundEngine["cancel"] = (id, event) => {
      const body = bodies.get(id);
      if (!body || !body.dragging || body.pointerId !== event.pointerId) return;
      body.dragging = false;
      dragDepth = Math.max(0, dragDepth - 1);
      body.pointerId = -1;
      body.vx = 0;
      body.vy = 0;
      body.samples.length = 0;
      body.element.style.cursor = "";
      wake();
    };

    engineRef.current = { wake, grab, drag, release, cancel };

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        intersecting = Boolean(entry?.isIntersecting);
        if (intersecting) wake();
      },
      { rootMargin: "10% 0px" },
    );
    intersectionObserver.observe(stage);
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[entries.length - 1];
      if (!entry) return;
      bounds.width = entry.contentRect.width;
      bounds.height = entry.contentRect.height;
      bodies.forEach((body) => {
        if (body.spawned && !body.dragging) clampIntoBounds(body, bounds);
      });
      wake();
    });
    resizeObserver.observe(stage);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") wake();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      disposed = true;
      engineRef.current = null;
      cancelAnimationFrame(frame);
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      itemElements.forEach((element) => {
        element.style.transform = "";
        element.style.visibility = "hidden";
        element.style.cursor = "";
        element.style.zIndex = "";
      });
      bodies.clear();
      suppressClick.clear();
    };
  }, [airFriction, dropStagger, gravity, maxTossSpeed, reducedMotion, restitution]);

  const resolveItemClass = (index: number) =>
    typeof itemClassName === "function" ? itemClassName(index) : itemClassName;

  if (reducedMotion) {
    return (
      <section
        aria-label={label}
        data-physics-playground
        data-static
        className={cn("relative flex flex-col", className)}
        {...props}
      >
        {header}
        <div className={cn("flex min-h-0 flex-1 flex-wrap content-start items-center gap-3 overflow-hidden p-6", stageClassName)}>
          {items.map((item, index) => (
            <div key={item.id} data-physics-item className={resolveItemClass(index)}>
              {item.content}
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      ref={rootRef}
      aria-label={label}
      data-physics-playground
      className={cn("relative flex flex-col", className)}
      {...props}
    >
      {header}
      <div ref={stageRef} className={cn("relative min-h-0 flex-1 overflow-hidden", stageClassName)}>
        {items.map((item, index) => (
          <div
            key={item.id}
            ref={(node) => {
              if (node) {
                itemRefs.current.set(item.id, node);
                engineRef.current?.wake();
              } else {
                itemRefs.current.delete(item.id);
              }
            }}
            data-physics-item
            className={cn(
              "absolute left-0 top-0 w-max transform-gpu cursor-grab touch-none select-none will-change-transform active:cursor-grabbing",
              resolveItemClass(index),
            )}
            style={{ visibility: "hidden" }}
            onPointerDown={(event) => engineRef.current?.grab(item.id, event)}
            onPointerMove={(event) => engineRef.current?.drag(item.id, event)}
            onPointerUp={(event) => engineRef.current?.release(item.id, event)}
            onPointerCancel={(event) => engineRef.current?.cancel(item.id, event)}
            onLostPointerCapture={(event) => engineRef.current?.cancel(item.id, event)}
            onClickCapture={(event) => {
              if (suppressClickRef.current.delete(item.id)) {
                event.preventDefault();
                event.stopPropagation();
              }
            }}
          >
            {item.content}
          </div>
        ))}
      </div>
    </section>
  );
}
