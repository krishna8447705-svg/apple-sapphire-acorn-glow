import { o as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Pause, i as RotateCcw, n as Users, o as Gauge, t as Zap } from "../_libs/lucide-react.mjs";
import { C as ShaderMaterial, D as TorusGeometry, E as SpriteMaterial, O as Vector3, S as Scene, T as Sprite, _ as Object3D, a as CanvasTexture, b as RepeatWrapping, c as ConeGeometry, d as Fog, f as Group, g as MeshStandardMaterial, h as Mesh, i as BufferGeometry, l as CylinderGeometry, m as InstancedMesh, n as BoxGeometry, o as ClampToEdgeWrapping, p as HemisphereLight, r as BufferAttribute, s as Color, t as WebGLRenderer, u as DirectionalLight, v as PerspectiveCamera, w as SphereGeometry, x as SRGBColorSpace, y as PointLight } from "../_libs/three.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DaGIt9rU.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var MODE_INFO = {
	cruise: {
		label: "Cruise",
		blurb: "Open road. Light traffic, extra nitro pads."
	},
	circuit: {
		label: "Circuit",
		blurb: "Classic run. Stages climb with your score."
	},
	rush: {
		label: "Nitro Rush",
		blurb: "Pads everywhere. Double-tap boost for blue flame."
	},
	survival: {
		label: "Survival",
		blurb: "Packed traffic and barriers. Highest payout."
	}
};
var SPEED_INFO = {
	touring: {
		label: "Touring",
		mul: .78
	},
	sport: {
		label: "Sport",
		mul: 1
	},
	super: {
		label: "Super",
		mul: 1.28
	},
	insane: {
		label: "Insane",
		mul: 1.55
	}
};
var MODE_TUNING = {
	cruise: {
		spawn: 1.35,
		pads: .7,
		barriersFrom: 4,
		score: .85,
		drain: .85,
		extraTraffic: 0
	},
	circuit: {
		spawn: 1,
		pads: 1,
		barriersFrom: 2,
		score: 1,
		drain: 1,
		extraTraffic: .3
	},
	rush: {
		spawn: .92,
		pads: .55,
		barriersFrom: 3,
		score: 1.12,
		drain: .72,
		extraTraffic: .45
	},
	survival: {
		spawn: .68,
		pads: 1.15,
		barriersFrom: 1,
		score: 1.4,
		drain: 1.15,
		extraTraffic: .7
	}
};
var TABLE_KEY = "fnp-highscores-v1";
var BEST_KEY = "fast-nd-praise-best";
function readTable() {
	try {
		const raw = JSON.parse(localStorage.getItem(TABLE_KEY) || "[]");
		if (!Array.isArray(raw)) return [];
		return raw.filter((r) => r && typeof r.score === "number").slice(0, 40);
	} catch {
		return [];
	}
}
function writeTable(rows) {
	try {
		localStorage.setItem(TABLE_KEY, JSON.stringify(rows.slice(0, 20)));
	} catch {}
}
function loadScores() {
	return readTable().sort((a, b) => b.score - a.score);
}
function overallBest() {
	const fromTable = loadScores()[0]?.score || 0;
	try {
		return Math.max(fromTable, Number(localStorage.getItem(BEST_KEY) || 0) || 0);
	} catch {
		return fromTable;
	}
}
function bestFor(mode, speed) {
	return loadScores().filter((r) => r.mode === mode && r.speed === speed).reduce((m, r) => Math.max(m, r.score), 0);
}
function submitScore(row) {
	const table = loadScores();
	row.score > 0 && (table.length < 10 || row.score > (table[table.length - 1]?.score || 0) || (row.score, overallBest()));
	const next = [...table, {
		...row,
		at: Date.now()
	}].sort((a, b) => b.score - a.score).slice(0, 10);
	writeTable(next);
	const best = next[0]?.score || row.score;
	try {
		localStorage.setItem(BEST_KEY, String(best));
	} catch {}
	return {
		table: next,
		best,
		isHigh: row.score > 0 && row.score === best
	};
}
function makeSkyMaterial() {
	return new ShaderMaterial({
		side: 1,
		depthWrite: false,
		fog: false,
		uniforms: { uTime: { value: 0 } },
		vertexShader: `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
		fragmentShader: `
      varying vec3 vPos;
      uniform float uTime;
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
      }
      void main() {
        vec3 dir = normalize(vPos);
        float h = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 zenith = vec3(0.18, 0.45, 0.86);
        vec3 horizon = vec3(0.82, 0.90, 0.97);
        vec3 ground = vec3(0.62, 0.78, 0.90);
        vec3 col = mix(ground, horizon, smoothstep(-0.15, 0.08, dir.y));
        col = mix(col, zenith, pow(max(h, 0.0), 1.25));
        vec3 sunDir = normalize(vec3(0.38, 0.64, 0.42));
        float sun = pow(max(dot(dir, sunDir), 0.0), 42.0);
        float halo = pow(max(dot(dir, sunDir), 0.0), 6.0);
        col += vec3(1.0, 0.93, 0.72) * sun * 1.6;
        col += vec3(1.0, 0.82, 0.55) * halo * 0.22;
        vec2 cuv = dir.xz / max(dir.y, 0.12);
        float n = noise(cuv * 2.2 + vec2(uTime * 0.012, 0.0));
        n += 0.45 * noise(cuv * 4.8 - vec2(uTime * 0.02, 0.3));
        float cloud = smoothstep(0.52, 0.86, n) * smoothstep(0.04, 0.38, dir.y);
        col = mix(col, vec3(1.0, 0.99, 0.97), cloud * 0.62);
        gl_FragColor = vec4(col, 1.0);
      }
    `
	});
}
function makeFlameMaterial(color) {
	return new ShaderMaterial({
		transparent: true,
		depthWrite: false,
		blending: 2,
		side: 2,
		uniforms: {
			uTime: { value: 0 },
			uOn: { value: 0 },
			uColor: { value: color }
		},
		vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
		fragmentShader: `
      varying vec2 vUv;
      uniform float uTime;
      uniform float uOn;
      uniform vec3 uColor;
      void main() {
        float flicker = 0.72 + 0.28 * sin(uTime * 38.0 + vUv.x * 12.0);
        float core = 1.0 - abs(vUv.x - 0.5) * 2.0;
        float fall = pow(1.0 - vUv.y, 1.35);
        float a = uOn * flicker * core * fall;
        vec3 col = mix(uColor, vec3(1.0, 0.96, 0.85), fall * 0.45);
        gl_FragColor = vec4(col * a, a);
      }
    `
	});
}
function patchRoadShader(mat, uTime) {
	mat.onBeforeCompile = (shader) => {
		shader.uniforms.uTime = uTime;
		shader.fragmentShader = shader.fragmentShader.replace("#include <common>", `#include <common>
uniform float uTime;`).replace("#include <color_fragment>", `#include <color_fragment>
float stripe = vMapUv.x;
float edge = smoothstep(0.018, 0.0, stripe) + smoothstep(0.982, 1.0, stripe);
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.95, 0.93, 0.86), edge * 0.4);
float sheen = 0.10 * pow(max(stripe * (1.0 - stripe) * 4.0, 0.0), 1.8);
diffuseColor.rgb += vec3(0.14, 0.16, 0.18) * sheen;
diffuseColor.rgb += 0.018 * sin(vMapUv.y * 36.0 - uTime * 7.0);`);
	};
	mat.customProgramCacheKey = () => "fnp-road-v2";
}
function patchBuildingShader(mat, uTime) {
	mat.onBeforeCompile = (shader) => {
		shader.uniforms.uTime = uTime;
		shader.fragmentShader = shader.fragmentShader.replace("#include <common>", `#include <common>
uniform float uTime;`).replace("#include <color_fragment>", `#include <color_fragment>
vec2 gv = fract(vMapUv * vec2(6.0, 10.0));
vec2 id = floor(vMapUv * vec2(6.0, 10.0));
float win = step(0.22, gv.x) * step(gv.x, 0.78) * step(0.2, gv.y) * step(gv.y, 0.8);
float on = step(0.28, fract(sin(dot(id, vec2(12.7, 4.2))) * 43758.0 + uTime * 0.05));
vec3 glass = mix(vec3(0.35, 0.48, 0.58), vec3(0.75, 0.9, 1.0), on);
diffuseColor.rgb = mix(diffuseColor.rgb * 0.92, glass, win * 0.85);`);
	};
	mat.customProgramCacheKey = () => "fnp-build-v2";
}
var ROAD_HALF = 8.6;
var LANE = [
	-5.2,
	0,
	5.2
];
var PATH_DS = 6;
var PATH_N = 1800;
var FIXED_DT = 1 / 60;
var PLAYER_COLOR = 12868653;
var TRAFFIC_COLORS = [
	3108845,
	14753096,
	4033370,
	13214247,
	5989488
];
function buildPath() {
	const samples = [];
	let x = 0;
	let z = 0;
	let yaw = 0;
	let s = 0;
	for (let i = 0; i < PATH_N; i++) {
		const fx = -Math.sin(yaw);
		const fz = -Math.cos(yaw);
		const rx = Math.cos(yaw);
		const rz = -Math.sin(yaw);
		samples.push({
			s,
			x,
			z,
			yaw,
			fx,
			fz,
			rx,
			rz
		});
		const curve = .105 * Math.sin(s * .016 + .55) + .068 * Math.sin(s * .029 + 1.6) + .036 * Math.sin(s * .047 + .2);
		yaw += curve;
		x += fx * PATH_DS;
		z += fz * PATH_DS;
		s += PATH_DS;
	}
	return samples;
}
function sampleAt(path, s) {
	const clamped = Math.max(0, Math.min(1798 * PATH_DS, s));
	const i = Math.min(1798, Math.max(0, Math.floor(clamped / PATH_DS)));
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
		rz: fx
	};
}
function nearestOnPath(path, x, z, hintS) {
	const hint = Math.round(hintS / PATH_DS);
	let bestI = Math.max(0, Math.min(1799, hint));
	let bestD = Infinity;
	const lo = Math.max(0, hint - 10);
	const hi = Math.min(1799, hint + 14);
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
function makeRoadTexture() {
	const c = document.createElement("canvas");
	c.width = 256;
	c.height = 256;
	const g = c.getContext("2d");
	g.fillStyle = "#4c4d52";
	g.fillRect(0, 0, 256, 256);
	for (let i = 0; i < 900; i++) {
		g.fillStyle = `rgba(255,255,255,${Math.random() * .07})`;
		g.fillRect(Math.random() * 256, Math.random() * 256, 2, 1);
	}
	g.fillStyle = "#f4f1e6";
	g.fillRect(0, 0, 7, 256);
	g.fillRect(249, 0, 7, 256);
	g.fillRect(82, 0, 5, 256);
	g.fillRect(169, 0, 5, 256);
	g.fillStyle = "#4c4d52";
	for (let y = 0; y < 256; y += 40) g.fillRect(80, y + 18, 9, 18), g.fillRect(167, y + 18, 9, 18);
	const t = new CanvasTexture(c);
	t.wrapS = ClampToEdgeWrapping;
	t.wrapT = RepeatWrapping;
	t.anisotropy = 4;
	t.colorSpace = SRGBColorSpace;
	t.repeat.set(1, 1);
	return t;
}
function makeGrassTexture() {
	const c = document.createElement("canvas");
	c.width = c.height = 128;
	const g = c.getContext("2d");
	g.fillStyle = "#4a8a3c";
	g.fillRect(0, 0, 128, 128);
	for (let i = 0; i < 400; i++) {
		g.fillStyle = `rgba(255,255,255,${Math.random() * .08})`;
		g.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
	}
	const t = new CanvasTexture(c);
	t.wrapS = t.wrapT = RepeatWrapping;
	t.anisotropy = 4;
	t.colorSpace = SRGBColorSpace;
	t.repeat.set(4, 18);
	return t;
}
function makeBuildingTexture() {
	const c = document.createElement("canvas");
	c.width = 128;
	c.height = 256;
	const g = c.getContext("2d");
	g.fillStyle = "#d8cbb8";
	g.fillRect(0, 0, 128, 256);
	g.fillStyle = "#c4b39a";
	g.fillRect(0, 0, 128, 18);
	for (let y = 22; y < 248; y += 16) for (let x = 8; x < 120; x += 18) {
		g.fillStyle = Math.random() > .25 ? "#8ec8e6" : "#6a7a86";
		g.fillRect(x, y, 10, 10);
	}
	const t = new CanvasTexture(c);
	t.colorSpace = SRGBColorSpace;
	return t;
}
function makeRibbon(path, half, y, vScale) {
	const n = path.length;
	const pos = new Float32Array(n * 2 * 3);
	const nrm = new Float32Array(n * 2 * 3);
	const uv = new Float32Array(n * 2 * 2);
	const idx = [];
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
		const v = i * PATH_DS / vScale;
		uv[i * 4] = 0;
		uv[i * 4 + 1] = v;
		uv[i * 4 + 2] = 1;
		uv[i * 4 + 3] = v;
		if (i < n - 1) {
			const a = i * 2;
			idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
		}
	}
	const geo = new BufferGeometry();
	geo.setAttribute("position", new BufferAttribute(pos, 3));
	geo.setAttribute("normal", new BufferAttribute(nrm, 3));
	geo.setAttribute("uv", new BufferAttribute(uv, 2));
	geo.setIndex(idx);
	geo.computeBoundingSphere();
	return geo;
}
function buildCar(color, hero = false) {
	const g = new Group();
	const bodyMat = new MeshStandardMaterial({
		color,
		metalness: .74,
		roughness: .2
	});
	const dark = new MeshStandardMaterial({
		color: 1118484,
		metalness: .55,
		roughness: .38
	});
	const chrome = new MeshStandardMaterial({
		color: 14015200,
		metalness: .96,
		roughness: .12
	});
	const stripe = new MeshStandardMaterial({
		color: 16053493,
		metalness: .35,
		roughness: .32
	});
	const glass = new MeshStandardMaterial({
		color: 8303828,
		metalness: .92,
		roughness: .06,
		transparent: true,
		opacity: .5
	});
	const body = new Mesh(new BoxGeometry(1.78, .38, 4.2), bodyMat);
	body.position.y = .52;
	body.castShadow = true;
	g.add(body);
	const nose = new Mesh(new BoxGeometry(1.68, .22, 1.15), bodyMat);
	nose.position.set(0, .5, -1.72);
	nose.castShadow = true;
	g.add(nose);
	const cabin = new Mesh(new BoxGeometry(1.5, .46, 1.55), glass);
	cabin.position.set(0, .94, -.12);
	g.add(cabin);
	const roof = new Mesh(new BoxGeometry(1.32, .06, 1.32), bodyMat);
	roof.position.set(0, 1.18, -.08);
	g.add(roof);
	const splitter = new Mesh(new BoxGeometry(1.84, .06, .42), dark);
	splitter.position.set(0, .28, -2.14);
	g.add(splitter);
	const skirt = new Mesh(new BoxGeometry(.08, .16, 3.2), dark);
	const skirtL = skirt.clone();
	skirtL.position.set(-.94, .32, .08);
	const skirtR = skirt.clone();
	skirtR.position.set(.94, .32, .08);
	g.add(skirtL, skirtR);
	const stripeM = new Mesh(new BoxGeometry(.2, .02, 4.15), stripe);
	stripeM.position.set(0, .72, 0);
	g.add(stripeM);
	const post = new Mesh(new BoxGeometry(.06, .3, .06), dark);
	const postL = post.clone();
	postL.position.set(-.55, .92, 1.86);
	const postR = post.clone();
	postR.position.set(.55, .92, 1.86);
	const wing = new Mesh(new BoxGeometry(1.74, .07, .4), dark);
	wing.position.set(0, 1.08, 1.9);
	g.add(postL, postR, wing);
	const mirror = new Mesh(new BoxGeometry(.3, .1, .16), chrome);
	const mL = mirror.clone();
	mL.position.set(-1, .82, -.52);
	const mR = mirror.clone();
	mR.position.set(1, .82, -.52);
	g.add(mL, mR);
	const lightGeo = new BoxGeometry(.3, .12, .08);
	const head = new MeshStandardMaterial({
		color: 16774358,
		emissive: 16774358,
		emissiveIntensity: .55
	});
	const tail = new MeshStandardMaterial({
		color: 14753096,
		emissive: 14753096,
		emissiveIntensity: .7
	});
	const hl = new Mesh(lightGeo, head);
	hl.position.set(-.55, .5, -2.22);
	const hr = hl.clone();
	hr.position.x = .55;
	g.add(hl, hr);
	const tl = new Mesh(lightGeo, tail);
	tl.position.set(-.55, .5, 2.12);
	const tr = tl.clone();
	tr.position.x = .55;
	g.add(tl, tr);
	const tire = new MeshStandardMaterial({
		color: 1381656,
		roughness: .86
	});
	const wheelGeo = new CylinderGeometry(.34, .34, .3, 14);
	wheelGeo.rotateZ(Math.PI / 2);
	const rimGeo = new TorusGeometry(.2, .035, 7, 14);
	rimGeo.rotateY(Math.PI / 2);
	for (const pos of [
		[
			-.94,
			.34,
			-1.28
		],
		[
			.94,
			.34,
			-1.28
		],
		[
			-.94,
			.34,
			1.32
		],
		[
			.94,
			.34,
			1.32
		]
	]) {
		const w = new Mesh(wheelGeo, tire);
		w.position.set(...pos);
		w.castShadow = true;
		const rim = new Mesh(rimGeo, chrome);
		rim.position.set(...pos);
		g.add(w, rim);
	}
	if (hero) {
		const red = makeFlameMaterial(new Color(16726832));
		const blue = makeFlameMaterial(new Color(3900150));
		const cone = new ConeGeometry(.12, .88, 8, 1, true);
		cone.rotateX(-Math.PI / 2);
		const mk = (mat, x) => {
			const m = new Mesh(cone, mat);
			m.position.set(x, .34, 2.18);
			m.visible = false;
			g.add(m);
			return m;
		};
		const flames = {
			redL: mk(red, -.42),
			redR: mk(red, .42),
			blueL: mk(blue, -.42),
			blueR: mk(blue, .42),
			red,
			blue,
			glow: new PointLight(16731450, 0, 8, 2)
		};
		flames.glow.position.set(0, .4, 2.1);
		g.add(flames.glow);
		g.userData.flames = flames;
	}
	return g;
}
function createEngineAudio() {
	let ctx = null;
	let osc = null;
	let osc2 = null;
	let filter = null;
	let gain = null;
	let dead = false;
	const ensure = () => {
		if (dead) return;
		if (ctx) {
			if (ctx.state === "suspended") ctx.resume();
			return;
		}
		ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: "interactive" });
		const master = ctx.createGain();
		master.gain.value = .2;
		master.connect(ctx.destination);
		gain = ctx.createGain();
		gain.gain.value = 0;
		filter = ctx.createBiquadFilter();
		filter.type = "lowpass";
		filter.frequency.value = 700;
		filter.Q.value = .9;
		osc = ctx.createOscillator();
		osc.type = "sawtooth";
		osc.frequency.value = 52;
		osc2 = ctx.createOscillator();
		osc2.type = "square";
		osc2.frequency.value = 104;
		const g2 = ctx.createGain();
		g2.gain.value = .12;
		osc.connect(filter);
		osc2.connect(g2);
		g2.connect(filter);
		filter.connect(gain);
		gain.connect(master);
		osc.start();
		osc2.start();
		if (ctx.state === "suspended") ctx.resume();
	};
	return {
		unlock: ensure,
		update(speed, boosting, live, throttle) {
			if (dead || !ctx || !osc || !osc2 || !filter || !gain) return;
			if (ctx.state === "suspended") ctx.resume();
			const rpm = 50 + speed * 10.5 + (boosting ? 48 : 0);
			const t = ctx.currentTime;
			osc.frequency.setTargetAtTime(rpm, t, .06);
			osc2.frequency.setTargetAtTime(rpm * 2.05, t, .06);
			filter.frequency.setTargetAtTime(480 + speed * 38 + (boosting ? 700 : 0), t, .08);
			const vol = live ? .03 + Math.min(.18, speed * .007) + (throttle ? .04 : 0) + (boosting ? .06 : 0) : 0;
			gain.gain.setTargetAtTime(vol, t, .05);
		},
		stop() {
			if (!gain || !ctx) return;
			gain.gain.setTargetAtTime(0, ctx.currentTime, .04);
		},
		dispose() {
			dead = true;
			try {
				osc?.stop();
				osc2?.stop();
				ctx?.close();
			} catch {}
			ctx = null;
		}
	};
}
function lerpAngle(a, b, k) {
	let d = b - a;
	while (d > Math.PI) d -= Math.PI * 2;
	while (d < -Math.PI) d += Math.PI * 2;
	return a + d * k;
}
function hitS(as, alat, al, aw, bs, blat, bl, bw) {
	return Math.abs(as - bs) < (al + bl) * .5 && Math.abs(alat - blat) < (aw + bw) * .5;
}
function createGame(canvas, onHud, settings) {
	const path = buildPath();
	const audio = createEngineAudio();
	const maxS = 1788 * PATH_DS;
	const tuning = MODE_TUNING[settings.mode];
	const speedMul = SPEED_INFO[settings.speed].mul;
	const shaderTime = { value: 0 };
	const renderer = new WebGLRenderer({
		canvas,
		antialias: true,
		powerPreference: "high-performance"
	});
	renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = 1;
	renderer.toneMapping = 4;
	renderer.toneMappingExposure = 1.16;
	renderer.outputColorSpace = SRGBColorSpace;
	const scene = new Scene();
	scene.background = new Color(7649258);
	scene.fog = new Fog(11063534, 90, 300);
	const camera = new PerspectiveCamera(62, 1, .2, 900);
	camera.position.set(0, 2.1, 7);
	scene.add(new HemisphereLight(16774102, 7047754, .9));
	const sun = new DirectionalLight(16773570, 2.05);
	sun.position.set(40, 90, 24);
	sun.castShadow = true;
	sun.shadow.mapSize.set(1024, 1024);
	sun.shadow.camera.near = 8;
	sun.shadow.camera.far = 200;
	sun.shadow.camera.left = -55;
	sun.shadow.camera.right = 55;
	sun.shadow.camera.top = 55;
	sun.shadow.camera.bottom = -55;
	sun.shadow.bias = -8e-4;
	scene.add(sun);
	scene.add(sun.target);
	const skyMat = makeSkyMaterial();
	const sky = new Mesh(new SphereGeometry(720, 24, 16), skyMat);
	scene.add(sky);
	const asphalt = makeRoadTexture();
	const grassTex = makeGrassTexture();
	const buildingTex = makeBuildingTexture();
	const roadMat = new MeshStandardMaterial({
		map: asphalt,
		roughness: .55,
		metalness: .18,
		polygonOffset: true,
		polygonOffsetFactor: -1,
		polygonOffsetUnits: -1
	});
	patchRoadShader(roadMat, shaderTime);
	const grassMat = new MeshStandardMaterial({
		map: grassTex,
		roughness: 1,
		metalness: 0,
		depthWrite: true
	});
	const padMat = new MeshStandardMaterial({
		color: 3462041,
		emissive: 3462041,
		emissiveIntensity: .5,
		roughness: .35
	});
	const barrierMat = new MeshStandardMaterial({
		color: 14753096,
		roughness: .45,
		metalness: .2
	});
	const stoneMat = new MeshStandardMaterial({
		color: 12035210,
		roughness: .78,
		metalness: .08
	});
	const deckMat = new MeshStandardMaterial({
		map: buildingTex,
		roughness: .65,
		metalness: .12
	});
	const buildingMat = new MeshStandardMaterial({
		map: buildingTex,
		roughness: .5,
		metalness: .22
	});
	patchBuildingShader(buildingMat, shaderTime);
	const grassMesh = new Mesh(makeRibbon(path, 38, -.04, 28), grassMat);
	grassMesh.receiveShadow = true;
	grassMesh.frustumCulled = false;
	const roadMesh = new Mesh(makeRibbon(path, 9.1, .02, 14), roadMat);
	roadMesh.receiveShadow = true;
	roadMesh.frustumCulled = false;
	scene.add(grassMesh, roadMesh);
	const dummy = new Object3D();
	const bGeo = new BoxGeometry(1, 1, 1);
	const bCount = 280;
	const buildings = new InstancedMesh(bGeo, buildingMat, bCount);
	buildings.castShadow = true;
	buildings.receiveShadow = true;
	buildings.frustumCulled = false;
	let bi = 0;
	for (let i = 8; i < 1792 && bi < bCount; i += 6) {
		const p = path[i];
		const side = bi % 2 === 0 ? -1 : 1;
		const h = 9 + bi % 7 * 3.1;
		const w = 6 + bi % 4;
		const d = 7 + bi % 3;
		const dist = 19 + bi % 5 * 1.8;
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
	const pillarGeo = new BoxGeometry(4.2, 13, 7);
	const spanGeo = new BoxGeometry(28, 2.2, 9);
	const midGeo = new BoxGeometry(16, 8, 8);
	const pillars = new InstancedMesh(pillarGeo, stoneMat, 80);
	const spans = new InstancedMesh(spanGeo, deckMat, 40);
	const mids = new InstancedMesh(midGeo, deckMat, 40);
	pillars.castShadow = true;
	spans.castShadow = true;
	mids.castShadow = true;
	pillars.frustumCulled = false;
	spans.frustumCulled = false;
	mids.frustumCulled = false;
	let oi = 0;
	for (let i = 22; i < 1784 && oi < 40; i += 24) {
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
	const traffic = [];
	for (let i = 0; i < 16; i++) {
		const mesh = buildCar(TRAFFIC_COLORS[i % TRAFFIC_COLORS.length]);
		mesh.visible = false;
		scene.add(mesh);
		traffic.push({
			mesh,
			s: 0,
			lane: 0,
			speed: 16,
			alive: false
		});
	}
	const pads = [];
	const padGeo = new BoxGeometry(1.6, .08, 2.2);
	for (let i = 0; i < 8; i++) {
		const mesh = new Mesh(padGeo, padMat);
		mesh.visible = false;
		scene.add(mesh);
		pads.push({
			mesh,
			s: 0,
			lane: 0,
			alive: false
		});
	}
	const barriers = [];
	const barGeo = new BoxGeometry(1.8, 1.1, 1.2);
	for (let i = 0; i < 8; i++) {
		const mesh = new Mesh(barGeo, barrierMat);
		mesh.visible = false;
		mesh.castShadow = true;
		scene.add(mesh);
		barriers.push({
			mesh,
			s: 0,
			lane: 0,
			alive: false
		});
	}
	const remotes = /* @__PURE__ */ new Map();
	const labelCache = /* @__PURE__ */ new Map();
	function makeLabel(text) {
		let tex = labelCache.get(text);
		if (!tex) {
			const c = document.createElement("canvas");
			c.width = 256;
			c.height = 64;
			const ctx = c.getContext("2d");
			ctx.fillStyle = "rgba(9,9,11,0.72)";
			ctx.fillRect(8, 8, 240, 48);
			ctx.fillStyle = "#f4f4f5";
			ctx.font = "600 28px Barlow, sans-serif";
			ctx.textAlign = "center";
			ctx.fillText(text.slice(0, 14), 128, 42);
			tex = new CanvasTexture(c);
			tex.colorSpace = SRGBColorSpace;
			labelCache.set(text, tex);
		}
		const s = new Sprite(new SpriteMaterial({
			map: tex,
			transparent: true,
			depthTest: false
		}));
		s.scale.set(3.2, .8, 1);
		return s;
	}
	const keys = /* @__PURE__ */ new Set();
	let qaKeys = null;
	let qaSteer = null;
	const touch = {
		steer: 0,
		throttle: 0,
		brake: 0,
		boost: 0
	};
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
		color: PLAYER_COLOR
	};
	let best = Math.max(overallBest(), bestFor(settings.mode, settings.speed));
	let isHigh = false;
	let boostHeld = false;
	let boostTapAt = -1;
	let spawnT = 0;
	let padT = 2;
	let barT = 6;
	let hudAcc = 0;
	const camPos = new Vector3(0, 2.2, 8);
	const look = new Vector3();
	function held() {
		if (qaKeys) return new Set(qaKeys);
		return keys;
	}
	function stageOf() {
		return 1 + Math.floor(player.score / 2200);
	}
	function maxSpeed() {
		const boost = player.doubleNitro ? 1.78 : player.boosting ? 1.42 : 1;
		return (32 + stageOf() * 2.2) * speedMul * boost;
	}
	function place(s, lane) {
		const p = sampleAt(path, s);
		return {
			p,
			x: p.x + p.rx * lane,
			z: p.z + p.rz * lane,
			yaw: Math.atan2(-p.fx, -p.fz)
		};
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
		slot.s = Math.min(10708, s);
		slot.speed = 11 + Math.random() * (8 + stageOf() * 2.4);
		slot.alive = true;
		slot.mesh.visible = true;
	}
	function spawnPad() {
		const slot = pads.find((p) => !p.alive);
		if (!slot) return;
		slot.lane = LANE[Math.floor(Math.random() * LANE.length)];
		slot.s = Math.min(10708, player.s + 90 + Math.random() * 40);
		slot.alive = true;
		slot.mesh.visible = true;
	}
	function spawnBarrier() {
		if (stageOf() < tuning.barriersFrom) return;
		const slot = barriers.find((b) => !b.alive);
		if (!slot) return;
		slot.lane = LANE[Math.floor(Math.random() * LANE.length)];
		slot.s = Math.min(10708, player.s + 110 + Math.random() * 40);
		slot.alive = true;
		slot.mesh.visible = true;
	}
	function hud() {
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
			speedPreset: settings.speed
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
			speed: settings.speed
		});
		best = submitted.best;
		isHigh = submitted.isHigh;
		emitHud();
	}
	function step(dt) {
		if (!player.playing || player.paused || player.crashed) {
			audio.update(0, false, false, false);
			const flames = playerMesh.userData.flames;
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
			const tnow = performance.now() / 1e3;
			if (tnow - boostTapAt < .34) player.doubleNitro = true;
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
		const turnRate = 2.15 * (1 - .32 * (player.speed / Math.max(1, cap)));
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
		player.score += player.speed * dt * (4.8 + stageOf() * .6) * tuning.score;
		if (player.boosting) player.score += (player.doubleNitro ? 32 : 18) * dt;
		const st = stageOf();
		spawnT += dt;
		if (spawnT >= Math.max(.4, (1.6 - st * .14) * tuning.spawn)) {
			spawnT = 0;
			spawnTraffic();
			if (st >= 3 && Math.random() < tuning.extraTraffic) spawnTraffic();
		}
		padT += dt;
		if (padT >= Math.max(2.4, (6.5 - st * .25) * tuning.pads)) {
			padT = 0;
			spawnPad();
		}
		barT += dt;
		if (st >= tuning.barriersFrom && barT >= Math.max(2.4, 7 - st * .4)) {
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
			if (hitS(player.s, player.lat, 3.6, 1.55, t.s, t.lane, 4, 1.6)) crash();
		}
		for (const p of pads) {
			if (!p.alive) continue;
			const placed = place(p.s, p.lane);
			p.mesh.position.set(placed.x, .1 + Math.sin(performance.now() / 260) * .03, placed.z);
			p.mesh.rotation.y = placed.yaw;
			if (p.s < player.s - 10 || p.s > player.s + 240) {
				p.alive = false;
				p.mesh.visible = false;
				continue;
			}
			if (hitS(player.s, player.lat, 3.6, 1.55, p.s, p.lane, 2, 1.5)) {
				p.alive = false;
				p.mesh.visible = false;
				player.nitro = Math.min(100, player.nitro + 42);
				player.score += 180;
			}
		}
		for (const b of barriers) {
			if (!b.alive) continue;
			const placed = place(b.s, b.lane);
			b.mesh.position.set(placed.x, .58, placed.z);
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
		const desiredY = 1.78 + player.speed * .012;
		const desiredZ = player.z - fz * followDist;
		const kCam = 1 - Math.exp(-7.2 * dt);
		camPos.x += (desiredX - camPos.x) * kCam;
		camPos.y += (desiredY - camPos.y) * kCam;
		camPos.z += (desiredZ - camPos.z) * kCam;
		camera.position.copy(camPos);
		look.set(player.x + fx * 6.5, .9, player.z + fz * 6.5);
		camera.lookAt(look);
		camera.fov = 58 + Math.min(12, player.speed * .22) + (player.doubleNitro ? 10 : player.boosting ? 6 : 0);
		camera.updateProjectionMatrix();
		playerMesh.position.set(player.x, 0, player.z);
		playerMesh.rotation.y = player.yaw;
		playerMesh.rotation.z = steer * -.1;
		const flames = playerMesh.userData.flames;
		const tnow = performance.now() / 1e3;
		flames.red.uniforms.uTime.value = tnow;
		flames.blue.uniforms.uTime.value = tnow;
		const redOn = player.boosting && !player.doubleNitro ? 1 : 0;
		const blueOn = player.doubleNitro ? 1 : 0;
		flames.red.uniforms.uOn.value = redOn;
		flames.blue.uniforms.uOn.value = blueOn;
		flames.redL.visible = flames.redR.visible = redOn > 0;
		flames.blueL.visible = flames.blueR.visible = blueOn > 0;
		flames.glow.color.set(blueOn ? 3900150 : 16731450);
		flames.glow.intensity = (redOn || blueOn) * (blueOn ? 4.2 : 2.6);
		audio.update(player.speed, player.boosting || player.doubleNitro, true, lastThrottle);
	}
	let acc = 0;
	let last = performance.now();
	let running = true;
	const onKeyDown = (e) => {
		keys.add(e.code);
		audio.unlock();
		if ([
			"Space",
			"ArrowUp",
			"ArrowDown",
			"ArrowLeft",
			"ArrowRight"
		].includes(e.code)) e.preventDefault();
		if (e.code === "KeyP" || e.code === "Escape") {
			if (player.playing && !player.crashed) {
				player.paused = !player.paused;
				emitHud();
			}
		}
	};
	const onKeyUp = (e) => keys.delete(e.code);
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
	const loop = (now) => {
		if (!running) return;
		let dt = (now - last) / 1e3;
		last = now;
		dt = Math.min(dt, .1);
		acc += dt;
		let steps = 0;
		while (acc >= FIXED_DT && steps < 8) {
			step(FIXED_DT);
			acc -= FIXED_DT;
			steps += 1;
		}
		if (acc >= FIXED_DT) acc = 0;
		hudAcc += dt;
		if (hudAcc > .08) {
			hudAcc = 0;
			emitHud();
		}
		shaderTime.value = now / 1e3;
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
		}
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
			const seen = /* @__PURE__ */ new Set();
			for (const s of list) {
				seen.add(s.id);
				let r = remotes.get(s.id);
				if (!r) {
					const mesh = buildCar(s.color || TRAFFIC_COLORS[0]);
					const label = makeLabel(s.name || "Racer");
					scene.add(mesh, label);
					r = {
						mesh,
						label,
						x: s.x,
						z: s.z,
						yaw: s.yaw,
						tx: s.x,
						tz: s.z,
						tyaw: s.yaw
					};
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
		getLocal() {
			return {
				x: player.x,
				z: player.z,
				yaw: player.yaw,
				speed: player.speed,
				nitro: player.nitro,
				crashed: player.crashed,
				score: player.score,
				color: player.color,
				name: player.name
			};
		},
		getHud: hud
	};
}
var emptyHud = {
	score: 0,
	best: 0,
	speed: 0,
	nitro: 0,
	stage: 1,
	crashed: false,
	paused: false,
	playing: false,
	boosting: false,
	doubleNitro: false,
	isHigh: false,
	mode: "circuit",
	speedPreset: "sport"
};
function GameShell({ name, room, joinLabel, online, mode, speed, p2p, onExit }) {
	const canvasRef = (0, import_react.useRef)(null);
	const apiRef = (0, import_react.useRef)(null);
	const [hud, setHud] = (0, import_react.useState)(emptyHud);
	const [ready, setReady] = (0, import_react.useState)(false);
	const remotesRef = (0, import_react.useRef)({});
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const api = createGame(canvas, setHud, {
			name,
			mode,
			speed
		});
		api.setName(name);
		apiRef.current = api;
		const t = window.setTimeout(() => {
			api.start();
			setReady(true);
		}, 420);
		return () => {
			window.clearTimeout(t);
			api.destroy();
			apiRef.current = null;
		};
	}, [
		name,
		mode,
		speed
	]);
	(0, import_react.useEffect)(() => {
		if (!p2p) return;
		return p2p.onMessage((from, data) => {
			const d = data;
			if (!d || typeof d.x !== "number") return;
			remotesRef.current[from] = {
				...d,
				id: from
			};
			apiRef.current?.setRemotes(Object.values(remotesRef.current));
		});
	}, [p2p]);
	(0, import_react.useEffect)(() => {
		if (!p2p) return;
		const alive = new Set(p2p.peers.map((p) => p.id));
		for (const id of Object.keys(remotesRef.current)) if (!alive.has(id)) delete remotesRef.current[id];
		apiRef.current?.setRemotes(Object.values(remotesRef.current));
	}, [p2p, p2p?.peers]);
	(0, import_react.useEffect)(() => {
		if (!p2p) return;
		let raf = 0;
		let last = 0;
		const tick = (now) => {
			if (now - last >= 50) {
				last = now;
				const local = apiRef.current?.getLocal();
				if (local) p2p.broadcast(local);
			}
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [p2p]);
	const press = (partial, down) => {
		const next = { ...partial };
		if (!down) for (const k of Object.keys(next)) next[k] = 0;
		apiRef.current?.setTouch(next);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative h-dvh w-full overflow-hidden bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
				ref: canvasRef,
				className: "absolute inset-0 block h-full w-full touch-none"
			}),
			!ready && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute inset-0 z-20 flex flex-col items-center justify-center bg-bg",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-2xl tracking-wide text-fg",
						children: "FAST ND PRAISE"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-muted",
						children: "Installing graphics pack"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-6 h-1 w-48 overflow-hidden rounded-full bg-elevated",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-full w-2/3 animate-pulse bg-accent" })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl bg-surface/80 px-4 py-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-mono text-xs tracking-widest text-muted",
							children: "SCORE"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-3xl tabular-nums leading-none",
							children: hud.score
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-xs text-subtle",
							children: ["Best ", hud.best]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col items-end gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 rounded-xl bg-surface/80 px-3 py-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gauge, { className: "size-4 text-muted" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-lg tabular-nums",
								children: hud.speed
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-subtle",
								children: "km/h"
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl bg-surface/80 px-3 py-2 text-right",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted",
							children: ["Stage ", hud.stage]
						}), online && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 flex items-center justify-end gap-1 text-xs text-subtle",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-3" }),
								1 + (p2p?.peers.length ?? 0),
								" · ",
								joinLabel || room
							]
						})]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none absolute inset-x-0 top-28 z-10 flex justify-center px-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "w-full max-w-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-1 flex items-center justify-between text-xs text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, { className: "size-3" }), " Nitro"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "font-mono tabular-nums",
							children: [hud.doubleNitro ? "DOUBLE " : hud.boosting ? "NOS " : "", hud.nitro]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-2 overflow-hidden rounded-full bg-elevated",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: `h-full ${hud.doubleNitro ? "bg-ice" : hud.boosting ? "bg-flame" : "bg-accent"}`,
							style: { width: `${hud.nitro}%` }
						})
					})]
				})
			}),
			hud.paused && !hud.crashed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Overlay, {
				title: "Paused",
				body: "W gas · A/D steer · tap Shift or E twice for blue double nitro.",
				actions: [{
					label: "Resume",
					onClick: () => apiRef.current?.resume()
				}, {
					label: "Leave",
					onClick: onExit,
					ghost: true
				}]
			}),
			hud.crashed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Overlay, {
				title: "Crashed",
				body: `${hud.isHigh ? "NEW HIGH SCORE · " : ""}Score ${hud.score} · Best ${hud.best} · ${MODE_INFO[hud.mode].label} ${SPEED_INFO[hud.speedPreset].label}`,
				actions: [{
					label: "Retry",
					onClick: () => apiRef.current?.retry(),
					icon: true
				}, {
					label: "Menu",
					onClick: onExit,
					ghost: true
				}]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "absolute top-[max(1rem,env(safe-area-inset-top))] left-1/2 z-10 flex -translate-x-1/2 rounded-full bg-surface/80 p-3 text-fg",
				onClick: () => hud.paused ? apiRef.current?.resume() : apiRef.current?.pause(),
				"aria-label": "Pause",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-4" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-4 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TouchBtn, {
						label: "Left",
						onDown: () => press({ steer: 1 }, true),
						onUp: () => press({ steer: 1 }, false)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TouchBtn, {
						label: "Right",
						onDown: () => press({ steer: -1 }, true),
						onUp: () => press({ steer: -1 }, false)
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TouchBtn, {
							label: "Brake",
							onDown: () => press({ brake: 1 }, true),
							onUp: () => press({ brake: 1 }, false)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TouchBtn, {
							label: "Nitro",
							accent: true,
							onDown: () => press({ boost: 1 }, true),
							onUp: () => press({ boost: 1 }, false)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TouchBtn, {
							label: "Gas",
							primary: true,
							onDown: () => press({ throttle: 1 }, true),
							onUp: () => press({ throttle: 1 }, false)
						})
					]
				})]
			})
		]
	});
}
function Overlay({ title, body, actions }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "absolute inset-0 z-20 flex items-center justify-center bg-bg/70 px-6",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-sm rounded-xl bg-surface p-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-3xl tracking-wide",
					children: title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: body
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6 flex flex-col gap-2",
					children: actions.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: a.onClick,
						className: a.ghost ? "h-11 rounded-md border border-border text-sm font-medium text-fg" : "h-11 rounded-md bg-accent text-sm font-medium text-accent-fg",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "inline-flex items-center gap-2",
							children: [a.icon ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-4" }) : null, a.label]
						})
					}, a.label))
				})
			]
		})
	});
}
function TouchBtn({ label, onDown, onUp, primary, accent }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		className: "h-14 min-w-16 rounded-lg px-4 text-sm font-medium select-none " + (primary ? "bg-accent text-accent-fg" : accent ? "bg-ok text-accent-fg" : "bg-surface/90 text-fg"),
		onPointerDown: (e) => {
			e.preventDefault();
			e.target.setPointerCapture(e.pointerId);
			onDown();
		},
		onPointerUp: onUp,
		onPointerCancel: onUp,
		children: label
	});
}
var FAST_POLL_MS = 400;
var IDLE_POLL_MS = 2e3;
var PING_INTERVAL_MS = 2e3;
var STALL_MS = 1e4;
var MAX_RECOVERY_ATTEMPTS = 3;
var SIGNAL_RETRY_DELAYS_MS = [250, 750];
function defaultIceServers() {
	return [{ urls: ["stun:stun.l.google.com:19302", "stun:stun.cloudflare.com:3478"] }];
}
var P2PRoom = class {
	opts;
	peers = /* @__PURE__ */ new Map();
	/** Per-remote-peer signal delivery chains (order-preserving). */
	signalQueues = /* @__PURE__ */ new Map();
	cursor = 0;
	pollTimer = null;
	pingTimer = null;
	closed = false;
	everPolled = false;
	lastPeersFingerprint = "";
	constructor(opts) {
		this.opts = opts;
	}
	/**
	* The first poll IS the join: it registers this peer and returns the
	* roster. A failed first poll (cold DB, offline tab) must not strand the
	* room: the loop and timers start regardless and the next poll retries.
	*/
	async join() {
		try {
			await this.pollOnce();
		} catch {}
		if (this.closed) return;
		this.schedulePoll(this.anyPairConnecting() ? FAST_POLL_MS : IDLE_POLL_MS);
		this.pingTimer = setInterval(() => {
			this.pingAll();
			this.watchdog();
		}, PING_INTERVAL_MS);
	}
	close() {
		this.closed = true;
		if (this.pollTimer) clearTimeout(this.pollTimer);
		if (this.pingTimer) clearInterval(this.pingTimer);
		for (const slot of this.peers.values()) slot.pc.close();
		this.peers.clear();
		fetch("/api/rtc", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				op: "leave",
				room: this.opts.room,
				peer: this.opts.selfId
			}),
			keepalive: true
		}).catch(() => {});
	}
	/** Send on the unreliable game-state channel (drops stale packets). */
	broadcast(data) {
		const wire = JSON.stringify({
			t: "d",
			d: data
		});
		for (const slot of this.peers.values()) if (slot.state?.readyState === "open") slot.state.send(wire);
	}
	/** Send reliably (ordered) to one peer, or to all when peerId is omitted. */
	send(data, peerId) {
		const wire = JSON.stringify({
			t: "d",
			d: data
		});
		const targets = peerId ? [this.peers.get(peerId)] : [...this.peers.values()];
		for (const slot of targets) if (slot?.reliable?.readyState === "open") slot.reliable.send(wire);
	}
	peerList() {
		return [...this.peers.values()].map((s) => ({ ...s.info }));
	}
	schedulePoll(delay) {
		if (this.closed) return;
		if (this.pollTimer) clearTimeout(this.pollTimer);
		this.pollTimer = setTimeout(() => void this.poll(), delay);
	}
	anyPairConnecting() {
		for (const s of this.peers.values()) {
			if (s.terminal) continue;
			if (s.info.connectionState !== "connected") return true;
		}
		return false;
	}
	async pollOnce() {
		const params = new URLSearchParams({
			room: this.opts.room,
			peer: this.opts.selfId,
			name: this.opts.name ?? "",
			since: String(this.cursor)
		});
		const res = await fetch(`/api/rtc?${params}`);
		if (this.closed) return;
		if (!res.ok) throw new Error(`signaling poll failed: ${res.status}`);
		const body = await res.json();
		if (this.closed) return;
		if (!this.everPolled) {
			this.everPolled = true;
			this.opts.onConnected?.();
		}
		this.reconcileRoster(body.peers);
		const roster = new Set(body.peers.map((p) => p.id));
		for (const sig of body.signals) {
			this.cursor = Math.max(this.cursor, sig.id);
			await this.onSignal(sig.from, sig.kind, sig.payload, roster);
			if (this.closed) return;
		}
	}
	async poll() {
		if (this.closed) return;
		try {
			await this.pollOnce();
		} catch {}
		this.schedulePoll(this.anyPairConnecting() ? FAST_POLL_MS : IDLE_POLL_MS);
	}
	reconcileRoster(peers) {
		const alive = new Set(peers.map((p) => p.id));
		for (const p of peers) {
			if (p.id === this.opts.selfId) continue;
			const existing = this.peers.get(p.id);
			if (existing) existing.info.name = p.name;
			else this.connectTo(p.id, p.name, this.opts.selfId > p.id);
		}
		for (const [id, slot] of this.peers) if (!alive.has(id)) {
			slot.pc.close();
			this.peers.delete(id);
		}
		this.emitPeers();
	}
	connectTo(peerId, name, initiator) {
		if (this.closed) return null;
		const pc = new RTCPeerConnection({ iceServers: this.opts.iceServers ?? defaultIceServers() });
		const slot = {
			pc,
			makingOffer: false,
			ignoreOffer: false,
			pendingCandidates: [],
			lastProgressAt: Date.now(),
			recoveryAttempts: 0,
			info: {
				id: peerId,
				name,
				connectionState: pc.connectionState,
				candidateType: null,
				rttMs: null
			}
		};
		this.peers.set(peerId, slot);
		pc.onicecandidate = (e) => {
			if (e.candidate) this.sendSignal(peerId, "ice", e.candidate.toJSON());
		};
		pc.onconnectionstatechange = () => {
			slot.info.connectionState = pc.connectionState;
			if (pc.connectionState === "connecting" || pc.connectionState === "connected") slot.lastProgressAt = Date.now();
			if (pc.connectionState === "connected") {
				slot.recoveryAttempts = 0;
				slot.terminal = false;
				this.readCandidateType(slot);
			}
			this.emitPeers();
			if (pc.connectionState === "failed") pc.restartIce();
			if (pc.connectionState === "failed" || pc.connectionState === "disconnected") this.schedulePoll(FAST_POLL_MS);
		};
		pc.onnegotiationneeded = async () => {
			try {
				slot.makingOffer = true;
				await pc.setLocalDescription();
				await this.sendSignal(peerId, "offer", pc.localDescription.toJSON());
			} catch {} finally {
				slot.makingOffer = false;
			}
		};
		pc.ondatachannel = (e) => this.attachChannel(slot, e.channel);
		if (initiator) {
			this.attachChannel(slot, pc.createDataChannel("state", {
				ordered: false,
				maxRetransmits: 0
			}));
			this.attachChannel(slot, pc.createDataChannel("reliable", { ordered: true }));
		}
		return slot;
	}
	attachChannel(slot, channel) {
		if (channel.label === "state") slot.state = channel;
		else slot.reliable = channel;
		channel.onopen = () => {
			slot.lastProgressAt = Date.now();
		};
		channel.onmessage = (e) => {
			let msg;
			try {
				msg = JSON.parse(e.data);
			} catch {
				return;
			}
			if (msg.t === "ping") {
				if (slot.state?.readyState === "open") slot.state.send(JSON.stringify({ t: "pong" }));
			} else if (msg.t === "pong") {
				if (slot.pingSentAt) {
					slot.info.rttMs = Math.round(performance.now() - slot.pingSentAt);
					slot.pingSentAt = void 0;
					this.emitPeers();
				}
			} else this.opts.onMessage?.(slot.info.id, msg.d, channel.label === "state" ? "state" : "reliable");
		};
	}
	/** Apply buffered ICE candidates once a remote description is in place. */
	async flushPendingCandidates(slot) {
		while (slot.pendingCandidates.length > 0) {
			const candidate = slot.pendingCandidates.shift();
			try {
				await slot.pc.addIceCandidate(candidate);
			} catch (err) {
				if (!slot.ignoreOffer) console.warn("[p2p] addIceCandidate failed:", err);
			}
			if (this.closed) return;
		}
	}
	async onSignal(from, kind, payload, roster) {
		if (this.closed) return;
		let slot = this.peers.get(from);
		if (!slot) {
			if (!roster.has(from)) return;
			const created = this.connectTo(from, "", false);
			if (!created) return;
			slot = created;
		}
		const polite = this.opts.selfId < from;
		try {
			if (kind === "offer" || kind === "answer") {
				const description = payload;
				const collision = kind === "offer" && (slot.makingOffer || slot.pc.signalingState !== "stable");
				slot.ignoreOffer = !polite && collision;
				if (slot.ignoreOffer) return;
				try {
					await slot.pc.setRemoteDescription(description);
				} catch (err) {
					if (kind !== "offer" || slot.recreatedForOffer) throw err;
					const attempts = slot.recoveryAttempts;
					const name = slot.info.name;
					slot.pc.close();
					this.peers.delete(from);
					const fresh = this.connectTo(from, name, false);
					if (!fresh) return;
					fresh.recoveryAttempts = attempts;
					fresh.recreatedForOffer = true;
					slot = fresh;
					await slot.pc.setRemoteDescription(description);
				}
				if (this.closed) return;
				await this.flushPendingCandidates(slot);
				if (this.closed) return;
				if (kind === "offer") {
					await slot.pc.setLocalDescription();
					if (this.closed) return;
					await this.sendSignal(from, "answer", slot.pc.localDescription.toJSON());
				}
			} else if (kind === "ice") {
				const candidate = payload;
				if (!slot.pc.remoteDescription) {
					slot.pendingCandidates.push(candidate);
					return;
				}
				try {
					await slot.pc.addIceCandidate(candidate);
				} catch (err) {
					if (!slot.ignoreOffer) console.warn("[p2p] addIceCandidate failed:", err);
				}
			}
		} catch {}
	}
	/**
	* Signals are serialized per remote peer (a candidate must never overtake
	* its SDP into the DB) and retried on failure with short backoff.
	*/
	sendSignal(to, kind, payload) {
		const next = (this.signalQueues.get(to) ?? Promise.resolve()).then(() => this.postSignal(to, kind, payload));
		this.signalQueues.set(to, next.catch(() => {}));
		return next;
	}
	async postSignal(to, kind, payload) {
		for (let attempt = 0;; attempt++) {
			if (this.closed) return;
			try {
				const res = await fetch("/api/rtc", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						op: "signal",
						room: this.opts.room,
						from: this.opts.selfId,
						to,
						kind,
						payload
					})
				});
				if (res.ok) return;
				throw new Error(`signal POST failed: ${res.status}`);
			} catch (err) {
				if (attempt >= SIGNAL_RETRY_DELAYS_MS.length) {
					console.warn(`[p2p] signal ${kind} to ${to} failed after retries`, err);
					return;
				}
				await new Promise((r) => setTimeout(r, SIGNAL_RETRY_DELAYS_MS[attempt]));
			}
		}
	}
	pingAll() {
		const wire = JSON.stringify({ t: "ping" });
		for (const slot of this.peers.values()) {
			if (slot.state?.readyState !== "open") continue;
			const stale = slot.pingSentAt !== void 0 && performance.now() - slot.pingSentAt > 2 * PING_INTERVAL_MS;
			if (slot.pingSentAt === void 0 || stale) {
				slot.pingSentAt = performance.now();
				slot.state.send(wire);
			}
		}
	}
	/**
	* Stuck-pair recovery, piggybacked on the ping interval. A pair that has
	* made no progress for STALL_MS gets rebuilt by the dialer with a FRESH
	* RTCPeerConnection (new DTLS identity — fixes the suspend/resume
	* fingerprint wedge). After MAX_RECOVERY_ATTEMPTS the pair is terminal:
	* visible to the app as its last connectionState, ignored by fast-poll.
	*/
	watchdog() {
		if (this.closed) return;
		const now = Date.now();
		for (const [peerId, slot] of this.peers) {
			const live = slot.pc.connectionState;
			if (live !== slot.info.connectionState) {
				slot.info.connectionState = live;
				if (live === "connecting" || live === "connected") slot.lastProgressAt = now;
				this.emitPeers();
			}
			if (slot.terminal || live === "connected") continue;
			if (now - slot.lastProgressAt <= STALL_MS) continue;
			if (slot.recoveryAttempts >= MAX_RECOVERY_ATTEMPTS) {
				slot.terminal = true;
				this.emitPeers();
				continue;
			}
			slot.recoveryAttempts += 1;
			slot.lastProgressAt = now;
			if (this.opts.selfId > peerId) {
				const { name } = slot.info;
				const attempts = slot.recoveryAttempts;
				slot.pc.close();
				this.peers.delete(peerId);
				const fresh = this.connectTo(peerId, name, true);
				if (fresh) fresh.recoveryAttempts = attempts;
				this.schedulePoll(FAST_POLL_MS);
			}
		}
	}
	async readCandidateType(slot) {
		try {
			const stats = await slot.pc.getStats();
			let selected;
			stats.forEach((s) => {
				if (s.type === "candidate-pair" && s.nominated) selected = s;
			});
			const localId = selected?.localCandidateId;
			if (localId) {
				const local = stats.get(localId);
				slot.info.candidateType = local?.candidateType ?? null;
				this.emitPeers();
			}
		} catch {}
	}
	emitPeers() {
		const list = this.peerList();
		const fingerprint = JSON.stringify(list.map((p) => [
			p.id,
			p.name,
			p.connectionState,
			p.candidateType,
			p.rttMs
		]));
		if (fingerprint === this.lastPeersFingerprint) return;
		this.lastPeersFingerprint = fingerprint;
		this.opts.onPeersChanged?.(list);
	}
};
function defaultRoom() {
	if (typeof window === "undefined") return "FASTND";
	return `FASTND`;
}
function useP2PRoom(options = {}) {
	const [selfId] = (0, import_react.useState)(() => `p-${Math.random().toString(36).slice(2, 10)}`);
	const [room] = (0, import_react.useState)(() => options.room ?? defaultRoom());
	const [name] = (0, import_react.useState)(() => options.name ?? selfId);
	const [peers, setPeers] = (0, import_react.useState)([]);
	const [joined, setJoined] = (0, import_react.useState)(false);
	const roomRef = (0, import_react.useRef)(null);
	const listeners = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	(0, import_react.useEffect)(() => {
		const p2p = new P2PRoom({
			room,
			selfId,
			name,
			onPeersChanged: setPeers,
			onMessage: (from, data, channel) => {
				for (const fn of listeners.current) fn(from, data, channel);
			},
			onConnected: () => setJoined(true)
		});
		roomRef.current = p2p;
		p2p.join();
		return () => {
			roomRef.current = null;
			p2p.close();
		};
	}, [
		room,
		selfId,
		name
	]);
	return {
		selfId,
		room,
		peers,
		joined,
		broadcast: (0, import_react.useCallback)((data) => roomRef.current?.broadcast(data), []),
		send: (0, import_react.useCallback)((data, peerId) => roomRef.current?.send(data, peerId), []),
		onMessage: (0, import_react.useCallback)((fn) => {
			listeners.current.add(fn);
			return () => {
				listeners.current.delete(fn);
			};
		}, [])
	};
}
var MODES = [
	"cruise",
	"circuit",
	"rush",
	"survival"
];
var SPEEDS = [
	"touring",
	"sport",
	"super",
	"insane"
];
function lobbyFromIpPort(ip, port) {
	const host = ip.trim() || "127.0.0.1";
	const p = port.replace(/[^0-9]/g, "").slice(0, 5) || "5555";
	return {
		room: `${host.replace(/[^a-zA-Z0-9]/g, "-")}-${p}`.replace(/-+/g, "-").slice(0, 64) || "FASTND",
		label: `${host}:${p}`
	};
}
function Home() {
	const [session, setSession] = (0, import_react.useState)(null);
	if (!session) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { onPlay: setSession });
	if (session.online) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OnlineRace, {
		session,
		onExit: () => setSession(null)
	}, session.room + session.name);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameShell, {
		...session,
		p2p: null,
		onExit: () => setSession(null)
	});
}
function OnlineRace({ session, onExit }) {
	const p2p = useP2PRoom({
		room: session.room,
		name: session.name
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameShell, {
		...session,
		p2p,
		onExit
	});
}
function Menu({ onPlay }) {
	const [name, setName] = (0, import_react.useState)("Racer");
	const [host, setHost] = (0, import_react.useState)("127.0.0.1");
	const [port, setPort] = (0, import_react.useState)("5555");
	const [online, setOnline] = (0, import_react.useState)(false);
	const [mode, setMode] = (0, import_react.useState)("circuit");
	const [speed, setSpeed] = (0, import_react.useState)("sport");
	const [scores, setScores] = (0, import_react.useState)([]);
	const [best, setBest] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		try {
			const saved = localStorage.getItem("fnp-name");
			if (saved) setName(saved);
		} catch {}
		setScores(loadScores());
		setBest(overallBest());
	}, []);
	const hint = (0, import_react.useMemo)(() => MODE_INFO[mode].blurb, [mode]);
	const go = () => {
		const n = name.trim().slice(0, 16) || "Racer";
		const { room, label } = lobbyFromIpPort(host, port);
		try {
			localStorage.setItem("fnp-name", n);
		} catch {}
		onPlay({
			name: n,
			room,
			online,
			joinLabel: label,
			mode,
			speed
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "flex min-h-dvh items-start justify-center bg-bg px-4 py-5 text-fg md:items-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid w-full max-w-5xl gap-6 md:grid-cols-[1.15fr_0.85fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl border border-border bg-surface p-4 md:p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-medium tracking-[0.32em] text-muted",
						children: "INSERT COIN"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-1 font-display text-4xl tracking-wide md:text-5xl",
						children: "FAST ND PRAISE"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: "Classic arcade select. Double-tap nitro for blue flame."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "mt-4 block text-xs font-medium tracking-widest text-muted",
						htmlFor: "racer",
						children: "DRIVER"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						id: "racer",
						value: name,
						onChange: (e) => setName(e.target.value),
						maxLength: 16,
						placeholder: "Callsign",
						className: "mt-2 h-11 w-full rounded-md border border-border bg-elevated px-3 text-sm text-fg outline-none ring-accent focus:ring-2"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 text-xs font-medium tracking-widest text-muted",
						children: "MODE"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 grid grid-cols-2 gap-2",
						children: MODES.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setMode(m),
							className: "h-12 rounded-md px-3 text-left text-sm font-medium " + (mode === m ? "bg-accent text-accent-fg" : "border border-border bg-elevated text-muted"),
							children: MODE_INFO[m].label
						}, m))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-xs leading-relaxed text-subtle",
						children: hint
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 text-xs font-medium tracking-widest text-muted",
						children: "SPEED CLASS"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 grid grid-cols-4 gap-2",
						children: SPEEDS.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setSpeed(s),
							className: "h-11 rounded-md text-xs font-medium sm:text-sm " + (speed === s ? "bg-accent text-accent-fg" : "border border-border bg-elevated text-muted"),
							children: SPEED_INFO[s].label
						}, s))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 text-xs font-medium tracking-widest text-muted",
						children: "PLAY"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setOnline(false),
							className: "h-11 rounded-md text-sm font-medium " + (!online ? "bg-accent text-accent-fg" : "border border-border bg-elevated text-muted"),
							children: "Solo"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setOnline(true),
							className: "h-11 rounded-md text-sm font-medium " + (online ? "bg-accent text-accent-fg" : "border border-border bg-elevated text-muted"),
							children: "Online"
						})]
					}),
					online && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 grid grid-cols-3 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "col-span-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "block text-xs font-medium text-muted",
								htmlFor: "host",
								children: "Server IP"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								id: "host",
								value: host,
								onChange: (e) => setHost(e.target.value),
								maxLength: 40,
								className: "mt-2 h-11 w-full rounded-md border border-border bg-elevated px-3 font-mono text-sm text-fg outline-none ring-accent focus:ring-2"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "block text-xs font-medium text-muted",
							htmlFor: "port",
							children: "Port"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							id: "port",
							value: port,
							onChange: (e) => setPort(e.target.value.replace(/[^0-9]/g, "").slice(0, 5)),
							inputMode: "numeric",
							className: "mt-2 h-11 w-full rounded-md border border-border bg-elevated px-3 font-mono text-sm text-fg outline-none ring-accent focus:ring-2"
						})] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: go,
						className: "mt-6 h-12 w-full rounded-md bg-accent text-sm font-semibold tracking-wide text-accent-fg",
						children: "Start Engine"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-xs text-subtle",
						children: "W gas · A/D steer · tap nitro twice for blue flame"
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "rounded-xl border border-border bg-surface p-4 md:p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-medium tracking-[0.32em] text-muted",
						children: "HIGH SCORES"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 font-display text-4xl tabular-nums",
						children: best || "—"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-subtle",
						children: "All-time best"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
						className: "mt-5 space-y-2",
						children: [scores.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "text-sm text-subtle",
							children: "No records yet. Take a run."
						}), scores.slice(0, 8).map((row, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-baseline justify-between gap-3 border-b border-border pb-2 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "min-w-0 truncate",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mr-2 font-mono text-xs text-subtle",
									children: String(i + 1).padStart(2, "0")
								}), row.name]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "shrink-0 font-mono tabular-nums text-fg",
								children: row.score
							})]
						}, `${row.at}-${row.name}-${i}`))]
					}),
					scores[0] && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-4 text-xs text-subtle",
						children: [
							"Top run: ",
							MODE_INFO[scores[0].mode].label,
							" · ",
							SPEED_INFO[scores[0].speed].label
						]
					})
				]
			})]
		})
	});
}
//#endregion
export { Home as component };
