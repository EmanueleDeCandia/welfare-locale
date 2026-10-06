import type { ReactNode } from "react";
import { useInView } from "./hooks";

export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>(0.12);
  return (
    <div
      ref={ref}
      className={`reveal ${inView ? "is-in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-block size-1.5 rounded-full bg-brass animate-[pulseDot_2.2s_ease-in-out_infinite]" />
      <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-brass">
        {children}
      </span>
      <span className="rule hidden sm:block" />
    </div>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  sub,
  className = "",
}: {
  eyebrow: string;
  title: ReactNode;
  sub?: string;
  className?: string;
}) {
  return (
    <Reveal className={className}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="font-display mt-6 text-4xl leading-[1.06] font-light tracking-tight text-bone sm:text-5xl lg:text-6xl">
        {title}
      </h2>
      {sub ? (
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-sand">{sub}</p>
      ) : null}
    </Reveal>
  );
}
