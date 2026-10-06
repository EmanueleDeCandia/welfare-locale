/* ------------------------------------------------------------------ */
/*  Target particellari: campiona un canvas 2D (testo + grafica)        */
/*  e lo carica come texture di punti — le particelle coalescono        */
/*  formando elementi grafici e testuali (SKILL §3.2).                  */
/* ------------------------------------------------------------------ */

export interface TargetLine {
  text: string;
  size: number;
  weight?: string;
  dy?: number;
  letterSpacing?: number;
}

export interface TargetTexture {
  tex: WebGLTexture;
  count: number;
  width: number;
  height: number;
}

const TARGET_W = 64;
const TARGET_H = 64;
const MAX_POINTS = TARGET_W * TARGET_H;

/** Converte un hex (#rrggbb) in componente rgb 0..1. */
export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const v = parseInt(h.length === 3 ? h.replace(/./g, (c) => c + c) : h, 16);
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
}

function withAlpha(rgb: [number, number, number], a: number) {
  return `rgba(${Math.round(rgb[0] * 255)},${Math.round(rgb[1] * 255)},${Math.round(rgb[2] * 255)},${a})`;
}

/**
 * Crea la texture dei target: disegna il testo su un canvas 2D,
 * ne campiona i pixel luminosi e li dispone in una griglia di punti.
 */
export function createTargetTexture(
  gl: WebGL2RenderingContext,
  lines: TargetLine[],
  accent: string,
  worldW = 13.5,
  worldH = 6.4
): TargetTexture {
  const cw = 768;
  const ch = 384;
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d")!;
  const rgb = hexToRgb(accent);

  ctx.clearRect(0, 0, cw, ch);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, cw, ch);

  // alone morbido del colore accent
  ctx.shadowColor = withAlpha(rgb, 0.9);
  ctx.shadowBlur = 26;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  lines.forEach((l, i) => {
    const y = ch * 0.5 + (l.dy ?? (i === 0 ? -ch * 0.13 : ch * 0.13));
    ctx.font = `${l.weight ?? "700"} ${l.size}px "Space Grotesk", "Fraunces", Georgia, serif`;
    if (l.letterSpacing !== undefined) {
      // letterSpacing è supportato dai browser moderni
      (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
        `${l.letterSpacing}px`;
    }
    ctx.fillStyle = "#ffffff";
    ctx.fillText(l.text, cw / 2, y);
    ctx.lineWidth = Math.max(2, l.size * 0.03);
    ctx.strokeStyle = withAlpha(rgb, 0.95);
    ctx.strokeText(l.text, cw / 2, y);
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "0px";
  });

  // cornice grafica: anello sottile attorno alla composizione
  ctx.shadowBlur = 0;
  ctx.strokeStyle = withAlpha(rgb, 0.55);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(cw * 0.5 - cw * 0.42, ch * 0.5 - ch * 0.40, cw * 0.84, ch * 0.80, 28);
  ctx.stroke();

  const data = ctx.getImageData(0, 0, cw, ch).data;
  const pts: number[] = [];
  for (let y = 0; y < ch; y += 2) {
    for (let x = 0; x < cw; x += 2) {
      const i = (y * cw + x) * 4;
      const lum = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) * (data[i + 3] / 255);
      if (lum > 90) pts.push(x, y);
    }
  }

  const out = new Float32Array(MAX_POINTS * 4);
  const n = Math.min(pts.length / 2, MAX_POINTS);
  // campionamento stratificato per distribuire uniformemente i punti
  const stride = Math.max(1, Math.floor(n / MAX_POINTS));
  let w = 0;
  for (let i = 0; i < pts.length / 2 && w < MAX_POINTS; i += stride) {
    const px = pts[i * 2] + (Math.random() - 0.5) * 2.5;
    const py = pts[i * 2 + 1] + (Math.random() - 0.5) * 2.5;
    out[w * 4] = (px / cw - 0.5) * worldW;
    out[w * 4 + 1] = -(py / ch - 0.5) * worldH;
    out[w * 4 + 2] = (Math.random() - 0.5) * 0.55;
    out[w * 4 + 3] = 1;
    w++;
  }
  // riempimento: se il testo copre pochi pixel, clona i punti esistenti
  while (w < MAX_POINTS) {
    const src = (Math.floor(Math.random() * Math.max(w, 1)) % Math.max(w, 1)) * 4;
    out[w * 4] = out[src] + (Math.random() - 0.5) * 0.2;
    out[w * 4 + 1] = out[src + 1] + (Math.random() - 0.5) * 0.2;
    out[w * 4 + 2] = out[src + 2];
    out[w * 4 + 3] = 1;
    w++;
  }

  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, TARGET_W, TARGET_H, 0, gl.RGBA, gl.FLOAT, out);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindTexture(gl.TEXTURE_2D, null);

  return { tex, count: MAX_POINTS, width: TARGET_W, height: TARGET_H };
}

export function deleteTargetTexture(gl: WebGL2RenderingContext, t: TargetTexture | null) {
  if (t) gl.deleteTexture(t.tex);
}
