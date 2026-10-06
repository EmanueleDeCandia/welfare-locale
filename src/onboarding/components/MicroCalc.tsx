import { useId, useState } from "react";
import { SlidersHorizontal, Calculator, ArrowUpRight } from "lucide-react";
import type { Profile } from "../data/profiles";
import type { Params, Results, ScenarioKey } from "../../lib/model";

interface Props {
  profile: Profile;
  params: Params;
  results: Results;
  scenario: ScenarioKey | "custom";
}

/* Micro-simulatore reattivo del profilo (SKILL §5.1) */
export default function MicroCalc({ profile, params, results, scenario }: Props) {
  const [local, setLocal] = useState(() => profile.micro.slider.default(params));
  const sliderId = useId();
  const s = profile.micro.slider;
  const rows = profile.micro.rows(params, results, local);
  const fill = ((local - s.min) / (s.max - s.min)) * 100;

  return (
    <div className="ob-panel" style={{ "--accent": profile.accent } as React.CSSProperties}>
      <div className="ob-panel-head">
        <span className="ob-panel-icon">
          <Calculator className="size-4" strokeWidth={1.75} />
        </span>
        <div>
          <h4 className="ob-panel-title">Micro-simulatore reattivo</h4>
          <p className="ob-panel-sub">
            Proiezione live sui parametri del simulatore · scenario{" "}
            <b>{scenario === "custom" ? "personalizzato" : scenario}</b>
          </p>
        </div>
        <span className="ob-live">live</span>
      </div>

      <label className="ob-slider" htmlFor={sliderId}>
        <span className="ob-slider-top">
          <span className="ob-slider-label">
            <SlidersHorizontal className="size-3.5" strokeWidth={1.75} />
            {s.label}
          </span>
          <span className="ob-slider-value">
            {local.toLocaleString("it-IT")} <i>{s.unit}</i>
          </span>
        </span>
        <input
          id={sliderId}
          type="range"
          min={s.min}
          max={s.max}
          step={s.step}
          value={local}
          onChange={(e) => setLocal(Number(e.target.value))}
          style={{ "--fill": `${fill}%` } as React.CSSProperties}
        />
      </label>

      <div className="ob-rows">
        {rows.map((r) => (
          <div key={r.label} className={`ob-row${r.accent === "primary" ? " is-primary" : ""}`}>
            <div className="ob-row-head">
              <span className="ob-row-label">{r.label}</span>
              <span className="ob-row-value">{r.value}</span>
            </div>
            <p className="ob-row-hint">{r.hint}</p>
            <code className="ob-row-formula">{r.formula}</code>
          </div>
        ))}
      </div>

      <a className="ob-panel-link" href="#simulatore">
        Verifica le formule complete nel simulatore
        <ArrowUpRight className="size-3.5" strokeWidth={2} />
      </a>
    </div>
  );
}
