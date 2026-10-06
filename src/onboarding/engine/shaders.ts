import { CURL, ENVIRONMENT, FBM, SIMPLEX_3D, UTILS } from "./glsl";

/* ------------------------------------------------------------------ */
/*  Shader dell'esperienza di Onboarding 3D                            */
/*  Pipeline: volumetric → scene (instanced + morph + particles) →      */
/*            bloom → composite (FXAA-lite, CA, vignette, grain)        */
/* ------------------------------------------------------------------ */

const HEAD = "#version 300 es\n";

/* ---------------- volumetric raymarching (vapore / fumo) ---------------- */

export const VOLUMETRIC_FS = HEAD + /* glsl */ `
precision highp float;
in vec2 vNdc;
uniform mat4 uInvViewProj;
uniform vec3 uCamPos;
uniform float uTime;
uniform vec3 uPillars[5];
uniform vec3 uPillarCols[5];
uniform vec3 uSurgeColor;
uniform vec3 uSurgeOrigin;
uniform float uSurge;
uniform float uSurgeRadius;
uniform int uSteps;
out vec4 fragColor;
${SIMPLEX_3D}
${FBM}
${ENVIRONMENT}
${UTILS}

void main() {
  vec4 farP = uInvViewProj * vec4(vNdc, 1.0, 1.0);
  vec3 rd = normalize(farP.xyz / farP.w - uCamPos);

  float jitter = hash12(gl_FragCoord.xy + fract(uTime) * 71.3);
  float tMin = 2.0;
  float tMax = 30.0;
  float stepLen = (tMax - tMin) / float(uSteps);
  float t = tMin + stepLen * jitter;

  vec3 acc = vec3(0.0);
  float trans = 1.0;

  for (int i = 0; i < 72; i++) {
    if (i >= uSteps || trans < 0.02) break;
    vec3 p = uCamPos + rd * t;

    // nubi lente (Simplex FBM a 3 ottave)
    float n = fbm3(p * 0.075 + vec3(0.0, uTime * 0.030, uTime * 0.011));
    float dens = smoothstep(0.05, 0.80, n);

    // caduta verticale e vuoto attorno al nucleo centrale
    float hFall = smoothstep(-7.0, 2.0, p.y) * (1.0 - smoothstep(4.0, 17.0, p.y));
    float coreHole = smoothstep(5.0, 10.0, length(p.xz));
    dens *= hFall * coreHole;

    // la densità ottica risponde all'illuminazione dei pilastri
    vec3 lamp = vec3(0.0);
    for (int k = 0; k < 5; k++) {
      float d = length(p - uPillars[k]);
      lamp += uPillarCols[k] * exp(-d * 0.26) * 0.60;
    }
    lamp += uEnvWarm * exp(-length(p) * 0.045) * 0.10;

    // surge: guscio sferico in espansione dal punto focale (SKILL §2)
    float ds = length(p - uSurgeOrigin);
    float q = (ds - uSurgeRadius) * 0.40;
    float shell = exp(-q * q) * uSurge;
    dens += shell * 1.20;

    vec3 scatter = mix(
      vec3(0.010, 0.008, 0.007) + lamp * 0.55,
      uSurgeColor * (1.25 + lamp * 0.6),
      clamp(shell * 1.5, 0.0, 1.0)
    );

    float a = 1.0 - exp(-dens * stepLen * 1.30);
    acc += trans * a * scatter;
    trans *= 1.0 - a;
    t += stepLen;
  }

  fragColor = vec4(acc, 1.0 - trans);
}
`;

/* ---------------- pilastri istanziati (vetro liquido) ---------------- */

export const MONOLITH_VS = HEAD + /* glsl */ `
precision highp float;
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNrm;
layout(location = 2) in vec2 aUv;
layout(location = 3) in vec3 iPos;
layout(location = 4) in vec2 iScale;
layout(location = 5) in vec3 iColor;
layout(location = 6) in vec4 iParams;

uniform mat4 uViewProj;
uniform mat4 uView;
uniform float uTime;

out vec3 vViewPos;
out vec3 vViewNrm;
out vec3 vColor;
out vec2 vUv;
out float vSelected;
out float vPulse;

void main() {
  float yN = aPos.y + 0.5;
  vec3 p = aPos;
  p.xz *= mix(1.0, 0.72, yN);
  p.xz *= iScale.x;
  p.y *= iScale.y;

  float breathe = sin(uTime * 0.55 + iParams.x * 6.2831) * 0.018 + iParams.z * 0.055;
  p.xz *= 1.0 + breathe;

  vec3 world = p + iPos;
  vec4 view = uView * vec4(world, 1.0);
  vViewPos = view.xyz;
  vViewNrm = normalize(vec3(aNrm.x / iScale.x, aNrm.y / iScale.y, aNrm.z / iScale.x));
  vColor = iColor;
  vUv = vec2(aUv.x, yN);
  vSelected = iParams.y;
  vPulse = iParams.z;
  gl_Position = uViewProj * vec4(world, 1.0);
}
`;

export const MONOLITH_FS = HEAD + /* glsl */ `
precision highp float;
in vec3 vViewPos;
in vec3 vViewNrm;
in vec3 vColor;
in vec2 vUv;
in float vSelected;
in float vPulse;
uniform vec3 uEnvWarm;
uniform vec3 uEnvCool;
uniform float uTime;
out vec4 fragColor;
${ENVIRONMENT}

void main() {
  vec3 N = normalize(vViewNrm);
  vec3 V = normalize(-vViewPos);
  float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.6);

  vec3 R = reflect(-V, N);
  vec3 env = envSample(R);
  vec3 refr = mix(uEnvCool * 0.30, vColor * 0.55, 0.5 + 0.5 * N.y);

  // flusso energetico che sale lungo il pilastro
  float bands = sin(vUv.y * 24.0 - uTime * 1.35 + vColor.r * 6.0) * 0.5 + 0.5;
  bands = smoothstep(0.62, 1.0, bands) * (1.0 - smoothstep(0.30, 1.05, vUv.y));
  float topRing = smoothstep(0.955, 0.995, vUv.y);
  float botGlow = 1.0 - smoothstep(0.0, 0.075, vUv.y);

  vec3 col = env * (0.20 + fres * 1.15) + refr * 0.32;
  col += vColor * (bands * 0.50 + topRing * 1.75 + botGlow * 0.55);
  col += vColor * vSelected * (0.10 + 0.55 * vPulse);

  float alpha = 0.20 + fres * 0.70 + topRing * 0.55 + bands * 0.10 + vSelected * 0.14;
  fragColor = vec4(col, clamp(alpha, 0.0, 1.0));
}
`;

/* ---------------- anelli halo (additivi) ---------------- */

export const HALO_VS = HEAD + /* glsl */ `
precision highp float;
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNrm;
layout(location = 2) in vec2 aUv;
layout(location = 3) in vec3 iPos;
layout(location = 4) in vec3 iScale;
layout(location = 5) in vec3 iColor;
layout(location = 6) in vec4 iParams;

uniform mat4 uViewProj;
uniform float uTime;

out vec3 vColor;
out float vSel;
out float vUvY;

void main() {
  float ang = uTime * 0.18 + iParams.x * 6.2831;
  float c = cos(ang), s = sin(ang);
  vec2 rot = vec2(aPos.x * c - aPos.z * s, aPos.x * s + aPos.z * c);
  vec3 world = iPos + vec3(rot.x * iScale.x, aPos.y * iScale.x, rot.y * iScale.x);
  vColor = iColor;
  vSel = iParams.y;
  vUvY = aUv.y;
  gl_Position = uViewProj * vec4(world, 1.0);
}
`;

export const HALO_FS = HEAD + /* glsl */ `
precision highp float;
in vec3 vColor;
in float vSel;
in float vUvY;
uniform float uTime;
out vec4 fragColor;
void main() {
  float pulse = 0.65 + 0.35 * sin(uTime * 2.2 + vUvY * 20.0);
  float a = (0.10 + 0.55 * vSel) * pulse;
  fragColor = vec4(vColor * a, a);
}
`;

/* ---------------- nucleo morphing in vetro PBR ---------------- */

export const CORE_VS = HEAD + /* glsl */ `
precision highp float;
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNrm;
layout(location = 2) in vec2 aUv;

uniform mat4 uViewProj;
uniform mat4 uView;
uniform float uTime;
uniform float uMorph01;
uniform float uMorph12;
uniform float uScale;

out vec3 vViewPos;
out vec3 vViewNrm;
out vec3 vLocal;

float shapeA(float lon, float lat, float t) {
  return 1.0 + 0.15 * sin(6.0 * lon + t * 0.40) * cos(4.0 * lat) + 0.07 * sin(9.0 * lat - t * 0.60);
}
float shapeB(float lon, float lat, float t) {
  return 1.0 + 0.40 * pow(max(sin(2.5 * lon), 0.0), 3.0) * (0.45 + 0.55 * sin(3.0 * lat + t * 0.3)) - 0.10;
}
float shapeC(float lon, float lat, float t) {
  vec3 d = vec3(sin(lat) * cos(lon), cos(lat), sin(lat) * sin(lon));
  float n = 4.5;
  return pow(max(pow(abs(d.x), n) + pow(abs(d.y), n) + pow(abs(d.z), n), 1e-4), -1.0 / n);
}
float radiusAt(float lon, float lat, float t) {
  float a = shapeA(lon, lat, t);
  float b = shapeB(lon, lat, t);
  float c = shapeC(lon, lat, t);
  float m1 = mix(a, b, uMorph01);
  return mix(m1, c, uMorph12);
}

void main() {
  float lon = aUv.x * 6.2831853;
  float lat = aUv.y * 3.14159265;
  float r = radiusAt(lon, lat, uTime);
  vec3 dir = vec3(sin(lat) * cos(lon), cos(lat), sin(lat) * sin(lon));
  vec3 p = dir * r * uScale;

  // normale per differenze finite (supporta il morphing in tempo reale)
  float e = 0.012;
  vec3 dLon = vec3(sin(lat) * cos(lon + e), cos(lat), sin(lat) * sin(lon + e)) * radiusAt(lon + e, lat, uTime) * uScale;
  vec3 dLat = vec3(sin(lat + e) * cos(lon), cos(lat + e), sin(lat + e) * sin(lon)) * radiusAt(lon, lat + e, uTime) * uScale;
  vec3 nrm = normalize(cross(dLon - p, dLat - p));
  if (dot(nrm, dir) < 0.0) nrm = -nrm;

  vLocal = p;
  vec4 view = uView * vec4(p, 1.0);
  vViewPos = view.xyz;
  vViewNrm = normalize(mat3(uView) * nrm);
  gl_Position = uViewProj * vec4(p, 1.0);
}
`;

export const CORE_FS = HEAD + /* glsl */ `
precision highp float;
in vec3 vViewPos;
in vec3 vViewNrm;
in vec3 vLocal;
uniform vec3 uAccent;
uniform vec3 uEnvWarm;
uniform vec3 uEnvCool;
uniform float uTime;
out vec4 fragColor;
${ENVIRONMENT}

void main() {
  vec3 N = normalize(vViewNrm);
  vec3 V = normalize(-vViewPos);
  float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.0);

  // riflessione ambiente procedurale
  vec3 R = reflect(-V, N);
  vec3 env = envSample(R);

  // dispersione cromatica interna (rifrazione su 3 canali)
  vec3 disp = vec3(
    envSample(reflect(-V, normalize(N + 0.055 * vec3(1.0, 0.0, 0.0)))).r,
    env.g,
    envSample(reflect(-V, normalize(N + 0.055 * vec3(0.0, 0.0, 1.0)))).b
  );

  // sub-surface scattering approssimata
  float sss = pow(clamp(dot(N, normalize(vec3(0.30, 0.85, 0.45))), 0.0, 1.0), 1.6);

  // iridescenza thin-film
  float ir = fres * 3.0 + uTime * 0.06;
  vec3 irid = 0.055 * vec3(sin(ir * 6.2831), sin(ir * 6.2831 + 2.094), sin(ir * 6.2831 + 4.188));

  // flusso energetico interno
  float flow = sin(vLocal.y * 13.0 - uTime * 1.7 + sin(vLocal.x * 6.0) * 1.6) * 0.5 + 0.5;

  // highlight speculare
  vec3 H = normalize(normalize(vec3(0.40, 0.90, 0.60)) + V);
  float spec = pow(max(dot(N, H), 0.0), 96.0);

  vec3 col = env * (0.22 + fres * 1.30) + disp * 0.10;
  col += uAccent * (sss * 0.32 + fres * 0.16 + flow * 0.09 * (1.0 - fres));
  col += irid * fres;
  col += vec3(1.0, 0.96, 0.86) * spec * 0.95;

  float alpha = 0.28 + fres * 0.62 + sss * 0.10;
  fragColor = vec4(col, clamp(alpha, 0.0, 1.0));
}
`;

/* ---------------- particelle GPU (transform feedback) ---------------- */

export const PARTICLE_SIM_VS = HEAD + /* glsl */ `
precision highp float;
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aVel;
layout(location = 2) in vec4 aMeta;

uniform float uDt;
uniform float uTime;
uniform float uModeA;
uniform float uModeB;
uniform float uModeT;
uniform vec3 uCorePos;
uniform sampler2D uTargets;
uniform float uTargetCount;
uniform float uTargetYaw;
uniform float uFlow;

out vec3 vPos;
out vec3 vVel;
out vec4 vMeta;

${SIMPLEX_3D}
${CURL}
${UTILS}

vec3 shellPoint(float seed) {
  float a = hash11(seed * 13.17) * 6.2831853;
  float y = hash11(seed * 27.31) * 2.0 - 1.0;
  float r = 5.2 + hash11(seed * 41.7) * 2.4;
  float rr = sqrt(max(1.0 - y * y, 0.0));
  return uCorePos + vec3(cos(a) * rr * r, y * r * 0.62, sin(a) * rr * r);
}

vec3 targetPoint(float seed) {
  float fi = floor(hash11(seed * 91.73 + 3.31) * uTargetCount);
  ivec2 tc = textureSize(uTargets, 0);
  int idx = int(fi);
  vec3 tgt = texelFetch(uTargets, ivec2(idx % tc.x, idx / tc.x), 0).xyz;
  float cy = cos(uTargetYaw);
  float sy = sin(uTargetYaw);
  // il piano testuale gida verso la camera e fluttua sopra il nucleo
  return uCorePos + vec3(cy * tgt.x + sy * tgt.z, tgt.y + 4.2, -sy * tgt.x + cy * tgt.z);
}

vec3 forceFor(float mode, vec3 p, float seed) {
  if (mode < 0.5) {
    // alone orbitale con turbolenza curl
    vec3 rel = p - uCorePos;
    float r = max(length(rel), 0.001);
    vec3 dir = rel / r;
    vec3 tang = normalize(cross(vec3(0.0, 1.0, 0.0), dir) + vec3(1e-5));
    vec3 f = tang * 2.5;
    f += curlNoise(p * 0.14 + vec3(0.0, uTime * 0.05, 0.0)) * 2.1 * uFlow;
    float shell = 5.5 + sin(uTime * 0.5 + seed * 6.2831) * 0.55;
    f += dir * (shell - r) * 1.7;
    f.y *= 0.55;
    return f;
  } else if (mode < 1.5) {
    // coalescenza magnetica verso elementi grafici/testuali
    vec3 tgt = targetPoint(seed);
    vec3 d = tgt - p;
    float dist = length(d);
    vec3 f = (d / max(dist, 0.001)) * min(dist * 4.5, 28.0);
    f += curlNoise(p * 0.22 + 11.0) * 0.45;
    return f;
  }
  // boost esplosivo (celebrazione)
  vec3 rel = p - uCorePos;
  vec3 dir = rel / max(length(rel), 0.001);
  return dir * 15.0 * (0.5 + 0.5 * sin(seed * 12.0)) + vec3(0.0, 5.0, 0.0);
}

void main() {
  float seed = aMeta.z;
  vec3 f = mix(forceFor(uModeA, aPos, seed), forceFor(uModeB, aPos, seed), uModeT);
  vec3 vel = aVel + f * uDt;

  float modeMix = mix(uModeA, uModeB, uModeT);
  float damping = mix(1.9, 5.5, step(0.5, modeMix) * 0.75);
  vel *= exp(-uDt * damping);

  vec3 pos = aPos + vel * uDt;

  float life = aMeta.x - uDt;
  if (life < 0.0) {
    life = aMeta.y;
    pos = (modeMix > 0.5) ? targetPoint(seed) : shellPoint(seed);
    vel *= 0.1;
  }

  vPos = pos;
  vVel = vel;
  vMeta = vec4(life, aMeta.y, seed, aMeta.w);
  gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
}
`;

export const PARTICLE_RENDER_VS = HEAD + /* glsl */ `
precision highp float;
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aVel;
layout(location = 2) in vec4 aMeta;

uniform mat4 uViewProj;
uniform mat4 uView;
uniform float uPointScale;
uniform vec3 uColorA;
uniform vec3 uColorB;

out vec3 vColor;
out float vAlpha;

void main() {
  vec4 view = uView * vec4(aPos, 1.0);
  gl_Position = uViewProj * vec4(aPos, 1.0);

  float speed = length(aVel);
  float t = clamp(speed * 0.11, 0.0, 1.0);
  vColor = mix(uColorA, uColorB, t) + vec3(0.22, 0.16, 0.05) * t;

  float lifeF = aMeta.x / max(aMeta.y, 0.001);
  vAlpha = smoothstep(0.0, 0.10, lifeF) * (1.0 - smoothstep(0.86, 1.0, lifeF)) * 0.80;

  gl_PointSize = clamp(uPointScale * (0.55 + aMeta.w * 0.9) * (11.0 / max(-view.z, 0.1)), 1.0, 26.0);
}
`;

export const PARTICLE_RENDER_FS = HEAD + /* glsl */ `
precision highp float;
in vec3 vColor;
in float vAlpha;
out vec4 fragColor;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float r = length(d);
  float a = 1.0 - smoothstep(0.06, 0.5, r);
  fragColor = vec4(vColor * a * vAlpha, 1.0);
}
`;

/** FS fittizio per il pass di simulazione (rasterizer discard). */
export const PARTICLE_SIM_FS = HEAD + /* glsl */ `
precision highp float;
out vec4 fragColor;
void main() {
  fragColor = vec4(0.0, 0.0, 0.0, 1.0);
}
`;

/* ---------------- post-processing ---------------- */

export const BRIGHT_FS = HEAD + /* glsl */ `
precision highp float;
in vec2 vNdc;
uniform sampler2D uSrc;
uniform float uThreshold;
uniform float uIntensity;
out vec4 fragColor;
void main() {
  vec2 uv = vNdc * 0.5 + 0.5;
  vec3 c = texture(uSrc, uv).rgb;
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  float k = max(l - uThreshold, 0.0) / max(l, 1e-4);
  fragColor = vec4(c * k * uIntensity, 1.0);
}
`;

export const BLUR_FS = HEAD + /* glsl */ `
precision highp float;
in vec2 vNdc;
uniform sampler2D uSrc;
uniform vec2 uDir;
out vec4 fragColor;
void main() {
  vec2 uv = vNdc * 0.5 + 0.5;
  vec3 sum = texture(uSrc, uv).rgb * 0.227027;
  vec2 o1 = uDir * 1.3846154;
  vec2 o2 = uDir * 3.2307692;
  sum += (texture(uSrc, uv + o1).rgb + texture(uSrc, uv - o1).rgb) * 0.3162162;
  sum += (texture(uSrc, uv + o2).rgb + texture(uSrc, uv - o2).rgb) * 0.0702702;
  fragColor = vec4(sum, 1.0);
}
`;

export const COMPOSITE_FS = HEAD + /* glsl */ `
precision highp float;
in vec2 vNdc;
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform sampler2D uVol;
uniform float uTime;
uniform float uBloomI;
uniform vec2 uTexel;
out vec4 fragColor;

float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

// FXAA-lite: sfuma le sgramfature lungo la direzione del gradiente
vec3 fxaaLite(vec2 uv) {
  vec3 cM = texture(uScene, uv).rgb;
  float lM = luma(cM);
  float lN = luma(texture(uScene, uv + vec2(0.0, uTexel.y)).rgb);
  float lS = luma(texture(uScene, uv - vec2(0.0, uTexel.y)).rgb);
  float lE = luma(texture(uScene, uv + vec2(uTexel.x, 0.0)).rgb);
  float lO = luma(texture(uScene, uv - vec2(uTexel.x, 0.0)).rgb);
  float lMin = min(lM, min(min(lN, lS), min(lE, lO)));
  float lMax = max(lM, max(max(lN, lS), max(lE, lO)));
  float range = lMax - lMin;
  if (range < max(0.045, lMax * 0.12)) return cM;
  vec2 dir = vec2(-((lN + lS) - (lE + lO)), ((lE + lO) - (lN + lS)));
  dir = normalize(dir + vec2(1e-6)) * uTexel * 1.5;
  vec3 a = texture(uScene, uv - dir).rgb;
  vec3 b = texture(uScene, uv + dir).rgb;
  return mix(cM, (a + b) * 0.5, 0.5);
}

void main() {
  vec2 uv = vNdc * 0.5 + 0.5;
  vec2 d = uv - 0.5;
  float r2 = dot(d, d);

  // anti-aliasing sui bordi + aberrazione cromatica sottile ai bordi
  vec3 col = fxaaLite(uv);
  vec2 ca = d * r2 * 0.0075;
  col.r = texture(uScene, uv + ca).r;
  col.b = texture(uScene, uv - ca).b;

  // bloom calibrato
  col += texture(uBloom, uv).rgb * uBloomI;

  // volume (vapore) in additive con la sua copertura
  vec4 vol = texture(uVol, uv);
  col += vol.rgb * vol.a;

  // vignettatura
  col *= 1.0 - smoothstep(0.16, 0.72, r2 * 1.55) * 0.52;

  // grana cinematografica
  float g = fract(sin(dot(uv * 913.0 + fract(uTime) * 57.0, vec2(12.9898, 78.233))) * 43758.5453);
  col += (g - 0.5) * 0.016;

  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;
