/* ------------------------------------------------------------------ */
/*  Motore di calcolo — Simulatore Welfare Territoriale (PDR v2.0)     */
/* ------------------------------------------------------------------ */

export interface Params {
  // 3.1 Welfare & Referral CSR
  impreseClienti: number;
  dipendentiPerImpresa: number;
  tassoAdesioneHotel: number;
  tassoAdesioneAperitivo: number;
  moltiplicatoreHotel: number;
  moltiplicatoreAperitivo: number;
  referralRate: number;
  conversionRate: number;
  cicliReferral: number;
  costoBiglietto: number;
  costoVoucherHotel: number;
  costoVoucherAperitivo: number;
  prezzoHotel: number;
  prezzoAperitivo: number;
  margineStartupHotel: number;
  margineStartupAperitivo: number;
  invitiMediPerAmbassador: number;
  fattoreEspansioneMercato: number;
  // 3.2 Pipeline B2B & Churn
  valoreMedioAcquisto: number;
  churnRateAsIs: number;
  churnRateToBe: number;
  nuoviProspectRate: number;
  tassoChiusuraProspect: number;
  moltiplicatoreTurismo: number;
  // 3.3 Filiera Km 0 & ESG
  adozioneKmZero: number;
  frequenzaAcquistiKmZero: number;
  scontrinoMedioKmZero: number;
  trattaLogisticaEvitata: number;
  fattoreEmissioniTrasporto: number;
  // 3.4 Advertising & Event Loyalty
  personePerEvento: number;
  retentionRateEvento: number;
  invitiMediEvento: number;
  referralRateEvento: number;
  conversionRateEvento: number;
  cicliEvento: number;
  spesaMediaTerritorioEvento: number;
  artistiPerEvento: number;
}

export type ScenarioKey = "conservativo" | "realistico" | "ottimistico";

export const DEFAULT_PARAMS: Params = {
  impreseClienti: 150,
  dipendentiPerImpresa: 30,
  tassoAdesioneHotel: 16,
  tassoAdesioneAperitivo: 25,
  moltiplicatoreHotel: 2,
  moltiplicatoreAperitivo: 2,
  referralRate: 25,
  conversionRate: 25,
  cicliReferral: 3,
  costoBiglietto: 25,
  costoVoucherHotel: 50,
  costoVoucherAperitivo: 25,
  prezzoHotel: 50,
  prezzoAperitivo: 25,
  margineStartupHotel: 25,
  margineStartupAperitivo: 75,
  invitiMediPerAmbassador: 5,
  fattoreEspansioneMercato: 3,
  valoreMedioAcquisto: 1000,
  churnRateAsIs: 10,
  churnRateToBe: 2,
  nuoviProspectRate: 30,
  tassoChiusuraProspect: 20,
  moltiplicatoreTurismo: 2.5,
  adozioneKmZero: 20,
  frequenzaAcquistiKmZero: 6,
  scontrinoMedioKmZero: 30,
  trattaLogisticaEvitata: 50,
  fattoreEmissioniTrasporto: 0.19,
  personePerEvento: 1000,
  retentionRateEvento: 40,
  invitiMediEvento: 5,
  referralRateEvento: 20,
  conversionRateEvento: 30,
  cicliEvento: 3,
  spesaMediaTerritorioEvento: 50,
  artistiPerEvento: 20,
};

export const PRESETS: Record<ScenarioKey, Partial<Params>> = {
  conservativo: {
    impreseClienti: 100,
    dipendentiPerImpresa: 25,
    tassoAdesioneHotel: 10,
    tassoAdesioneAperitivo: 16,
    referralRate: 15,
    conversionRate: 15,
    cicliReferral: 2,
    invitiMediPerAmbassador: 4,
    fattoreEspansioneMercato: 2.5,
    churnRateToBe: 4,
    nuoviProspectRate: 20,
    tassoChiusuraProspect: 12,
    adozioneKmZero: 12,
    frequenzaAcquistiKmZero: 4,
    personePerEvento: 800,
    retentionRateEvento: 30,
    referralRateEvento: 12,
    conversionRateEvento: 20,
    cicliEvento: 2,
  },
  realistico: { ...DEFAULT_PARAMS },
  ottimistico: {
    impreseClienti: 220,
    dipendentiPerImpresa: 40,
    tassoAdesioneHotel: 22,
    tassoAdesioneAperitivo: 32,
    referralRate: 35,
    conversionRate: 35,
    cicliReferral: 4,
    invitiMediPerAmbassador: 6,
    fattoreEspansioneMercato: 4,
    churnRateToBe: 1,
    nuoviProspectRate: 40,
    tassoChiusuraProspect: 28,
    adozioneKmZero: 30,
    frequenzaAcquistiKmZero: 8,
    personePerEvento: 1500,
    retentionRateEvento: 50,
    referralRateEvento: 28,
    conversionRateEvento: 40,
    cicliEvento: 4,
    spesaMediaTerritorioEvento: 60,
  },
};

/* ------------------------------ Results ------------------------------ */

export interface CyclePoint {
  ciclo: string;
  nuovi: number;
  cumulato: number;
}

export interface EventEdition {
  edizione: string;
  partecipanti: number;
  fedeli: number;
  referral: number;
}

export interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

export interface Results {
  popolazione: number;
  aderentiHotel: number;
  aderentiAperitivo: number;
  seed: number;
  presenzeHotelSeed: number;
  presenzeAperitivoSeed: number;
  presenzeDiretteSeed: number;
  kFactor: number;
  tamEsteso: number;
  growth: number;
  cycles: CyclePoint[];
  biglietti: number;
  costoBiglietti: number;
  presenzeHotelTot: number;
  presenzeAperitivoTot: number;
  volumeHotel: number;
  volumeAperitivo: number;
  margineHotel: number;
  margineAperitivo: number;
  entrateLorde: number;
  margineNettoStartup: number;
  spesaHotel: number;
  spesaAperitivo: number;
  spesaCSR: number;
  quotaHotel: number;
  quotaAperitivo: number;
  impattoCSR: number;
  acquirentiKm0: number;
  ordiniKm0: number;
  fatturatoKm0: number;
  kmEvitati: number;
  co2Kg: number;
  totaleTerritorio: number;
  prospectB2B: number;
  nuoviClienti: number;
  valoreNuovi: number;
  deltaRetention: number;
  impreseSalvate: number;
  valoreRetention: number;
  totaleB2B: number;
  eventi: EventEdition[];
  presenzeEventi: number;
  indottoEventi: number;
  partecipantiTotali: number;
  presenzeTerritorio: number;
  valoreComplessivo: number;
  donut: DonutSlice[];
  churnDeltaPct: number;
  capacitaAssorbita: number;
}

export function computeResults(p: Params): Results {
  const r = Math.round;

  /* 5.1 Base seed */
  const popolazione = p.impreseClienti * p.dipendentiPerImpresa;
  const aderentiHotel = r((popolazione * p.tassoAdesioneHotel) / 100);
  const aderentiAperitivo = r((popolazione * p.tassoAdesioneAperitivo) / 100);
  const seed = Math.max(aderentiHotel, aderentiAperitivo);
  const presenzeHotelSeed = r(aderentiHotel * p.moltiplicatoreHotel);
  const presenzeAperitivoSeed = r(aderentiAperitivo * p.moltiplicatoreAperitivo);
  const presenzeDiretteSeed = Math.max(presenzeHotelSeed, presenzeAperitivoSeed);

  /* 5.2 Referral & K-factor */
  const kFactor = (p.referralRate / 100) * p.invitiMediPerAmbassador * (p.conversionRate / 100);
  const tamEsteso = r(seed * p.fattoreEspansioneMercato);
  const cycles: CyclePoint[] = [{ ciclo: "Seed", nuovi: seed, cumulato: seed }];
  let prevWave = seed;
  let growth = 0;
  for (let i = 2; i <= p.cicliReferral; i++) {
    const ambassador = r((prevWave * p.referralRate) / 100);
    const potenziali = r(ambassador * p.invitiMediPerAmbassador * (p.conversionRate / 100));
    const residua = Math.max(tamEsteso - (seed + growth), 0);
    const effettivi = Math.max(Math.min(potenziali, residua), 0);
    growth += effettivi;
    prevWave = effettivi;
    cycles.push({ ciclo: `Ciclo ${i}`, nuovi: effettivi, cumulato: seed + growth });
  }

  /* 5.3 Matching grant & startup */
  const biglietti = presenzeDiretteSeed;
  const costoBiglietti = biglietti * p.costoBiglietto;
  const presenzeHotelTot = r((aderentiHotel + growth) * p.moltiplicatoreHotel);
  const presenzeAperitivoTot = r((aderentiAperitivo + growth) * p.moltiplicatoreAperitivo);
  const volumeHotel = presenzeHotelTot * p.prezzoHotel;
  const volumeAperitivo = presenzeAperitivoTot * p.prezzoAperitivo;
  const margineHotel = volumeHotel * (p.margineStartupHotel / 100);
  const margineAperitivo = volumeAperitivo * (p.margineStartupAperitivo / 100);
  const entrateLorde = margineHotel + margineAperitivo;
  const margineNettoStartup = entrateLorde - costoBiglietti;

  /* 5.4 Spesa CSR */
  const spesaHotel = (aderentiHotel + growth) * p.costoVoucherHotel;
  const spesaAperitivo = (aderentiAperitivo + growth) * p.costoVoucherAperitivo;
  const spesaCSR = spesaHotel + spesaAperitivo;

  /* 5.5 Territorio */
  const quotaHotel = volumeHotel - margineHotel;
  const quotaAperitivo = volumeAperitivo - margineAperitivo;
  const impattoCSR = spesaCSR * p.moltiplicatoreTurismo;

  /* 5.6 Km 0 & CO2 */
  const acquirentiKm0 = r((popolazione * p.adozioneKmZero) / 100);
  const ordiniKm0 = acquirentiKm0 * p.frequenzaAcquistiKmZero;
  const fatturatoKm0 = ordiniKm0 * p.scontrinoMedioKmZero;
  const kmEvitati = ordiniKm0 * p.trattaLogisticaEvitata;
  const co2Kg = r(kmEvitati * p.fattoreEmissioniTrasporto);

  const totaleTerritorio = quotaHotel + quotaAperitivo + impattoCSR + fatturatoKm0;

  /* 5.7 Ritorno B2B operatore */
  const prospectB2B = r((growth * p.nuoviProspectRate) / 100);
  const nuoviClienti = r((prospectB2B * p.tassoChiusuraProspect) / 100);
  const valoreNuovi = nuoviClienti * p.valoreMedioAcquisto;
  const deltaRetention = Math.max(p.churnRateAsIs - p.churnRateToBe, 0);
  const impreseSalvate = r((p.impreseClienti * deltaRetention) / 100);
  const valoreRetention = impreseSalvate * p.valoreMedioAcquisto;
  const totaleB2B = valoreNuovi + valoreRetention;

  /* 5.8 Eventi loyalty */
  const eventi: EventEdition[] = [
    { edizione: "Ed. 1", partecipanti: p.personePerEvento, fedeli: 0, referral: 0 },
  ];
  let prevEv = p.personePerEvento;
  let presenzeEventi = p.personePerEvento;
  for (let e = 2; e <= p.cicliEvento; e++) {
    const fedeli = r((prevEv * p.retentionRateEvento) / 100);
    const ambassador = r((prevEv * p.referralRateEvento) / 100);
    const referral = r(ambassador * p.invitiMediEvento * (p.conversionRateEvento / 100));
    const tot = fedeli + referral;
    eventi.push({ edizione: `Ed. ${e}`, partecipanti: tot, fedeli, referral });
    presenzeEventi += tot;
    prevEv = tot;
  }
  const indottoEventi = presenzeEventi * p.spesaMediaTerritorioEvento;

  /* KPI globali */
  const partecipantiTotali = presenzeDiretteSeed + growth + presenzeEventi;
  const presenzeTerritorio = presenzeHotelTot + presenzeAperitivoTot + presenzeEventi;
  const valoreComplessivo = totaleB2B + totaleTerritorio + indottoEventi;

  const churnDeltaPct =
    p.churnRateAsIs > 0 ? ((p.churnRateAsIs - p.churnRateToBe) / p.churnRateAsIs) * 100 : 0;
  const capacitaAssorbita = tamEsteso > 0 ? ((seed + growth) / tamEsteso) * 100 : 0;

  const donut: DonutSlice[] = [
    { name: "Quota netta Hotel & Agriturismi", value: quotaHotel, color: "#e2a63d" },
    { name: "Quota netta Food & Aperitivi", value: quotaAperitivo, color: "#7dd3fc" },
    { name: "Indotto turistico 2,5×", value: impattoCSR, color: "#7fce9b" },
    { name: "Fatturato Filiera Km 0", value: fatturatoKm0, color: "#c4b5fd" },
    { name: "Valore B2B Operatore", value: totaleB2B, color: "#fb7185" },
  ];

  return {
    popolazione,
    aderentiHotel,
    aderentiAperitivo,
    seed,
    presenzeHotelSeed,
    presenzeAperitivoSeed,
    presenzeDiretteSeed,
    kFactor,
    tamEsteso,
    growth,
    cycles,
    biglietti,
    costoBiglietti,
    presenzeHotelTot,
    presenzeAperitivoTot,
    volumeHotel,
    volumeAperitivo,
    margineHotel,
    margineAperitivo,
    entrateLorde,
    margineNettoStartup,
    spesaHotel,
    spesaAperitivo,
    spesaCSR,
    quotaHotel,
    quotaAperitivo,
    impattoCSR,
    acquirentiKm0,
    ordiniKm0,
    fatturatoKm0,
    kmEvitati,
    co2Kg,
    totaleTerritorio,
    prospectB2B,
    nuoviClienti,
    valoreNuovi,
    deltaRetention,
    impreseSalvate,
    valoreRetention,
    totaleB2B,
    eventi,
    presenzeEventi,
    indottoEventi,
    partecipantiTotali,
    presenzeTerritorio,
    valoreComplessivo,
    donut,
    churnDeltaPct,
    capacitaAssorbita,
  };
}

/* ------------------------------ Formatters ------------------------------ */

export const fmtInt = (n: number) =>
  new Intl.NumberFormat("it-IT", { maximumFractionDigits: 0 }).format(n);

export const fmtEUR = (n: number) =>
  new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);

export const fmtDec = (n: number, d = 2) =>
  n.toLocaleString("it-IT", { minimumFractionDigits: d, maximumFractionDigits: d });
