import * as THREE from "three";

export function makeSkyMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uTime: { value: 0 },
    },
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
    `,
  });
}

export function makeFlameMaterial(color: THREE.Color): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uOn: { value: 0 },
      uColor: { value: color },
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
    `,
  });
}

export function patchRoadShader(mat: THREE.MeshStandardMaterial, uTime: THREE.IUniform<number>) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uTime;
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uTime;`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
float stripe = vMapUv.x;
float edge = smoothstep(0.018, 0.0, stripe) + smoothstep(0.982, 1.0, stripe);
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.95, 0.93, 0.86), edge * 0.4);
float sheen = 0.10 * pow(max(stripe * (1.0 - stripe) * 4.0, 0.0), 1.8);
diffuseColor.rgb += vec3(0.14, 0.16, 0.18) * sheen;
diffuseColor.rgb += 0.018 * sin(vMapUv.y * 36.0 - uTime * 7.0);`,
      );
  };
  mat.customProgramCacheKey = () => "fnp-road-v2";
}

export function patchBuildingShader(mat: THREE.MeshStandardMaterial, uTime: THREE.IUniform<number>) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uTime;
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uTime;`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
vec2 gv = fract(vMapUv * vec2(6.0, 10.0));
vec2 id = floor(vMapUv * vec2(6.0, 10.0));
float win = step(0.22, gv.x) * step(gv.x, 0.78) * step(0.2, gv.y) * step(gv.y, 0.8);
float on = step(0.28, fract(sin(dot(id, vec2(12.7, 4.2))) * 43758.0 + uTime * 0.05));
vec3 glass = mix(vec3(0.35, 0.48, 0.58), vec3(0.75, 0.9, 1.0), on);
diffuseColor.rgb = mix(diffuseColor.rgb * 0.92, glass, win * 0.85);`,
      );
  };
  mat.customProgramCacheKey = () => "fnp-build-v2";
}
