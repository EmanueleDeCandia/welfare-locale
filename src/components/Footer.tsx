import { Coffee, ArrowUp, FileText, Layers, BarChart3, Orbit, UserPlus } from "lucide-react";

const COLS = [
  {
    title: "Percorso",
    links: [
      { label: "Visione di progetto", href: "#visione", icon: FileText },
      { label: "Ecosistema a 5 attori", href: "#ecosistema", icon: Layers },
      { label: "Simulatore interattivo", href: "#simulatore", icon: BarChart3 },
      { label: "Le 8 leve in 3D", href: "#leve", icon: Orbit },
      { label: "Onboarding 3D partecipanti", href: "#onboarding", icon: UserPlus },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-white/[0.07] bg-coal/40">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_0.8fr]">
          <div>
            <a href="#visione" className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl border border-brass/30 bg-brass/10 text-brass">
                <Coffee className="size-4.5" strokeWidth={1.75} />
              </span>
              <span className="font-display text-lg tracking-tight text-bone">
                Vending<span className="text-brass">×</span>Welfare
              </span>
            </a>
            <p className="mt-5 max-w-md text-[13px] leading-relaxed text-sand">
              Simulatore Welfare: metriche di diffusione e impatto territoriale integrato.
              Modellazione delle sinergie tra matching grant culturale, welfare aziendale,
              eventi, attività ricettive e filiera corta a Km 0.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 font-mono text-[9.5px] uppercase tracking-[0.18em] text-sand/70">
              <span className="rounded-full border border-white/10 px-3 py-1.5">PDR 2.0-Enterprise</span>
              <span className="rounded-full border border-white/10 px-3 py-1.5">React 18 + TypeScript</span>
              <span className="rounded-full border border-white/10 px-3 py-1.5">Recharts</span>
              <span className="rounded-full border border-white/10 px-3 py-1.5">Tailwind</span>
            </div>
          </div>

          {COLS.map((c) => (
            <div key={c.title}>
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-brass">
                {c.title}
              </p>
              <ul className="mt-5 space-y-3">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      className="group flex items-center gap-2.5 text-[13px] text-sand transition-colors hover:text-bone"
                    >
                      <l.icon className="size-3.5 text-brass/60 transition-colors group-hover:text-brass" />
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="flex flex-col items-start gap-4 md:items-end">
            <a
              href="#visione"
              className="glass group inline-flex items-center gap-2 rounded-full px-5 py-3 text-[12.5px] text-bone transition-all hover:border-brass/50"
            >
              Torna all'inizio
              <ArrowUp className="size-4 text-brass transition-transform group-hover:-translate-y-0.5" />
            </a>
            <p className="max-w-[220px] text-left text-[11px] leading-relaxed text-sand/60 md:text-right">
              Target: Direzioni Generali vending, HR & CSR Manager, Fondazioni territoriali,
              startup culturali, PA locali.
            </p>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] pt-6 sm:flex-row">
          <p className="font-mono text-[10.5px] text-sand/60">
            © 2026 — Simulatore Welfare Territoriale · Vending × CSR × Km 0 × Cultura
          </p>
          <p className="font-mono text-[10.5px] text-sand/60">
            Investimento operatore: €0 · Churn −80% · Indotto ×2,5
          </p>
        </div>
      </div>
    </footer>
  );
}
