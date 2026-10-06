import { useEffect, useState } from "react";
import { Coffee, Menu, X, ArrowUpRight } from "lucide-react";

const LINKS = [
  { href: "#visione", label: "Visione" },
  { href: "#ecosistema", label: "Ecosistema" },
  { href: "#simulatore", label: "Simulatore" },
  { href: "#leve", label: "Leve 3D" },
  { href: "#onboarding", label: "Onboarding 3D" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={`transition-all duration-500 ${
          scrolled ? "glass-deep border-b border-white/[0.06]" : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <a href="#visione" className="group flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl border border-brass/30 bg-brass/10 text-brass transition-colors group-hover:bg-brass/20">
              <Coffee className="size-4.5" strokeWidth={1.75} />
            </span>
            <span className="font-display text-lg tracking-tight text-bone">
              Vending<span className="text-brass">×</span>Welfare
              <span className="ml-2 hidden font-mono text-[10px] uppercase tracking-[0.22em] text-sand md:inline">
                Simulatore v2.0
              </span>
            </span>
          </a>

          <nav className="hidden items-center gap-8 lg:flex">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-[13px] text-sand transition-colors hover:text-bone"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#simulatore"
              className="group inline-flex items-center gap-2 rounded-full bg-brass px-5 py-2.5 text-[13px] font-semibold text-ink transition-all hover:bg-brass2"
            >
              Avvia il simulatore
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </nav>

          <button
            onClick={() => setOpen(!open)}
            className="grid size-10 place-items-center rounded-xl border border-white/10 text-bone lg:hidden"
            aria-label="Menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="glass-deep border-b border-white/[0.06] lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-5 py-4">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-sm text-sand transition-colors hover:bg-white/5 hover:text-bone"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#simulatore"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-brass px-5 py-3 text-sm font-semibold text-ink"
            >
              Avvia il simulatore
              <ArrowUpRight className="size-4" />
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
