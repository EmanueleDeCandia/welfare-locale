import { useSyncExternalStore } from "react";
import {
  DEFAULT_PARAMS,
  PRESETS,
  computeResults,
  type Params,
  type Results,
  type ScenarioKey,
} from "./model";

/* ------------------------------------------------------------------ */
/*  Store condiviso — ponte reattivo Simulatore ↔ Onboarding 3D        */
/*  (SKILL §5: flusso dati bidirezionale, lettura parametri live)      */
/* ------------------------------------------------------------------ */

export interface SimState {
  params: Params;
  scenario: ScenarioKey | "custom";
}

let state: SimState = { params: DEFAULT_PARAMS, scenario: "realistico" };
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function getSimState(): SimState {
  return state;
}

export function setSimParam(key: keyof Params, value: number) {
  state = {
    params: { ...state.params, [key]: value },
    scenario: "custom",
  };
  emit();
}

export function applySimScenario(key: ScenarioKey) {
  state = {
    params: { ...DEFAULT_PARAMS, ...PRESETS[key] },
    scenario: key,
  };
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Stato grezzo del simulatore (parametri + scenario attivo). */
export function useSimState(): SimState {
  return useSyncExternalStore(subscribe, getSimState, getSimState);
}

/** Risultati calcolati dal motore parametrico, sempre allineati ai parametri live. */
export function useSimResults(): { params: Params; results: Results; scenario: SimState["scenario"] } {
  const { params, scenario } = useSimState();
  const results = computeResults(params);
  return { params, results, scenario };
}

/* ------------------------------------------------------------------ */
/*  Handoff "GIRA ORA" → Onboarding                                     */
/*  Payload dell'evento di arresto della giostra (SKILL §2)            */
/* ------------------------------------------------------------------ */

export interface HandoffPayload {
  /** Indice della carta estratta dalla roulette (0..7) */
  cardIndex: number;
  /** Colore accent della carta focale — origine cromatica della transizione */
  accent: string;
  /** Titolo della leva estratta */
  title: string;
  /** Timestamp dell'evento di arresto */
  at: number;
}

let handoff: HandoffPayload | null = null;
const handoffListeners = new Set<() => void>();

export function getHandoff(): HandoffPayload | null {
  return handoff;
}

export function setHandoff(payload: HandoffPayload | null) {
  handoff = payload;
  handoffListeners.forEach((l) => l());
}

function subscribeHandoff(listener: () => void) {
  handoffListeners.add(listener);
  return () => handoffListeners.delete(listener);
}

export function useHandoff(): HandoffPayload | null {
  return useSyncExternalStore(subscribeHandoff, getHandoff, getHandoff);
}
