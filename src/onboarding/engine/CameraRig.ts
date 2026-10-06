/* ------------------------------------------------------------------ */
/*  Camera rig — orbita utente + interpolazione cinematografica         */
/*  Catmull-Rom attraverso waypoint (SKILL §3.4: camera splines)        */
/* ------------------------------------------------------------------ */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

const v3 = (x = 0, y = 0, z = 0): Vec3 => ({ x, y, z });
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function catmull(p0: Vec3, p1: Vec3, p2: Vec3, t: number): Vec3 {
  const t2 = t * t;
  const t3 = t2 * t;
  const f = (a: number, b: number, c: number) =>
    0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - c) * t2 + (-a + 3 * b - 3 * c + c) * t3);
  return v3(f(p0.x, p1.x, p2.x), f(p0.y, p1.y, p2.y), f(p0.z, p1.z, p2.z));
}

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

interface Spline {
  eye: [Vec3, Vec3, Vec3];
  tgt: [Vec3, Vec3, Vec3];
  t: number;
  dur: number;
}

export class CameraRig {
  eye = v3(0, 8, 30);
  target = v3(0, 0.5, 0);

  /** coordinate sferiche dell'orbita (relative al target) */
  theta = 0;
  phi = 0.42;
  dist = 30;
  autoSpeed = 0.055;

  private spline: Spline | null = null;
  private baseTheta = 0;

  /** Vola verso una nuova inquadratura con spline Catmull-Rom. */
  flyTo(theta: number, phi: number, dist: number, target: Vec3, dur: number) {
    const fromEye = v3(this.eye.x, this.eye.y, this.eye.z);
    const fromTgt = v3(this.target.x, this.target.y, this.target.z);

    const toEye = spherical(theta, phi, dist, target);
    const toTgt = target;

    // waypoint intermedio: solleva e allontana leggermente per un arco cinematografico
    const mid = v3(
      lerp(fromEye.x, toEye.x, 0.5) + (fromEye.z - toEye.z) * 0.10,
      lerp(fromEye.y, toEye.y, 0.5) + 5.5,
      lerp(fromEye.z, toEye.z, 0.5) + (toEye.x - fromEye.x) * 0.10
    );
    const midT = v3(
      lerp(fromTgt.x, toTgt.x, 0.5),
      lerp(fromTgt.y, toTgt.y, 0.5) + 1.2,
      lerp(fromTgt.z, toTgt.z, 0.5)
    );

    this.spline = {
      eye: [fromEye, mid, toEye],
      tgt: [fromTgt, midT, toTgt],
      t: 0,
      dur: Math.max(dur, 0.001),
    };
  }

  /** Interrompe la spline e risincronizza l'orbita alla posa corrente. */
  cancelSpline() {
    if (!this.spline) return;
    this.spline = null;
    const d = v3(this.eye.x - this.target.x, this.eye.y - this.target.y, this.eye.z - this.target.z);
    this.dist = Math.max(6, Math.hypot(d.x, d.y, d.z));
    this.theta = Math.atan2(d.x, d.z);
    this.phi = Math.asin(clamp(d.y / Math.max(this.dist, 1e-4), -1, 1));
  }

  orbit(dx: number, dy: number) {
    this.theta -= dx * 0.0052;
    this.phi = clamp(this.phi - dy * 0.0042, -0.35, 1.25);
  }

  zoom(delta: number) {
    this.dist = clamp(this.dist * (1 + delta * 0.0012), 9, 52);
  }

  get flying() {
    return this.spline !== null;
  }

  update(dt: number) {
    if (this.spline) {
      const s = this.spline;
      s.t = Math.min(s.t + dt / s.dur, 1);
      const e = easeInOutCubic(s.t);
      const p = catmull(s.eye[0], s.eye[1], s.eye[2], e);
      const q = catmull(s.tgt[0], s.tgt[1], s.tgt[2], e);
      this.eye = p;
      this.target = q;
      if (s.t >= 1) this.cancelSpline();
    } else {
      this.baseTheta += dt * this.autoSpeed;
      const th = this.theta + this.baseTheta;
      const cp = Math.cos(this.phi);
      this.eye = v3(
        this.target.x + Math.sin(th) * cp * this.dist,
        this.target.y + Math.sin(this.phi) * this.dist,
        this.target.z + Math.cos(th) * cp * this.dist
      );
    }
  }

  /** Azimut corrente della camera rispetto all'origine XZ (per orientare il piano testuale). */
  get yaw() {
    const d = v3(this.eye.x - this.target.x, 0, this.eye.z - this.target.z);
    return Math.atan2(d.x, d.z);
  }
}

export function spherical(theta: number, phi: number, dist: number, target: Vec3): Vec3 {
  const cp = Math.cos(phi);
  return v3(
    target.x + Math.sin(theta) * cp * dist,
    target.y + Math.sin(phi) * dist,
    target.z + Math.cos(theta) * cp * dist
  );
}

export { v3, lerp, clamp };
