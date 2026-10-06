import { useEffect, useState } from "react";
import { Orbit, Sparkles, X, ArrowRight, RefreshCw } from "lucide-react";
import { useHandoff, setHandoff } from "../../lib/store";

/**
 * Handoff "GIRA ORA" → Onboarding (SKILL §2).
 * Si attiva solo all'arresto della decelerazione della giostra:
 * l'invito immersivo nasce dal punto focale della carta estratta.
 */
export default function HandoffGate() {
  const handoff = useHandoff();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!handoff) {
      setOpen(false);
      return;
    }
    setOpen(true);
    const t = window.setTimeout(() => close(), 24000);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handoff]);

  if (!handoff || !open) return null;

  function close() {
    setOpen(false);
    setHandoff(null);
  }

  function enter() {
    // l'handoff resta in memoria: la pagina di onboarding lo consumerà
    // per far partire la transizione volumetrica dal colore della carta.
    setOpen(false);
    window.location.hash = "#onboarding";
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[70] flex justify-center px-4 pb-6 sm:pb-8"
      role="dialog"
      aria-modal="false"
      aria-label="Invito all'onboarding 3D"
    >
      <div
        className="handoff glass-deep relative w-full max-w-[560px] overflow-hidden rounded-3xl p-6 sm:p-7"
        style={
          {
            "--accent": handoff.accent,
            animation: "handoffIn 0.7s cubic-bezier(0.16,1,0.3,1)",
          } as React.CSSProperties
        }
      >
        <div className="handoff-glow" aria-hidden />
        <button
          onClick={close}
          className="absolute right-3 top-3 grid size-8 place-items-center rounded-full border border-white/10 text-sand transition-colors hover:border-brass/50 hover:text-brass"
          aria-label="Chiudi invito"
        >
          <X className="size-4" strokeWidth={2} />
        </button>

        <span
          className="font-mono text-[10px] uppercase tracking-[0.24em]"
          style={{ color: handoff.accent }}
        >
          <Sparkles className="mr-1.5 inline size-3" strokeWidth={2} style={{ verticalAlign: "-2px" }} />
          Giostra 3D · carta estratta
        </span>
        <h3 className="font-display mt-3 text-2xl font-light leading-tight text-bone sm:text-[28px]">
          {handoff.title}
        </h3>
        <p className="mt-2.5 text-[13px] leading-relaxed text-sand">
          La ruota si è stabilizzata su questa leva. Entra nello spazio di onboarding 3D: scegli il
          tuo profilo tra i 5 attori dell'ecosistema, calcola il tuo vantaggio sui parametri live del
          simulatore e iscriviti al circuito.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            onClick={enter}
            className="group inline-flex items-center gap-2.5 rounded-full bg-brass px-6 py-3 text-sm font-semibold text-ink shadow-[0_8px_40px_-8px_rgba(226,166,61,0.55)] transition-all hover:bg-brass2"
          >
            <Orbit className="size-4 transition-transform duration-500 group-hover:rotate-180" />
            Entra nell'onboarding 3D
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </button>
          <button
            onClick={close}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-[13px] text-bone transition-all hover:border-brass/50 hover:bg-brass/5"
          >
            <RefreshCw className="size-3.5" />
            Gira di nuovo
          </button>
        </div>
      </div>
    </div>
  );
}
