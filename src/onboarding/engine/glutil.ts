/* ------------------------------------------------------------------ */
/*  Helper WebGL2 — compilazione shader, programmi, FBO, geometrie     */
/* ------------------------------------------------------------------ */

export function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  src: string
): WebGLShader {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh) ?? "unknown";
    gl.deleteShader(sh);
    const kind = type === gl.VERTEX_SHADER ? "vertex" : "fragment";
    throw new Error(`Shader ${kind} non compilato:\n${log}`);
  }
  return sh;
}

export interface Program {
  prog: WebGLProgram;
  u: Record<string, WebGLUniformLocation | null>;
  a: Record<string, number>;
}

export function createProgram(
  gl: WebGL2RenderingContext,
  vsSrc: string,
  fsSrc: string,
  tfVaryings?: string[]
): Program {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSrc);
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  if (tfVaryings && tfVaryings.length) {
    gl.transformFeedbackVaryings(prog, tfVaryings, gl.INTERLEAVED_ATTRIBS);
  }
  gl.linkProgram(prog);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(prog) ?? "unknown";
    gl.deleteProgram(prog);
    throw new Error(`Programma non linkato:\n${log}`);
  }
  const u: Record<string, WebGLUniformLocation | null> = {};
  const a: Record<string, number> = {};
  const nU = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS) as number;
  for (let i = 0; i < nU; i++) {
    const info = gl.getActiveUniform(prog, i);
    if (!info) continue;
    const name = info.name.replace(/\[0\]$/, "");
    u[name] = gl.getUniformLocation(prog, name);
  }
  const nA = gl.getProgramParameter(prog, gl.ACTIVE_ATTRIBUTES) as number;
  for (let i = 0; i < nA; i++) {
    const info = gl.getActiveAttrib(prog, i);
    if (!info) continue;
    a[info.name] = gl.getAttribLocation(prog, info.name);
  }
  return { prog, u, a };
}

export interface RenderTarget {
  fb: WebGLFramebuffer;
  tex: WebGLTexture;
  width: number;
  height: number;
  format: "rgba16f" | "rgba8";
}

export function createRenderTarget(
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
  allowFloat: boolean,
  filter: "linear" | "nearest" = "linear"
): RenderTarget {
  const tex = gl.createTexture()!;
  const useFloat = allowFloat && !!gl.getExtension("EXT_color_buffer_float");
  const internalFormat = useFloat ? gl.RGBA16F : gl.RGBA8;
  const type = useFloat ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, gl.RGBA, type, null);
  const f = filter === "linear" ? gl.LINEAR : gl.NEAREST;
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, f);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, f);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const fb = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    gl.deleteFramebuffer(fb);
    gl.deleteTexture(tex);
    throw new Error(`Framebuffer incompleto (${status})`);
  }
  return { fb, tex, width, height, format: useFloat ? "rgba16f" : "rgba8" };
}

export function deleteRenderTarget(gl: WebGL2RenderingContext, rt: RenderTarget | null) {
  if (!rt) return;
  gl.deleteFramebuffer(rt.fb);
  gl.deleteTexture(rt.tex);
}

/** Disegna il triangolo fullscreen (nessun VAO richiesto). */
export function drawFullscreen(gl: WebGL2RenderingContext) {
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}


/**
 * Crea un VAO che combina la geometria (pos/nrm/uv) con un buffer di
 * istanze (attributi 3..6 con divisor 1). Un solo VAO per draw call.
 */
export function createInstancedVao(
  gl: WebGL2RenderingContext,
  g: Geometry,
  instanceBuffer: WebGLBuffer,
  layout: { loc: number; size: number; offset: number }[],
  stride: number
): WebGLVertexArrayObject {
  const vao = gl.createVertexArray()!;
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, g.buffers[0]);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, g.buffers[1]);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, g.buffers[2]);
  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
  for (const a of layout) {
    gl.enableVertexAttribArray(a.loc);
    gl.vertexAttribPointer(a.loc, a.size, gl.FLOAT, false, stride, a.offset);
    gl.vertexAttribDivisor(a.loc, 1);
  }
  gl.bindVertexArray(null);
  return vao;
}

/* ------------------------------ geometrie ------------------------------ */

export interface Geometry {
  vao: WebGLVertexArrayObject;
  count: number;
  /** attributi disponibili (posizione sempre in "position") */
  hasUv: boolean;
  buffers: WebGLBuffer[];
}

/** Builder di geometria non indicizzata: ogni triangolo porta i suoi vertici. */
class MeshBuilder {
  pos: number[] = [];
  nrm: number[] = [];
  uv: number[] = [];
  tri(
    p0: number[], p1: number[], p2: number[],
    n0: number[], n1: number[], n2: number[],
    u0: number[], u1: number[], u2: number[]
  ) {
    this.pos.push(...p0, ...p1, ...p2);
    this.nrm.push(...n0, ...n1, ...n2);
    this.uv.push(...u0, ...u1, ...u2);
  }
}

export function deleteGeometry(gl: WebGL2RenderingContext, g: Geometry) {
  gl.deleteVertexArray(g.vao);
  for (const b of g.buffers) gl.deleteBuffer(b);
}

function createGeometry(gl: WebGL2RenderingContext, m: MeshBuilder): Geometry {
  const vao = gl.createVertexArray()!;
  gl.bindVertexArray(vao);
  const posBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(m.pos), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
  const nrmBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, nrmBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(m.nrm), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
  const uvBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(m.uv), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  return { vao, count: m.pos.length / 3, hasUv: true, buffers: [posBuf, nrmBuf, uvBuf] };
}

/** Cilindro conico: raggio 1, altezza 1 centrato (y ∈ [-0.5, 0.5]). */
export function createCylinder(gl: WebGL2RenderingContext, segments = 22, taper = 0.72): Geometry {
  const m = new MeshBuilder();
  const halfH = 0.5;
  const slope = 1 - taper;
  const nl = Math.hypot(1, slope);

  // corpo: due anelli di vertici
  const ring: { p: number[]; n: number[]; uv: number[] }[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const c = Math.cos(a);
    const si = Math.sin(a);
    const n = [c / nl, -slope / nl, si / nl];
    const nt = [c / nl, slope / nl, si / nl];
    ring.push({
      p: [c, -halfH, si],
      n,
      uv: [i / segments, 0],
    });
    ring.push({
      p: [c, halfH, si * taper],
      n: nt,
      uv: [i / segments, 1],
    });
  }
  for (let i = 0; i < segments; i++) {
    const a = ring[i * 2];
    const b = ring[i * 2 + 1];
    const c = ring[i * 2 + 2];
    const d = ring[i * 2 + 3];
    m.tri(a.p, b.p, d.p, a.n, b.n, d.n, a.uv, b.uv, d.uv);
    m.tri(a.p, d.p, c.p, a.n, d.n, c.n, a.uv, d.uv, c.uv);
  }

  // tappi
  for (const top of [false, true]) {
    const cy = top ? halfH : -halfH;
    const r = top ? taper : 1;
    const ny = top ? 1 : -1;
    const center = { p: [0, cy, 0], n: [0, ny, 0], uv: [0.5, 0.5] };
    const rim: { p: number[]; n: number[]; uv: number[] }[] = [];
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      rim.push({
        p: [Math.cos(a) * r, cy, Math.sin(a) * r],
        n: [0, ny, 0],
        uv: [0.5 + Math.cos(a) * 0.5, 0.5 + Math.sin(a) * 0.5],
      });
    }
    for (let i = 0; i < segments; i++) {
      const a = rim[i];
      const b = rim[i + 1];
      if (top) m.tri(center.p, a.p, b.p, center.n, a.n, b.n, center.uv, a.uv, b.uv);
      else m.tri(center.p, b.p, a.p, center.n, b.n, a.n, center.uv, b.uv, a.uv);
    }
  }
  return createGeometry(gl, m);
}

/** Sfera UV parametrica (usata per il morphing in vertex shader). */
export function createUvSphere(gl: WebGL2RenderingContext, w = 72, h = 48): Geometry {
  const m = new MeshBuilder();
  const at = (x: number, y: number) => {
    const u = x / w;
    const v = y / h;
    const theta = u * Math.PI * 2;
    const phi = v * Math.PI;
    const sp = Math.sin(phi);
    const d = [sp * Math.cos(theta), Math.cos(phi), sp * Math.sin(theta)];
    return { p: d, n: d, uv: [u, v] };
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = at(x, y);
      const b = at(x + 1, y);
      const c = at(x, y + 1);
      const d = at(x + 1, y + 1);
      m.tri(a.p, c.p, b.p, a.n, c.n, b.n, a.uv, c.uv, b.uv);
      m.tri(b.p, c.p, d.p, b.n, c.n, d.n, b.uv, c.uv, d.uv);
    }
  }
  return createGeometry(gl, m);
}

/** Toro piatto (anello) per gli halo dei pilastri. */
export function createTorus(
  gl: WebGL2RenderingContext,
  major = 1,
  minor = 0.045,
  seg = 96,
  ring = 12
): Geometry {
  const m = new MeshBuilder();
  const at = (i: number, j: number) => {
    const u = (i / seg) * Math.PI * 2;
    const v = (j / ring) * Math.PI * 2;
    const cu = Math.cos(u);
    const su = Math.sin(u);
    const cv = Math.cos(v);
    const sv = Math.sin(v);
    const r = major + minor * cv;
    const p = [r * cu, minor * sv, r * su];
    const n = [cv * cu, sv, cv * su];
    return { p, n, uv: [i / seg, j / ring] };
  };
  for (let i = 0; i < seg; i++) {
    for (let j = 0; j < ring; j++) {
      const a = at(i, j);
      const b = at(i + 1, j);
      const c = at(i, j + 1);
      const d = at(i + 1, j + 1);
      m.tri(a.p, c.p, b.p, a.n, c.n, b.n, a.uv, c.uv, b.uv);
      m.tri(b.p, c.p, d.p, b.n, c.n, d.n, b.uv, c.uv, d.uv);
    }
  }
  return createGeometry(gl, m);
}
