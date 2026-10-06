import { useEffect, useRef, useState } from "react";
import { OnboardingEngine, type PillarLabel } from "../engine/OnboardingEngine";
import { PROFILES } from "../data/profiles";
import type { Results, Params } from "../../lib/model";

export type Phase = "picker" | "focus" | "enroll" | "done";

interface Props {
  phase: Phase;
  selected: number | null;
  onSelect: (i: number) => void;
  onEngine: (e: OnboardingEngine | null) => void;
  engineRef: React.MutableRefObject<OnboardingEngine | null>;
  metrics: number[];
  params: Params;
  results: Results;
}

/* Etichette ancorate ai pilastri 3D (proiezione CPU → DOM) */
export default function StageCanvas({
  phase,
  selected,
  onSelect,
  onEngine,
  engineRef,
  metrics,
  params,
  results,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;
  const [failed, setFailed] = useState(false);
  const [rm, setRm] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setRm(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    engineRef.current?.setReducedMotion(rm);
  }, [rm, engineRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = OnboardingEngine.create(canvas, {
      reducedMotion: rm,
      callbacks: {
        onPicked: (i) => selectRef.current(i),
        onLabels: (labels: PillarLabel[]) => {
          for (let i = 0; i < labels.length; i++) {
            const el = labelRefs.current[i];
            if (!el) continue;
            const l = labels[i];
            el.style.transform = `translate3d(${l.x.toFixed(1)}px, ${l.y.toFixed(1)}px, 0)`;
            el.style.opacity = l.visible ? (0.4 + (l.selected ? 1 : 0) * 0.6).toFixed(2) : "0";
            el.style.pointerEvents = l.visible ? "auto" : "none";
            el.dataset.sel = l.selected ? "1" : "0";
            el.classList.toggle("is-left", l.x > (canvasRef.current?.clientWidth ?? 0) - 270);
          }
        },
      },
    });
    if (!engine) {
      setFailed(true);
      return;
    }
    engineRef.current = engine;
    engine.start();
    onEngine(engine);
    return () => {
      engine.dispose();
      engineRef.current = null;
      onEngine(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // metriche live del simulatore → altezza dei pilastri
  useEffect(() => {
    engineRef.current?.setMetrics(metrics);
  }, [metrics, engineRef]);

  return (
    <div className="absolute inset-0">
      <canvas
        ref={canvasRef}
        className="block h-full w-full touch-none"
        style={{ cursor: "grab" }}
        tabIndex={0}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 90 : 28;
          if (e.key === "ArrowLeft") {
            engineRef.current?.nudge(-step);
            e.preventDefault();
          } else if (e.key === "ArrowRight") {
            engineRef.current?.nudge(step);
            e.preventDefault();
          } else if (e.key === "ArrowUp") {
            engineRef.current?.nudge(0, -step * 0.6);
            e.preventDefault();
          } else if (e.key === "ArrowDown") {
            engineRef.current?.nudge(0, step * 0.6);
            e.preventDefault();
          }
        }}
        aria-label="Scenario 3D del circuito di welfare: cinque pilastri, un nucleo morphing e particelle GPU. Usa le frecce per orbitare."
        role="img"
      />

      {/* fallback elegante senza WebGL2 (SKILL §2 — graceful degradation) */}
      {failed && (
        <div className="ob-fallback pointer-events-none absolute inset-0" aria-hidden>
          <div className="ob-fallback-core" />
          <div className="ob-fallback-grid" />
        </div>
      )}

      {/* etichette dei pilastri — solo con il motore 3D attivo (posizionate dalla GPU) */}
      {!failed && (
        <div className="ob-labels" data-phase={phase}>
        {PROFILES.map((p, i) => (
          <button
            key={p.id}
            ref={(el) => {
              labelRefs.current[i] = el;
            }}
            className="ob-label glass"
            data-sel={selected === i ? "1" : "0"}
            style={{ "--accent": p.accent } as React.CSSProperties}
            onClick={() => onSelect(i)}
            tabIndex={phase === "picker" ? 0 : -1}
            aria-label={`Profilo ${p.name} — entra`}
          >
            <span className="ob-label-dot" />
            <span className="ob-label-body">
              <span className="ob-label-name">{p.short}</span>
              <span className="ob-label-metric">{p.pillarMetric(params, results)}</span>
            </span>
          </button>
          ))}
        </div>
      )}

      {failed && (
        <p className="ob-fallback-note">
          WebGL2 non disponibile su questo dispositivo: l'esperienza continua in modalità
          compatibile, con dati e calcoli sempre attivi.
        </p>
      )}
    </div>
  );
}

/* metriche normalizzate 0..1 per l'altezza dei pilastri (live dal simulatore) */
export function pillarMetrics(params: Params, results: Results): number[] {
  const norm = (v: number, full: number) => Math.max(0.16, Math.min(1, v / full));
  return [
    norm(results.spesaCSR, 200000),
    norm(params.costoVoucherHotel + params.costoVoucherAperitivo, 150),
    norm(results.fatturatoKm0, 300000),
    norm(results.quotaHotel, 180000),
    norm(results.biglietti, 4500),
  ];
}

