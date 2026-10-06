import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Coffee,
  Orbit,
  Gauge,
  X,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BadgeCheck,
  Sparkles,
  MousePointer2,
  Hand,
  MoveVertical,
  CircleDot,
  Layers,
  Boxes,
  Calculator,
  FileSignature,
  PartyPopper,
  ExternalLink,
} from "lucide-react";
import { useHandoff, setHandoff, useSimResults } from "../../lib/store";
import { fmtInt } from "../../lib/model";
import { PROFILES } from "../data/profiles";
import type { TargetLine } from "../engine/textTargets";
import type { OnboardingEngine } from "../engine/OnboardingEngine";
import StageCanvas, { pillarMetrics, type Phase } from "./StageCanvas";
import MicroCalc from "./MicroCalc";
import FaqList from "./FaqList";
import EnrollForm from "./EnrollForm";
import "../onboarding.css";

/* Testo verso cui coalescono le particelle GPU (SKILL §3.2) */
const COALESCE: Record<string, TargetLine[]> = {
  imprese: [
    { text: "IMPRESE & HR", size: 92, weight: "700", dy: -54 },
    { text: "WELFARE DEDUCIBILE", size: 36, weight: "500", dy: 62, letterSpacing: 7 },
  ],
  addetti: [
    { text: "ADDETTI", size: 96, weight: "700", dy: -54 },
    { text: "BENEFIT A COSTO ZERO", size: 34, weight: "500", dy: 62, letterSpacing: 6 },
  ],
  produttori: [
    { text: "FILIERA KM 0", size: 88, weight: "700", dy: -54 },
    { text: "PREZZO PIENO GARANTITO", size: 33, weight: "500", dy: 62, letterSpacing: 5 },
  ],
  accoglienza: [
    { text: "RICETTIVITÀ", size: 92, weight: "700", dy: -54 },
    { text: "ZERO COMMISSIONI OTA", size: 34, weight: "500", dy: 62, letterSpacing: 5 },
  ],
  cultura: [
    { text: "CULTURA", size: 96, weight: "700", dy: -54 },
    { text: "MATCHING GRANT", size: 36, weight: "500", dy: 62, letterSpacing: 7 },
  ],
};

const PILLARS_INFO = [
  {
    icon: CircleDot,
    t: "Profilatore spaziale",
    d: "Cinque pilastri di vetro, uno per attore dell'ecosistema. L'altezza di ogni pilastro è la metrica live del simulatore.",
  },
  {
    icon: Boxes,
    t: "Modello 3D attivo",
    d: "Il nucleo morphing in PBR cambia forma e colore con il profilo: le particelle GPU coalescono in testo e grafica.",
  },
  {
    icon: Calculator,
    t: "Calcolatore & accreditamento",
    d: "Micro-simulatori reattivi sui parametri del modello, requisiti di conformità, FAQ e modulo di candidatura.",
  },
];

interface Props {
  onExit: (hash: string) => void;
}

export default function OnboardingPage({ onExit }: Props) {
  const { params, results, scenario } = useSimResults();
  const engineRef = useRef<OnboardingEngine | null>(null);
  const [engine, setEngine] = useState<OnboardingEngine | null>(null);
  const [phase, setPhase] = useState<Phase>("picker");
  const [selected, setSelected] = useState<number | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [greeting, setGreeting] = useState<string | null>(null);
  const handoff = useHandoff();

  const metrics = useMemo(() => pillarMetrics(params, results), [params, results]);
  const profile = selected !== null ? PROFILES[selected] : null;
  const inFocus = phase !== "picker" && profile !== null;

  /* ---- handoff "GIRA ORA": il vapore parte dalla carta estratta ---- */
  useEffect(() => {
    if (!handoff) return;
    setGreeting(`Leva estratta dalla giostra: «${handoff.title}»`);
    const t = window.setTimeout(() => {
      engineRef.current?.triggerSurge(1);
    }, 120);
    const t2 = window.setTimeout(() => setGreeting(null), 7000);
    setHandoff(null);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(t2);
    };
  }, [handoff]);

  /* ---- sincronizzazione profilo ↔ scena 3D ---- */
  useEffect(() => {
    const e = engineRef.current;
    if (!e) return;
    if (inFocus && profile) {
      e.setProfile(profile.index, { lines: COALESCE[profile.id], accent: profile.accent });
    } else {
      e.setProfile(null);
    }
  }, [engine, inFocus, profile]);

  /* ---- boost celebrativo all'iscrizione ---- */
  useEffect(() => {
    if (phase === "done" && profile) engineRef.current?.celebrate(profile.accent);
  }, [phase, profile]);

  /* ---- scroll lock del body ---- */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  /* ---- tastiera ---- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const onCanvas = (e.target as HTMLElement | null)?.tagName === "CANVAS";
      if (e.key === "Escape" && inFocus) {
        setPhase("picker");
        setSelected(null);
      }
      if (onCanvas) return; // le frecce sulla canvas orbitano la telecamera
      if (inFocus && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
        const dir = e.key === "ArrowRight" ? 1 : -1;
        const next = (selected! + dir + PROFILES.length) % PROFILES.length;
        setSelected(next);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inFocus, selected]);

  const selectProfile = useCallback(
    (i: number) => {
      setSelected(i);
      setPhase("focus");
      setCode(null);
    },
    []
  );

  const backToPicker = useCallback(() => {
    setPhase("picker");
    setSelected(null);
    setCode(null);
  }, []);

  return (
    <div className="ob-root">
      <StageCanvas
        phase={phase}
        selected={selected}
        onSelect={selectProfile}
        onEngine={setEngine}
        engineRef={engineRef}
        metrics={metrics}
        params={params}
        results={results}
      />

      {/* ------------------------------ top bar ------------------------------ */}
      <header className="ob-topbar glass-deep">
        <div className="ob-topbar-left">
          <span className="ob-topbar-logo">
            <Coffee className="size-4.5" strokeWidth={1.75} />
          </span>
          <div>
            <p className="ob-topbar-title">
              Onboarding 3D <span className="ob-topbar-sep">·</span> iscrizione partecipanti
            </p>
            <p className="ob-topbar-sub">
              Vending<span className="text-brass">×</span>Welfare — circuito territoriale
            </p>
          </div>
        </div>
        <div className="ob-topbar-right">
          <span className="ob-scenario" title="Parametri live dal simulatore">
            <Gauge className="size-3.5" strokeWidth={2} />
            scenario {scenario === "custom" ? "personalizzato" : scenario}
          </span>
          <button className="ob-btn is-ghost is-sm" onClick={() => onExit("#leve")}>
            <Orbit className="size-4" strokeWidth={1.75} />
            Giostra 3D
          </button>
          <button className="ob-btn is-ghost is-sm" onClick={() => onExit("#simulatore")}>
            <Gauge className="size-4" strokeWidth={1.75} />
            Simulatore
          </button>
          <button
            className="ob-btn is-icon"
            onClick={() => onExit("#visione")}
            aria-label="Esci dall'onboarding"
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        </div>
      </header>

      {/* ------------------------------ greeting ------------------------------ */}
      {greeting && (
        <div className="ob-greeting glass-deep" role="status">
          <Sparkles className="size-4 text-brass" strokeWidth={2} />
          {greeting}
        </div>
      )}

      {/* ------------------------------ layout ------------------------------ */}
      <div className="ob-layout">
        {/* rail profili */}
        <aside className="ob-rail">
          <div className="ob-rail-head">
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-brass">
              Profilatore spaziale
            </span>
            <span className="ob-rail-count">
              {inFocus ? `${selected! + 1} / 5` : "5 attori"}
            </span>
          </div>
          <nav className="ob-rail-list" aria-label="Profili partecipante">
            {PROFILES.map((p) => {
              const active = selected === p.index;
              return (
                <button
                  key={p.id}
                  className={`ob-rail-item${active ? " is-active" : ""}`}
                  style={{ "--accent": p.accent } as React.CSSProperties}
                  onClick={() => selectProfile(p.index)}
                  aria-current={active}
                >
                  <span className="ob-rail-icon">
                    <p.icon className="size-4.5" strokeWidth={1.75} />
                  </span>
                  <span className="ob-rail-body">
                    <span className="ob-rail-name">{p.short}</span>
                    <span className="ob-rail-metric">{p.pillarMetric(params, results)}</span>
                  </span>
                  <ChevronRight className="ob-rail-chevron size-4" strokeWidth={2} />
                </button>
              );
            })}
          </nav>
          {inFocus && (
            <button className="ob-rail-back" onClick={backToPicker}>
              <ArrowLeft className="size-3.5" strokeWidth={2} />
              Torna al profilatore
            </button>
          )}
          <p className="ob-rail-hint">
            <MousePointer2 className="size-3" strokeWidth={2} /> clicca un pilastro
            <Hand className="size-3" strokeWidth={2} /> trascina per orbitare
            <MoveVertical className="size-3" strokeWidth={2} /> rotella per zoom
          </p>
        </aside>

        {/* pannello contestuale */}
        <main className="ob-main">
          {!inFocus && (
            <div className="ob-intro">
              <span className="ob-eyebrow">
                <Layers className="size-3.5" strokeWidth={2} />
                Spazio di accreditamento
              </span>
              <h1 className="ob-title">
                Entra nel circuito.
                <br />
                <em>Scegli il tuo profilo</em> nello spazio 3D.
              </h1>
              <p className="ob-lead">
                Non un modulo anagrafico: uno spazio tridimensionale reattivo in cui ogni attore
                dell'ecosistema — imprese, addetti, produttori, strutture, operatori culturali —
                misura il proprio posizionamento nel welfare territoriale. I dati sono quelli vivi
                del simulatore.
              </p>
              <div className="ob-pillars">
                {PILLARS_INFO.map((p) => (
                  <div key={p.t} className="ob-pillar-card glass">
                    <span className="ob-pillar-card-icon">
                      <p.icon className="size-4" strokeWidth={1.75} />
                    </span>
                    <h3>{p.t}</h3>
                    <p>{p.d}</p>
                  </div>
                ))}
              </div>
              <div className="ob-live-strip glass">
                <span className="ob-live-strip-item">
                  <b>{fmtInt(results.partecipantiTotali)}</b> partecipanti ecosistema
                </span>
                <span className="ob-live-strip-item">
                  <b>{fmtInt(results.presenzeTerritorio)}</b> presenze sul territorio
                </span>
                <span className="ob-live-strip-item">
                  K-Factor <b>{results.kFactor.toFixed(3).replace(".", ",")}</b>
                </span>
              </div>
            </div>
          )}

          {inFocus && profile && (
            <div className="ob-focus" key={profile.id}>
              <div
                className="ob-hero glass"
                style={{ "--accent": profile.accent } as React.CSSProperties}
              >
                <div className="ob-hero-top">
                  <span className="ob-hero-icon">
                    <profile.icon className="size-6" strokeWidth={1.75} />
                  </span>
                  <div className="ob-hero-heads">
                    <span className="ob-hero-role">{profile.role}</span>
                    <h2 className="ob-hero-name">{profile.name}</h2>
                  </div>
                  <div className="ob-hero-nav">
                    <button
                      className="ob-btn is-icon"
                      onClick={() =>
                        setSelected((selected! - 1 + PROFILES.length) % PROFILES.length)
                      }
                      aria-label="Profilo precedente"
                    >
                      <ChevronLeft className="size-4" strokeWidth={2} />
                    </button>
                    <button
                      className="ob-btn is-icon"
                      onClick={() => setSelected((selected! + 1) % PROFILES.length)}
                      aria-label="Profilo successivo"
                    >
                      <ChevronRight className="size-4" strokeWidth={2} />
                    </button>
                  </div>
                </div>
                <p className="ob-hero-ambito">{profile.ambito}</p>
                <div className="ob-hero-actions">
                  <button
                    className="ob-btn is-primary"
                    onClick={() => setPhase("enroll")}
                  >
                    <FileSignature className="size-4" strokeWidth={2} />
                    Iscriviti come {profile.short}
                  </button>
                  <a className="ob-btn is-ghost" href="#simulatore">
                    <ExternalLink className="size-4" strokeWidth={2} />
                    Apri il simulatore
                  </a>
                </div>
              </div>

              <div className="ob-focus-grid">
                <div className="ob-focus-col">
                  <MicroCalc profile={profile} params={params} results={results} scenario={scenario} />
                  <FaqList profile={profile} />
                </div>
                <div className="ob-focus-col">
                  <div
                    className="ob-panel"
                    style={{ "--accent": profile.accent } as React.CSSProperties}
                  >
                    <div className="ob-panel-head">
                      <span className="ob-panel-icon">
                        <BadgeCheck className="size-4" strokeWidth={1.75} />
                      </span>
                      <div>
                        <h4 className="ob-panel-title">Requisiti di conformità</h4>
                        <p className="ob-panel-sub">Cosa serve per entrare nel circuito</p>
                      </div>
                    </div>
                    <ul className="ob-req">
                      {profile.requisiti.map((r) => (
                        <li key={r.text}>
                          <r.icon className="size-4" strokeWidth={1.75} />
                          <span>{r.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div
                    className="ob-panel"
                    style={{ "--accent": profile.accent } as React.CSSProperties}
                  >
                    <div className="ob-panel-head">
                      <span className="ob-panel-icon">
                        <Sparkles className="size-4" strokeWidth={1.75} />
                      </span>
                      <div>
                        <h4 className="ob-panel-title">Vantaggi del profilo</h4>
                        <p className="ob-panel-sub">Focus tecnico del posizionamento</p>
                      </div>
                    </div>
                    <ul className="ob-vantaggi">
                      {profile.vantaggi.map((v) => (
                        <li key={v}>{v}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {phase === "enroll" && profile && (
            <EnrollForm
              profile={profile}
              onBack={() => setPhase("focus")}
              onDone={(c) => {
                setCode(c);
                setPhase("done");
              }}
            />
          )}

          {phase === "done" && profile && (
            <div
              className="ob-panel ob-done"
              style={{ "--accent": profile.accent } as React.CSSProperties}
            >
              <div className="ob-done-burst" aria-hidden>
                <PartyPopper className="size-10" strokeWidth={1.5} />
              </div>
              <span className="ob-eyebrow is-center">
                <BadgeCheck className="size-3.5" strokeWidth={2} />
                Accreditamento completato
              </span>
              <h2 className="ob-done-title">Benvenuto nel circuito</h2>
              <p className="ob-done-text">
                La candidatura per <b>{profile.name}</b> è stata registrata. Un referente del
                circuito di welfare territoriale ti contatta per l'attivazione. Nel frattempo le
                particelle dello scenario 3D hanno già formato il tuo benvenuto.
              </p>
              <div className="ob-cert">
                <span className="ob-cert-label">Certificato welfare · codice</span>
                <span className="ob-cert-code">{code}</span>
                <span className="ob-cert-meta">
                  {profile.short} · {new Date().toLocaleDateString("it-IT")}
                </span>
              </div>
              <div className="ob-done-actions">
                <button className="ob-btn is-primary" onClick={backToPicker}>
                  <Orbit className="size-4" strokeWidth={2} />
                  Iscrivi un altro profilo
                </button>
                <button className="ob-btn is-ghost" onClick={() => onExit("#simulatore")}>
                  <Gauge className="size-4" strokeWidth={2} />
                  Apri il simulatore
                </button>
                <button className="ob-btn is-ghost" onClick={() => onExit("#leve")}>
                  <Orbit className="size-4" strokeWidth={2} />
                  Torna alla giostra
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
