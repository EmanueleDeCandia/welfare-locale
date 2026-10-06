import {
  BRIGHT_FS,
  BLUR_FS,
  COMPOSITE_FS,
  CORE_FS,
  CORE_VS,
  HALO_FS,
  HALO_VS,
  MONOLITH_FS,
  MONOLITH_VS,
  PARTICLE_RENDER_FS,
  PARTICLE_RENDER_VS,
  PARTICLE_SIM_FS,
  PARTICLE_SIM_VS,
  VOLUMETRIC_FS,
} from "./shaders";
import { FULLSCREEN_VS } from "./glsl";
import {
  createCylinder,
  createProgram,
  createRenderTarget,
  createTorus,
  createInstancedVao,
  createUvSphere,
  deleteGeometry,
  deleteRenderTarget,
  drawFullscreen,
  type Geometry,
  type Program,
  type RenderTarget,
} from "./glutil";
import { CameraRig, clamp, v3, type Vec3 } from "./CameraRig";
import { invert, lookAt, mat4, multiply, perspective, projectToScreen } from "./mat4";
import { createTargetTexture, deleteTargetTexture, hexToRgb, type TargetLine, type TargetTexture } from "./textTargets";

/* ------------------------------------------------------------------ */
/*  Motore di rendering dell'esperienza di Onboarding                   */
/*  WebGL2 · volumetric raymarching · instanced mesh · GPU particles    */
/*  · morphing PBR · camera spline · bloom + composite cinematografico  */
/* ------------------------------------------------------------------ */

export interface PillarLabel {
  x: number;
  y: number;
  visible: boolean;
  selected: boolean;
  depth: number;
}

export interface EngineCallbacks {
  onPicked?: (index: number) => void;
  onLabels?: (labels: PillarLabel[]) => void;
  onHover?: (index: number | null) => void;
}

export interface EngineOptions {
  reducedMotion: boolean;
  callbacks?: EngineCallbacks;
}

const BASE_H = 7.0;
const CORE_Y = 0.0;
const RING_R_DESKTOP = 16.5;
const RING_R_MOBILE = 10.5;

const DEFAULT_ACCENT = "#e2a63d";
const UP = v3(0, 1, 0);

const MONO_LAYOUT = [
  { loc: 3, size: 3, offset: 0 },
  { loc: 4, size: 2, offset: 12 },
  { loc: 5, size: 3, offset: 20 },
  { loc: 6, size: 4, offset: 32 },
];
const HALO_LAYOUT = [
  { loc: 3, size: 3, offset: 0 },
  { loc: 4, size: 3, offset: 12 },
  { loc: 5, size: 3, offset: 24 },
  { loc: 6, size: 4, offset: 36 },
];

const approach = (cur: number, tgt: number, rate: number, dt: number) =>
  cur + (tgt - cur) * (1 - Math.exp(-rate * dt));

export class OnboardingEngine {
  readonly gl: WebGL2RenderingContext;
  private canvas: HTMLCanvasElement;
  private opts: EngineOptions;

  /* programmi */
  private pVol: Program;
  private pMono: Program;
  private pHalo: Program;
  private pCore: Program;
  private pSim: Program;
  private pPart: Program;
  private pBright: Program;
  private pBlur: Program;
  private pComp: Program;

  /* geometrie */
  private gMono: Geometry;
  private gHalo: Geometry;
  private gCore: Geometry;

  /* instanze */
  private monoVao: WebGLVertexArrayObject;
  private monoBuf: WebGLBuffer;
  private haloVao: WebGLVertexArrayObject;
  private haloBuf: WebGLBuffer;
  private readonly monoData = new Float32Array(5 * 12);
  private readonly haloData = new Float32Array(5 * 13);

  /* particelle */
  private partVao: WebGLVertexArrayObject;
  private partBuf: [WebGLBuffer, WebGLBuffer];
  private partTf: WebGLTransformFeedback;
  private partCount: number;
  private partCur = 0;

  /* render targets */
  private sceneRT: RenderTarget | null = null;
  private volRT: RenderTarget | null = null;
  private bloomA: RenderTarget | null = null;
  private bloomB: RenderTarget | null = null;
  private depthRb: WebGLRenderbuffer | null = null;

  /* geometria adattiva (calcolata dal aspect ratio del viewport) */
  private ringR = RING_R_DESKTOP;
  private pillarTmp: Vec3 = v3(0, 0, 0);
  private pillarAngles = [-1.05, -0.525, 0, 0.525, 1.05];

  /* camera & matrici */
  private rig = new CameraRig();
  private view = mat4();
  private proj = mat4();
  private viewProj = mat4();
  private invViewProj = mat4();

  /* stato scena */
  private selected: number | null = null;
  private hovered: number | null = null;
  private pillarH = [1, 1, 1, 1, 1];
  private pillarHTarget = [0.55, 0.55, 0.55, 0.55, 0.55];
  private pillarSel = [0, 0, 0, 0, 0];
  private pillarSelT = [0, 0, 0, 0, 0];
  private accentRgb: [number, number, number] = hexToRgb(DEFAULT_ACCENT);
  private accentRgbT: [number, number, number] = hexToRgb(DEFAULT_ACCENT);
  private morph01 = 0;
  private morph01T = 0;
  private morph12 = 0;
  private morph12T = 0;

  /* modalità particelle: 0 alone, 1 coalescenza, 2 boost */
  private modeFrom: 0 | 1 | 2 = 0;
  private modeTo: 0 | 1 | 2 = 0;
  private modeT = 1;
  private modeHold = 0;

  /* surge volumetrico */
  private surgeT = 0;
  private surgeDur = 2.4;
  private surgeRadius = 0;
  private surgeOrigin: Vec3 = v3(0, 1.5, 0);
  private surgeRgb: [number, number, number] = hexToRgb(DEFAULT_ACCENT);

  /* target particellari */
  private targets: TargetTexture | null = null;

  /* loop & dimensioni */
  private raf = 0;
  private last = 0;
  private time = 0;
  private width = 1;
  private height = 1;
  private dpr = 1;
  private disposed = false;
  private running = false;
  private ro: ResizeObserver | null = null;
  private labels: PillarLabel[] = Array.from({ length: 5 }, () => ({
    x: 0,
    y: 0,
    visible: false,
    selected: false,
    depth: 0,
  }));

  /* buffer riutilizzati (nessuna allocazione nel render loop) */
  private pillarsArr = new Float32Array(15);
  private colsArr = new Float32Array(15);

  /* input */
  private pointers = new Map<number, { x: number; y: number }>();
  private dragging = false;
  private dragMoved = 0;
  private pinchDist = 0;

  static create(canvas: HTMLCanvasElement, opts: EngineOptions): OnboardingEngine | null {
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: false,
    });
    if (!gl) return null;
    try {
      return new OnboardingEngine(canvas, gl, opts);
    } catch (err) {
      console.warn("[Onboarding3D] inizializzazione fallita:", err);
      return null;
    }
  }

  private constructor(
    canvas: HTMLCanvasElement,
    gl: WebGL2RenderingContext,
    opts: EngineOptions
  ) {
    this.canvas = canvas;
    this.gl = gl;
    this.opts = opts;

    /* ---------------- programmi ---------------- */
    this.pVol = createProgram(gl, FULLSCREEN_VS, VOLUMETRIC_FS);
    this.pMono = createProgram(gl, MONOLITH_VS, MONOLITH_FS);
    this.pHalo = createProgram(gl, HALO_VS, HALO_FS);
    this.pCore = createProgram(gl, CORE_VS, CORE_FS);
    this.pSim = createProgram(gl, PARTICLE_SIM_VS, PARTICLE_SIM_FS, ["vPos", "vVel", "vMeta"]);
    this.pPart = createProgram(gl, PARTICLE_RENDER_VS, PARTICLE_RENDER_FS);
    this.pBright = createProgram(gl, FULLSCREEN_VS, BRIGHT_FS);
    this.pBlur = createProgram(gl, FULLSCREEN_VS, BLUR_FS);
    this.pComp = createProgram(gl, FULLSCREEN_VS, COMPOSITE_FS);

    /* ---------------- geometrie ---------------- */
    this.gMono = createCylinder(gl, 22, 0.72);
    this.gHalo = createTorus(gl, 1, 0.045, 96, 12);
    this.gCore = createUvSphere(gl, 72, 48);

    /* ---------------- istanze (un VAO per draw call) ---------------- */
    this.monoBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.monoBuf);
    gl.bufferData(gl.ARRAY_BUFFER, this.monoData, gl.DYNAMIC_DRAW);
    this.monoVao = createInstancedVao(gl, this.gMono, this.monoBuf, MONO_LAYOUT, 48);

    this.haloBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.haloBuf);
    gl.bufferData(gl.ARRAY_BUFFER, this.haloData, gl.DYNAMIC_DRAW);
    this.haloVao = createInstancedVao(gl, this.gHalo, this.haloBuf, HALO_LAYOUT, 52);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    /* ---------------- particelle ---------------- */
    const small = Math.min(window.innerWidth, window.innerHeight) < 700;
    this.partCount = small ? 4200 : 9000;
    this.partBuf = [gl.createBuffer()!, gl.createBuffer()!];
    const init = new Float32Array(this.partCount * 10);
    for (let i = 0; i < this.partCount; i++) {
      const o = i * 10;
      const a = Math.random() * Math.PI * 2;
      const y = Math.random() * 2 - 1;
      const r = 5.2 + Math.random() * 2.6;
      const rr = Math.sqrt(Math.max(1 - y * y, 0));
      init[o] = Math.cos(a) * rr * r;
      init[o + 1] = y * r * 0.62;
      init[o + 2] = Math.sin(a) * rr * r;
      init[o + 3] = (Math.random() - 0.5) * 0.6;
      init[o + 4] = (Math.random() - 0.5) * 0.6;
      init[o + 5] = (Math.random() - 0.5) * 0.6;
      init[o + 6] = 1 + Math.random() * 4;
      init[o + 7] = 4 + Math.random() * 4;
      init[o + 8] = Math.random();
      init[o + 9] = Math.random();
    }
    for (const b of this.partBuf) {
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, init, gl.DYNAMIC_COPY);
    }
    this.partVao = gl.createVertexArray()!;
    this.partTf = gl.createTransformFeedback()!;

    /* ---------------- input ---------------- */
    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("pointerup", this.onPointerUp);
    canvas.addEventListener("pointercancel", this.onPointerUp);
    canvas.addEventListener("wheel", this.onWheel, { passive: false });
    canvas.addEventListener("webglcontextlost", this.onContextLost);

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas.parentElement ?? canvas);
    this.resize();
  }

  /* ------------------------------ setup helpers ------------------------------ */

  private bindParticleBuffer(buf: WebGLBuffer) {
    const gl = this.gl;
    gl.bindVertexArray(this.partVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 40, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 40, 12);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 40, 24);
  }

  /* ------------------------------ API pubblica ------------------------------ */

  setReducedMotion(v: boolean) {
    this.opts.reducedMotion = v;
    this.rig.autoSpeed = v ? 0 : 0.055;
  }

  /** Seleziona un profilo (null = torna al profilatore spaziale). */
  setProfile(index: number | null, text?: { lines: TargetLine[]; accent: string }) {
    const rm = this.opts.reducedMotion;
    this.rig.cancelSpline();
    this.selected = index;

    if (index === null) {
      this.morph01T = 0;
      this.morph12T = 0;
      this.accentRgbT = hexToRgb(DEFAULT_ACCENT);
      this.setMode(0);
      this.rig.flyTo(this.rig.theta, 0.34, 31, v3(0, 2.2, 0), rm ? 0.5 : 1.6);
      return;
    }

    // inquadratura focale: pilastro in primo piano, nucleo e particelle sullo sfondo
    const a = this.pillarAngles[index] ?? 0;
    const h = BASE_H * (0.55 + 0.9 * this.pillarHTarget[index]);
    const pillar = v3(Math.sin(a) * this.ringR, h * 0.55, Math.cos(a) * this.ringR);
    const target = v3(pillar.x * 0.45, h * 0.62 + 0.4, pillar.z * 0.45);
    this.rig.flyTo(a + 0.18, 0.14, 17, target, rm ? 0.5 : 1.7);

    // morphing del nucleo per profilo
    this.morph01T = index % 2 === 0 ? 1 : 0;
    this.morph12T = index >= 2 ? 1 : 0;

    if (text) {
      const rgb = hexToRgb(text.accent);
      this.accentRgbT = rgb;
      this.surgeRgb = rgb;
      this.surgeOrigin = v3(pillar.x, pillar.y, pillar.z);
      const aspect = this.width / Math.max(this.height, 1);
      const k = Math.min(1, Math.max(0.45, aspect));
      const next = createTargetTexture(
        this.gl,
        text.lines,
        text.accent,
        13.5 * k,
        6.4 * k
      );
      if (this.targets) deleteTargetTexture(this.gl, this.targets);
      this.targets = next;
      this.setMode(1);
      this.triggerSurge();
    }
  }

  /** Metriche live del simulatore (0..1) → altezza e glow dei pilastri. */
  setMetrics(metrics: number[]) {
    for (let i = 0; i < 5; i++) {
      this.pillarHTarget[i] = clamp(metrics[i] ?? 0.55, 0.18, 1);
    }
  }

  /** Transizione volumetrica: vapore/espansione dal punto focale. */
  triggerSurge(strength = 1) {
    if (this.opts.reducedMotion) {
      this.surgeT = 0.35;
      this.surgeRadius = 12;
      return;
    }
    this.surgeT = strength;
    this.surgeRadius = 1;
  }

  /** Boost celebrativo delle particelle (iscrizione completata). */
  celebrate(accent?: string) {
    if (accent) this.surgeRgb = hexToRgb(accent);
    this.setMode(2);
    this.modeHold = 1.15;
    this.triggerSurge(0.85);
  }

  /** Orbita da tastiera / controlli esterni. */
  nudge(dTheta: number, dPhi = 0) {
    this.rig.cancelSpline();
    this.rig.orbit(dTheta, dPhi);
  }

  start() {
    if (this.running || this.disposed) return;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.stop();
    const gl = this.gl;
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("pointerup", this.onPointerUp);
    this.canvas.removeEventListener("pointercancel", this.onPointerUp);
    this.canvas.removeEventListener("wheel", this.onWheel);
    this.canvas.removeEventListener("webglcontextlost", this.onContextLost);
    this.ro?.disconnect();
    this.ro = null;

    for (const p of [
      this.pVol,
      this.pMono,
      this.pHalo,
      this.pCore,
      this.pSim,
      this.pPart,
      this.pBright,
      this.pBlur,
      this.pComp,
    ]) {
      gl.deleteProgram(p.prog);
    }
    for (const g of [this.gMono, this.gHalo, this.gCore]) {
      deleteGeometry(gl, g);
    }
    gl.deleteVertexArray(this.monoVao);
    gl.deleteVertexArray(this.haloVao);
    gl.deleteVertexArray(this.partVao);
    gl.deleteBuffer(this.monoBuf);
    gl.deleteBuffer(this.haloBuf);
    gl.deleteBuffer(this.partBuf[0]);
    gl.deleteBuffer(this.partBuf[1]);
    gl.deleteTransformFeedback(this.partTf);
    deleteRenderTarget(gl, this.sceneRT);
    deleteRenderTarget(gl, this.volRT);
    deleteRenderTarget(gl, this.bloomA);
    deleteRenderTarget(gl, this.bloomB);
    if (this.depthRb) gl.deleteRenderbuffer(this.depthRb);
    deleteTargetTexture(gl, this.targets);
    const lose = gl.getExtension("WEBGL_lose_context");
    lose?.loseContext();
  }

  /* ------------------------------ dimensioni ------------------------------ */

  private resize() {
    const parent = this.canvas.parentElement;
    const w = Math.max(1, Math.floor(parent?.clientWidth ?? this.canvas.clientWidth));
    const h = Math.max(1, Math.floor(parent?.clientHeight ?? this.canvas.clientHeight));
    const small = Math.min(w, h) < 700;
    this.dpr = Math.min(window.devicePixelRatio || 1, small ? 1.6 : 2);
    this.width = Math.floor(w * this.dpr);
    this.height = Math.floor(h * this.dpr);
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";

    // arco dei pilastri e raggio dell'anello si adattano al campo visivo orizzontale
    const aspect = w / Math.max(h, 1);
    const halfH = Math.atan(Math.tan(0.82 / 2) * aspect);
    const spread = Math.min(1.05, Math.max(0.3, halfH * 0.8));
    this.pillarAngles = [-spread, -spread / 2, 0, spread / 2, spread];
    this.ringR = aspect < 0.85 ? RING_R_MOBILE : RING_R_DESKTOP;

    this.rebuildTargets();
  }

  private rebuildTargets() {
    const gl = this.gl;
    const w = Math.max(2, this.width);
    const h = Math.max(2, this.height);
    deleteRenderTarget(gl, this.sceneRT);
    deleteRenderTarget(gl, this.volRT);
    deleteRenderTarget(gl, this.bloomA);
    deleteRenderTarget(gl, this.bloomB);
    if (this.depthRb) {
      gl.deleteRenderbuffer(this.depthRb);
      this.depthRb = null;
    }
    let allowFloat = !!gl.getExtension("EXT_color_buffer_float");
    try {
      this.sceneRT = createRenderTarget(gl, w, h, allowFloat);
    } catch {
      allowFloat = false;
      this.sceneRT = createRenderTarget(gl, w, h, false);
    }
    const vw = Math.max(2, Math.floor(w / 3));
    const vh = Math.max(2, Math.floor(h / 3));
    try {
      this.volRT = createRenderTarget(gl, vw, vh, allowFloat);
    } catch {
      this.volRT = createRenderTarget(gl, vw, vh, false);
    }
    const bw = Math.max(2, Math.floor(w / 4));
    const bh = Math.max(2, Math.floor(h / 4));
    try {
      this.bloomA = createRenderTarget(gl, bw, bh, allowFloat);
      this.bloomB = createRenderTarget(gl, bw, bh, allowFloat);
    } catch {
      this.bloomA = createRenderTarget(gl, bw, bh, false);
      this.bloomB = createRenderTarget(gl, bw, bh, false);
    }
    if (this.sceneRT) {
      this.depthRb = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthRb);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.sceneRT.fb);
      gl.framebufferRenderbuffer(
        gl.FRAMEBUFFER,
        gl.DEPTH_ATTACHMENT,
        gl.RENDERBUFFER,
        this.depthRb
      );
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    }
  }

  /* ------------------------------ loop ------------------------------ */

  private frame = (now: number) => {
    if (!this.running || this.disposed) return;
    this.raf = requestAnimationFrame(this.frame);
    const dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    this.time += dt;
    this.update(dt);
    this.render();
  };

  private setMode(m: 0 | 1 | 2) {
    if (this.modeTo === m && this.modeT >= 1) return;
    this.modeFrom = this.modeTo;
    this.modeTo = m;
    this.modeT = 0;
  }

  private update(dt: number) {
    const rm = this.opts.reducedMotion;
    this.rig.autoSpeed = rm ? 0 : this.selected === null ? 0.055 : 0.02;
    this.rig.update(dt);

    // morphing e colori
    this.morph01 = approach(this.morph01, this.morph01T, 2.2, dt);
    this.morph12 = approach(this.morph12, this.morph12T, 2.2, dt);
    for (let i = 0; i < 3; i++) {
      this.accentRgb[i] = approach(this.accentRgb[i], this.accentRgbT[i], 2.4, dt);
    }

    // pilastri
    for (let i = 0; i < 5; i++) {
      this.pillarH[i] = approach(this.pillarH[i], this.pillarHTarget[i], 2.6, dt);
      this.pillarSelT[i] = this.selected === i ? 1 : 0;
      this.pillarSel[i] = approach(this.pillarSel[i], this.pillarSelT[i], 5, dt);
    }

    // modalità particelle
    if (this.modeT < 1) {
      this.modeT = Math.min(1, this.modeT + dt * 1.6);
      if (this.modeT >= 1) this.modeFrom = this.modeTo;
    } else if (this.modeHold > 0) {
      this.modeHold -= dt;
      if (this.modeHold <= 0) this.setMode(this.selected === null ? 0 : 1);
    }

    // surge
    if (this.surgeT > 0) {
      this.surgeT = Math.max(0, this.surgeT - dt / this.surgeDur);
      this.surgeRadius += dt * 15;
    }

    this.updateInstanceBuffers();
    this.simulateParticles(dt);
  }

  /**
   * Posizione del pilastro i. Scrive in un buffer riusato: il motore non deve
   * allocare nel percorso per-frame (SKILL §6.1). Nessun chiamante trattiene
   * il riferimento restituito oltre l'iterazione corrente.
   */
  private pillarPos(i: number): Vec3 {
    const a = this.pillarAngles[i] ?? 0;
    const h = BASE_H * (0.55 + 0.9 * this.pillarH[i]);
    const out = this.pillarTmp;
    out.x = Math.sin(a) * this.ringR;
    out.y = h * 0.5;
    out.z = Math.cos(a) * this.ringR;
    return out;
  }

  private pillarColors: [number, number, number][] = (
    ["#7dd3fc", "#7fce9b", "#a3e635", "#e2a63d", "#c4b5fd"] as const
  ).map(hexToRgb) as [number, number, number][];

  private updateInstanceBuffers() {
    const gl = this.gl;
    for (let i = 0; i < 5; i++) {
      const p = this.pillarPos(i);
      const h = BASE_H * (0.55 + 0.9 * this.pillarH[i]);
      const o = i * 12;
      this.monoData[o] = p.x;
      this.monoData[o + 1] = p.y;
      this.monoData[o + 2] = p.z;
      this.monoData[o + 3] = 0.82 + this.pillarH[i] * 0.16;
      this.monoData[o + 4] = h;
      const c = this.pillarColors[i];
      this.monoData[o + 5] = c[0];
      this.monoData[o + 6] = c[1];
      this.monoData[o + 7] = c[2];
      this.monoData[o + 8] = i * 0.137;
      this.monoData[o + 9] = this.pillarSel[i];
      this.monoData[o + 10] = 0.5 + 0.5 * Math.sin(this.time * 2.1 + i * 1.7);
      this.monoData[o + 11] = i;

      const ho = i * 13;
      this.haloData[ho] = p.x;
      this.haloData[ho + 1] = p.y + h * 0.5 + 0.55;
      this.haloData[ho + 2] = p.z;
      this.haloData[ho + 3] = 1.5 + this.pillarSel[i] * 0.35;
      this.haloData[ho + 4] = 1.5 + this.pillarSel[i] * 0.35;
      this.haloData[ho + 5] = 1.5 + this.pillarSel[i] * 0.35;
      this.haloData[ho + 6] = c[0];
      this.haloData[ho + 7] = c[1];
      this.haloData[ho + 8] = c[2];
      this.haloData[ho + 9] = i * 0.2;
      this.haloData[ho + 10] = this.pillarSel[i];
      this.haloData[ho + 11] = 0;
      this.haloData[ho + 12] = 0;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.monoBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.monoData);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.haloBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.haloData);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  private simulateParticles(dt: number) {
    const gl = this.gl;
    const src = this.partBuf[this.partCur];
    const dst = this.partBuf[1 - this.partCur];
    const p = this.pSim;

    gl.useProgram(p.prog);
    gl.uniform1f(p.u.uDt, dt);
    gl.uniform1f(p.u.uTime, this.time);
    gl.uniform1f(p.u.uModeA, this.modeFrom);
    gl.uniform1f(p.u.uModeB, this.modeTo);
    gl.uniform1f(p.u.uModeT, this.modeT);
    gl.uniform3f(p.u.uCorePos, 0, CORE_Y, 0);
    gl.uniform1f(p.u.uTargetCount, this.targets?.count ?? 1);
    gl.uniform1f(p.u.uTargetYaw, this.rig.yaw);
    gl.uniform1f(p.u.uFlow, this.opts.reducedMotion ? 0.35 : 1);
    if (this.targets) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.targets.tex);
      gl.uniform1i(p.u.uTargets, 0);
    }

    this.bindParticleBuffer(src);
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.partTf);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, dst);
    gl.enable(gl.RASTERIZER_DISCARD);
    gl.beginTransformFeedback(gl.POINTS);
    gl.drawArrays(gl.POINTS, 0, this.partCount);
    gl.endTransformFeedback();
    gl.disable(gl.RASTERIZER_DISCARD);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
    gl.bindVertexArray(null);
    this.partCur = 1 - this.partCur;
  }

  /* ------------------------------ rendering ------------------------------ */

  private render() {
    const gl = this.gl;
    if (!this.sceneRT || !this.volRT || !this.bloomA || !this.bloomB) return;

    const aspect = this.width / this.height;
    perspective(this.proj, 0.82, aspect, 0.1, 120);
    lookAt(this.view, this.rig.eye, this.rig.target, UP);
    multiply(this.viewProj, this.proj, this.view);
    if (invert(this.invViewProj, this.viewProj) === null) this.invViewProj = this.viewProj;

    /* --- scena 3D --- */
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.sceneRT.fb);
    gl.viewport(0, 0, this.width, this.height);
    gl.clearColor(0.014, 0.012, 0.010, 1);
    gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    // pilastri
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(this.pMono.prog);
    gl.uniformMatrix4fv(this.pMono.u.uViewProj, false, this.viewProj);
    gl.uniformMatrix4fv(this.pMono.u.uView, false, this.view);
    gl.uniform1f(this.pMono.u.uTime, this.time);
    gl.uniform3f(this.pMono.u.uEnvWarm, 0.62, 0.42, 0.20);
    gl.uniform3f(this.pMono.u.uEnvCool, 0.20, 0.30, 0.44);
    gl.bindVertexArray(this.monoVao);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, this.gMono.count, 5);

    // nucleo morphing (trasparente, senza scrittura depth)
    gl.depthMask(false);
    gl.useProgram(this.pCore.prog);
    gl.uniformMatrix4fv(this.pCore.u.uViewProj, false, this.viewProj);
    gl.uniformMatrix4fv(this.pCore.u.uView, false, this.view);
    gl.uniform1f(this.pCore.u.uTime, this.time);
    gl.uniform1f(this.pCore.u.uMorph01, this.morph01);
    gl.uniform1f(this.pCore.u.uMorph12, this.morph12);
    gl.uniform1f(this.pCore.u.uScale, 2.55);
    gl.uniform3f(this.pCore.u.uAccent, this.accentRgb[0], this.accentRgb[1], this.accentRgb[2]);
    gl.uniform3f(this.pCore.u.uEnvWarm, 0.62, 0.42, 0.20);
    gl.uniform3f(this.pCore.u.uEnvCool, 0.20, 0.30, 0.44);
    gl.bindVertexArray(this.gCore.vao);
    gl.drawArrays(gl.TRIANGLES, 0, this.gCore.count);

    // anelli halo (additivi)
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(this.pHalo.prog);
    gl.uniformMatrix4fv(this.pHalo.u.uViewProj, false, this.viewProj);
    gl.uniform1f(this.pHalo.u.uTime, this.time);
    gl.bindVertexArray(this.haloVao);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, this.gHalo.count, 5);

    // particelle (additive)
    const buf = this.partBuf[this.partCur];
    this.bindParticleBuffer(buf);
    gl.useProgram(this.pPart.prog);
    gl.uniformMatrix4fv(this.pPart.u.uViewProj, false, this.viewProj);
    gl.uniformMatrix4fv(this.pPart.u.uView, false, this.view);
    gl.uniform1f(
      this.pPart.u.uPointScale,
      this.height * 0.06 * (this.opts.reducedMotion ? 0.8 : 1)
    );
    gl.uniform3f(this.pPart.u.uColorA, this.accentRgb[0], this.accentRgb[1], this.accentRgb[2]);
    gl.uniform3f(this.pPart.u.uColorB, 0.94, 0.77, 0.44);
    gl.drawArrays(gl.POINTS, 0, this.partCount);

    gl.depthMask(true);
    gl.disable(gl.BLEND);
    gl.bindVertexArray(null);

    /* --- volumetrico (metà risoluzione) --- */
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.volRT.fb);
    gl.viewport(0, 0, this.volRT.width, this.volRT.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(this.pVol.prog);
    gl.uniformMatrix4fv(this.pVol.u.uInvViewProj, false, this.invViewProj);
    gl.uniform3f(this.pVol.u.uCamPos, this.rig.eye.x, this.rig.eye.y, this.rig.eye.z);
    gl.uniform1f(this.pVol.u.uTime, this.time);
    const pillars = this.pillarsArr;
    const cols = this.colsArr;
    for (let i = 0; i < 5; i++) {
      const p = this.pillarPos(i);
      pillars[i * 3] = p.x;
      pillars[i * 3 + 1] = p.y;
      pillars[i * 3 + 2] = p.z;
      const c = this.pillarColors[i];
      const g = 0.35 + this.pillarSel[i] * 0.65;
      cols[i * 3] = c[0] * g;
      cols[i * 3 + 1] = c[1] * g;
      cols[i * 3 + 2] = c[2] * g;
    }
    gl.uniform3fv(this.pVol.u.uPillars, pillars);
    gl.uniform3fv(this.pVol.u.uPillarCols, cols);
    gl.uniform3f(this.pVol.u.uSurgeColor, this.surgeRgb[0], this.surgeRgb[1], this.surgeRgb[2]);
    gl.uniform3f(
      this.pVol.u.uSurgeOrigin,
      this.surgeOrigin.x,
      this.surgeOrigin.y,
      this.surgeOrigin.z
    );
    gl.uniform1f(this.pVol.u.uSurge, this.surgeT);
    gl.uniform1f(this.pVol.u.uSurgeRadius, this.surgeRadius);
    gl.uniform3f(this.pVol.u.uEnvWarm, 0.62, 0.42, 0.20);
    gl.uniform3f(this.pVol.u.uEnvCool, 0.20, 0.30, 0.44);
    const small = this.width < 900;
    gl.uniform1i(this.pVol.u.uSteps, small ? 12 : 18);
    drawFullscreen(gl);

    /* --- bloom --- */
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.bloomA.fb);
    gl.viewport(0, 0, this.bloomA.width, this.bloomA.height);
    gl.useProgram(this.pBright.prog);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.sceneRT.tex);
    gl.uniform1i(this.pBright.u.uSrc, 0);
    gl.uniform1f(this.pBright.u.uThreshold, 0.5);
    gl.uniform1f(this.pBright.u.uIntensity, 1.15);
    drawFullscreen(gl);

    gl.useProgram(this.pBlur.prog);
    gl.uniform1i(this.pBlur.u.uSrc, 0);
    let srcRT = this.bloomA;
    let dstRT = this.bloomB;
    for (let i = 0; i < 2; i++) {
      const r = i === 0 ? 1 : 1.7;
      gl.bindFramebuffer(gl.FRAMEBUFFER, dstRT.fb);
      gl.viewport(0, 0, dstRT.width, dstRT.height);
      gl.bindTexture(gl.TEXTURE_2D, srcRT.tex);
      gl.uniform2f(this.pBlur.u.uDir, r / srcRT.width, 0);
      drawFullscreen(gl);
      const tmp = srcRT;
      srcRT = dstRT;
      dstRT = tmp;
      gl.bindFramebuffer(gl.FRAMEBUFFER, dstRT.fb);
      gl.viewport(0, 0, dstRT.width, dstRT.height);
      gl.bindTexture(gl.TEXTURE_2D, srcRT.tex);
      gl.uniform2f(this.pBlur.u.uDir, 0, r / srcRT.height);
      drawFullscreen(gl);
      const tmp2 = srcRT;
      srcRT = dstRT;
      dstRT = tmp2;
    }
    this.bloomResult = srcRT;

    /* --- composite --- */
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.width, this.height);
    gl.useProgram(this.pComp.prog);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.sceneRT.tex);
    gl.uniform1i(this.pComp.u.uScene, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.bloomResult.tex);
    gl.uniform1i(this.pComp.u.uBloom, 1);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.volRT.tex);
    gl.uniform1i(this.pComp.u.uVol, 2);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1f(this.pComp.u.uTime, this.time);
    gl.uniform1f(this.pComp.u.uBloomI, 0.85);
    gl.uniform2f(this.pComp.u.uTexel, 1 / this.width, 1 / this.height);
    drawFullscreen(gl);

    /* --- label dei pilastri (proiezione CPU) --- */
    this.emitLabels();
  }

  private bloomResult: RenderTarget | null = null;

  private emitLabels() {
    const cb = this.opts.callbacks;
    for (let i = 0; i < 5; i++) {
      const p = this.pillarPos(i);
      const h = BASE_H * (0.55 + 0.9 * this.pillarH[i]);
      const s = projectToScreen(
        this.viewProj,
        p.x,
        p.y + h * 0.5 + 1.35,
        p.z,
        this.canvas.clientWidth,
        this.canvas.clientHeight
      );
      const l = this.labels[i];
      l.x = s.x;
      l.y = s.y;
      l.visible = s.visible;
      l.selected = this.pillarSel[i] > 0.5;
      l.depth = s.depth;
    }
    cb?.onLabels?.(this.labels);
  }

  /* ------------------------------ input ------------------------------ */

  private onContextLost = (e: Event) => {
    e.preventDefault();
    this.stop();
    console.warn("[Onboarding3D] contesto WebGL perso");
  };

  private onPointerDown = (e: PointerEvent) => {
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    this.dragging = false;
    this.dragMoved = 0;
    if (this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      this.pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
    }
    this.canvas.setPointerCapture(e.pointerId);
  };

  private onPointerMove = (e: PointerEvent) => {
    const prev = this.pointers.get(e.pointerId);
    if (!prev) {
      // hover
      const hit = this.pickAt(e.clientX, e.clientY);
      if (hit !== this.hovered) {
        this.hovered = hit;
        this.canvas.style.cursor = hit !== null ? "pointer" : "grab";
        this.opts.callbacks?.onHover?.(hit);
      }
      return;
    }
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (this.pointers.size >= 2) {
      const [a, b] = [...this.pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (this.pinchDist > 0) this.rig.zoom((this.pinchDist - d) * 2.2);
      this.pinchDist = d;
      this.dragging = true;
      return;
    }

    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    this.dragMoved += Math.abs(dx) + Math.abs(dy);
    if (this.dragMoved > 8) this.dragging = true;
    this.rig.cancelSpline();
    this.rig.orbit(dx, dy);
  };

  private onPointerUp = (e: PointerEvent) => {
    const wasDragging = this.dragging;
    this.pointers.delete(e.pointerId);
    if (this.pointers.size < 2) this.pinchDist = 0;
    if (this.canvas.hasPointerCapture(e.pointerId)) {
      this.canvas.releasePointerCapture(e.pointerId);
    }
    if (!wasDragging) {
      const hit = this.pickAt(e.clientX, e.clientY);
      if (hit !== null) this.opts.callbacks?.onPicked?.(hit);
    }
    this.dragging = false;
    this.dragMoved = 0;
  };

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    this.rig.zoom(e.deltaY);
  };

  /** Individua il pilastro più vicino al punto (coordinate client). */
  private pickAt(clientX: number, clientY: number): number | null {
    const rect = this.canvas.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    let best: number | null = null;
    let bestD = 120;
    for (let i = 0; i < 5; i++) {
      const l = this.labels[i];
      if (!l.visible) continue;
      const d = Math.hypot(l.x - px, l.y - py);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }
}
