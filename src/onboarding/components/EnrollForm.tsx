import { useState } from "react";
import { Send, ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";
import type { Profile } from "../data/profiles";

interface Props {
  profile: Profile;
  onDone: (code: string) => void;
  onBack: () => void;
}

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function makeCode(profileId: string) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let r = "";
  for (let i = 0; i < 6; i++) r += chars[Math.floor(Math.random() * chars.length)];
  return `WLF-${profileId.slice(0, 3).toUpperCase()}-${r}`;
}

/* Modulo di candidatura / iscrizione partecipanti (SKILL §4 — pilastro 3) */
export default function EnrollForm({ profile, onDone, onBack }: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [privacy, setPrivacy] = useState(false);
  const [sending, setSending] = useState(false);

  const set = (name: string, v: string) => {
    setValues((s) => ({ ...s, [name]: v }));
    setErrors((e) => ({ ...e, [name]: "" }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    for (const f of profile.form.fields) {
      const v = (values[f.name] ?? "").trim();
      if (f.required && !v) err[f.name] = "Campo obbligatorio";
      else if (f.type === "email" && v && !emailRe.test(v)) err[f.name] = "Email non valida";
      else if (f.type === "number" && v && Number(v) <= 0) err[f.name] = "Inserisci un numero valido";
    }
    if (!privacy) err.privacy = "Devi accettare l'informativa privacy";
    setErrors(err);
    if (Object.keys(err).length) return;

    setSending(true);
    const code = makeCode(profile.id);
    try {
      const key = "welfare-onboarding-candidates";
      const list = JSON.parse(localStorage.getItem(key) ?? "[]");
      list.push({ code, profile: profile.id, at: new Date().toISOString(), values });
      localStorage.setItem(key, JSON.stringify(list));
    } catch {
      /* storage non disponibile: la candidatura resta valida in sessione */
    }
    window.setTimeout(() => onDone(code), 650);
  };

  return (
    <form
      className="ob-panel ob-form"
      style={{ "--accent": profile.accent } as React.CSSProperties}
      onSubmit={submit}
      noValidate
    >
      <div className="ob-panel-head">
        <span className="ob-panel-icon">
          <Send className="size-4" strokeWidth={1.75} />
        </span>
        <div>
          <h4 className="ob-panel-title">Candidatura · {profile.short}</h4>
          <p className="ob-panel-sub">{profile.form.intro}</p>
        </div>
      </div>

      <div className="ob-form-grid">
        {profile.form.fields.map((f) => (
          <label
            key={f.name}
            className={`ob-field${f.type === "textarea" ? " is-wide" : ""}`}
            data-error={errors[f.name] ? "1" : "0"}
          >
            <span className="ob-field-label">
              {f.label}
              {f.required && <i>*</i>}
            </span>
            {f.type === "select" ? (
              <select value={values[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)}>
                <option value="">Seleziona…</option>
                {f.options?.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : f.type === "textarea" ? (
              <textarea
                rows={3}
                placeholder={f.placeholder}
                value={values[f.name] ?? ""}
                onChange={(e) => set(f.name, e.target.value)}
              />
            ) : (
              <input
                type={f.type === "number" ? "number" : f.type === "email" ? "email" : "text"}
                placeholder={f.placeholder}
                value={values[f.name] ?? ""}
                onChange={(e) => set(f.name, e.target.value)}
              />
            )}
            {errors[f.name] && <span className="ob-field-error">{errors[f.name]}</span>}
          </label>
        ))}
      </div>

      <label className="ob-privacy" data-error={errors.privacy ? "1" : "0"}>
        <input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} />
        <span>
          <ShieldCheck className="size-3.5" strokeWidth={2} />
          Accetto l'informativa privacy: i dati sono usati solo per l'attivazione del circuito di
          welfare territoriale.
        </span>
      </label>
      {errors.privacy && <span className="ob-field-error is-block">{errors.privacy}</span>}

      <div className="ob-form-actions">
        <button type="button" className="ob-btn is-ghost" onClick={onBack}>
          <ArrowLeft className="size-4" strokeWidth={2} />
          Torna al profilo
        </button>
        <button type="submit" className="ob-btn is-primary" disabled={sending}>
          {sending ? (
            <>
              <Loader2 className="size-4 animate-spin" strokeWidth={2} />
              Attivazione…
            </>
          ) : (
            <>
              {profile.form.submitLabel}
              <Send className="size-4" strokeWidth={2} />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
