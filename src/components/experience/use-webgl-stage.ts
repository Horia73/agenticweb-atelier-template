"use client";

import * as React from "react";
import * as THREE from "three";

import {
  getExperienceDprCap,
  supportsWebGL,
} from "@/components/experience/experience-runtime";

export type WebGLStageContext = {
  renderer: THREE.WebGLRenderer;
  stage: HTMLElement;
  canvas: HTMLCanvasElement;
  /** Flip the stage to ready once async assets are decoded and the first frame can show. */
  markReady: () => void;
  /** Flip the stage to failed (poster/fallback becomes visible). */
  markFailed: () => void;
  /** True after the stage effect has been cleaned up; guard async callbacks with it. */
  isDisposed: () => boolean;
  /** Re-run the resize pass — call after async assets load so size-dependent caps apply. */
  requestResize: () => void;
};

export type WebGLStageHandle = {
  /** Runs every animation frame while the stage is on screen, the tab is visible and the context is alive. */
  onFrame?: (deltaSeconds: number, time: number) => void;
  /** Runs after the renderer resized; update cameras, uniforms and derived scales here. */
  onResize?: (width: number, height: number) => void;
  /** Optional extra cap on device pixel ratio for a given stage size (e.g. never supersample past the source texture). */
  getDpr?: (width: number, height: number) => number;
  /** Dispose geometries, materials and textures created in `create`; the renderer itself is disposed by the hook. */
  dispose?: () => void;
};

export type WebGLStageOptions = {
  stageRef: React.RefObject<HTMLElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** false keeps the stage fully inert — use it for reduced-motion / coarse-pointer static modes. */
  enabled: boolean;
  maxDpr?: number;
  antialias?: boolean;
  alpha?: boolean;
  /** Request a stencil buffer (three defaults it off since r163); needed for aperture/mask scenes. */
  stencil?: boolean;
  /**
   * Serialize every visual prop that must rebuild the scene into this string.
   * Array or callback identity never triggers a rebuild, so inline props stay safe.
   */
  signature?: string;
  /** Root margin for the offscreen pause observer. */
  rootMargin?: string;
  /** Build the scene. Reads props freely (latest values are visible via closure on each rebuild). */
  create: (context: WebGLStageContext) => WebGLStageHandle | void;
};

/**
 * Shared WebGL lifecycle for experience stages: renderer with capped DPR,
 * resize + offscreen observers, a visibility-gated animation loop, context-loss
 * pause with context-restore recovery, and full disposal. Components own only
 * their scene graph and per-frame logic.
 */
export function useWebGLStage({
  alpha = false,
  antialias = false,
  canvasRef,
  create,
  enabled,
  maxDpr = 1.6,
  rootMargin = "20% 0px",
  signature,
  stageRef,
  stencil = false,
}: WebGLStageOptions) {
  const [ready, setReady] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const createRef = React.useRef(create);
  React.useInsertionEffect(() => {
    createRef.current = create;
  });

  React.useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas || !enabled) return;
    if (!supportsWebGL()) {
      const timer = window.setTimeout(() => setFailed(true), 0);
      return () => window.clearTimeout(timer);
    }

    let disposed = false;
    let frame = 0;
    let previous = performance.now();
    let contextAlive = true;
    let lossTimer = 0;
    let onScreen = true;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias, alpha, stencil, powerPreference: "high-performance" });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(
      window.devicePixelRatio || 1,
      maxDpr,
      getExperienceDprCap(stage.clientWidth),
    ));

    let handle: WebGLStageHandle = {};
    const resize = () => {
      const width = Math.max(1, stage.clientWidth);
      const height = Math.max(1, stage.clientHeight);
      const extraCap = handle.getDpr?.(width, height) ?? Number.POSITIVE_INFINITY;
      renderer.setPixelRatio(Math.max(0.5, Math.min(
        window.devicePixelRatio || 1,
        maxDpr,
        extraCap,
        getExperienceDprCap(width),
      )));
      renderer.setSize(width, height, false);
      handle.onResize?.(width, height);
    };
    const context: WebGLStageContext = {
      renderer,
      stage,
      canvas,
      markReady: () => {
        if (!disposed) setReady(true);
      },
      markFailed: () => {
        if (!disposed) setFailed(true);
      },
      isDisposed: () => disposed,
      requestResize: () => {
        if (!disposed) resize();
      },
    };
    handle = createRef.current(context) ?? {};
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stage);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        onScreen = Boolean(entry?.isIntersecting);
      },
      { rootMargin },
    );
    intersectionObserver.observe(stage);

    // preventDefault opts into restoration; Three re-uploads retained resources
    // on the next render after the context returns. Only a loss that never
    // restores becomes a visible failure.
    const contextLost = (event: Event) => {
      event.preventDefault();
      contextAlive = false;
      window.clearTimeout(lossTimer);
      lossTimer = window.setTimeout(() => {
        if (!disposed && !contextAlive) setFailed(true);
      }, 2500);
    };
    const contextRestored = () => {
      window.clearTimeout(lossTimer);
      contextAlive = true;
      if (disposed) return;
      setFailed(false);
      resize();
    };
    canvas.addEventListener("webglcontextlost", contextLost);
    canvas.addEventListener("webglcontextrestored", contextRestored);

    const render = (time: number) => {
      if (disposed) return;
      const delta = Math.min(0.05, Math.max(0.001, (time - previous) / 1000));
      previous = time;
      if (contextAlive && onScreen && document.visibilityState === "visible") {
        handle.onFrame?.(delta, time);
      }
      frame = requestAnimationFrame(render);
    };

    resize();
    frame = requestAnimationFrame(render);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.clearTimeout(lossTimer);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      canvas.removeEventListener("webglcontextlost", contextLost);
      canvas.removeEventListener("webglcontextrestored", contextRestored);
      handle.dispose?.();
      renderer.dispose();
    };
  }, [alpha, antialias, canvasRef, enabled, maxDpr, rootMargin, signature, stageRef, stencil]);

  return { ready, failed };
}
