"use client";

import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

export type SecurityState =
  | "IDLE"
  | "TASK_REQUESTED"
  | "LEASE_APPROVED"
  | "AGENT_EXECUTING"
  | "ACCESS_DENIED"
  | "TASK_COMPLETED"
  | "RECEIPT_VERIFIED";

type Props = {
  state?: SecurityState;
  compact?: boolean;
  reducedMotion?: boolean;
  className?: string;
};

const COLORS = {
  cyan: "#52d9ff",
  violet: "#8769ff",
  green: "#73f2ba",
  red: "#ff688d",
};

const STATE_LABELS: Record<SecurityState, string> = {
  IDLE: "Trust core idle. No data access granted.",
  TASK_REQUESTED: "Task proposed. Documents are waiting for your approval.",
  LEASE_APPROVED: "Permission lease approved. The authorized connection is open.",
  AGENT_EXECUTING: "Agent executing. Data travels only along approved paths.",
  ACCESS_DENIED: "Unauthorized access blocked at the policy boundary.",
  TASK_COMPLETED: "Task completed. Temporary data access has closed.",
  RECEIPT_VERIFIED: "Receipt verified. Cryptographic integrity confirmed.",
};

function stateColor(state: SecurityState) {
  if (state === "RECEIPT_VERIFIED" || state === "TASK_COMPLETED") return COLORS.green;
  if (state === "ACCESS_DENIED") return COLORS.red;
  return COLORS.cyan;
}

class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function CoreFallback({ state }: { state: SecurityState }) {
  const color = stateColor(state);
  return (
    <svg viewBox="0 0 600 540" width="100%" height="100%" aria-hidden="true" style={{ display: "block" }}>
      <defs>
        <radialGradient id={`core-fallback-${state}`}><stop offset="0" stopColor={color} stopOpacity=".13" /><stop offset="1" stopColor={color} stopOpacity="0" /></radialGradient>
        <linearGradient id={`core-face-${state}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor={color} stopOpacity=".34" /><stop offset="1" stopColor="#193d64" stopOpacity=".1" /></linearGradient>
      </defs>
      <circle cx="300" cy="270" r="225" fill={`url(#core-fallback-${state})`} />
      <g fill="none" stroke={color} strokeWidth="1">
        <ellipse cx="300" cy="270" rx="207" ry="74" transform="rotate(-28 300 270)" opacity=".55" />
        <ellipse cx="300" cy="270" rx="180" ry="95" transform="rotate(57 300 270)" opacity=".25" />
        <ellipse cx="300" cy="270" rx="218" ry="126" transform="rotate(16 300 270)" opacity=".15" />
        <path d="M300 130 391 260 300 402 209 260Z" fill={`url(#core-face-${state})`} opacity=".9" />
        <path d="M300 130 300 402M209 260 300 299 391 260M300 130 300 299" opacity=".65" />
        <path d="M300 202 345 267 300 334 255 267Z" fill={color} fillOpacity=".1" />
      </g>
      {[[-159, 88], [173, -72], [56, 160], [-66, -157]].map(([x, y], i) => <g key={i} transform={`translate(${300 + x} ${270 + y})`}><circle r="9" fill="#0c1423" stroke={i === 3 ? COLORS.violet : color} /><circle r="3" fill={i === 3 ? COLORS.violet : color} /></g>)}
    </svg>
  );
}

function ContextGuard({ onLost }: { onLost: () => void }) {
  const { gl } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => { event.preventDefault(); onLost(); };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl, onLost]);
  return null;
}

function EdgeGeometry({ size, color, opacity = 1 }: { size: number; color: string; opacity?: number }) {
  const edges = useMemo(() => {
    const shape = new THREE.OctahedronGeometry(size, 0);
    const result = new THREE.EdgesGeometry(shape);
    shape.dispose();
    return result;
  }, [size]);
  useEffect(() => () => edges.dispose(), [edges]);
  return <lineSegments geometry={edges}><lineBasicMaterial color={color} transparent opacity={opacity} /></lineSegments>;
}

function Crystal({ state, reduced }: { state: SecurityState; reduced: boolean }) {
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const color = state === "ACCESS_DENIED" ? COLORS.cyan : stateColor(state);
  useFrame(({ clock }, delta) => {
    if (reduced) return;
    const t = clock.elapsedTime;
    if (group.current) {
      group.current.rotation.y += delta * (state === "AGENT_EXECUTING" ? 0.2 : 0.07);
      group.current.position.y = Math.sin(t * .65) * .085;
    }
    if (inner.current) { inner.current.rotation.y -= delta * .18; inner.current.rotation.z = Math.sin(t * .3) * .08; }
  });
  return (
    <group ref={group} rotation={[.1, .4, -.08]} scale={[1, 1.2, 1]}>
      <mesh>
        <octahedronGeometry args={[1.25, 0]} />
        <meshPhysicalMaterial color="#4badd9" metalness={.45} roughness={.12} transmission={0} transparent opacity={.18} side={THREE.DoubleSide} depthWrite={false} clearcoat={1} />
      </mesh>
      <EdgeGeometry size={1.25} color={color} opacity={.72} />
      <group rotation={[0, Math.PI / 4, 0]}>
        <mesh><octahedronGeometry args={[1.05, 0]} /><meshPhysicalMaterial color="#184267" emissive={color} emissiveIntensity={.035} metalness={.6} roughness={.18} transparent opacity={.3} side={THREE.DoubleSide} depthWrite={false} /></mesh>
        <EdgeGeometry size={1.05} color={color} opacity={.22} />
      </group>
      <group ref={inner} rotation={[0, Math.PI / 4, 0]}>
        <mesh><octahedronGeometry args={[.6, 0]} /><meshStandardMaterial color="#a9edff" emissive={color} emissiveIntensity={.8} metalness={.55} roughness={.2} /></mesh>
        <mesh scale={1.1}><octahedronGeometry args={[.6, 0]} /><meshBasicMaterial color={color} transparent opacity={.12} wireframe /></mesh>
        <EdgeGeometry size={.62} color="#d7f8ff" opacity={.8} />
      </group>
      <mesh rotation={[0, 0, Math.PI / 4]}><octahedronGeometry args={[.25, 0]} /><meshBasicMaterial color="#e4fbff" /></mesh>
      <pointLight color={color} intensity={3} distance={4} decay={2} />
    </group>
  );
}

function Orbit({ radius, rotation, color, speed, phase, reduced, active }: {
  radius: number; rotation: [number, number, number]; color: string; speed: number; phase: number; reduced: boolean; active: boolean;
}) {
  const marker = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!marker.current || reduced) return;
    const t = clock.elapsedTime * speed + phase;
    marker.current.position.set(Math.cos(t) * radius, Math.sin(t) * radius, 0);
  });
  return (
    <group rotation={rotation}>
      <mesh><torusGeometry args={[radius, .006, 6, 150]} /><meshBasicMaterial color={color} transparent opacity={.28} /></mesh>
      <mesh rotation={[0, 0, phase]}><torusGeometry args={[radius, .012, 6, 65, Math.PI * .62]} /><meshBasicMaterial color={color} transparent opacity={.68} /></mesh>
      <mesh rotation={[0, 0, phase + Math.PI]}><torusGeometry args={[radius, .008, 6, 20, .17]} /><meshBasicMaterial color="#d2f5ff" transparent opacity={.8} /></mesh>
      <group ref={marker} position={[Math.cos(phase) * radius, Math.sin(phase) * radius, 0]}>
        <mesh><sphereGeometry args={[active ? .055 : .038, 12, 12]} /><meshBasicMaterial color={color} /></mesh>
        <mesh><sphereGeometry args={[active ? .12 : .085, 12, 12]} /><meshBasicMaterial color={color} transparent opacity={.09} depthWrite={false} /></mesh>
        <mesh><torusGeometry args={[.13, .007, 5, 30]} /><meshBasicMaterial color={color} transparent opacity={.35} /></mesh>
      </group>
    </group>
  );
}

function FieldParticles({ reduced }: { reduced: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const result = new Float32Array(80 * 3);
    // Deterministic sampling avoids hydration/randomness differences.
    for (let i = 0; i < 80; i++) {
      const a = i * 2.399963;
      const r = 2.3 + ((i * 17) % 23) / 14;
      result[i * 3] = Math.cos(a) * r;
      result[i * 3 + 1] = (Math.sin(i * 7.13) * 2.4);
      result[i * 3 + 2] = Math.sin(a) * r;
    }
    return result;
  }, []);
  useFrame((_, dt) => { if (ref.current && !reduced) ref.current.rotation.y += dt * .015; });
  return <points ref={ref}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry><pointsMaterial color="#9abed1" size={.012} transparent opacity={.48} sizeAttenuation depthWrite={false} /></points>;
}

function DataRoute({ start, end, color, running, denied, reduced }: {
  start: [number, number, number]; end: [number, number, number]; color: string; running: boolean; denied?: boolean; reduced: boolean;
}) {
  const bead = useRef<THREE.Mesh>(null);
  const curve = useMemo(() => {
    const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end);
    const mid = a.clone().lerp(b, .5); mid.y += .22;
    return new THREE.QuadraticBezierCurve3(a, mid, b);
  }, [start[0], start[1], start[2], end[0], end[1], end[2]]);
  const geometry = useMemo(() => new THREE.TubeGeometry(curve, 36, .008, 5, false), [curve]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(({ clock }) => {
    if (!bead.current || reduced) return;
    const t = (clock.elapsedTime * .4) % 1;
    bead.current.position.copy(curve.getPoint(denied ? Math.min(t * 1.25, 1) : t));
    bead.current.scale.setScalar(denied && t > .8 ? .7 : 1);
  });
  return <group>
    <mesh geometry={geometry}><meshBasicMaterial color={color} transparent opacity={running ? .55 : .16} /></mesh>
    {running && <mesh ref={bead} position={start}><sphereGeometry args={[.042, 10, 10]} /><meshBasicMaterial color={color} /></mesh>}
    {denied && <group position={end}>
      <mesh rotation={[0, .4, .3]}><torusGeometry args={[.14, .015, 6, 24]} /><meshBasicMaterial color={COLORS.red} /></mesh>
      <mesh rotation={[0, .4, .3]}><boxGeometry args={[.16, .02, .015]} /><meshBasicMaterial color="#ffc2d2" /></mesh>
    </group>}
  </group>;
}

function DataNodes({ state, reduced }: { state: SecurityState; reduced: boolean }) {
  const visible = state !== "IDLE";
  const approved = state === "LEASE_APPROVED" || state === "AGENT_EXECUTING";
  const denied = state === "ACCESS_DENIED";
  const nodes: [number, number, number][] = [[-2.65, .7, .2], [2.45, 1.1, -.1], [1.85, -1.5, .45]];
  return <group>
    {nodes.map((position, i) => <group key={i}>
      <group position={position} rotation={[.25, .45 + i, .2]} scale={visible ? 1 : .65}>
        <mesh><boxGeometry args={[.18, .24, .06]} /><meshStandardMaterial color="#153344" emissive={COLORS.cyan} emissiveIntensity={visible ? .22 : .03} metalness={.7} roughness={.3} /></mesh>
        <mesh scale={1.05}><boxGeometry args={[.18, .24, .06]} /><meshBasicMaterial color={COLORS.cyan} wireframe transparent opacity={visible ? .6 : .2} /></mesh>
      </group>
      {visible && <DataRoute start={position} end={[position[0] > 0 ? .7 : -.7, position[1] * .3, 0]} color={COLORS.cyan} running={approved} reduced={reduced} />}
    </group>)}
    {denied && <group>
      <group position={[-2.85, -1.35, .6]} rotation={[.3, .4, .2]}>
        <mesh><boxGeometry args={[.21, .26, .08]} /><meshBasicMaterial color={COLORS.red} wireframe /></mesh>
      </group>
      <DataRoute start={[-2.85, -1.35, .6]} end={[-1.65, -.73, .3]} color={COLORS.red} running denied reduced={reduced} />
      <mesh rotation={[Math.PI / 2.8, .3, -.2]}><torusGeometry args={[1.85, .012, 6, 100, Math.PI * 1.6]} /><meshBasicMaterial color={COLORS.red} transparent opacity={.6} /></mesh>
    </group>}
  </group>;
}

function Scene({ state, reduced }: { state: SecurityState; reduced: boolean }) {
  const { gl } = useThree();
  useEffect(() => {
    // OrbitControls connects in its child effect and sets touchAction to none.
    // Restore vertical browser scrolling after it connects; horizontal drags
    // still rotate the core and native scroll cancels the pointer cleanly.
    const element = gl.domElement;
    const previous = element.style.touchAction;
    element.style.touchAction = "pan-y";
    return () => { element.style.touchAction = previous; };
  }, [gl]);
  const verified = state === "RECEIPT_VERIFIED" || state === "TASK_COMPLETED";
  const color = verified ? COLORS.green : COLORS.cyan;
  const active = state === "LEASE_APPROVED" || state === "AGENT_EXECUTING";
  return <>
    <ambientLight intensity={.8} />
    <directionalLight position={[3, 5, 4]} intensity={3} color="#bdefff" />
    <directionalLight position={[-4, 1, -2]} intensity={2.4} color="#7862ff" />
    <pointLight position={[0, -3, 2]} intensity={8} color={COLORS.cyan} distance={8} />
    <group rotation={[.1, 0, -.12]}>
      <Crystal state={state} reduced={reduced} />
      <Orbit radius={2.1} rotation={[1.13, .18, -.3]} color={color} speed={.16} phase={.5} reduced={reduced} active={active} />
      <Orbit radius={2.48} rotation={[.72, -.65, .52]} color={COLORS.violet} speed={-.1} phase={2.8} reduced={reduced} active={active} />
      <Orbit radius={1.83} rotation={[.26, 1.1, -.4]} color={color} speed={.21} phase={4.2} reduced={reduced} active={active} />
      <DataNodes state={state} reduced={reduced} />
    </group>
    <FieldParticles reduced={reduced} />
    <OrbitControls domElement={gl.domElement} enablePan={false} enableZoom={false} enableDamping={!reduced} dampingFactor={.055} rotateSpeed={.35} minPolarAngle={Math.PI * .33} maxPolarAngle={Math.PI * .65} minAzimuthAngle={-.5} maxAzimuthAngle={.5} />
  </>;
}

/** Live workspace states come from backend events; the marketing story passes illustrative states. */
export default function TrustCore3D({ state = "IDLE", compact = false, reducedMotion, className }: Props) {
  const [supported, setSupported] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const [visible,setVisible] = useState(true);
  useEffect(()=>{const el=container.current;if(!el)return;let intersecting=true;const update=()=>setVisible(intersecting&&!document.hidden);const observer=new IntersectionObserver(entries=>{intersecting=entries[0]?.isIntersecting??false;update();},{rootMargin:"80px"});observer.observe(el);document.addEventListener("visibilitychange",update);return()=>{observer.disconnect();document.removeEventListener("visibilitychange",update)}},[]);
  const [systemReduced, setSystemReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystemReduced(query.matches);
    update(); query.addEventListener("change", update);
    try {
      const test = document.createElement("canvas");
      // Three.js r182 requires WebGL2. A WebGL1-only browser uses the SVG.
      const context = test.getContext("webgl2");
      if (context) { context.getExtension("WEBGL_lose_context")?.loseContext(); setSupported(true); }
    } catch { setSupported(false); }
    return () => query.removeEventListener("change", update);
  }, []);
  const reduced = reducedMotion ?? systemReduced;
  const fallback = <CoreFallback state={state} />;
  return <div ref={container} className={className} role="img" aria-label={STATE_LABELS[state]} data-security-state={state} style={{ width: "100%", height: "100%", minHeight: compact ? 230 : 300, position: "relative", touchAction: "pan-y" }}>
    {supported ? <SceneBoundary fallback={fallback}>
      <Canvas aria-hidden="true" camera={{ position: [0, .25, compact ? 8.7 : 8.4], fov: 44 }} dpr={[1, 1.5]} frameloop={reduced || !visible ? "demand" : "always"} gl={{ alpha: true, antialias: true, powerPreference: "low-power", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }} style={{ background: "transparent", touchAction: "pan-y" }}>
        <ContextGuard onLost={() => setSupported(false)} />
        <Suspense fallback={null}><Scene state={state} reduced={reduced} /></Suspense>
      </Canvas>
    </SceneBoundary> : fallback}
  </div>;
}
