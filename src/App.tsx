import { useEffect, useRef, useState } from "react";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import Ecosystem from "./components/Ecosystem";
import Simulator from "./components/Simulator";
import Orbital3D from "./components/Orbital3D";
import Footer from "./components/Footer";
import OnboardingPage from "./onboarding/components/OnboardingPage";
import HandoffGate from "./onboarding/components/HandoffGate";

/* Vista corrente: sito a sezioni oppure spazio di Onboarding 3D (#onboarding) */
function useHashView() {
  const [view, setView] = useState<"site" | "onboarding">(() =>
    typeof window !== "undefined" && window.location.hash === "#onboarding" ? "onboarding" : "site"
  );
  useEffect(() => {
    const onHash = () =>
      setView(window.location.hash === "#onboarding" ? "onboarding" : "site");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return view;
}

export default function App() {
  const view = useHashView();
  const wasOnboarding = useRef(false);

  /* rientro dalle sezioni: ripristina lo scroll sull'ancora richiesta */
  useEffect(() => {
    if (view === "onboarding") {
      wasOnboarding.current = true;
      return;
    }
    if (wasOnboarding.current) {
      wasOnboarding.current = false;
      const id = window.location.hash.replace("#", "");
      const el = id ? document.getElementById(id) : null;
      requestAnimationFrame(() =>
        el?.scrollIntoView({ behavior: "smooth", block: "start" })
      );
    }
  }, [view]);

  if (view === "onboarding") {
    return (
      <OnboardingPage
        onExit={(hash) => {
          window.location.hash = hash;
        }}
      />
    );
  }

  return (
    <div className="relative min-h-screen bg-ink font-sans text-bone">
      <div className="noise" aria-hidden />
      <Nav />
      <main>
        <Hero />
        <Ecosystem />
        <Simulator />
        <Orbital3D />
      </main>
      <Footer />
      <HandoffGate />
    </div>
  );
}
