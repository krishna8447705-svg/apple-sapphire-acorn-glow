import * as THREE from "three";
import type { GameHud, GameSettings, LocalSnapshot, RemoteSnapshot, TouchActions } from "./types";
import { MODE_TUNING, SPEED_INFO, bestFor, overallBest, submitScore } from "./scores";
import { makeFlameMaterial, makeSkyMaterial, patchBuildingShader, patchRoadShader } from "./shaders";

const BEST_KEY = "fast-nd-praise-best";
const ROAD_HALF = 8.6;
const LANE = [-5.2, 0, 5.2];
const PATH_DS = 6;
const PATH_N = 1800;
const FIXED_DT = 1 / 60;
const PLAYER_COLOR = 0xc45c2d;
const TRAFFIC_COLORS = [0x2f6fed, 0xe11d48, 0x3d8b5a, 0xc9a227, 0x5b6470];

type Sample = {
  s: number;
  x: number;
  z: number;
  yaw: number;
  fx: number;
  fz: number;
  rx: number;
  rz: number;
};

function buildPath(): Sample[] {
  const samples: Sample[] = [];
  let x = 0;
  let z = 0;
  let yaw = 0;
  let s = 0;
  for (let i = 0; i < PATH_N; i++) {
    const fx = -Math.sin(yaw);
    const fz = -Math.cos(yaw);
    const rx = Math.cos(yaw);
    const rz = -Math.sin(yaw);
    samples.push({ s, x, z, yaw, fx, fz, rx, rz });
    const curve =
      0.105 * Math.sin(s * 0.016 + 0.55) + 0.068 * Math.sin(s * 0.029 + 1.6) + 0.036 * Math.sin(s * 0.047 + 0.2);
    yaw += curve;
    x += fx * PATH_DS;
    z += fz * PATH_DS;
    s += PATH_DS;
  }
  return samples;
}

function sampleAt(path: Sample[], s: number): Sample {
  const maxS = (PATH_N - 2) * PATH_DS;
  const clamped = Math.max(0, Math.min(maxS, s));
  const i = Math.min(PATH_N - 2, Math.max(0, Math.floor(clamped / PATH_DS)));
  const a = path[i];
  const b = path[i + 1];
  const span = b.s - a.s || PATH_DS;
  const t = (clamped - a.s) / span;
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len = Math.hypot(dx, dz) || 1;
  const fx = dx / len;
  const fz = dz / len;
  return {
    s: clamped,
    x: a.x + dx * t,
    z: a.z + dz * t,
    yaw: a.yaw + (b.yaw - a.yaw) * t,
    fx,
    fz,
    rx: -fz,
    rz: fx,
  };
}

function nearestOnPath(path: Sample[], x: number, z: number, hintS: number): Sample {
  const hint = Math.round(hintS / PATH_DS);
  let bestI = Math.max(0, Math.min(PATH_N - 1, hint));
  let bestD = Infinity;
  const lo = Math.max(0, hint - 10);
  const hi = Math.min(PATH_N - 1, hint + 14);
  for (let i = lo; i <= hi; i++) {
    const dx = path[i].x - x;
    const dz = path[i].z - z;
    const d = dx * dx + dz * dz;
    if (d < bestD) {
      bestD = d;
      bestI = i;
    }
  }
  const p = path[bestI];
  const along = (x - p.x) * p.fx + (z - p.z) * p.fz;
  return sampleAt(path, p.s + along);
}

function makeRoadTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#4c4d52";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) {
    g.fillStyle = `rgba(255,255,255,${Math.random() * 0.07})`;
    g.fillRect(Math.random() * 256, Math.random() * 256, 2, 1);
  }
  g.fillStyle = "#f4f1e6";
  g.fillRect(0, 0, 7, 256);
  g.fillRect(249, 0, 7, 256);
  g.fillRect(82, 0, 5, 256);
  g.fillRect(169, 0, 5, 256);
  g.fillStyle = "#4c4d52";
  for (let y = 0; y < 256; y += 40) g.fillRect(80, y + 18, 9, 18), g.fillRect(167, y + 18, 9, 18);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.ClampToEdgeWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  t.colorSpace = THREE.SRGBColorSpace;
  t.repeat.set(1, 1);
  return t;
}

function makeGrassTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = "#4a8a3c";
  g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 400; i++) {
    g.fillStyle = `rgba(255,255,255,${Math.random() * 0.08})`;
    g.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  t.colorSpace = THREE.SRGBColorSpace;
  t.repeat.set(4, 18);
  return t;
}

function makeBuildingTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#d8cbb8";
  g.fillRect(0, 0, 128, 256);
  g.fillStyle = "#c4b39a";
  g.fillRect(0, 0, 128, 18);
  for (let y = 22; y < 248; y += 16) {
    for (let x = 8; x < 120; x += 18) {
      g.fillStyle = Math.random() > 0.25 ? "#8ec8e6" : "#6a7a86";
      g.fillRect(x, y, 10, 10);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeRibbon(path: Sample[], half: number, y: number, vScale: number): THREE.BufferGeometry {
  const n = path.length;
  const pos = new Float32Array(n * 2 * 3);
  const nrm = new Float32Array(n * 2 * 3);
  const uv = new Float32Array(n * 2 * 2);
  const idx: number[] = [];
  for (let i = 0; i < n; i++) {
    const p = path[i];
    const lx = p.x - p.rx * half;
    const lz = p.z - p.rz * half;
    const rx = p.x + p.rx * half;
    const rz = p.z + p.rz * half;
    const o = i * 6;
    pos[o] = lx;
    pos[o + 1] = y;
    pos[o + 2] = lz;
    pos[o + 3] = rx;
    pos[o + 4] = y;
    pos[o + 5] = rz;
    nrm[o + 1] = 1;
    nrm[o + 4] = 1;
    const v = (i * PATH_DS) / vScale;
    uv[i * 4] = 0;
    uv[i * 4 + 1] = v;
    uv[i * 4 + 2] = 1;
    uv[i * 4 + 3] = v;
    if (i < n - 1) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.BufferAttribute(nrm, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeBoundingSphere();
  return geo;
}

function buildCar(color: number, hero = false): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color, metalness: 0.74, roughness: 0.2 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x111114, metalness: 0.55, roughness: 0.38 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xd5dae0, metalness: 0.96, roughness: 0.12 });
  const stripe = new THREE.MeshStandardMaterial({ color: 0xf4f4f5, metalness: 0.35, roughness: 0.32 });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x7eb4d4,
    metalness: 0.92,
    roughness: 0.06,
    transparent: true,
    opacity: 0.5,
  });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.38, 4.2), bodyMat);
  body.position.y = 0.52;
  body.castShadow = true;
  g.add(body);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.22, 1.15), bodyMat);
  nose.position.set(0, 0.5, -1.72);
  nose.castShadow = true;
  g.add(nose);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.46, 1.55), glass);
  cabin.position.set(0, 0.94, -0.12);
  g.add(cabin);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.06, 1.32), bodyMat);
  roof.position.set(0, 1.18, -0.08);
  g.add(roof);
  const splitter = new THREE.Mesh(new THREE.BoxGeometry(1.84, 0.06, 0.42), dark);
  splitter.position.set(0, 0.28, -2.14);
  g.add(splitter);
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 3.2), dark);
  const skirtL = skirt.clone();
  skirtL.position.set(-0.94, 0.32, 0.08);
  const skirtR = skirt.clone();
  skirtR.position.set(0.94, 0.32, 0.08);
  g.add(skirtL, skirtR);
  const stripeM = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.02, 4.15), stripe);
  stripeM.position.set(0, 0.72, 0);
  g.add(stripeM);
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 0.06), dark);
  const postL = post.clone();
  postL.position.set(-0.55, 0.92, 1.86);
  const postR = post.clone();
  postR.position.set(0.55, 0.92, 1.86);
  const wing = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.07, 0.4), dark);
  wing.position.set(0, 1.08, 1.9);
  g.add(postL, postR, wing);
  const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.16), chrome);
  const mL = mirror.clone();
  mL.position.set(-1.0, 0.82, -0.52);
  const mR = mirror.clone();
  mR.position.set(1.0, 0.82, -0.52);
  g.add(mL, mR);
  const lightGeo = new THREE.BoxGeometry(0.3, 0.12, 0.08);
  const head = new THREE.MeshStandardMaterial({ color: 0xfff4d6, emissive: 0xfff4d6, emissiveIntensity: 0.55 });
  const tail = new THREE.MeshStandardMaterial({ color: 0xe11d48, emissive: 0xe11d48, emissiveIntensity: 0.7 });
  const hl = new THREE.Mesh(lightGeo, head);
  hl.position.set(-0.55, 0.5, -2.22);
  const hr = hl.clone();
  hr.position.x = 0.55;
  g.add(hl, hr);
  const tl = new THREE.Mesh(lightGeo, tail);
  tl.position.set(-0.55, 0.5, 2.12);
  const tr = tl.clone();
  tr.position.x = 0.55;
  g.add(tl, tr);
  const tire = new THREE.MeshStandardMaterial({ color: 0x151518, roughness: 0.86 });
  const wheelGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.3, 14);
  wheelGeo.rotateZ(Math.PI / 2);
  const rimGeo = new THREE.TorusGeometry(0.2, 0.035, 7, 14);
  rimGeo.rotateY(Math.PI / 2);
  for (const pos of [
    [-0.94, 0.34, -1.28],
    [0.94, 0.34, -1.28],
    [-0.94, 0.34, 1.32],
    [0.94, 0.34, 1.32],
  ] as [number, number, number][]) {
    const w = new THREE.Mesh(wheelGeo, tire);
    w.position.set(...pos);
    w.castShadow = true;
    const rim = new THREE.Mesh(rimGeo, chrome);
    rim.position.set(...pos);
    g.add(w, rim);
  }
  if (hero) {
    const red = makeFlameMaterial(new THREE.Color(0xff3b30));
    const blue = makeFlameMaterial(new THREE.Color(0x3b82f6));
    const cone = new THREE.ConeGeometry(0.12, 0.88, 8, 1, true);
    cone.rotateX(-Math.PI / 2);
    const mk = (mat: THREE.ShaderMaterial, x: number) => {
      const m = new THREE.Mesh(cone, mat);
      m.position.set(x, 0.34, 2.18);
      m.visible = false;
      g.add(m);
      return m;
    };
    const flames = {
      redL: mk(red, -0.42),
      redR: mk(red, 0.42),
      blueL: mk(blue, -0.42),
      blueR: mk(blue, 0.42),
      red,
      blue,
      glow: new THREE.PointLight(0xff4d3a, 0, 8, 2),
    };
    flames.glow.position.set(0, 0.4, 2.1);
    g.add(flames.glow);
    g.userData.flames = flames;
  }
  return g;
}

function createEngineAudio() {
  let ctx: AudioContext | null = null;
  let osc: OscillatorNode | null = null;
  let osc2: OscillatorNode | null = null;
  let filter: BiquadFilterNode | null = null;
  let gain: GainNode | null = null;
  let dead = false;

  const ensure = () => {
    if (dead) return;
    if (ctx) {
      if (ctx.state === "suspended") void ctx.resume();
      return;
    }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC({ latencyHint: "interactive" });
    const master = ctx.createGain();
    master.gain.value = 0.2;
    master.connect(ctx.destination);
    gain = ctx.createGain();
    gain.gain.value = 0;
    filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 700;
    filter.Q.value = 0.9;
    osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 52;
    osc2 = ctx.createOscillator();
    osc2.type = "square";
    osc2.frequency.value = 104;
    const g2 = ctx.createGain();
    g2.gain.value = 0.12;
    osc.connect(filter);
    osc2.connect(g2);
    g2.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    osc.start();
    osc2.start();
    if (ctx.state === "suspended") void ctx.resume();
  };

  return {
    unlock: ensure,
    update(speed: number, boosting: boolean, live: boolean, throttle: boolean) {
      if (dead || !ctx || !osc || !osc2 || !filter || !gain) return;
      if (ctx.state === "suspended") void ctx.resume();
      const rpm = 50 + speed * 10.5 + (boosting ? 48 : 0);
      const t = ctx.currentTime;
      osc.frequency.setTargetAtTime(rpm, t, 0.06);
      osc2.frequency.setTargetAtTime(rpm * 2.05, t, 0.06);
      filter.frequency.setTargetAtTime(480 + speed * 38 + (boosting ? 700 : 0), t, 0.08);
      const vol = live ? 0.03 + Math.min(0.18, speed * 0.007) + (throttle ? 0.04 : 0) + (boosting ? 0.06 : 0) : 0;
      gain.gain.setTargetAtTime(vol, t, 0.05);
    },
    stop() {
      if (!gain || !ctx) return;
      gain.gain.setTargetAtTime(0, ctx.currentTime, 0.04);
    },
    dispose() {
      dead = true;
      try {
        osc?.stop();
        osc2?.stop();
        void ctx?.close();
      } catch {
        /* ignore */
      }
      ctx = null;
    },
  };
}

type Traffic = { mesh: THREE.Group; s: number; lane: number; speed: number; alive: boolean };
type Pad = { mesh: THREE.Mesh; s: number; lane: number; alive: boolean };
type Barrier = { mesh: THREE.Mesh; s: number; lane: number; alive: boolean };
type RemoteVis = {
  mesh: THREE.Group;
  label: THREE.Sprite;
  x: number;
  z: number;
  yaw: number;
  tx: number;
  tz: number;
  tyaw: number;
};

export type GameApi = {
  destroy: () => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  retry: () => void;
  setName: (n: string) => void;
  setTouch: (a: Partial<TouchActions>) => void;
  setRemotes: (list: RemoteSnapshot[]) => void;
  getLocal: () => LocalSnapshot;
  getHud: () => GameHud;
};

function lerpAngle(a: number, b: number, k: number) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * k;
}

function hitS(as: number, alat: number, al: number, aw: number, bs: number, blat: number, bl: number, bw: number) {
  return Math.abs(as - bs) < (al + bl) * 0.5 && Math.abs(alat - blat) < (aw + bw) * 0.5;
}

export function createGame(canvas: HTMLCanvasElement, onHud: (h: GameHud) => void, settings: GameSettings): GameApi {
  const path = buildPath();
  const audio = createEngineAudio();
  const maxS = (PATH_N - 12) * PATH_DS;
  const tuning = MODE_TUNING[settings.mode];
  const speedMul = SPEED_INFO[settings.speed].mul;
  const shaderTime = { value: 0 };

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.16;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x74b7ea);
  scene.fog = new THREE.Fog(0xa8d0ee, 90, 300);

  const camera = new THREE.PerspectiveCamera(62, 1, 0.2, 900);
  camera.position.set(0, 2.1, 7);

  scene.add(new THREE.HemisphereLight(0xfff3d6, 0x6b8a4a, 0.9));
  const sun = new THREE.DirectionalLight(0xfff1c2, 2.05);
  sun.position.set(40, 90, 24);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 8;
  sun.shadow.camera.far = 200;
  sun.shadow.camera.left = -55;
  sun.shadow.camera.right = 55;
  sun.shadow.camera.top = 55;
  sun.shadow.camera.bottom = -55;
  sun.shadow.bias = -0.0008;
  scene.add(sun);
  scene.add(sun.target);

  const skyMat = makeSkyMaterial();
  const sky = new THREE.Mesh(new THREE.SphereGeometry(720, 24, 16), skyMat);
  scene.add(sky);

  const asphalt = makeRoadTexture();
  const grassTex = makeGrassTexture();
  const buildingTex = makeBuildingTexture();

  const roadMat = new THREE.MeshStandardMaterial({
    map: asphalt,
    roughness: 0.55,
    metalness: 0.18,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  patchRoadShader(roadMat, shaderTime);
  const grassMat = new THREE.MeshStandardMaterial({
    map: grassTex,
    roughness: 1,
    metalness: 0,
    depthWrite: true,
  });
  const padMat = new THREE.MeshStandardMaterial({
    color: 0x34d399,
    emissive: 0x34d399,
    emissiveIntensity: 0.5,
    roughness: 0.35,
  });
  const barrierMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.45, metalness: 0.2 });
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xb7a48a, roughness: 0.78, metalness: 0.08 });
  const deckMat = new THREE.MeshStandardMaterial({ map: buildingTex, roughness: 0.65, metalness: 0.12 });
  const buildingMat = new THREE.MeshStandardMaterial({ map: buildingTex, roughness: 0.5, metalness: 0.22 });
  patchBuildingShader(buildingMat, shaderTime);

  const grassMesh = new THREE.Mesh(makeRibbon(path, 38, -0.04, 28), grassMat);
  grassMesh.receiveShadow = true;
  grassMesh.frustumCulled = false;
  const roadMesh = new THREE.Mesh(makeRibbon(path, 9.1, 0.02, 14), roadMat);
  roadMesh.receiveShadow = true;
  roadMesh.frustumCulled = false;
  scene.add(grassMesh, roadMesh);

  const dummy = new THREE.Object3D();
  const bGeo = new THREE.BoxGeometry(1, 1, 1);
  const bCount = 280;
  const buildings = new THREE.InstancedMesh(bGeo, buildingMat, bCount);
  buildings.castShadow = true;
  buildings.receiveShadow = true;
  buildings.frustumCulled = false;
  let bi = 0;
  for (let i = 8; i < PATH_N - 8 && bi < bCount; i += 6) {
    const p = path[i];
    const side = bi % 2 === 0 ? -1 : 1;
    const h = 9 + (bi % 7) * 3.1;
    const w = 6 + (bi % 4);
    const d = 7 + (bi % 3);
    const dist = 19 + (bi % 5) * 1.8;
    dummy.position.set(p.x + p.rx * side * dist, h / 2, p.z + p.rz * side * dist);
    dummy.scale.set(w, h, d);
    dummy.rotation.set(0, p.yaw, 0);
    dummy.updateMatrix();
    buildings.setMatrixAt(bi, dummy.matrix);
    bi += 1;
  }
  buildings.count = bi;
  buildings.instanceMatrix.needsUpdate = true;
  scene.add(buildings);

  const pillarGeo = new THREE.BoxGeometry(4.2, 13, 7);
  const spanGeo = new THREE.BoxGeometry(28, 2.2, 9);
  const midGeo = new THREE.BoxGeometry(16, 8, 8);
  const pillars = new THREE.InstancedMesh(pillarGeo, stoneMat, 80);
  const spans = new THREE.InstancedMesh(spanGeo, deckMat, 40);
  const mids = new THREE.InstancedMesh(midGeo, deckMat, 40);
  pillars.castShadow = true;
  spans.castShadow = true;
  mids.castShadow = true;
  pillars.frustumCulled = false;
  spans.frustumCulled = false;
  mids.frustumCulled = false;
  let oi = 0;
  for (let i = 22; i < PATH_N - 16 && oi < 40; i += 24) {
    const p = path[i];
    dummy.rotation.set(0, p.yaw, 0);
    dummy.scale.set(1, 1, 1);
    dummy.position.set(p.x - p.rx * 14.6, 6.5, p.z - p.rz * 14.6);
    dummy.updateMatrix();
    pillars.setMatrixAt(oi * 2, dummy.matrix);
    dummy.position.set(p.x + p.rx * 14.6, 6.5, p.z + p.rz * 14.6);
    dummy.updateMatrix();
    pillars.setMatrixAt(oi * 2 + 1, dummy.matrix);
    dummy.position.set(p.x, 13.2, p.z);
    dummy.updateMatrix();
    spans.setMatrixAt(oi, dummy.matrix);
    dummy.position.set(p.x, 18.2, p.z);
    dummy.updateMatrix();
    mids.setMatrixAt(oi, dummy.matrix);
    oi += 1;
  }
  pillars.count = oi * 2;
  spans.count = oi;
  mids.count = oi;
  pillars.instanceMatrix.needsUpdate = true;
  spans.instanceMatrix.needsUpdate = true;
  mids.instanceMatrix.needsUpdate = true;
  scene.add(pillars, spans, mids);

  const playerMesh = buildCar(PLAYER_COLOR, true);
  scene.add(playerMesh);

  const traffic: Traffic[] = [];
  for (let i = 0; i < 16; i++) {
    const mesh = buildCar(TRAFFIC_COLORS[i % TRAFFIC_COLORS.length]);
    mesh.visible = false;
    scene.add(mesh);
    traffic.push({ mesh, s: 0, lane: 0, speed: 16, alive: false });
  }
  const pads: Pad[] = [];
  const padGeo = new THREE.BoxGeometry(1.6, 0.08, 2.2);
  for (let i = 0; i < 8; i++) {
    const mesh = new THREE.Mesh(padGeo, padMat);
    mesh.visible = false;
    scene.add(mesh);
    pads.push({ mesh, s: 0, lane: 0, alive: false });
  }
  const barriers: Barrier[] = [];
  const barGeo = new THREE.BoxGeometry(1.8, 1.1, 1.2);
  for (let i = 0; i < 8; i++) {
    const mesh = new THREE.Mesh(barGeo, barrierMat);
    mesh.visible = false;
    mesh.castShadow = true;
    scene.add(mesh);
    barriers.push({ mesh, s: 0, lane: 0, alive: false });
  }

  const remotes = new Map<string, RemoteVis>();
  const labelCache = new Map<string, THREE.CanvasTexture>();

  function makeLabel(text: string): THREE.Sprite {
    let tex = labelCache.get(text);
    if (!tex) {
      const c = document.createElement("canvas");
      c.width = 256;
      c.height = 64;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "rgba(9,9,11,0.72)";
      ctx.fillRect(8, 8, 240, 48);
      ctx.fillStyle = "#f4f4f5";
      ctx.font = "600 28px Barlow, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(text.slice(0, 14), 128, 42);
      tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      labelCache.set(text, tex);
    }
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    s.scale.set(3.2, 0.8, 1);
    return s;
  }

  const keys = new Set<string>();
  let qaKeys: string[] | null = null;
  let qaSteer: number | null = null;
  const touch: TouchActions = { steer: 0, throttle: 0, brake: 0, boost: 0 };
  let lastThrottle = false;

  const player = {
    x: 0,
    z: 0,
    yaw: 0,
    speed: 0,
    lat: 0,
    s: 16,
    nitro: 40,
    score: 0,
    crashed: false,
    paused: false,
    playing: false,
    boosting: false,
    doubleNitro: false,
    name: settings.name,
    color: PLAYER_COLOR,
  };
  let best = Math.max(overallBest(), bestFor(settings.mode, settings.speed));
  let isHigh = false;
  let boostHeld = false;
  let boostTapAt = -1;
  let spawnT = 0;
  let padT = 2;
  let barT = 6;
  let hudAcc = 0;
  const camPos = new THREE.Vector3(0, 2.2, 8);
  const look = new THREE.Vector3();

  function held(): Set<string> {
    if (qaKeys) return new Set(qaKeys);
    return keys;
  }

  function stageOf(): number {
    return 1 + Math.floor(player.score / 2200);
  }

  function maxSpeed(): number {
    const boost = player.doubleNitro ? 1.78 : player.boosting ? 1.42 : 1;
    return (32 + stageOf() * 2.2) * speedMul * boost;
  }

  function place(s: number, lane: number) {
    const p = sampleAt(path, s);
    return { p, x: p.x + p.rx * lane, z: p.z + p.rz * lane, yaw: Math.atan2(-p.fx, -p.fz) };
  }

  function resetRun() {
    const start = sampleAt(path, 18);
    player.x = start.x;
    player.z = start.z;
    player.yaw = Math.atan2(-start.fx, -start.fz);
    player.speed = 8;
    player.lat = 0;
    player.s = 18;
    player.nitro = 45;
    player.score = 0;
    player.crashed = false;
    player.paused = false;
    player.playing = true;
    player.boosting = false;
    player.doubleNitro = false;
    isHigh = false;
    boostHeld = false;
    spawnT = 0;
    padT = 1.2;
    barT = 8;
    for (const t of traffic) {
      t.alive = false;
      t.mesh.visible = false;
    }
    for (const p of pads) {
      p.alive = false;
      p.mesh.visible = false;
    }
    for (const b of barriers) {
      b.alive = false;
      b.mesh.visible = false;
    }
    camPos.set(start.x - start.fx * 5.4, 2.1, start.z - start.fz * 5.4);
    audio.unlock();
  }

  function spawnTraffic() {
    const slot = traffic.find((t) => !t.alive);
    if (!slot) return;
    const lane = LANE[Math.floor(Math.random() * LANE.length)];
    const s = player.s + 80 + Math.random() * 70;
    if (traffic.some((t) => t.alive && Math.abs(t.s - s) < 12 && Math.abs(t.lane - lane) < 3)) return;
    slot.lane = lane;
    slot.s = Math.min(maxS - 20, s);
    slot.speed = 11 + Math.random() * (8 + stageOf() * 2.4);
    slot.alive = true;
    slot.mesh.visible = true;
  }

  function spawnPad() {
    const slot = pads.find((p) => !p.alive);
    if (!slot) return;
    slot.lane = LANE[Math.floor(Math.random() * LANE.length)];
    slot.s = Math.min(maxS - 20, player.s + 90 + Math.random() * 40);
    slot.alive = true;
    slot.mesh.visible = true;
  }

  function spawnBarrier() {
    if (stageOf() < tuning.barriersFrom) return;
    const slot = barriers.find((b) => !b.alive);
    if (!slot) return;
    slot.lane = LANE[Math.floor(Math.random() * LANE.length)];
    slot.s = Math.min(maxS - 20, player.s + 110 + Math.random() * 40);
    slot.alive = true;
    slot.mesh.visible = true;
  }

  function hud(): GameHud {
    return {
      score: Math.floor(player.score),
      best,
      speed: Math.max(0, Math.round(player.speed * 9.2)),
      nitro: Math.round(player.nitro),
      stage: stageOf(),
      crashed: player.crashed,
      paused: player.paused,
      playing: player.playing,
      boosting: player.boosting,
      doubleNitro: player.doubleNitro,
      isHigh,
      mode: settings.mode,
      speedPreset: settings.speed,
    };
  }

  function emitHud() {
    onHud(hud());
  }

  function crash() {
    if (player.crashed) return;
    player.crashed = true;
    player.boosting = false;
    player.doubleNitro = false;
    audio.stop();
    const submitted = submitScore({
      name: player.name,
      score: Math.floor(player.score),
      mode: settings.mode,
      speed: settings.speed,
    });
    best = submitted.best;
    isHigh = submitted.isHigh;
    emitHud();
  }

  function step(dt: number) {
    if (!player.playing || player.paused || player.crashed) {
      audio.update(0, false, false, false);
      const flames = playerMesh.userData.flames as { redL: THREE.Mesh; redR: THREE.Mesh; blueL: THREE.Mesh; blueR: THREE.Mesh; red: THREE.ShaderMaterial; blue: THREE.ShaderMaterial; glow: THREE.PointLight } | undefined;
      if (flames) {
        flames.red.uniforms.uOn.value = 0;
        flames.blue.uniforms.uOn.value = 0;
        flames.redL.visible = flames.redR.visible = false;
        flames.blueL.visible = flames.blueR.visible = false;
        flames.glow.intensity = 0;
      }
      return;
    }

    const k = held();
    let steer = touch.steer;
    if (qaSteer != null) steer = qaSteer;
    else {
      if (k.has("KeyA") || k.has("ArrowLeft")) steer += 1;
      if (k.has("KeyD") || k.has("ArrowRight")) steer -= 1;
    }
    steer = Math.max(-1, Math.min(1, steer));

    let throttle = touch.throttle;
    if (k.has("KeyW") || k.has("ArrowUp")) throttle = 1;
    let brake = touch.brake;
    if (k.has("KeyS") || k.has("ArrowDown")) brake = 1;
    const wantBoost = touch.boost > 0 || k.has("ShiftLeft") || k.has("ShiftRight") || k.has("KeyE");
    lastThrottle = throttle > 0;
    const nowBoost = wantBoost && player.nitro > 1 && player.speed > 4;
    if (nowBoost && !boostHeld) {
      const tnow = performance.now() / 1000;
      if (tnow - boostTapAt < 0.34) player.doubleNitro = true;
      boostTapAt = tnow;
    }
    if (!wantBoost) player.doubleNitro = false;
    boostHeld = nowBoost;
    player.boosting = nowBoost;
    const drain = (player.doubleNitro ? 42 : 26) * tuning.drain;
    if (player.boosting) player.nitro = Math.max(0, player.nitro - drain * dt);
    else player.nitro = Math.min(100, player.nitro + 5.5 * dt);

    const road = nearestOnPath(path, player.x, player.z, player.s);
    player.s = road.s;
    player.lat = (player.x - road.x) * road.rx + (player.z - road.z) * road.rz;
    const off = Math.abs(player.lat) > ROAD_HALF;

    const cap = maxSpeed();
    if (throttle > 0) player.speed += 18 * speedMul * throttle * dt;
    if (brake > 0) player.speed -= 28 * brake * dt;
    player.speed -= 3.2 * dt;
    if (off) player.speed -= 12 * dt;
    player.speed = Math.max(0, Math.min(cap, player.speed));

    const speedFactor = Math.min(1, player.speed / 10);
    const high = player.speed / Math.max(1, cap);
    const turnRate = 2.15 * (1 - 0.32 * high);
    player.yaw += steer * turnRate * speedFactor * dt;

    const fx = -Math.sin(player.yaw);
    const fz = -Math.cos(player.yaw);
    player.x += fx * player.speed * dt;
    player.z += fz * player.speed * dt;

    const after = nearestOnPath(path, player.x, player.z, player.s);
    player.s = Math.max(0, Math.min(maxS, after.s));
    player.lat = (player.x - after.x) * after.rx + (player.z - after.z) * after.rz;
    if (Math.abs(player.lat) > 12.5) {
      const pull = player.lat - Math.sign(player.lat) * 12.5;
      player.x -= after.rx * pull;
      player.z -= after.rz * pull;
      player.lat = Math.sign(player.lat) * 12.5;
    }

    player.score += player.speed * dt * (4.8 + stageOf() * 0.6) * tuning.score;
    if (player.boosting) player.score += (player.doubleNitro ? 32 : 18) * dt;

    const st = stageOf();
    spawnT += dt;
    if (spawnT >= Math.max(0.4, (1.6 - st * 0.14) * tuning.spawn)) {
      spawnT = 0;
      spawnTraffic();
      if (st >= 3 && Math.random() < tuning.extraTraffic) spawnTraffic();
    }
    padT += dt;
    if (padT >= Math.max(2.4, (6.5 - st * 0.25) * tuning.pads)) {
      padT = 0;
      spawnPad();
    }
    barT += dt;
    if (st >= tuning.barriersFrom && barT >= Math.max(2.4, 7 - st * 0.4)) {
      barT = 0;
      spawnBarrier();
    }

    for (const t of traffic) {
      if (!t.alive) continue;
      t.s += t.speed * dt;
      const placed = place(t.s, t.lane);
      t.mesh.position.set(placed.x, 0, placed.z);
      t.mesh.rotation.y = placed.yaw;
      if (t.s < player.s - 24 || t.s > player.s + 240) {
        t.alive = false;
        t.mesh.visible = false;
        continue;
      }
      if (hitS(player.s, player.lat, 3.6, 1.55, t.s, t.lane, 4.0, 1.6)) crash();
    }
    for (const p of pads) {
      if (!p.alive) continue;
      const placed = place(p.s, p.lane);
      p.mesh.position.set(placed.x, 0.1 + Math.sin(performance.now() / 260) * 0.03, placed.z);
      p.mesh.rotation.y = placed.yaw;
      if (p.s < player.s - 10 || p.s > player.s + 240) {
        p.alive = false;
        p.mesh.visible = false;
        continue;
      }
      if (hitS(player.s, player.lat, 3.6, 1.55, p.s, p.lane, 2.0, 1.5)) {
        p.alive = false;
        p.mesh.visible = false;
        player.nitro = Math.min(100, player.nitro + 42);
        player.score += 180;
      }
    }
    for (const b of barriers) {
      if (!b.alive) continue;
      const placed = place(b.s, b.lane);
      b.mesh.position.set(placed.x, 0.58, placed.z);
      b.mesh.rotation.y = placed.yaw;
      if (b.s < player.s - 10 || b.s > player.s + 240) {
        b.alive = false;
        b.mesh.visible = false;
        continue;
      }
      if (hitS(player.s, player.lat, 3.6, 1.55, b.s, b.lane, 1.2, 1.7)) crash();
    }

    for (const r of remotes.values()) {
      const kPos = Math.min(1, 12 * dt);
      r.x += (r.tx - r.x) * kPos;
      r.z += (r.tz - r.z) * kPos;
      r.yaw = lerpAngle(r.yaw, r.tyaw, Math.min(1, 10 * dt));
      r.mesh.position.set(r.x, 0, r.z);
      r.mesh.rotation.y = r.yaw;
      r.label.position.set(r.x, 2.2, r.z);
      const rp = nearestOnPath(path, r.x, r.z, player.s);
      const rlat = (r.x - rp.x) * rp.rx + (r.z - rp.z) * rp.rz;
      if (hitS(player.s, player.lat, 3.6, 1.55, rp.s, rlat, 3.6, 1.55)) crash();
    }

    sun.target.position.set(player.x, 0, player.z);
    sun.position.set(player.x + 42, 88, player.z + 26);
    sun.target.updateMatrixWorld();

    const followDist = 5.4;
    const desiredX = player.x - fx * followDist;
    const desiredY = 1.78 + player.speed * 0.012;
    const desiredZ = player.z - fz * followDist;
    const kCam = 1 - Math.exp(-7.2 * dt);
    camPos.x += (desiredX - camPos.x) * kCam;
    camPos.y += (desiredY - camPos.y) * kCam;
    camPos.z += (desiredZ - camPos.z) * kCam;
    camera.position.copy(camPos);
    look.set(player.x + fx * 6.5, 0.9, player.z + fz * 6.5);
    camera.lookAt(look);
    camera.fov = 58 + Math.min(12, player.speed * 0.22) + (player.doubleNitro ? 10 : player.boosting ? 6 : 0);
    camera.updateProjectionMatrix();

    playerMesh.position.set(player.x, 0, player.z);
    playerMesh.rotation.y = player.yaw;
    playerMesh.rotation.z = steer * -0.1;

    const flames = playerMesh.userData.flames as {
      redL: THREE.Mesh;
      redR: THREE.Mesh;
      blueL: THREE.Mesh;
      blueR: THREE.Mesh;
      red: THREE.ShaderMaterial;
      blue: THREE.ShaderMaterial;
      glow: THREE.PointLight;
    };
    const tnow = performance.now() / 1000;
    flames.red.uniforms.uTime.value = tnow;
    flames.blue.uniforms.uTime.value = tnow;
    const redOn = player.boosting && !player.doubleNitro ? 1 : 0;
    const blueOn = player.doubleNitro ? 1 : 0;
    flames.red.uniforms.uOn.value = redOn;
    flames.blue.uniforms.uOn.value = blueOn;
    flames.redL.visible = flames.redR.visible = redOn > 0;
    flames.blueL.visible = flames.blueR.visible = blueOn > 0;
    flames.glow.color.set(blueOn ? 0x3b82f6 : 0xff4d3a);
    flames.glow.intensity = (redOn || blueOn) * (blueOn ? 4.2 : 2.6);

    audio.update(player.speed, player.boosting || player.doubleNitro, true, lastThrottle);
  }

  let acc = 0;
  let last = performance.now();
  let running = true;

  const onKeyDown = (e: KeyboardEvent) => {
    keys.add(e.code);
    audio.unlock();
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
    if (e.code === "KeyP" || e.code === "Escape") {
      if (player.playing && !player.crashed) {
        player.paused = !player.paused;
        emitHud();
      }
    }
  };
  const onKeyUp = (e: KeyboardEvent) => keys.delete(e.code);
  const clearKeys = () => keys.clear();
  const onPointer = () => audio.unlock();
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", clearKeys);
  window.addEventListener("pointerdown", onPointer);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearKeys();
      audio.stop();
    } else audio.unlock();
  });

  const onResize = () => {
    const parent = canvas.parentElement;
    const w = Math.max(1, canvas.clientWidth || parent?.clientWidth || window.innerWidth);
    const h = Math.max(1, canvas.clientHeight || parent?.clientHeight || window.innerHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  onResize();
  window.addEventListener("resize", onResize);
  const ro = new ResizeObserver(onResize);
  ro.observe(canvas.parentElement || canvas);

  const loop = (now: number) => {
    if (!running) return;
    let dt = (now - last) / 1000;
    last = now;
    dt = Math.min(dt, 0.1);
    acc += dt;
    let steps = 0;
    while (acc >= FIXED_DT && steps < 8) {
      step(FIXED_DT);
      acc -= FIXED_DT;
      steps += 1;
    }
    if (acc >= FIXED_DT) acc = 0;
    hudAcc += dt;
    if (hudAcc > 0.08) {
      hudAcc = 0;
      emitHud();
    }
    shaderTime.value = now / 1000;
    skyMat.uniforms.uTime.value = shaderTime.value;
    sky.position.copy(camera.position);
    renderer.render(scene, camera);
  };
  renderer.setAnimationLoop(loop);

  window.__controlsTest = {
    getYaw: () => player.yaw,
    getSpeed: () => player.speed,
    setSteer: (v) => {
      qaSteer = v;
    },
    setKeys: (codes) => {
      qaKeys = codes;
      qaSteer = null;
    },
  };

  return {
    destroy() {
      running = false;
      renderer.setAnimationLoop(null);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", clearKeys);
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      audio.dispose();
      asphalt.dispose();
      grassTex.dispose();
      buildingTex.dispose();
      renderer.dispose();
      if (window.__controlsTest) delete window.__controlsTest;
    },
    start() {
      audio.unlock();
      resetRun();
      onResize();
      emitHud();
    },
    pause() {
      player.paused = true;
      emitHud();
    },
    resume() {
      player.paused = false;
      emitHud();
    },
    retry() {
      resetRun();
      emitHud();
    },
    setName(n) {
      player.name = n;
    },
    setTouch(a) {
      if (a.steer != null) touch.steer = a.steer;
      if (a.throttle != null) touch.throttle = a.throttle;
      if (a.brake != null) touch.brake = a.brake;
      if (a.boost != null) touch.boost = a.boost;
    },
    setRemotes(list) {
      const seen = new Set<string>();
      for (const s of list) {
        seen.add(s.id);
        let r = remotes.get(s.id);
        if (!r) {
          const mesh = buildCar(s.color || TRAFFIC_COLORS[0]);
          const label = makeLabel(s.name || "Racer");
          scene.add(mesh, label);
          r = { mesh, label, x: s.x, z: s.z, yaw: s.yaw, tx: s.x, tz: s.z, tyaw: s.yaw };
          remotes.set(s.id, r);
        }
        r.tx = s.x;
        r.tz = s.z;
        r.tyaw = s.yaw;
        r.mesh.visible = !s.crashed;
      }
      for (const [id, r] of remotes) {
        if (seen.has(id)) continue;
        scene.remove(r.mesh, r.label);
        remotes.delete(id);
      }
    },
    getLocal(): LocalSnapshot {
      return {
        x: player.x,
        z: player.z,
        yaw: player.yaw,
        speed: player.speed,
        nitro: player.nitro,
        crashed: player.crashed,
        score: player.score,
        color: player.color,
        name: player.name,
      };
    },
    getHud: hud,
  };
}
