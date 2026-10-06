import { useMemo, useState } from "react";
import {
  Copy,
  Check,
  Users,
  CircleDollarSign,
  MapPin,
  Gauge,
  Ticket,
  Landmark,
  HandCoins,
  Building2,
  Truck,
  Network,
  Award,
  Leaf,
  ShoppingBasket,
  ShieldCheck,
  TrendingUp,
  Briefcase,
  ChevronDown,
  Coffee,
  Rocket,
  BookOpenCheck,
} from "lucide-react";
import { computeResults, type Params, type ScenarioKey } from "../lib/model";
import { fmtInt, fmtEUR, fmtDec } from "../lib/model";
import { useCountUp } from "../lib/hooks";
import { useSimState, setSimParam, applySimScenario } from "../lib/store";
import { Reveal, SectionTitle } from "../lib/ui";
import ParamsPanel from "./ParamsPanel";
import { GrowthChart, ValueDonut } from "./Charts";

/* ------------------------------ KPI card ------------------------------ */

function Kpi({
  icon: Icon,
  label,
  raw,
  format,
  sub,
  accent,
  delay,
}: {
  icon: typeof Users;
  label: string;
  raw: number;
  format: (n: number) => string;
  sub: string;
  accent: string;
  delay: number;
}) {
  const v = useCountUp(raw);
  return (
    <Reveal delay={delay}>
      <div className="glass relative h-full overflow-hidden rounded-3xl p-6">
        <div
          className="absolute inset-x-0 top-0 h-[3px]"
          style={{ background: `linear-gradient(to right, ${accent}, transparent)` }}
        />
        <div className="flex items-center justify-between">
          <span
            className="grid size-10 place-items-center rounded-xl border"
            style={{ color: accent, borderColor: `${accent}30`, background: `${accent}12` }}
          >
            <Icon className="size-4.5" strokeWidth={1.75} />
          </span>
          <span className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-sand">
            Live
          </span>
        </div>
        <p className="mt-5 font-mono text-[26px] leading-none font-semibold text-bone sm:text-[30px]">
          {format(v)}
        </p>
        <p className="mt-2.5 text-[12.5px] font-medium text-bone/85">{label}</p>
        <p className="mt-1 text-[11px] leading-snug text-sand">{sub}</p>
      </div>
    </Reveal>
  );
}

/* ------------------------------ Bilancio rows ------------------------------ */

function Row({
  label,
  sub,
  value,
  strong,
  negative,
  color,
}: {
  label: string;
  sub?: string;
  value: string;
  strong?: boolean;
  negative?: boolean;
  color?: string;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 py-2.5 ${
        strong ? "border-t border-white/10 pt-3.5" : ""
      }`}
    >
      <div className="min-w-0">
        <p className={`text-[13px] ${strong ? "font-semibold text-bone" : "text-bone/85"}`}>
          {label}
        </p>
        {sub && <p className="mt-0.5 text-[10.5px] leading-snug text-sand">{sub}</p>}
      </div>
      <span
        className={`shrink-0 font-mono text-[13px] ${
          strong ? "text-[15px] font-semibold" : "font-medium"
        } ${negative ? "text-bloom" : ""}`}
        style={color ? { color } : strong ? { color: "#f0c471" } : undefined}
      >
        {value}
      </span>
    </div>
  );
}

/* ------------------------------ Sintesi card ------------------------------ */

function SintesiCard({
  icon: Icon,
  raw,
  format,
  label,
  sub,
  accent,
  delay,
}: {
  icon: typeof Leaf;
  raw: number;
  format: (n: number) => string;
  label: string;
  sub: string;
  accent: string;
  delay: number;
}) {
  const v = useCountUp(raw);
  return (
    <Reveal delay={delay}>
      <div className="glass group h-full rounded-2xl p-5 transition-all duration-500 hover:-translate-y-1 hover:border-white/20">
        <div className="flex items-center justify-between">
          <Icon className="size-4.5" style={{ color: accent }} strokeWidth={1.75} />
          <TrendingUp className="size-3.5 text-sand/50" />
        </div>
        <p className="mt-4 font-mono text-[22px] leading-none font-semibold" style={{ color: accent }}>
          {format(v)}
        </p>
        <p className="mt-2 text-[12px] font-medium text-bone/85">{label}</p>
        <p className="mt-0.5 text-[10.5px] text-sand">{sub}</p>
      </div>
    </Reveal>
  );
}

/* ------------------------------ Metodologia ------------------------------ */

const METODO = [
  {
    t: "Base seed & tassi di adesione",
    f: "Seed = max(Aderenti Hotel, Aderenti Aperitivo)",
    d: "Popolazione = Imprese × Dipendenti. Gli aderenti sono il round di popolazione × tasso; le presenze includono gli accompagnatori tramite i moltiplicatori (×2 di default).",
  },
  {
    t: "K-Factor virale",
    f: "K = referral% × inviti × conversion%",
    d: "Con i default: 0,25 × 5 × 0,25 = 0,3125. Poiché K < 1 la serie geometrica converge: crescita finita, predicibile e mai fuori budget.",
  },
  {
    t: "TAM esteso & saturazione di ciclo",
    f: "Nuoviᵢ = min(potenzialiᵢ, TAM − cumulatoᵢ₋₁)",
    d: "Il TAM è Seed × fattore di espansione (×3). Ogni ciclo assorbe solo la capacità residua del bacino: il modello satura dolcemente invece di esplodere.",
  },
  {
    t: "Matching grant culturale",
    f: "Biglietti = presenze dirette seed × €25",
    d: "La startup eroga i biglietti omaggio e li ripaga con le commissioni convenzionate: margine 25% sui volumi hotel e 75% sui volumi food. Il netto rimane positivo.",
  },
  {
    t: "Spesa CSR delle imprese",
    f: "CSR = (Aderenti + Growth) × costo voucher",
    d: "Le imprese finanziano il 100% dei voucher (€50 hotel, €25 food) con budget CSR già deducibili: zero nuovi costi per operatore e dipendenti.",
  },
  {
    t: "Valore territoriale con moltiplicatore",
    f: "Territorio = quote nette + CSR × 2,5 + fatturato Km0",
    d: "Ogni euro di voucher attiva spesa accessoria sul territorio (trasporti, shopping, attrazioni). La quota netta è il lordo meno le commissioni startup.",
  },
  {
    t: "Filiera Km 0 & CO₂ evitata",
    f: "CO₂ = ordini × tratta × 0,19 kg/km",
    d: "Solo i dipendenti diretti delle sedi servite dai furgoni: la consegna avviene sul giro di rifornimento esistente, eliminando la logistica dedicata (−51,3 t di default).",
  },
  {
    t: "Churn differenziale & retention",
    f: "Retention = max(churn AS-IS − TO-BE, 0) × imprese × CLV",
    d: "Otto punti di churn in meno proteggono 12 contratti triennali su 150. Cambiare fornitore significherebbe revocare il welfare ai dipendenti.",
  },
  {
    t: "Pipeline referral B2B",
    f: "Clienti = round(Growth × prospect% × chiusura%)",
    d: "Il certificato welfare mostrato ad amici e conoscenti trasforma i partecipanti in canale commerciale: 28 nuovi contratti nello scenario realistico, CAC ≈ €0.",
  },
  {
    t: "Eventi & loyalty loop",
    f: "Edizioneᵢ = fedeliᵢ₋₁ + referralᵢ₋₁",
    d: "Concerti e festival crescono a ogni edizione con retention 40% e passaparola. L'indotto è presenze totali × spesa media territoriale (€50).",
  },
];

/* ------------------------------ Simulator ------------------------------ */

const SCENARIOS: { key: ScenarioKey; label: string }[] = [
  { key: "conservativo", label: "Conservativo" },
  { key: "realistico", label: "Realistico" },
  { key: "ottimistico", label: "Ottimistico" },
];

export default function Simulator() {
  const { params, scenario } = useSimState();
  const [copied, setCopied] = useState(false);
  const [openMetodo, setOpenMetodo] = useState<number | null>(1);

  const results = useMemo(() => computeResults(params), [params]);

  const update = (key: keyof Params, value: number) => setSimParam(key, value);

  const applyScenario = (key: ScenarioKey) => applySimScenario(key);

  const copyParams = async () => {
    const payload = JSON.stringify(
      { scenario, parametri: params },
      null,
      2
    );
    try {
      await navigator.clipboard.writeText(payload);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = payload;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="simulatore" className="relative scroll-mt-24 overflow-hidden py-28 sm:py-36">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute top-0 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-brass/[0.06] blur-[160px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <SectionTitle
          eyebrow="Cockpit analitico"
          title={
            <>
              Il simulatore: ogni leva,{" "}
              <em className="font-normal italic text-brass2">ogni euro</em>, in tempo
              reale.
            </>
          }
          sub="Muovi gli slider e osserva la reazione dell'ecosistema: crescita virale, bilancio della startup, spesa CSR, valore B2B e impatto ambientale convergono in un unico modello reattivo."
        />

        {/* scenario bar */}
        <Reveal delay={120} className="mt-12">
          <div className="glass flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3.5 sm:px-6">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-sand">
              Scenari
            </span>
            <div className="flex flex-wrap gap-2">
              {SCENARIOS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => applyScenario(s.key)}
                  className={`rounded-full px-4.5 py-2 text-[12.5px] font-medium transition-all ${
                    scenario === s.key
                      ? "bg-brass text-ink shadow-[0_4px_24px_-6px_rgba(226,166,61,0.6)]"
                      : "border border-white/10 text-sand hover:border-brass/40 hover:text-bone"
                  }`}
                >
                  {s.label}
                </button>
              ))}
              {scenario === "custom" && (
                <span className="rounded-full border border-leafy/40 bg-leafy/10 px-4.5 py-2 text-[12.5px] font-medium text-leafy">
                  Personalizzato
                </span>
              )}
            </div>
            <button
              onClick={copyParams}
              className="ml-auto inline-flex items-center gap-2 rounded-full border border-white/12 px-4.5 py-2 text-[12.5px] text-bone transition-all hover:border-brass/50 hover:bg-brass/5"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-leafy" /> Copiato negli appunti
                </>
              ) : (
                <>
                  <Copy className="size-3.5" /> Copia parametri JSON
                </>
              )}
            </button>
          </div>
        </Reveal>

        {/* KPI */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi
            icon={Users}
            label="Partecipanti totali ecosistema"
            sub="Dipendenti + accompagnatori + referral + spettatori"
            raw={results.partecipantiTotali}
            format={fmtInt}
            accent="#e2a63d"
            delay={0}
          />
          <Kpi
            icon={CircleDollarSign}
            label="Valore complessivo generato"
            sub="B2B + territorio moltiplicato + indotto eventi"
            raw={results.valoreComplessivo}
            format={fmtEUR}
            accent="#7fce9b"
            delay={70}
          />
          <Kpi
            icon={MapPin}
            label="Presenze sul territorio"
            sub="Notti in hotel + coperti food + ingressi eventi"
            raw={results.presenzeTerritorio}
            format={fmtInt}
            accent="#7dd3fc"
            delay={140}
          />
          <Kpi
            icon={Gauge}
            label="K-Factor virale"
            sub="Convergente (< 1): crescita sempre in budget"
            raw={results.kFactor}
            format={(n) => fmtDec(n, 3)}
            accent="#c4b5fd"
            delay={210}
          />
        </div>

        {/* params + results */}
        <div className="mt-10 grid gap-6 xl:grid-cols-[400px_minmax(0,1fr)]">
          <Reveal className="xl:sticky xl:top-24 xl:self-start">
            <div className="xl:max-h-[calc(100vh-7.5rem)] xl:overflow-y-auto xl:pr-1.5">
              <ParamsPanel params={params} onChange={update} />
            </div>
          </Reveal>

          <div className="min-w-0 space-y-6">
            {/* bilancio 2 colonne */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Reveal>
                <div className="glass h-full rounded-3xl p-6 sm:p-7">
                  <div className="flex items-center gap-2.5">
                    <HandCoins className="size-4 text-bloom" />
                    <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-bloom">
                      Struttura costi & impegni
                    </span>
                  </div>
                  <h4 className="font-display mt-3 text-[22px] font-light text-bone">
                    Chi paga cosa — e chi no
                  </h4>
                  <div className="mt-5 divide-y divide-white/[0.05]">
                    <Row
                      label="Biglietti omaggio matching grant"
                      sub={`Erogati dalla startup · costo operatore €0 · ${fmtInt(results.biglietti)} biglietti`}
                      value={fmtEUR(results.costoBiglietti)}
                      color="#c4b5fd"
                    />
                    <Row
                      label="Spesa imprese partner CSR"
                      sub="Finanziamento diretto voucher: 100% budget deducibile"
                      value={fmtEUR(results.spesaCSR)}
                      color="#7dd3fc"
                    />
                    <Row
                      label="Entrate lorde startup"
                      sub={`Commissioni ${params.margineStartupHotel}% hotel + ${params.margineStartupAperitivo}% food`}
                      value={fmtEUR(results.entrateLorde)}
                    />
                    <Row
                      label="Costo biglietti omaggio"
                      negative
                      value={`− ${fmtEUR(results.costoBiglietti)}`}
                    />
                    <Row
                      strong
                      label="Margini netti startup"
                      sub="Copertura grant garantita dalle commissioni"
                      value={fmtEUR(results.margineNettoStartup)}
                      color="#7fce9b"
                    />
                  </div>
                </div>
              </Reveal>

              <Reveal delay={90}>
                <div className="glass flex h-full flex-col rounded-3xl p-6 sm:p-7">
                  <div className="flex items-center gap-2.5">
                    <TrendingUp className="size-4 text-leafy" />
                    <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-leafy">
                      Ritorno & valore generato
                    </span>
                  </div>
                  <h4 className="font-display mt-3 text-[22px] font-light text-bone">
                    B2B + territorio: il circolo virtuoso
                  </h4>
                  <div className="mt-5 flex-1">
                    <p className="mb-1 font-mono text-[9.5px] uppercase tracking-[0.2em] text-sand">
                      Blocco territorio
                    </p>
                    <div className="divide-y divide-white/[0.05]">
                      <Row label="Quota netta hotel & agriturismi" value={fmtEUR(results.quotaHotel)} />
                      <Row label="Quota netta food & aperitivi" value={fmtEUR(results.quotaAperitivo)} />
                      <Row
                        label={`Indotto turistico ×${fmtDec(params.moltiplicatoreTurismo, 1)}`}
                        value={fmtEUR(results.impattoCSR)}
                      />
                      <Row label="Fatturato filiera corta Km 0" value={fmtEUR(results.fatturatoKm0)} />
                      <Row strong label="Valore territorio" value={fmtEUR(results.totaleTerritorio)} color="#7fce9b" />
                    </div>
                    <p className="mt-5 mb-1 font-mono text-[9.5px] uppercase tracking-[0.2em] text-sand">
                      Blocco operatore B2B
                    </p>
                    <div className="divide-y divide-white/[0.05]">
                      <Row
                        label="Nuovi contratti da referral HR"
                        sub={`${fmtInt(results.nuoviClienti)} contratti × CLV ${fmtEUR(params.valoreMedioAcquisto)}`}
                        value={fmtEUR(results.valoreNuovi)}
                      />
                      <Row
                        label="Retention da churn abbattuto"
                        sub={`${fmtInt(results.impreseSalvate)} imprese salvate × CLV`}
                        value={fmtEUR(results.valoreRetention)}
                      />
                      <Row strong label="Valore B2B operatore" value={fmtEUR(results.totaleB2B)} color="#e2a63d" />
                    </div>
                  </div>
                  <div className="mt-5 rounded-2xl border border-brass/25 bg-brass/[0.07] px-5 py-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-[11px] uppercase tracking-[0.16em] text-brass2">
                        Indotto eventi live
                      </span>
                      <span className="font-mono text-[13px] text-bone">
                        {fmtEUR(results.indottoEventi)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between gap-3 border-t border-brass/15 pt-2.5">
                      <span className="text-[12.5px] font-semibold text-bone">
                        Totale valore generato / anno
                      </span>
                      <span className="font-mono text-lg font-semibold text-brass2">
                        {fmtEUR(results.valoreComplessivo)}
                      </span>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>

            {/* 4 pilastri */}
            <Reveal>
              <div className="glass rounded-3xl p-6 sm:p-7">
                <div className="flex items-center gap-2.5">
                  <Coffee className="size-4 text-brass" />
                  <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-brass">
                    Operatore B2B · Promotore del welfare
                  </span>
                </div>
                <h4 className="font-display mt-3 text-[22px] font-light text-bone">
                  I 4 pilastri del nuovo posizionamento
                </h4>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] text-brass">I</span>
                      <Briefcase className="size-4 text-brass" />
                      <h5 className="text-[13.5px] font-semibold text-bone">
                        Ritorno economico diretto
                      </h5>
                    </div>
                    <div className="mt-4 space-y-2 font-mono text-[12px]">
                      <p className="flex justify-between text-sand">
                        Nuovi contratti <span className="text-bone">+{fmtInt(results.nuoviClienti)}</span>
                      </p>
                      <p className="flex justify-between text-sand">
                        Acquisizione <span className="text-bone">{fmtEUR(results.valoreNuovi)}</span>
                      </p>
                      <p className="flex justify-between text-sand">
                        Contratti protetti <span className="text-bone">{fmtInt(results.impreseSalvate)}</span>
                      </p>
                      <p className="flex justify-between text-sand">
                        Retention <span className="text-bone">{fmtEUR(results.valoreRetention)}</span>
                      </p>
                      <p className="flex justify-between border-t border-white/10 pt-2 text-[12.5px]">
                        <span className="text-bone">Totale B2B</span>
                        <span className="font-semibold text-brass2">{fmtEUR(results.totaleB2B)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] text-leafy">II</span>
                      <Truck className="size-4 text-leafy" />
                      <h5 className="text-[13.5px] font-semibold text-bone">
                        Flotta logistica & CO₂ azzerata
                      </h5>
                    </div>
                    <div className="mt-4 space-y-2 font-mono text-[12px]">
                      <p className="flex justify-between text-sand">
                        Fatturato Km 0 <span className="text-bone">{fmtEUR(results.fatturatoKm0)}</span>
                      </p>
                      <p className="flex justify-between text-sand">
                        Ordini / anno <span className="text-bone">{fmtInt(results.ordiniKm0)}</span>
                      </p>
                      <p className="flex justify-between text-sand">
                        Km logistici evitati <span className="text-bone">{fmtInt(results.kmEvitati)}</span>
                      </p>
                      <p className="flex justify-between border-t border-white/10 pt-2 text-[12.5px]">
                        <span className="text-bone">CO₂ risparmiata</span>
                        <span className="font-semibold text-leafy">
                          −{fmtDec(results.co2Kg / 1000, 1)} t
                        </span>
                      </p>
                    </div>
                    <p className="mt-3 text-[11px] leading-snug text-sand">
                      I panieri viaggiano sui giri di rifornimento già pianificati: costo di
                      consegna ed emissioni dedicate pari a zero.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] text-skyy">III</span>
                      <Network className="size-4 text-skyy" />
                      <h5 className="text-[13.5px] font-semibold text-bone">
                        Autorevolezza B2B & gateway
                      </h5>
                    </div>
                    <ul className="mt-4 space-y-2.5 text-[12.5px] leading-relaxed text-sand">
                      <li className="flex gap-2">
                        <span className="mt-1.5 size-1 shrink-0 rounded-full bg-skyy" />
                        Relazione C-Level / HR consolidata: l'operatore apre alla startup le porte dei consigli di amministrazione.
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-1.5 size-1 shrink-0 rounded-full bg-skyy" />
                        Orchestrazione dei 5 attori con investimento diretto pari a €0 e pipeline a CAC ≈ €0.
                      </li>
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] text-grape">IV</span>
                      <Award className="size-4 text-grape" />
                      <h5 className="text-[13.5px] font-semibold text-bone">
                        Posizionamento ESG
                      </h5>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {["Bilancio di sostenibilità", "Punteggio premiale gare", "Brand purpose locale", "Differentiazione anti-commodity"].map(
                        (c) => (
                          <span
                            key={c}
                            className="rounded-full border border-grape/30 bg-grape/[0.08] px-3 py-1.5 text-[10.5px] text-grape"
                          >
                            {c}
                          </span>
                        )
                      )}
                    </div>
                    <p className="mt-4 text-[12.5px] leading-relaxed text-sand">
                      Ogni vendita di caffè finanzia cultura, agricoltura locale e welfare:
                      un racconto ESG misurabile che nessun concorrente a ribasso può replicare.
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* charts */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Reveal>
                <GrowthChart results={results} />
              </Reveal>
              <Reveal delay={90}>
                <ValueDonut results={results} />
              </Reveal>
            </div>

            {/* sintesi 6 */}
            <div>
              <Reveal>
                <div className="flex items-center gap-3">
                  <ShieldCheck className="size-4 text-brass" />
                  <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-brass">
                    Quadro di sintesi
                  </span>
                  <span className="rule" />
                </div>
              </Reveal>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <SintesiCard
                  icon={ShieldCheck}
                  raw={results.churnDeltaPct}
                  format={(n) => `−${fmtInt(n)}%`}
                  label="Churn rate abbattuto"
                  sub={`Dal ${fmtDec(params.churnRateAsIs, 0)}% al ${fmtDec(params.churnRateToBe, 0)}% annuo`}
                  accent="#7fce9b"
                  delay={0}
                />
                <SintesiCard
                  icon={ShoppingBasket}
                  raw={results.ordiniKm0}
                  format={fmtInt}
                  label="Ordini Km 0 / anno"
                  sub={`${fmtInt(results.acquirentiKm0)} acquirenti attivi × ${params.frequenzaAcquistiKmZero} ordini`}
                  accent="#e2a63d"
                  delay={60}
                />
                <SintesiCard
                  icon={Leaf}
                  raw={results.co2Kg / 1000}
                  format={(n) => `−${fmtDec(n, 1)} t`}
                  label="CO₂ da trasporto evitata"
                  sub={`${fmtInt(results.kmEvitati)} km logistici azzerati`}
                  accent="#7fce9b"
                  delay={120}
                />
                <SintesiCard
                  icon={Ticket}
                  raw={results.biglietti}
                  format={fmtInt}
                  label="Biglietti omaggio erogati"
                  sub={`Grant da ${fmtEUR(params.costoBiglietto)} cad. · ${fmtInt(params.artistiPerEvento)} artisti/evento`}
                  accent="#c4b5fd"
                  delay={180}
                />
                <SintesiCard
                  icon={Briefcase}
                  raw={results.nuoviClienti}
                  format={(n) => `+${fmtInt(n)}`}
                  label="Nuovi contratti B2B"
                  sub={`${fmtInt(results.prospectB2B)} prospect via certificato HR`}
                  accent="#7dd3fc"
                  delay={240}
                />
                <SintesiCard
                  icon={TrendingUp}
                  raw={results.impattoCSR}
                  format={fmtEUR}
                  label="Indotto turistico generato"
                  sub={`Moltiplicatore ×${fmtDec(params.moltiplicatoreTurismo, 1)} sulla spesa CSR`}
                  accent="#fb7185"
                  delay={300}
                />
              </div>
            </div>

            {/* partner sinottici */}
            <Reveal>
              <div className="glass rounded-3xl p-6 sm:p-7">
                <div className="flex items-center gap-2.5">
                  <Landmark className="size-4 text-brass" />
                  <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-brass">
                    Modello di partnership · impegni contrattuali
                  </span>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {[
                    { icon: Coffee, n: "Operatore", i: "Rete + flotta su giri esistenti", o: "€0 investimento diretto", c: "#e2a63d" },
                    { icon: Building2, n: "Imprese CSR", i: "Voucher 100% da budget deducibile", o: "Retention + bilancio ESG", c: "#7dd3fc" },
                    { icon: Users, n: "Dipendenti", i: "€0 ingresso · panieri €30 medi", o: "Esperienze + spesa in ufficio", c: "#7fce9b" },
                    { icon: Rocket, n: "Startup", i: `Biglietti €${params.costoBiglietto} + piattaforma`, o: "Margini su commissioni", c: "#c4b5fd" },
                    { icon: MapPin, n: "Territorio", i: "Tariffe convenzionate", o: `Indotto ×${fmtDec(params.moltiplicatoreTurismo, 1)} + bassa stagione`, c: "#fb7185" },
                  ].map((p) => (
                    <div
                      key={p.n}
                      className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="grid size-8 place-items-center rounded-lg border"
                          style={{ color: p.c, borderColor: `${p.c}30`, background: `${p.c}12` }}
                        >
                          <p.icon className="size-4" strokeWidth={1.75} />
                        </span>
                        <span className="text-[12.5px] font-semibold text-bone">{p.n}</span>
                      </div>
                      <p className="mt-3 text-[11px] leading-snug text-sand">{p.i}</p>
                      <p className="mt-2 text-[11px] font-medium leading-snug" style={{ color: p.c }}>
                        {p.o}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* metodologia */}
            <Reveal>
              <div className="glass rounded-3xl p-6 sm:p-7">
                <div className="flex items-center gap-2.5">
                  <BookOpenCheck className="size-4 text-brass" />
                  <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-brass">
                    Metodologia & architettura algoritmica
                  </span>
                </div>
                <p className="mt-3 max-w-2xl text-[12.5px] leading-relaxed text-sand">
                  Documentazione trasparente per revisori, comitati ESG e analisti: ogni
                  formula del modello con razionale economico e vincoli di saturazione.
                </p>
                <div className="mt-5 divide-y divide-white/[0.06]">
                  {METODO.map((m, i) => {
                    const open = openMetodo === i;
                    return (
                      <div key={m.t}>
                        <button
                          onClick={() => setOpenMetodo(open ? null : i)}
                          className="flex w-full items-center gap-4 py-3.5 text-left"
                          aria-expanded={open}
                        >
                          <span className="font-mono text-[10px] text-sand">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="text-[13.5px] font-medium text-bone">{m.t}</span>
                          <code className="ml-auto hidden rounded-md border border-brass/20 bg-brass/[0.06] px-2.5 py-1 font-mono text-[10px] text-brass2 md:block">
                            {m.f}
                          </code>
                          <ChevronDown
                            className={`size-4 shrink-0 text-sand transition-transform duration-500 ${
                              open ? "rotate-180 text-brass" : ""
                            }`}
                          />
                        </button>
                        <div className={`acc-body ${open ? "open" : ""}`}>
                          <div className="acc-inner">
                            <div className="pb-5 pl-9 pr-2">
                              <code className="mb-3 block rounded-lg border border-brass/20 bg-brass/[0.06] px-3 py-2 font-mono text-[11px] text-brass2 md:hidden">
                                {m.f}
                              </code>
                              <p className="text-[12.5px] leading-relaxed text-sand">{m.d}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
