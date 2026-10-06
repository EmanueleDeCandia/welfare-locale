import { useEffect, useRef, useState } from "react";

/* Osserva l'ingresso in viewport per le animazioni reveal */
export function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setInView(true);
            obs.disconnect();
          }
        });
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, inView };
}

/* Conteggio animato fluido verso il valore target (ease-out cubic) */
export function useCountUp(target: number, duration = 650) {
  const [value, setValue] = useState(target);
  const valueRef = useRef(target);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const from = valueRef.current;
    if (from === target) return;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = from + (target - from) * eased;
      valueRef.current = v;
      setValue(v);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    };
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}

/* Metadati viewport per ridimensionare il carosello 3D */
export function useViewportWidth() {
  const [w, setW] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1280
  );
  useEffect(() => {
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setW(window.innerWidth));
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, []);
  return w;
}
