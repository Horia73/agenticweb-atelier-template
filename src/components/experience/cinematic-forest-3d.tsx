"use client";

import * as React from "react";
import { Clone, Environment, useGLTF, useTexture } from "@react-three/drei";
import { motion, type MotionValue, useTransform } from "motion/react";
import * as THREE from "three";

import {
  Cinematic3DScene,
  OccludedText,
  type Cinematic3DSceneProps,
  type CinematicCameraBeat,
} from "@/components/experience/cinematic-3d-scene";
import { cn } from "@/lib/utils";

const ASSET_ROOT = "/experience/cinematic-forest-3d";
const FOREST_POSTER = `${ASSET_ROOT}/poster.webp`;
const GROUND_NORMAL_SCALE = new THREE.Vector2(0.88, 0.88);

const DEFAULT_CAMERA: CinematicCameraBeat[] = [
  { at: 0, position: [0, 2.3, 7.2], target: [0, 4.2, -10], fov: 48 },
  { at: 0.22, position: [1.1, 2.45, 2.7], target: [-1.2, 4.45, -13], fov: 46 },
  { at: 0.5, position: [-1.45, 2.58, -3.1], target: [0.4, 4.8, -19], fov: 45 },
  { at: 0.74, position: [2.05, 2.7, -8.7], target: [-0.2, 5.1, -25], fov: 44 },
  { at: 1, position: [-1.7, 2.92, -14.4], target: [1.1, 5.45, -31], fov: 43 },
];

const TREE_GROUPS = [
  { position: [-7.2, 0, -12.5] as [number, number, number], rotation: 0.04, scale: 0.82 },
  { position: [9.5, 0.05, -31] as [number, number, number], rotation: Math.PI + 0.3, scale: 0.94 },
  { position: [-15, 0.08, -48] as [number, number, number], rotation: -0.22, scale: 1.08 },
];

const BROADLEAF_TREES = [
  [-5.8, 0.02, -6.8, 0.38, 2.55],
  [6.8, 0.02, -9.5, -0.42, 2.15],
  [-7.2, 0.04, -17.8, 1.08, 2.7],
  [7.8, 0.05, -22.5, -1.2, 2.45],
  [-6.4, 0.06, -30.5, 0.12, 2.85],
  [6.2, 0.08, -36.8, 1.55, 2.65],
  [-8.4, 0.08, -44.5, -0.74, 3.05],
] as const;

const DISTANT_BROADLEAF_TREES = [
  [-23, -61, 0.2, 3.25], [-11, -68, -0.7, 3.7], [3, -75, 1.1, 3.45], [17, -82, -0.25, 3.9],
  [-17, -94, 0.75, 4.15], [-1, -108, -1.1, 4.4], [18, -121, 0.4, 4.6],
] as const;

const DISTANT_FIR_GROUPS = [
  [-20, -72, 0.22, 1.08],
  [1, -104, Math.PI + 0.16, 1.18],
] as const;

const SAPLING_GROUPS = [
  [-8.2, 0.03, -5.8, 0.15, 3.1],
  [5.8, 0.04, -7.5, -0.4, 2.65],
  [-6.7, 0.05, -20.5, 0.9, 3.4],
  [8.7, 0.07, -23.5, -0.7, 3.75],
  [-9.8, 0.08, -37.5, 0.2, 3.5],
  [6.4, 0.08, -42.5, 1.1, 3.9],
] as const;

const FERN_GROUPS = [
  [-4.6, -2.8, 1.45], [3.6, -3.8, 1.18], [-6.4, -8.7, 1.6], [5.2, -10.4, 1.38],
  [-2.2, -6.2, 1.08], [2.1, -8.1, 1.24], [-4.1, -11.8, 1.3], [3.2, -13.1, 1.16],
  [-3.7, -14.6, 1.34], [7.1, -17.2, 1.75], [-7.8, -22.4, 1.85], [4.4, -25.8, 1.48],
  [-2.8, -19.5, 1.22], [2.7, -23.1, 1.38], [-4.6, -28.2, 1.44], [3.5, -30.4, 1.26],
  [-5.1, -31.5, 1.9], [7.6, -35.7, 1.72], [-8.8, -41.5, 2.05], [5.7, -45.8, 1.68],
  [-2.4, -35.3, 1.34], [2.8, -39.1, 1.46], [-4.2, -43.8, 1.52], [3.6, -47.2, 1.32],
] as const;

const ROCK_GROUPS = [
  [-6.8, -4.1, 0.55, 0.4], [5.8, -12.6, 0.48, -0.6], [-7.5, -27.2, 0.62, 0.8],
  [6.9, -39.2, 0.58, 0.15],
] as const;

export type CinematicForest3DProps = Omit<
  Cinematic3DSceneProps,
  "camera" | "children" | "intro" | "label" | "poster"
> & {
  camera?: CinematicCameraBeat[];
  poster?: string;
  kicker?: string;
  title?: string;
  closingLine?: string;
  assetRoot?: string;
};

function terrainHeightAt(x: number, z: number) {
  return -0.14 + Math.sin(x * 0.115) * Math.cos(z * 0.09) * 0.1;
}

function fadeGroundShader(shader: THREE.WebGLProgramParametersWithUniforms) {
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", "#include <common>\nvarying float vForestWorldDepth;")
    .replace(
      "#include <begin_vertex>",
      "#include <begin_vertex>\nvForestWorldDepth = -(modelMatrix * vec4(transformed, 1.0)).z;",
    );
  shader.fragmentShader = shader.fragmentShader
    .replace("#include <common>", "#include <common>\nvarying float vForestWorldDepth;")
    .replace(
      "#include <alphatest_fragment>",
      "diffuseColor.a *= 1.0 - smoothstep(48.0, 82.0, vForestWorldDepth);\n#include <alphatest_fragment>",
    );
}

function prepareForestMaterials(...scenes: THREE.Object3D[]) {
  for (const scene of scenes) {
    scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = false;
      object.receiveShadow = true;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        if (!(material instanceof THREE.MeshStandardMaterial)) continue;
        material.depthWrite = true;
        if (material.transparent || material.alphaMap || material.map?.format === THREE.RGBAFormat) {
          material.transparent = false;
          material.alphaTest = 0.34;
          material.side = THREE.DoubleSide;
        }
        material.needsUpdate = true;
      }
    });
  }
}

function ForestWorld({ assetRoot, quality }: { assetRoot: string; quality: "full" | "balanced" }) {
  const trees = useGLTF(`${assetRoot}/fir-trees.glb`, false, true).scene;
  const broadleafTree = useGLTF(`${assetRoot}/broadleaf-tree.glb`, false, true).scene;
  const saplings = useGLTF(`${assetRoot}/fir-saplings.glb`, false, true).scene;
  const ferns = useGLTF(`${assetRoot}/ferns.glb`, false, true).scene;
  const mossRocks = useGLTF(`${assetRoot}/moss-rocks.glb`, false, true).scene;
  const rootCluster = useGLTF(`${assetRoot}/root-cluster.glb`, false, true).scene;
  const [sourceGroundMap, sourceGroundNormal, sourceGroundRoughness, sourceGroundDisplacement] = useTexture([
    `${assetRoot}/ground-diffuse.jpg`,
    `${assetRoot}/ground-normal.jpg`,
    `${assetRoot}/ground-roughness.jpg`,
    `${assetRoot}/ground-displacement.jpg`,
  ]);
  const [groundMap, groundNormal, groundRoughness, groundDisplacement] = React.useMemo(() => {
    const textures = [
      sourceGroundMap.clone(),
      sourceGroundNormal.clone(),
      sourceGroundRoughness.clone(),
      sourceGroundDisplacement.clone(),
    ] as const;
    for (const texture of textures) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(7.5, 10);
      texture.anisotropy = quality === "full" ? 8 : 4;
      texture.needsUpdate = true;
    }
    textures[0].colorSpace = THREE.SRGBColorSpace;
    return textures;
  }, [quality, sourceGroundDisplacement, sourceGroundMap, sourceGroundNormal, sourceGroundRoughness]);
  const terrain = React.useMemo(() => {
    const segments = quality === "full" ? 192 : 96;
    const geometry = new THREE.PlaneGeometry(220, 220, segments, segments);
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0, 0, -40);
    const position = geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let index = 0; index < position.count; index += 1) {
      const x = position.getX(index);
      const z = position.getZ(index);
      position.setY(index, terrainHeightAt(x, z));
    }
    position.needsUpdate = true;
    geometry.computeVertexNormals();
    return geometry;
  }, [quality]);

  React.useEffect(() => () => terrain.dispose(), [terrain]);

  React.useLayoutEffect(() => {
    prepareForestMaterials(trees, broadleafTree, saplings, ferns, mossRocks, rootCluster);
  }, [broadleafTree, ferns, mossRocks, rootCluster, saplings, trees]);

  React.useEffect(() => () => {
    groundMap.dispose();
    groundNormal.dispose();
    groundRoughness.dispose();
    groundDisplacement.dispose();
  }, [groundDisplacement, groundMap, groundNormal, groundRoughness]);

  const visibleSaplings = quality === "full" ? SAPLING_GROUPS.slice(0, 5) : SAPLING_GROUPS.slice(0, 3);
  const visibleFerns = quality === "full" ? FERN_GROUPS : FERN_GROUPS.slice(0, 8);
  const visibleRocks = quality === "full" ? ROCK_GROUPS : ROCK_GROUPS.slice(0, 3);
  const distantBroadleaf = quality === "full" ? DISTANT_BROADLEAF_TREES.slice(0, 5) : DISTANT_BROADLEAF_TREES.slice(0, 3);
  const distantFirs = DISTANT_FIR_GROUPS.slice(0, 1);

  return (
    <>
      <Environment
        background
        backgroundBlurriness={0}
        backgroundIntensity={0.9}
        environmentIntensity={0.62}
        files={`${assetRoot}/forest-slope-4k.hdr`}
      />
      <hemisphereLight args={["#c8d7bf", "#2b241b", 1.15]} />
      <directionalLight
        castShadow
        color="#fff2cf"
        intensity={2.1}
        position={[-8, 16, 5]}
        shadow-bias={-0.00018}
        shadow-camera-bottom={-20}
        shadow-camera-far={70}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={20}
        shadow-mapSize-height={quality === "full" ? 1024 : 512}
        shadow-mapSize-width={quality === "full" ? 1024 : 512}
      />

      <mesh geometry={terrain} receiveShadow>
        <meshStandardMaterial
          color="#7d8065"
          depthWrite={false}
          displacementMap={groundDisplacement}
          displacementScale={0.34}
          map={groundMap}
          normalMap={groundNormal}
          normalScale={GROUND_NORMAL_SCALE}
          onBeforeCompile={fadeGroundShader}
          roughness={0.98}
          roughnessMap={groundRoughness}
          transparent
        />
      </mesh>

      {TREE_GROUPS.map((tree, index) => (
        <group key={index} position={tree.position} rotation-y={tree.rotation} scale={tree.scale}>
          <Clone object={trees} castShadow={index === 0} receiveShadow />
        </group>
      ))}

      {BROADLEAF_TREES.map(([x, y, z, rotation, scale], index) => (
        <group key={index} position={[x, y, z]} rotation-y={rotation} scale={scale}>
          <Clone object={broadleafTree} castShadow={index < 3} receiveShadow />
        </group>
      ))}

      {distantBroadleaf.map(([x, z, rotation, scale], index) => (
        <group key={index} position={[x, terrainHeightAt(x, z), z]} rotation-y={rotation} scale={scale}>
          <Clone object={broadleafTree} castShadow={false} receiveShadow />
        </group>
      ))}

      {distantFirs.map(([x, z, rotation, scale], index) => (
        <group key={index} position={[x, terrainHeightAt(x, z), z]} rotation-y={rotation} scale={scale}>
          <Clone object={trees} castShadow={false} receiveShadow />
        </group>
      ))}

      {visibleSaplings.map(([x, y, z, rotation, scale], index) => (
        <group key={index} position={[x, y, z]} rotation-y={rotation} scale={scale}>
          <Clone object={saplings} castShadow={false} receiveShadow />
        </group>
      ))}

      {visibleFerns.map(([x, z, scale], index) => (
        <group key={index} position={[x, -0.05, z]} rotation-y={(index * 1.73) % Math.PI} scale={scale}>
          <Clone object={ferns} castShadow={false} receiveShadow />
        </group>
      ))}

      {visibleRocks.map(([x, z, scale, rotation], index) => (
        <group key={index} position={[x, -0.08, z]} rotation-y={rotation} scale={scale}>
          <Clone object={mossRocks} castShadow receiveShadow />
        </group>
      ))}

      <group position={[-4.8, -0.06, -18]} rotation-y={0.32} scale={0.68}>
        <Clone object={rootCluster} castShadow receiveShadow />
      </group>
    </>
  );
}

function ForestNarrative({
  closingLine,
  kicker,
  progress,
  title,
}: {
  closingLine: string;
  kicker: string;
  progress: MotionValue<number>;
  title: string;
}) {
  const openingOpacity = useTransform(progress, [0, 0.08, 0.25, 0.36], [1, 1, 1, 0]);
  const openingY = useTransform(progress, [0, 0.34], [0, -32]);
  const closingOpacity = useTransform(progress, [0.7, 0.82, 0.97], [0, 1, 1]);
  const closingY = useTransform(progress, [0.7, 0.86], [38, 0]);

  return (
    <div className="relative h-full text-white">
      <motion.div
        className="absolute inset-x-[clamp(1.5rem,5vw,5.5rem)] top-[clamp(5.5rem,14vh,9rem)] max-w-[54rem]"
        style={{ opacity: openingOpacity, y: openingY }}
      >
        <p className="text-[0.64rem] font-semibold uppercase tracking-[0.3em] text-white/68">{kicker}</p>
        <h2 className="mt-5 max-w-[10ch] text-[clamp(3.8rem,8.2vw,8.6rem)] font-semibold leading-[0.8] tracking-[-0.075em] text-balance">
          {title}
        </h2>
      </motion.div>

      <motion.div
        className="absolute bottom-[clamp(2.5rem,8vh,6rem)] right-[clamp(1.5rem,6vw,7rem)] max-w-[27rem] text-right"
        style={{ opacity: closingOpacity, y: closingY }}
      >
        <p className="text-[clamp(1.55rem,3vw,3.2rem)] font-medium leading-[0.94] tracking-[-0.045em] text-balance">
          {closingLine}
        </p>
      </motion.div>

      <div className="absolute bottom-6 left-[clamp(1.5rem,5vw,5.5rem)] flex items-center gap-3 text-[0.58rem] font-semibold uppercase tracking-[0.24em] text-white/58">
        <span className="h-px w-9 bg-white/45" />
        Scroll to enter
      </div>
    </div>
  );
}

/**
 * A real 3D forest assembled from scanned/PBR CC0 sources. Studio can replace
 * the world, camera beats and narrative without inheriting this art direction.
 */
export function CinematicForest3D({
  assetRoot = ASSET_ROOT,
  camera = DEFAULT_CAMERA,
  className,
  closingLine = "One world. Real depth. No flat layers.",
  kicker = "Scanned geometry / full vegetation / scroll camera",
  poster = FOREST_POSTER,
  scrollScreens = 6.2,
  title = "Enter a living forest.",
  ...props
}: CinematicForest3DProps) {
  return (
    <Cinematic3DScene
      {...props}
      camera={camera}
      className={cn("[--forest-ink:#f4f1e8]", className)}
      label="Pădure 3D fotorealistă controlată prin scroll"
      poster={poster}
      scrollScreens={scrollScreens}
      intro={(progress) => (
        <ForestNarrative
          closingLine={closingLine}
          kicker={kicker}
          progress={progress}
          title={title}
        />
      )}
      reducedMotionFallback={(
        <section
          aria-label="Pădure 3D fotorealistă"
          className="relative min-h-svh bg-[#07100b] bg-cover bg-center text-white"
          style={{ backgroundImage: `linear-gradient(rgb(3 8 5 / 0.08), rgb(3 8 5 / 0.58)), url(${poster})` }}
        >
          <div className="absolute inset-x-[clamp(1.5rem,5vw,5.5rem)] top-[18vh]">
            <p className="text-[0.64rem] font-semibold uppercase tracking-[0.3em] text-white/68">{kicker}</p>
            <h2 className="mt-5 max-w-[10ch] text-[clamp(3.8rem,8vw,8.4rem)] font-semibold leading-[0.8] tracking-[-0.075em]">{title}</h2>
          </div>
        </section>
      )}
    >
      {({ progress, quality }) => (
        <>
          <ForestWorld assetRoot={assetRoot} quality={quality} />
          <OccludedText
            anchorX="center"
            anchorY="middle"
            beats={[
              { at: 0, opacity: 0, position: [-1.2, 4.4, -17] },
              { at: 0.34, opacity: 0, position: [-3.6, 4.25, -17] },
              { at: 0.5, opacity: 0.86, position: [-2.2, 4.4, -17] },
              { at: 0.7, opacity: 0.86, position: [1.15, 4.55, -17] },
              { at: 0.84, opacity: 0, position: [2.35, 4.65, -17] },
            ]}
            color="#e9eadb"
            fontSize={0.78}
            letterSpacing={-0.045}
            lineHeight={0.88}
            maxWidth={5.6}
            progress={progress}
            textAlign="center"
          >
            THE FOREST OPENS
          </OccludedText>
        </>
      )}
    </Cinematic3DScene>
  );
}

export { DEFAULT_CAMERA as cinematicForestCamera };
