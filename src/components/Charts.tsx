import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { BarChart3, PieChart as PieIcon, Target, Gauge, TrendingUp } from "lucide-react";
import type { Results } from "../lib/model";
import { fmtInt, fmtEUR, fmtDec } from "../lib/model";

/* ---------------- custom tooltip ---------------- */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-deep rounded-xl px-4 py-3 shadow-2xl">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-sand">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="mt-1.5 flex items-center gap-2 font-mono text-[12px]">
          <span
            className="inline-block size-2 rounded-full"
            style={{ background: p.color || p.payload?.fill }}
          />
          <span className="text-sand">{p.name}:</span>
          <span className="font-semibold text-bone">{fmtInt(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

const AXIS_TICK = { fill: "#a89f8f", fontSize: 11, fontFamily: "JetBrains Mono" };

export function GrowthChart({ results }: { results: Results }) {
  const data = results.cycles.map((c) => ({
    name: c.ciclo,
    "Nuovi ingressi": c.nuovi,
    "Crescita cumulata": c.cumulato,
  }));

  return (
    <div className="glass flex h-full flex-col rounded-3xl p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <BarChart3 className="size-4 text-brass" />
            <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-brass">
              Dinamica di crescita
            </span>
          </div>
          <h4 className="font-display mt-3 text-2xl font-light text-bone">
            Cicli di referral e soglia TAM
          </h4>
        </div>
      </div>

      <div className="mt-6 h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 8, left: -14, bottom: 0 }}>
            <CartesianGrid stroke="rgba(239,230,216,0.06)" vertical={false} />
            <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} dy={8} />
            <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(239,230,216,0.04)" }} />
            <ReferenceLine
              y={results.tamEsteso}
              stroke="#c4b5fd"
              strokeDasharray="5 5"
              strokeOpacity={0.7}
              label={{
                value: `TAM esteso · ${fmtInt(results.tamEsteso)}`,
                fill: "#c4b5fd",
                fontSize: 10.5,
                fontFamily: "JetBrains Mono",
                position: "insideTopRight",
              }}
            />
            <Bar
              dataKey="Nuovi ingressi"
              fill="#e2a63d"
              radius={[7, 7, 0, 0]}
              maxBarSize={52}
            />
            <Line
              type="monotone"
              dataKey="Crescita cumulata"
              stroke="#7fce9b"
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: "#7fce9b", strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "#7fce9b", strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/[0.07] pt-5">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-sand">
            <Gauge className="size-3 text-brass" /> K-Factor
          </p>
          <p className="mt-1 font-mono text-lg text-brass2">{fmtDec(results.kFactor, 2)}</p>
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-sand">
            <TrendingUp className="size-3 text-leafy" /> Growth organico
          </p>
          <p className="mt-1 font-mono text-lg text-leafy">+{fmtInt(results.growth)}</p>
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-sand">
            <Target className="size-3 text-grape" /> TAM assorbito
          </p>
          <p className="mt-1 font-mono text-lg text-grape">{fmtDec(results.capacitaAssorbita, 0)}%</p>
        </div>
      </div>
    </div>
  );
}

/* ---------------- donut ---------------- */
export function ValueDonut({ results }: { results: Results }) {
  const total = results.donut.reduce((a, s) => a + s.value, 0);

  return (
    <div className="glass flex h-full flex-col rounded-3xl p-6 sm:p-8">
      <div className="flex items-center gap-2.5">
        <PieIcon className="size-4 text-brass" />
        <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-brass">
          Composizione del valore
        </span>
      </div>
      <h4 className="font-display mt-3 text-2xl font-light text-bone">
        Le 5 componenti economiche
      </h4>

      <div className="relative mt-2 h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<ChartTooltip />} />
            <Pie
              data={results.donut}
              dataKey="value"
              nameKey="name"
              innerRadius="64%"
              outerRadius="92%"
              paddingAngle={3}
              strokeWidth={0}
              cornerRadius={5}
            >
              {results.donut.map((s) => (
                <Cell key={s.name} fill={s.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-sand">
            Valore / anno
          </span>
          <span className="font-mono text-[22px] font-semibold text-bone">
            {fmtEUR(total)}
          </span>
        </div>
      </div>

      <ul className="mt-4 space-y-2.5 border-t border-white/[0.07] pt-5">
        {results.donut.map((s) => {
          const share = total > 0 ? (s.value / total) * 100 : 0;
          return (
            <li key={s.name} className="flex items-center gap-3 text-[12.5px]">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: s.color }}
              />
              <span className="min-w-0 flex-1 truncate text-bone/80">{s.name}</span>
              <span className="font-mono text-[11px] text-sand">{fmtDec(share, 1)}%</span>
              <span className="w-[88px] text-right font-mono text-[11.5px] font-medium text-bone">
                {fmtEUR(s.value)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
