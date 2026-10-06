import { useState } from "react";
import { ChevronDown, MessageCircleQuestion } from "lucide-react";
import type { Profile } from "../data/profiles";

/* FAQ multi-stakeholder (SKILL §4 — pilastro 3) */
export default function FaqList({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="ob-panel" style={{ "--accent": profile.accent } as React.CSSProperties}>
      <div className="ob-panel-head">
        <span className="ob-panel-icon">
          <MessageCircleQuestion className="size-4" strokeWidth={1.75} />
        </span>
        <div>
          <h4 className="ob-panel-title">Domande frequenti</h4>
          <p className="ob-panel-sub">Dubbi ricorrenti per questo profilo</p>
        </div>
      </div>
      <div className="ob-faq">
        {profile.faq.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={f.q} className={`ob-faq-item${isOpen ? " is-open" : ""}`}>
              <button
                className="ob-faq-q"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
              >
                <span>{f.q}</span>
                <ChevronDown className="ob-faq-chevron size-4" strokeWidth={2} />
              </button>
              <div className="ob-faq-a">
                <p>{f.a}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
