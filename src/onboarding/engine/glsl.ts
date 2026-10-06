/* ------------------------------------------------------------------ */
/*  Libreria GLSL condivisa — noise 3D, FBM, curl noise, environment   */
/*  (SKILL §3.2: Simplex Noise / Perlin FBM per shader volumetrici)    */
/* ------------------------------------------------------------------ */

/**
 * Intestazione obbligatoria di OGNI shader. La direttiva `#version` deve essere
 * il primissimo carattere del sorgente: senza di essa il driver compila in
 * GLSL ES 1.00, dove `out`, `in` e `gl_VertexID` non esistono e la
 * compilazione fallisce. Vivere qui (e non in shaders.ts) evita un import
 * circolare: i chunk di glsl.ts sono interpolati dentro gli shader.
 */
export const HEAD = "#version 300 es\n";

/** Simplex noise 3D (Ashima Arts / Stefan Gustavson, MIT). */
export const SIMPLEX_3D = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

/** FBM a ottave fisse (performance prevedibili). */
export const FBM = /* glsl */ `
float fbm3(vec3 p) {
  float f = 0.0;
  f += 0.5000 * snoise(p); p *= 2.02;
  f += 0.2500 * snoise(p); p *= 2.03;
  f += 0.1250 * snoise(p); p *= 2.01;
  f += 0.0625 * snoise(p);
  return f;
}
float fbm4(vec3 p) {
  float f = 0.0;
  f += 0.5000 * snoise(p); p *= 2.02;
  f += 0.2500 * snoise(p); p *= 2.03;
  f += 0.1250 * snoise(p); p *= 2.01;
  f += 0.0625 * snoise(p); p *= 1.99;
  f += 0.03125 * snoise(p);
  return f;
}
`;

/** Curl noise — campo vettoriale divergence-free per turbolenza particellare. */
export const CURL = /* glsl */ `
vec3 snoiseVec3(vec3 x) {
  return vec3(snoise(x), snoise(vec3(x.y - 19.1, x.z + 33.4, x.x + 47.2)), snoise(vec3(x.z + 74.2, x.x - 124.5, x.y + 99.4)));
}
vec3 curlNoise(vec3 p) {
  const float e = 0.12;
  vec3 dx = vec3(e, 0.0, 0.0);
  vec3 dy = vec3(0.0, e, 0.0);
  vec3 dz = vec3(0.0, 0.0, e);
  vec3 p_x0 = snoiseVec3(p - dx);
  vec3 p_x1 = snoiseVec3(p + dx);
  vec3 p_y0 = snoiseVec3(p - dy);
  vec3 p_y1 = snoiseVec3(p + dy);
  vec3 p_z0 = snoiseVec3(p - dz);
  vec3 p_z1 = snoiseVec3(p + dz);
  float x = p_y1.z - p_y0.z - p_z1.y + p_z0.y;
  float y = p_z1.x - p_z0.x - p_x1.z + p_x0.z;
  float z = p_x1.y - p_x0.y - p_y1.x + p_y0.x;
  return normalize(vec3(x, y, z) + 1e-6) * 2.0;
}
`;

/** Environment procedurale: cielo caldo, suolo scuro, alone del "sole" brass. */
export const ENVIRONMENT = /* glsl */ `
uniform vec3 uEnvWarm;
uniform vec3 uEnvCool;

vec3 envSample(vec3 dir) {
  float h = dir.y * 0.5 + 0.5;
  vec3 sky = mix(uEnvCool, uEnvWarm, smoothstep(0.35, 0.95, h));
  vec3 ground = mix(vec3(0.016, 0.013, 0.010), uEnvCool * 0.16, smoothstep(0.5, 0.0, h));
  vec3 col = mix(ground, sky, smoothstep(0.42, 0.58, h));
  // alone solare (luce calda del progetto)
  float sun = pow(max(dot(normalize(dir), normalize(vec3(0.45, 0.55, 0.35))), 0.0), 26.0);
  col += uEnvWarm * sun * 1.35;
  float sun2 = pow(max(dot(normalize(dir), normalize(vec3(-0.6, 0.25, -0.5))), 0.0), 60.0);
  col += uEnvCool * sun2 * 0.55;
  return col;
}
`;

/** Hash & utilità comuni. */
export const UTILS = /* glsl */ `
float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
vec3 hash32(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yxz + 33.33);
  return fract((p3.xxy + p3.yzz) * p3.zyx);
}
`;

/** VS fullscreen: triangolo che copre il viewport senza vertex buffer. */
export const FULLSCREEN_VS = HEAD + /* glsl */ `
precision highp float;
out vec2 vNdc;
void main() {
  vec2 p = vec2((gl_VertexID == 1) ? 3.0 : -1.0, (gl_VertexID == 2) ? 3.0 : -1.0);
  vNdc = p;
  gl_Position = vec4(p, 0.0, 1.0);
}
`;
