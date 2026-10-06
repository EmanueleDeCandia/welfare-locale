import {
  XCircle,
  CheckCircle2,
  Coffee,
  Building2,
  Users,
  Rocket,
  MapPin,
  ArrowRight,
  ArrowDown,
  BadgeCheck,
  Landmark,
  HandCoins,
  Network,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { Reveal, SectionTitle } from "../lib/ui";

const ASIS = [
  "Commoditizzazione del servizio: la gara si vince solo sul prezzo a tazzina.",
  "Churn rate fisiologico del 10% annuo a fine ammortamento macchine.",
  "Micro-logistica separata: il Km 0 non raggiunge i luoghi di lavoro.",
];

const TOBE = [
  {
    icon: Landmark,
    text: "Aggregatore di valore ESG: welfare finanziato con budget CSR deducibili.",
  },
  {
    icon: Truck,
    text: "Backbone logistico a emissioni zero: i panieri Km 0 viaggiano sui giri vending esistenti.",
  },
  {
    icon: Network,
    text: "Gateway fiduciario per la cultura: l'operatore apre le porte dei CDA alla startup.",
  },
  {
    icon: ShieldCheck,
    text: "Fidelizzazione blindata: revocare il vending revocherebbe il welfare. Churn 10% → 2%.",
  },
];

const ACTORS = [
  {
    n: "01",
    icon: Coffee,
    name: "Operatore Vending",
    role: "Hub e orchestratore fiduciario",
    give: "Rete commerciale consolidata + flotta logistica. Investimento: €0.",
    get: "Nuovi contratti via certificato HR, churn abbattuto, punteggio ESG in gara.",
    accent: "#e2a63d",
  },
  {
    n: "02",
    icon: Building2,
    name: "Imprese Clienti CSR",
    role: "Finanziatrici del welfare",
    give: "Voucher welfare al 100% (€50 hotel + €25 food) da budget CSR deducibile.",
    get: "Retention dei dipendenti, clima aziendale, bilancio ESG conforme.",
    accent: "#7dd3fc",
  },
  {
    n: "03",
    icon: Users,
    name: "Dipendenti & Ambassador",
    role: "Beneficiari e motore virale",
    give: "Nessun costo di ingresso; acquisto panieri con scontrino medio €30.",
    get: "Esperienze memorabili gratuite e spesa locale consegnata in ufficio.",
    accent: "#7fce9b",
  },
  {
    n: "04",
    icon: Rocket,
    name: "Startup Culturale",
    role: "Piattaforma e matching grant",
    give: "Biglietti omaggio (€25 cad.) e gestione software dei voucher.",
    get: "Commissioni sui voucher (25% hotel, 75% food) con margine netto positivo.",
    accent: "#c4b5fd",
  },
  {
    n: "05",
    icon: MapPin,
    name: "Territorio & Filiera",
    role: "Hotel, food, produttori, eventi",
    give: "Camere, coperti e produzioni tipiche a tariffe convenzionate.",
    get: "Occupazione in bassa stagione, indotto ×2,5, logistica disintermediata.",
    accent: "#fb7185",
  },
];

const FLOW = [
  "Le imprese finanziano",
  "L'operatore orchestra",
  "La startup co-finanzia",
  "I dipendenti partecipano",
  "Il territorio cresce",
];

export default function Ecosystem() {
  return (
    <section id="ecosistema" className="relative scroll-mt-24 overflow-hidden py-28 sm:py-36">
      {/* territory backdrop */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <img
          src="/images/territory.jpg"
          alt=""
          className="h-full w-full object-cover opacity-[0.13]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink via-ink/70 to-ink" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <SectionTitle
          eyebrow="Il paradigma"
          title={
            <>
              Dal prezzo a tazzina al{" "}
              <em className="font-normal italic text-brass2">valore di sistema</em>.
            </>
          }
          sub="Il vending B2B compete sul ribasso. Noi lo trasformiamo in infrastruttura di relazione: cinque attori, un solo circolo virtuoso misurabile."
        />

        {/* AS-IS vs TO-BE */}
        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-3xl border border-white/[0.07] bg-white/[0.02] p-8">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-sand">
                  Paradigma AS-IS
                </span>
                <span className="rule" />
              </div>
              <h3 className="font-display mt-4 text-2xl font-light text-bone/80">
                Il fornitore sostituibile
              </h3>
              <ul className="mt-7 space-y-5">
                {ASIS.map((t) => (
                  <li key={t} className="flex gap-3.5">
                    <XCircle className="mt-0.5 size-5 shrink-0 text-bloom/70" strokeWidth={1.75} />
                    <span className="text-[14px] leading-relaxed text-sand">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="relative h-full overflow-hidden rounded-3xl border border-brass/25 bg-gradient-to-br from-brass/[0.09] to-transparent p-8">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-brass">
                  Trasformazione TO-BE
                </span>
                <span className="rule" />
              </div>
              <h3 className="font-display mt-4 text-2xl font-light text-bone">
                L'hub del welfare territoriale
              </h3>
              <ul className="mt-7 space-y-5">
                {TOBE.map((t) => (
                  <li key={t.text} className="flex gap-3.5">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brass" strokeWidth={1.75} />
                    <span className="text-[14px] leading-relaxed text-bone/85">{t.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        {/* 5 actors */}
        <Reveal className="mt-24">
          <div className="flex items-center gap-3">
            <BadgeCheck className="size-4 text-brass" />
            <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-brass">
              Matrice dei 5 attori
            </span>
            <span className="rule" />
          </div>
          <h3 className="font-display mt-5 max-w-2xl text-3xl font-light leading-tight text-bone sm:text-4xl">
            Ognuno porta risorse che già possiede.{" "}
            <span className="text-sand">Ognuno esce con più di quanto ha messo.</span>
          </h3>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {ACTORS.map((a, i) => (
            <Reveal key={a.n} delay={i * 80}>
              <article className="group glass relative flex h-full flex-col overflow-hidden rounded-3xl p-6 transition-all duration-500 hover:-translate-y-1.5 hover:border-white/20">
                <div
                  className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full opacity-[0.12] blur-2xl transition-opacity duration-500 group-hover:opacity-[0.28]"
                  style={{ background: a.accent }}
                  aria-hidden
                />
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-sand">{a.n}</span>
                  <span
                    className="grid size-10 place-items-center rounded-xl border"
                    style={{
                      color: a.accent,
                      borderColor: `${a.accent}33`,
                      background: `${a.accent}14`,
                    }}
                  >
                    <a.icon className="size-4.5" strokeWidth={1.75} />
                  </span>
                </div>
                <h4 className="font-display mt-5 text-xl leading-snug font-normal text-bone">
                  {a.name}
                </h4>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em]" style={{ color: a.accent }}>
                  {a.role}
                </p>
                <div className="mt-5 space-y-4 border-t border-white/[0.07] pt-4 text-[12.5px] leading-relaxed">
                  <p className="text-sand">
                    <span className="mb-0.5 block font-mono text-[9.5px] uppercase tracking-[0.2em] text-bone/50">
                      Contribuisce
                    </span>
                    {a.give}
                  </p>
                  <p className="text-bone/80">
                    <span className="mb-0.5 block font-mono text-[9.5px] uppercase tracking-[0.2em] text-bone/50">
                      Riceve
                    </span>
                    {a.get}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        {/* flow */}
        <Reveal delay={100} className="mt-16">
          <div className="glass flex flex-wrap items-center justify-center gap-x-3 gap-y-4 rounded-3xl px-6 py-6">
            {FLOW.map((f, i) => (
              <span key={f} className="flex items-center gap-3">
                <span className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2">
                  <HandCoins className="size-3.5 text-brass" />
                  <span className="text-[12.5px] text-bone/85">{f}</span>
                </span>
                {i < FLOW.length - 1 && (
                  <>
                    <ArrowRight className="hidden size-4 text-brass/60 sm:block" />
                    <ArrowDown className="size-4 text-brass/60 sm:hidden" />
                  </>
                )}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
