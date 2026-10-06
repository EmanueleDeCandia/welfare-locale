import { useState, type CSSProperties } from "react";
import {
  ChevronDown,
  Landmark,
  Users,
  Briefcase,
  Sprout,
  CalendarDays,
  SlidersHorizontal,
} from "lucide-react";
import type { Params } from "../lib/model";
import { fmtInt, fmtDec, fmtEUR } from "../lib/model";

export type FieldFormat = "int" | "eur" | "pct" | "d1" | "d2";

export interface ParamField {
  key: keyof Params;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  format?: FieldFormat;
}

interface ParamGroup {
  id: string;
  title: string;
  icon: typeof Landmark;
  fields: ParamField[];
}

const GROUPS: ParamGroup[] = [
  {
    id: "welfare",
    title: "Welfare & CSR",
    icon: Landmark,
    fields: [
      { key: "impreseClienti", label: "Imprese clienti", min: 50, max: 400, step: 5, format: "int" },
      { key: "dipendentiPerImpresa", label: "Dipendenti per impresa", min: 10, max: 80, step: 1, format: "int" },
      { key: "tassoAdesioneHotel", label: "Adesione voucher hotel", min: 2, max: 40, step: 1, unit: "%", format: "pct" },
      { key: "tassoAdesioneAperitivo", label: "Adesione voucher aperitivo", min: 2, max: 45, step: 1, unit: "%", format: "pct" },
      { key: "moltiplicatoreHotel", label: "Moltiplicatore accompagnatori hotel", min: 1, max: 4, step: 0.1, unit: "×", format: "d1" },
      { key: "moltiplicatoreAperitivo", label: "Moltiplicatore accompagnatori food", min: 1, max: 4, step: 0.1, unit: "×", format: "d1" },
      { key: "costoVoucherHotel", label: "Costo voucher hotel", min: 20, max: 120, step: 5, format: "eur" },
      { key: "costoVoucherAperitivo", label: "Costo voucher aperitivo", min: 10, max: 60, step: 1, format: "eur" },
      { key: "prezzoHotel", label: "Prezzo medio hotel", min: 20, max: 120, step: 5, format: "eur" },
      { key: "prezzoAperitivo", label: "Prezzo medio aperitivo", min: 10, max: 60, step: 1, format: "eur" },
    ],
  },
  {
    id: "referral",
    title: "Referral & Viralità",
    icon: Users,
    fields: [
      { key: "referralRate", label: "Referral rate ambassador", min: 5, max: 60, step: 1, unit: "%", format: "pct" },
      { key: "conversionRate", label: "Conversion rate inviti", min: 5, max: 60, step: 1, unit: "%", format: "pct" },
      { key: "invitiMediPerAmbassador", label: "Inviti medi per ambassador", min: 1, max: 12, step: 1, format: "int" },
      { key: "cicliReferral", label: "Cicli di referral", min: 1, max: 6, step: 1, format: "int" },
      { key: "fattoreEspansioneMercato", label: "Fattore espansione mercato (TAM)", min: 1.5, max: 5, step: 0.5, unit: "×", format: "d1" },
      { key: "costoBiglietto", label: "Costo biglietto omaggio", min: 10, max: 40, step: 1, format: "eur" },
      { key: "margineStartupHotel", label: "Margine startup su hotel", min: 10, max: 50, step: 1, unit: "%", format: "pct" },
      { key: "margineStartupAperitivo", label: "Margine startup su food", min: 30, max: 90, step: 1, unit: "%", format: "pct" },
    ],
  },
  {
    id: "b2b",
    title: "Pipeline B2B & Retention",
    icon: Briefcase,
    fields: [
      { key: "valoreMedioAcquisto", label: "CLV contratto vending (3 anni)", min: 300, max: 3000, step: 50, format: "eur" },
      { key: "churnRateAsIs", label: "Churn rate AS-IS", min: 4, max: 20, step: 0.5, unit: "%", format: "d1" },
      { key: "churnRateToBe", label: "Churn rate TO-BE", min: 0.5, max: 8, step: 0.5, unit: "%", format: "d1" },
      { key: "nuoviProspectRate", label: "Prospect da referral", min: 5, max: 60, step: 1, unit: "%", format: "pct" },
      { key: "tassoChiusuraProspect", label: "Tasso chiusura prospect", min: 5, max: 50, step: 1, unit: "%", format: "pct" },
      { key: "moltiplicatoreTurismo", label: "Moltiplicatore turistico", min: 1.2, max: 4, step: 0.1, unit: "×", format: "d1" },
    ],
  },
  {
    id: "km0",
    title: "Filiera Km 0 & ESG",
    icon: Sprout,
    fields: [
      { key: "adozioneKmZero", label: "Adozione panieri Km 0", min: 5, max: 45, step: 1, unit: "%", format: "pct" },
      { key: "frequenzaAcquistiKmZero", label: "Ordini per dipendente / anno", min: 2, max: 12, step: 1, format: "int" },
      { key: "scontrinoMedioKmZero", label: "Scontrino medio paniere", min: 15, max: 60, step: 1, format: "eur" },
      { key: "trattaLogisticaEvitata", label: "Tratta logistica evitata", min: 10, max: 120, step: 5, unit: "km", format: "int" },
      { key: "fattoreEmissioniTrasporto", label: "Fattore emissioni", min: 0.05, max: 0.5, step: 0.01, unit: "kg/km", format: "d2" },
    ],
  },
  {
    id: "eventi",
    title: "Eventi & Loyalty",
    icon: CalendarDays,
    fields: [
      { key: "personePerEvento", label: "Spettatori prima edizione", min: 200, max: 3000, step: 50, format: "int" },
      { key: "retentionRateEvento", label: "Retention tra edizioni", min: 10, max: 70, step: 1, unit: "%", format: "pct" },
      { key: "referralRateEvento", label: "Referral rate evento", min: 5, max: 40, step: 1, unit: "%", format: "pct" },
      { key: "invitiMediEvento", label: "Inviti medi evento", min: 1, max: 10, step: 1, format: "int" },
      { key: "conversionRateEvento", label: "Conversion evento", min: 5, max: 60, step: 1, unit: "%", format: "pct" },
      { key: "cicliEvento", label: "Edizioni programmate", min: 1, max: 6, step: 1, format: "int" },
      { key: "spesaMediaTerritorioEvento", label: "Spesa media sul territorio", min: 20, max: 100, step: 5, format: "eur" },
      { key: "artistiPerEvento", label: "Artisti coinvolti / evento", min: 5, max: 50, step: 1, format: "int" },
    ],
  },
];

function displayValue(f: ParamField, v: number) {
  switch (f.format) {
    case "eur":
      return fmtEUR(v);
    case "pct":
      return `${fmtInt(v)}%`;
    case "d1":
      return `${fmtDec(v, 1)}${f.unit === "%" ? "%" : f.unit ? ` ${f.unit}` : ""}`;
    case "d2":
      return `${fmtDec(v, 2)}${f.unit ? ` ${f.unit}` : ""}`;
    default:
      return `${fmtInt(v)}${f.unit ? ` ${f.unit}` : ""}`;
  }
}

export default function ParamsPanel({
  params,
  onChange,
}: {
  params: Params;
  onChange: (key: keyof Params, value: number) => void;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({
    welfare: true,
    referral: true,
  });

  return (
    <div className="glass rounded-3xl p-6">
      <div className="flex items-center gap-3 border-b border-white/[0.07] pb-4">
        <SlidersHorizontal className="size-4 text-brass" />
        <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-bone">
          Pannello parametri
        </span>
        <span className="ml-auto font-mono text-[10px] text-sand">
          {GROUPS.reduce((a, g) => a + g.fields.length, 0)} leve
        </span>
      </div>

      <div className="mt-2">
        {GROUPS.map((g) => {
          const isOpen = !!open[g.id];
          return (
            <div key={g.id} className="border-b border-white/[0.06] last:border-0">
              <button
                onClick={() => setOpen((o) => ({ ...o, [g.id]: !o[g.id] }))}
                className="flex w-full items-center gap-3 py-4 text-left"
                aria-expanded={isOpen}
              >
                <span className="grid size-8 place-items-center rounded-lg border border-brass/25 bg-brass/10 text-brass">
                  <g.icon className="size-4" strokeWidth={1.75} />
                </span>
                <span className="text-[13.5px] font-medium text-bone">{g.title}</span>
                <span className="ml-auto font-mono text-[10px] text-sand">
                  {g.fields.length}
                </span>
                <ChevronDown
                  className={`size-4 text-sand transition-transform duration-500 ${
                    isOpen ? "rotate-180 text-brass" : ""
                  }`}
                />
              </button>
              <div className={`acc-body ${isOpen ? "open" : ""}`}>
                <div className="acc-inner">
                  <div className="space-y-5 pb-6 pt-1">
                    {g.fields.map((f) => {
                      const v = params[f.key];
                      const fill = ((v - f.min) / (f.max - f.min)) * 100;
                      return (
                        <label key={f.key} className="block">
                          <span className="mb-2 flex items-baseline justify-between gap-3">
                            <span className="text-[12px] text-sand">{f.label}</span>
                            <span className="rounded-md border border-brass/25 bg-brass/[0.08] px-2 py-0.5 font-mono text-[11px] font-medium text-brass2">
                              {displayValue(f, v)}
                            </span>
                          </span>
                          <input
                            type="range"
                            className="param-range"
                            min={f.min}
                            max={f.max}
                            step={f.step}
                            value={v}
                            onChange={(e) => onChange(f.key, Number(e.target.value))}
                            style={{ "--fill": `${fill}%` } as CSSProperties}
                            aria-label={f.label}
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
