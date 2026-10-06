import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  HeartHandshake,
  ShieldCheck,
  Sprout,
  Ticket,
  KeyRound,
  Network,
  Megaphone,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Undo2,
  Dices,
  MousePointer2,
  MoveVertical,
  Hand,
  Crosshair,
} from "lucide-react";
import { useViewportWidth } from "../lib/hooks";
import { Reveal, SectionTitle } from "../lib/ui";

const STEP = 45;
const REST_TILT = -7;

/* ------------------------------ easing ------------------------------ */
function makeBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = (t: number) => ((ax * t + bx) * t + cx) * t;
  const Y = (t: number) => ((ay * t + by) * t + cy) * t;
  return (x: number) => {
    let lo = 0, hi = 1, t = x;
    for (let i = 0; i < 24; i++) {
      t = (lo + hi) / 2;
      if (X(t) < x) lo = t;
      else hi = t;
    }
    return Y(t);
  };
}
const easeDecel = makeBezier(0.16, 1, 0.3, 1);
const mod = (n: number, m: number) => ((n % m) + m) % m;

/* ------------------------------ cards data ------------------------------ */
const CARDS = [
  {
    verb: "Coinvolgi",
    title: "Welfare CSR integrato",
    icon: HeartHandshake,
    accent: "#e2a63d",
    desc: "Voucher hotel (€50) ed esperienze food (€25) attivati con budget CSR deducibili già presenti in azienda.",
    value: "100%",
    valueLabel: "voucher finanziati dalle imprese",
    sfida: "Il welfare tradizionale è percepito come costo invisibile: non genera clima né retention misurabile.",
    leva: "Voucher esperienziali erogati ai collaboratori: hotel, food ed evento in un'unica esperienza a costo zero.",
    formula: "(1.586 aderenti) × €50 + €25 → €98.700/anno · budget deducibile",
  },
  {
    verb: "Proteggi",
    title: "Retention blindata",
    icon: ShieldCheck,
    accent: "#7fce9b",
    desc: "Ristoro, benefit dipendenti e filiera locale fusi in un unico servizio impossibile da scorporare.",
    value: "−80%",
    valueLabel: "churn rate: dal 10% al 2% annuo",
    sfida: "Churn fisiologico del 10%: a fine ammortamento delle macchine il cliente rilancia l'appalto a ribasso.",
    leva: "Il contratto diventa ecosistema: cambiare fornitore significherebbe revocare voucher e panieri ai dipendenti.",
    formula: "(10% − 2%) × 150 imprese → 12 salvate × €1.000 CLV = €12.000",
  },
  {
    verb: "Attiva",
    title: "Filiera corta Km 0",
    icon: Sprout,
    accent: "#a3e635",
    desc: "Panieri di prodotti tipici ordinati dai dipendenti e consegnati in ufficio sui giri vending esistenti.",
    value: "−51,3 t",
    valueLabel: "CO₂ logistica evitata ogni anno*",
    sfida: "I produttori locali non raggiungono i luoghi di lavoro: micro-lotti con trasporto dedicato antieconomico.",
    leva: "Il furgone che rifornisce e sanifica i distributori recapita anche i panieri: backbone logico condiviso.",
    formula: "900 acquirenti × 6 ordini × 50 km × 0,19 kg → 270.000 km evitati",
  },
  {
    verb: "Valorizza",
    title: "Cultura in matching grant",
    icon: Ticket,
    accent: "#c4b5fd",
    desc: "Ogni voucher sblocca un biglietto omaggio per spettacoli del territorio: la cultura entra nel welfare.",
    value: "2.250",
    valueLabel: "biglietti omaggio finanziati dalla startup",
    sfida: "Teatri e artisti locali affrontano platee scarse in bassa stagione e costi di audience proibitivi.",
    leva: "Platee qualificate dai dipendenti delle imprese partner, ripagate dalle commissioni sui voucher.",
    formula: "2.250 × €25 = €56.250 grant < €89.000 commissioni lorde",
  },
  {
    verb: "Sblocca",
    title: "Pipeline referral B2B",
    icon: KeyRound,
    accent: "#7dd3fc",
    desc: "Ogni partecipante riceve un certificato welfare: mostrandolo ad amici, apre le porte di nuove aziende.",
    value: "+28",
    valueLabel: "nuovi contratti vending acquisiti / anno",
    sfida: "Raggiungere le Direzioni HR di aziende terze richiede mesi di cold calling, fiere e agenzie.",
    leva: "I dipendenti-ambassador segnalano l'iniziativa alle proprie HR: prospect caldi e chiusura rapida.",
    formula: "Growth 461 × 30% × 20% → 28 contratti × €1.000 = €28.000",
  },
  {
    verb: "Orchestra",
    title: "Hub fiduciario",
    icon: Network,
    accent: "#f0c471",
    desc: "L'operatore diventa la regia del sistema: mette rete e fiducia, gli altri attori mettono il capitale.",
    value: "€0",
    valueLabel: "investimento finanziario diretto",
    sfida: "Da commodity vendor sostituibile con una semplice lettera di disdetta a fine ammortamento.",
    leva: "Orchestratore insostituibile di 5 attori: imprese, startup, dipendenti, filiera e cultura.",
    formula: "Asset = rete commerciale + giri pianificati → capitale incrementale nullo",
  },
  {
    verb: "Fidelizza",
    title: "Ambassador virali",
    icon: Megaphone,
    accent: "#fb7185",
    desc: "Passaparola programmato: ogni aderente invita in media 5 contatti con conversione del 25%.",
    value: "0,31",
    valueLabel: "K-factor virale, convergente (< 1)",
    sfida: "Il passaparola spontaneo è casuale, non misurabile e non pilotabile dal management.",
    leva: "Cicli di referral con saturazione TAM: crescita finita, predicibile e sempre sotto budget.",
    formula: "K = 0,25 × 5 × 0,25 = 0,3125 < 1 → serie geometrica finita",
  },
  {
    verb: "Scala",
    title: "TAM esteso ×3",
    icon: TrendingUp,
    accent: "#2dd4bf",
    desc: "Il bacino si allarga oltre i dipendenti diretti: amici, famiglie e comunità nei cicli successivi.",
    value: "×3",
    valueLabel: "fattore di espansione del mercato",
    sfida: "Il bacino naturale del canale si esaurisce nei dipendenti delle imprese già servite.",
    leva: "Fattore di espansione ×3 con capacità residua ricalcolata a ogni ciclo di referral.",
    formula: "TAM = 1.125 seed × 3 → 3.375 · 47% assorbito con 3 cicli",
  },
];

/* ------------------------------ cup svg ------------------------------ */
function CupSvg({ accent, className }: { accent: string; className?: string }) {
  return (
    <svg viewBox="0 0 120 84" fill="none" className={className} aria-hidden>
      <g stroke={accent} strokeWidth={2.4} strokeLinecap="round" opacity={0.9}>
        <path className="steam-line" d="M48 27c-3-4 3-6 0-10" />
        <path className="steam-line s2" d="M62 25c-3-4 3-6 0-10" />
        <path className="steam-line s3" d="M76 27c-3-4 3-6 0-10" />
      </g>
      <path
        d="M34 38h58l-4.5 24a8 8 0 0 1-7.8 6.6H46.3a8 8 0 0 1-7.8-6.6L34 38Z"
        stroke="#efe6d8"
        strokeWidth={2.6}
        strokeLinejoin="round"
        fill="rgba(239,230,216,0.05)"
      />
      <path d="M40 45.5h46" stroke={accent} strokeWidth={2.6} strokeLinecap="round" opacity={0.8} />
      <path
        d="M92.5 42.5c8.5 1 12.5 4.8 11.8 10.3-.8 6-6.6 8.2-14.4 7.4"
        stroke="#efe6d8"
        strokeWidth={2.6}
        strokeLinecap="round"
      />
      <path d="M24 74.5h78" stroke={accent} strokeWidth={2.6} strokeLinecap="round" opacity={0.65} />
    </svg>
  );
}

/* ------------------------------ main ------------------------------ */
export default function Orbital3D() {
  const vw = useViewportWidth();
  const size =
    vw < 480
      ? { w: 196, h: 292, r: 262, stageH: 400 }
      : vw < 768
        ? { w: 216, h: 312, r: 315, stageH: 440 }
        : vw < 1280
          ? { w: 246, h: 350, r: 400, stageH: 540 }
          : { w: 272, h: 380, r: 470, stageH: 580 };

  const ringRef = useRef<HTMLDivElement | null>(null);
  const posRefs = useRef<(HTMLDivElement | null)[]>([]);

  const rot = useRef(0);
  const vel = useRef(0);
  const tilt = useRef(REST_TILT);
  const tiltTarget = useRef(REST_TILT);
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const roulette = useRef<null | { from: number; to: number; start: number; dur: number }>(null);
  const activeRef = useRef(0);

  const [activeIndex, setActiveIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [spinning, setSpinning] = useState(false);

  /* render loop */
  useEffect(() => {
    let raf = 0;
    const step = (now: number) => {
      if (roulette.current) {
        const r = roulette.current;
        const t = Math.min((now - r.start) / r.dur, 1);
        rot.current = r.from + (r.to - r.from) * easeDecel(t);
        vel.current = 0;
        if (t >= 1) {
          roulette.current = null;
          setSpinning(false);
        }
      } else if (!dragging.current) {
        rot.current += vel.current;
        vel.current *= 0.94;
        if (Math.abs(vel.current) < 0.03) {
          vel.current = 0;
          const nearest = Math.round(rot.current / STEP) * STEP;
          rot.current += (nearest - rot.current) * 0.07;
        }
        tiltTarget.current += (REST_TILT - tiltTarget.current) * 0.05;
      }
      tilt.current += (tiltTarget.current - tilt.current) * 0.1;

      if (ringRef.current) {
        ringRef.current.style.transform = `rotateX(${tilt.current.toFixed(2)}deg) rotateY(${rot.current.toFixed(2)}deg)`;
      }
      for (let i = 0; i < CARDS.length; i++) {
        const el = posRefs.current[i];
        if (!el) continue;
        const c = Math.cos(((rot.current + i * STEP) * Math.PI) / 180);
        el.style.setProperty("--dim", (Math.max(0, (1 - c) / 2) * 0.78).toFixed(3));
      }
      const idx = mod(Math.round(-rot.current / STEP), CARDS.length);
      if (idx !== activeRef.current) {
        activeRef.current = idx;
        setActiveIndex(idx);
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => setFlipped(false), [activeIndex]);

  const goTo = (idx: number, extraSpins: number, dur: number) => {
    const current = rot.current;
    const target = -idx * STEP;
    let delta = mod(target - current, 360);
    if (delta > 180 && extraSpins > 0) delta -= 360; // shortest path with spins
    const to = current + delta + (delta >= 0 ? 1 : -1) * 360 * extraSpins;
    roulette.current = { from: current, to, start: performance.now(), dur };
    setSpinning(true);
    setFlipped(false);
  };

  const onDown = (e: React.PointerEvent) => {
    if (roulette.current) return;
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
    vel.current = 0;
    setFlipped(false);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    rot.current += dx * 0.28;
    vel.current = vel.current * 0.65 + dx * 0.28 * 0.35;
    tiltTarget.current = Math.max(-30, Math.min(30, tiltTarget.current - dy * 0.35));
  };
  const onUp = () => {
    dragging.current = false;
  };

  const active = CARDS[activeIndex];

  return (
    <section id="leve" className="relative scroll-mt-24 overflow-hidden py-28 sm:py-36">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute top-[8%] left-[-10%] h-[540px] w-[540px] rounded-full bg-grape/[0.08] blur-[150px]" />
        <div className="absolute bottom-[5%] right-[-8%] h-[540px] w-[540px] rounded-full bg-brass/[0.09] blur-[150px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <SectionTitle
          eyebrow="Presentazione AD & HR · Liquid glass 3D"
          title={
            <>
              Otto leve in orbita.{" "}
              <em className="font-normal italic text-brass2">Una sola regia.</em>
            </>
          }
          sub="Schede in vetro liquido per la trattativa con Direzioni Generali e Direttori HR: trascina l'anello, estrai una leva con la roulette, apri il drawer per la formula economica."
          className="mx-auto max-w-3xl text-center [&_.rule]:hidden [&>div]:justify-center"
        />

        <Reveal delay={140}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-sand">
            <span className="flex items-center gap-2 text-[12px]">
              <MousePointer2 className="size-3.5 text-brass" /> Trascina per ruotare
            </span>
            <span className="flex items-center gap-2 text-[12px]">
              <MoveVertical className="size-3.5 text-brass" /> Inclina fino a 30°
            </span>
            <span className="flex items-center gap-2 text-[12px]">
              <Hand className="size-3.5 text-brass" /> Gira la carta attiva
            </span>
          </div>
        </Reveal>

        {/* ------------------------------ stage ------------------------------ */}
        <Reveal delay={200}>
          <div
            className="persp-1250 relative mt-6 select-none"
            style={{ height: size.stageH, touchAction: "pan-y" }}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            role="application"
            aria-label="Carosello tridimensionale delle otto leve del modello"
          >
            {/* back to simulator */}
            <a
              href="#simulatore"
              className="glass absolute left-0 top-0 z-30 inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[12px] text-bone transition-all hover:border-brass/50 hover:bg-brass/10"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <ChevronLeft className="size-3.5 text-brass" /> Simulatore
            </a>

            {/* roulette trigger */}
            <div className="absolute right-0 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-2.5">
              <button
                onClick={() => {
                  let idx = activeIndex;
                  while (idx === activeIndex) idx = Math.floor(Math.random() * CARDS.length);
                  goTo(idx, 2, 3600);
                }}
                disabled={spinning}
                className="glass-deep group grid size-15 place-items-center rounded-full border-brass/35 transition-all hover:border-brass/70 hover:shadow-[0_0_40px_-8px_rgba(226,166,61,0.5)] disabled:opacity-60 sm:size-17"
                onPointerDown={(e) => e.stopPropagation()}
                aria-label="Gira ora: estrazione casuale di una leva"
              >
                <Dices
                  className={`size-5.5 text-brass transition-transform duration-500 group-hover:rotate-180 ${
                    spinning ? "animate-spin" : ""
                  }`}
                />
              </button>
              <span className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-brass">
                Gira ora
              </span>
            </div>

            {/* orbit guide */}
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/[0.07]"
              style={{ width: size.r * 2 + 40, height: size.r * 0.62 }}
              aria-hidden
            />

            {/* ring */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div ref={ringRef} className="preserve-3d relative" style={{ width: size.w, height: size.h, willChange: "transform" }}>
                {CARDS.map((c, i) => {
                  const isActive = i === activeIndex;
                  return (
                    <div
                      key={c.verb}
                      ref={(el) => {
                        posRefs.current[i] = el;
                      }}
                      className="preserve-3d absolute"
                      style={
                        {
                          width: size.w,
                          height: size.h,
                          transform: `rotateY(${i * STEP}deg) translateZ(${size.r}px)`,
                        } as CSSProperties
                      }
                    >
                      {/* flipper */}
                      <div
                        className="preserve-3d relative h-full w-full transition-transform duration-700 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]"
                        style={{ transform: flipped && isActive ? "rotateY(180deg)" : "rotateY(0deg)" }}
                      >
                        {/* ------ FRONT ------ */}
                        <div className="backface-hidden absolute inset-0">
                          <div
                            className="glass relative flex h-full flex-col overflow-hidden rounded-[1.6rem] p-5"
                            style={{
                              background: `radial-gradient(130% 80% at 20% 0%, ${c.accent}24 0%, rgba(20,17,14,0.72) 58%)`,
                              borderColor: isActive ? `${c.accent}55` : "rgba(239,230,216,0.12)",
                            }}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="font-mono text-[9.5px] uppercase tracking-[0.24em] text-sand">
                                  Leva {String(i + 1).padStart(2, "0")}
                                </span>
                                <p
                                  className="mt-1 font-mono text-[13px] font-semibold uppercase tracking-[0.18em]"
                                  style={{ color: c.accent }}
                                >
                                  {c.verb}
                                </p>
                              </div>
                              <span
                                className="grid size-10 place-items-center rounded-xl border"
                                style={{ color: c.accent, borderColor: `${c.accent}40`, background: `${c.accent}14` }}
                              >
                                <c.icon className="size-4.5" strokeWidth={1.75} />
                              </span>
                            </div>

                            <CupSvg accent={c.accent} className="mx-auto my-3 h-[64px] w-auto sm:h-[72px]" />

                            <h3 className="font-display text-[19px] leading-tight font-normal text-bone sm:text-[22px]">
                              {c.title}
                            </h3>
                            <p className="mt-2 hidden text-[11.5px] leading-relaxed text-sand sm:line-clamp-3">
                              {c.desc}
                            </p>

                            <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                              <span
                                className="rounded-full border px-3 py-1.5 font-mono text-[13px] font-semibold"
                                style={{ color: c.accent, borderColor: `${c.accent}45`, background: `${c.accent}10` }}
                              >
                                {c.value}
                              </span>
                              <button
                                onClick={() => isActive && setFlipped(true)}
                                className={`grid size-9 place-items-center rounded-full border transition-all ${
                                  isActive
                                    ? "border-white/20 text-bone hover:border-brass hover:text-brass"
                                    : "border-white/10 text-sand/40"
                                }`}
                                onPointerDown={(e) => e.stopPropagation()}
                                aria-label={`Gira la carta ${c.verb}`}
                              >
                                <RotateCw className="size-4" />
                              </button>
                            </div>

                            {/* dimmer */}
                            <div
                              className="pointer-events-none absolute inset-0 bg-ink transition-none"
                              style={{ opacity: "var(--dim, 0)" }}
                            />
                          </div>
                        </div>

                        {/* ------ BACK ------ */}
                        <div className="backface-hidden absolute inset-0 [transform:rotateY(180deg)]">
                          <div
                            className="glass-deep relative flex h-full flex-col overflow-hidden rounded-[1.6rem] p-5"
                            style={{
                              background: `radial-gradient(130% 90% at 80% 0%, ${c.accent}1f 0%, rgba(12,10,8,0.92) 55%)`,
                              borderColor: `${c.accent}40`,
                            }}
                          >
                            <span className="font-mono text-[9.5px] uppercase tracking-[0.24em] text-sand">
                              {c.verb} · in numeri
                            </span>
                            <p
                              className="mt-3 font-mono text-[38px] leading-none font-semibold"
                              style={{ color: c.accent }}
                            >
                              {c.value}
                            </p>
                            <p className="mt-2 text-[11px] leading-snug text-sand">{c.valueLabel}</p>

                            <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3">
                              <span className="mb-1 block font-mono text-[8.5px] uppercase tracking-[0.22em] text-bone/50">
                                Formula · scenario realistico
                              </span>
                              <code className="font-mono text-[10px] leading-relaxed" style={{ color: c.accent }}>
                                {c.formula}
                              </code>
                            </div>

                            <p className="mt-auto pt-3 text-[10.5px] leading-relaxed text-sand">
                              Scenario live nel simulatore: parametri, KPI e grafici si aggiornano in
                              tempo reale.
                            </p>
                            <div className="mt-3 flex items-center justify-between gap-2">
                              <a
                                href="#simulatore"
                                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3.5 py-2 text-[10.5px] text-bone transition-colors hover:border-brass/60 hover:text-brass"
                                onPointerDown={(e) => e.stopPropagation()}
                              >
                                <Crosshair className="size-3" /> Verifica nel simulatore
                              </a>
                              <button
                                onClick={() => isActive && setFlipped(false)}
                                className={`grid size-9 place-items-center rounded-full border transition-all ${
                                  isActive
                                    ? "border-white/20 text-bone hover:border-brass hover:text-brass"
                                    : "border-white/10 text-sand/40"
                                }`}
                                onPointerDown={(e) => e.stopPropagation()}
                                aria-label="Torna al fronte della carta"
                              >
                                <Undo2 className="size-4" />
                              </button>
                            </div>

                            <div
                              className="pointer-events-none absolute inset-0 bg-ink"
                              style={{ opacity: "var(--dim, 0)" }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Reveal>

        {/* ------------------------------ drawer ------------------------------ */}
        <Reveal delay={260}>
          <div className="glass mt-4 rounded-3xl p-6 sm:p-7">
            <div className="flex flex-wrap items-center gap-4">
              <span
                className="rounded-full border px-3.5 py-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: active.accent, borderColor: `${active.accent}45`, background: `${active.accent}10` }}
              >
                Leva {String(activeIndex + 1).padStart(2, "0")} · {active.verb}
              </span>
              <h3 className="font-display text-2xl font-light text-bone">{active.title}</h3>
              <div className="ml-auto flex items-center gap-2">
                <span className="mr-1 font-mono text-[11px] text-sand">
                  {String(activeIndex + 1).padStart(2, "0")} / 08
                </span>
                <button
                  onClick={() => goTo(mod(activeIndex - 1, CARDS.length), 0, 750)}
                  disabled={spinning}
                  className="grid size-9 place-items-center rounded-full border border-white/15 text-bone transition-all hover:border-brass/60 hover:text-brass disabled:opacity-40"
                  aria-label="Leva precedente"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  onClick={() => goTo(mod(activeIndex + 1, CARDS.length), 0, 750)}
                  disabled={spinning}
                  className="grid size-9 place-items-center rounded-full border border-white/15 text-bone transition-all hover:border-brass/60 hover:text-brass disabled:opacity-40"
                  aria-label="Leva successiva"
                >
                  <ChevronRight className="size-4" />
                </button>
                <button
                  onClick={() => setFlipped((f) => !f)}
                  className="ml-1 inline-flex items-center gap-2 rounded-full bg-brass px-4 py-2 text-[12px] font-semibold text-ink transition-all hover:bg-brass2"
                >
                  <RotateCw className="size-3.5" />
                  {flipped ? "Vedi fronte" : "Gira la carta"}
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-3">
              <div>
                <span className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-bloom">
                  Sfida AS-IS
                </span>
                <p className="mt-2 text-[12.5px] leading-relaxed text-bone/75">{active.sfida}</p>
              </div>
              <div>
                <span className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-leafy">
                  Leva TO-BE
                </span>
                <p className="mt-2 text-[12.5px] leading-relaxed text-bone/75">{active.leva}</p>
              </div>
              <div>
                <span className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-brass">
                  Formula quantitativa
                </span>
                <div className="mt-2 rounded-xl border border-white/10 bg-black/30 p-3.5">
                  <code className="font-mono text-[11px] leading-relaxed" style={{ color: active.accent }}>
                    {active.formula}
                  </code>
                </div>
              </div>
            </div>

            {/* dots */}
            <div className="mt-7 flex items-center justify-center gap-2.5 border-t border-white/[0.06] pt-5">
              {CARDS.map((c, i) => (
                <button
                  key={c.verb}
                  onClick={() => goTo(i, 1, 1100)}
                  disabled={spinning}
                  className="group grid h-6 place-items-center"
                  aria-label={`Vai alla leva ${c.verb}`}
                >
                  <span
                    className={`block rounded-full transition-all duration-500 ${
                      i === activeIndex
                        ? "h-2 w-7"
                        : "size-2 bg-white/20 group-hover:bg-white/45"
                    }`}
                    style={i === activeIndex ? { background: c.accent } : undefined}
                  />
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        <p className="mt-6 text-center text-[11px] text-sand/70">
          * Valori sul retro delle carte calcolati sullo scenario realistico — passa al simulatore
          per ricalcolarli con i tuoi parametri.
        </p>
      </div>
    </section>
  );
}
