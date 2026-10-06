import {
  ArrowDown,
  ArrowUpRight,
  Leaf,
  ShieldCheck,
  Ticket,
  Sprout,
  TrendingUp,
  Users,
  Truck,
  Building2,
  Sparkles,
  Network,
} from "lucide-react";
import { Reveal } from "../lib/ui";

const TICKER = [
  { icon: ShieldCheck, text: "Churn −80% · dal 10% al 2%" },
  { icon: Leaf, text: "CO₂ logistica azzerata" },
  { icon: Ticket, text: "Biglietti omaggio in matching grant" },
  { icon: Sprout, text: "Filiera corta Km 0 in ufficio" },
  { icon: TrendingUp, text: "Indotto turistico ×2,5" },
  { icon: Users, text: "Referral virale HR-to-HR" },
  { icon: Truck, text: "Backbone su flotta esistente" },
  { icon: Building2, text: "Gateway fiduciario C-Level" },
];

const STATS = [
  { value: "−80%", label: "Churn rate fisiologico" },
  { value: "−51,3 t", label: "CO₂ trasporto annuo" },
  { value: "×2,5", label: "Moltiplicatore indotto" },
  { value: "€0", label: "Investimento operatore" },
];

export default function Hero() {
  return (
    <>
      <section id="visione" className="relative overflow-hidden pt-40 pb-20 sm:pt-44">
        {/* ambient background */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -top-40 right-[-10%] h-[640px] w-[640px] rounded-full bg-brass/[0.13] blur-[140px]" />
          <div className="absolute bottom-[-20%] left-[-12%] h-[520px] w-[520px] rounded-full bg-leafy/[0.07] blur-[150px]" />
          <div
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(239,230,216,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(239,230,216,0.045) 1px, transparent 1px)",
              backgroundSize: "72px 72px",
              maskImage:
                "radial-gradient(ellipse 90% 70% at 50% 30%, black 30%, transparent 75%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 90% 70% at 50% 30%, black 30%, transparent 75%)",
            }}
          />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr]">
          {/* copy */}
          <div>
            <Reveal>
              <div className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
                <Sparkles className="size-3.5 text-brass" />
                <span className="font-mono text-[10.5px] uppercase tracking-[0.24em] text-bone/80">
                  Operatore Vending × CSR × Cultura × Km 0
                </span>
              </div>
            </Reveal>

            <Reveal delay={90}>
              <h1 className="font-display mt-7 text-[44px] leading-[1.02] font-light tracking-tight text-bone sm:text-6xl lg:text-[68px]">
                La pausa caffè diventa un{" "}
                <em className="font-normal italic text-brass2">ecosistema</em>{" "}
                di welfare territoriale.
              </h1>
            </Reveal>

            <Reveal delay={180}>
              <p className="mt-7 max-w-xl text-[15.5px] leading-relaxed text-sand">
                Da fornitore di bevande in commodity a hub del benessere: voucher
                welfare finanziati dalle imprese, panieri Km 0 consegnati a
                emissioni zero con la flotta esistente e cultura in matching
                grant — con investimento diretto pari a{" "}
                <span className="font-semibold text-bone">zero euro</span>.
              </p>
            </Reveal>

            <Reveal delay={260}>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <a
                  href="#simulatore"
                  className="group inline-flex items-center gap-2.5 rounded-full bg-brass px-7 py-3.5 text-sm font-semibold text-ink shadow-[0_8px_40px_-8px_rgba(226,166,61,0.5)] transition-all hover:bg-brass2 hover:shadow-[0_12px_50px_-8px_rgba(226,166,61,0.65)]"
                >
                  Apri il simulatore
                  <ArrowDown className="size-4 transition-transform group-hover:translate-y-0.5" />
                </a>
                <a
                  href="#leve"
                  className="group inline-flex items-center gap-2.5 rounded-full border border-white/15 px-7 py-3.5 text-sm text-bone transition-all hover:border-brass/50 hover:bg-brass/5"
                >
                  Esplora le 8 leve 3D
                  <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </div>
            </Reveal>

            <Reveal delay={330}>
              <div className="mt-14 grid max-w-xl grid-cols-2 gap-x-8 gap-y-7 border-t border-white/10 pt-8 sm:grid-cols-4">
                {STATS.map((s) => (
                  <div key={s.label}>
                    <p className="font-mono text-[22px] font-medium text-brass2">{s.value}</p>
                    <p className="mt-1.5 text-[10.5px] uppercase leading-snug tracking-wide text-sand">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          {/* visual */}
          <Reveal delay={200} className="relative">
            <div className="relative mx-auto max-w-[460px]">
              <div className="absolute -inset-6 rounded-[2.5rem] bg-brass/[0.07] blur-2xl" aria-hidden />
              <figure className="glass relative overflow-hidden rounded-[2rem] p-2">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[1.6rem]">
                  <img
                    src="/images/hero-cup.jpg"
                    alt="Tazzina di caffè con anelli orbitali luminosi: l'ecosistema del welfare territoriale"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-ink/25" />

                  {/* floating chips */}
                  <div className="glass absolute top-4 left-4 flex items-center gap-2 rounded-full px-3.5 py-2 animate-[floatSlow_7s_ease-in-out_infinite]">
                    <Network className="size-3.5 text-brass" />
                    <span className="text-[11px] font-medium text-bone">
                      5 attori · 1 ecosistema
                    </span>
                  </div>
                  <div className="glass absolute top-[42%] right-4 flex items-center gap-2 rounded-full px-3.5 py-2 animate-[floatSlow_7s_ease-in-out_infinite] [animation-delay:1.6s]">
                    <Users className="size-3.5 text-leafy" />
                    <span className="font-mono text-[11px] text-bone">
                      K-Factor 0,31
                    </span>
                  </div>
                  <div className="glass absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl px-4 py-3.5 animate-[floatSlow_7s_ease-in-out_infinite] [animation-delay:3s]">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-sand">
                        Investimento operatore
                      </p>
                      <p className="font-mono text-xl font-semibold text-brass2">
                        € 0
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-sand">
                        Retention portafoglio
                      </p>
                      <p className="font-mono text-xl font-semibold text-leafy">
                        98%
                      </p>
                    </div>
                  </div>
                </div>
              </figure>
            </div>
          </Reveal>
        </div>
      </section>

      {/* marquee */}
      <div className="relative border-y border-white/[0.07] bg-coal/60 py-4 overflow-hidden">
        <div className="flex w-max animate-marquee gap-10 pr-10">
          {[...TICKER, ...TICKER].map((t, i) => (
            <span key={i} className="flex items-center gap-3 whitespace-nowrap">
              <t.icon className="size-4 text-brass" strokeWidth={1.75} />
              <span className="font-mono text-[11.5px] tracking-[0.08em] text-bone/70 uppercase">
                {t.text}
              </span>
              <span className="ml-6 inline-block size-1 rounded-full bg-brass/50" />
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
