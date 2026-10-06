import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Users,
  Sprout,
  Hotel,
  Drama,
  ShieldCheck,
  FileCheck2,
  Handshake,
  BadgeCheck,
  Sprout as SproutIcon,
  Leaf,
  Euro,
  Banknote,
  CalendarCheck,
} from "lucide-react";
import type { Params, Results } from "../../lib/model";
import { fmtInt, fmtEUR, fmtDec } from "../../lib/model";

/* ------------------------------------------------------------------ */
/*  Profilatore Spaziale — i 5 attori dell'ecosistema                  */
/*  (SKILL §4.1: differenziazione funzionale dei profili)              */
/* ------------------------------------------------------------------ */

export interface MicroRow {
  label: string;
  value: string;
  hint: string;
  formula: string;
  accent?: "primary" | "alt";
}

export interface FormField {
  name: string;
  label: string;
  type: "text" | "email" | "number" | "select" | "textarea";
  placeholder?: string;
  required?: boolean;
  options?: string[];
}

export interface Profile {
  id: string;
  index: number;
  name: string;
  short: string;
  role: string;
  ambito: string;
  accent: string;
  accentSoft: string;
  icon: LucideIcon;
  /** Metrica live mostrata sul pilastro 3D (dal motore parametrico) */
  pillarMetric: (p: Params, r: Results) => string;
  pillarSub: (p: Params, r: Results) => string;
  /** Micro-simulatore reattivo (SKILL §5.1) */
  micro: {
    slider: {
      label: string;
      min: number;
      max: number;
      step: number;
      default: (p: Params) => number;
      unit: string;
    };
    rows: (p: Params, r: Results, local: number) => MicroRow[];
  };
  requisiti: { icon: LucideIcon; text: string }[];
  vantaggi: string[];
  faq: { q: string; a: string }[];
  form: {
    intro: string;
    fields: FormField[];
    submitLabel: string;
  };
}

/* ------------------------------ helper ------------------------------ */

const eur = (n: number) => fmtEUR(n);
const int = (n: number) => fmtInt(Math.round(n));

/* ------------------------------ 5 profili ------------------------------ */

export const PROFILES: Profile[] = [
  {
    id: "imprese",
    index: 0,
    name: "Grandi Imprese & Direzioni HR",
    short: "Imprese & HR",
    role: "Finanziatrici del welfare",
    ambito:
      "Ottimizzazione dei piani welfare, welfare aziendale deducibile (art. 51 TUIR), retention del capitale umano e rendicontazione non finanziaria ESG/CSRD.",
    accent: "#7dd3fc",
    accentSoft: "rgba(125,211,252,0.14)",
    icon: Building2,
    pillarMetric: (_p, r) => eur(r.spesaCSR),
    pillarSub: () => "budget CSR annuale mobilitato",
    micro: {
      slider: {
        label: "Dipendenti coinvolti nel piano",
        min: 10,
        max: 500,
        step: 5,
        default: (p) => p.dipendentiPerImpresa,
        unit: "persone",
      },
      rows: (p, _r, local) => {
        const deducibile =
          local *
          ((p.tassoAdesioneHotel / 100) * p.costoVoucherHotel +
            (p.tassoAdesioneAperitivo / 100) * p.costoVoucherAperitivo);
        const esperienze =
          local *
          ((p.tassoAdesioneHotel / 100) * p.moltiplicatoreHotel +
            (p.tassoAdesioneAperitivo / 100) * p.moltiplicatoreAperitivo);
        const stabilizzati = local * (Math.max(p.churnRateAsIs - p.churnRateToBe, 0) / 100);
        return [
          {
            label: "Monte voucher deducibile / anno",
            value: eur(deducibile),
            hint: `Budget CSR già in bilancio: nessun nuovo costo fuori budget · ${p.tassoAdesioneHotel}% hotel + ${p.tassoAdesioneAperitivo}% food`,
            formula: `${int(local)} × (${p.tassoAdesioneHotel}%×${eur(p.costoVoucherHotel)} + ${p.tassoAdesioneAperitivo}%×${eur(p.costoVoucherAperitivo)})`,
            accent: "primary",
          },
          {
            label: "Esperienze esperienziali erogate",
            value: int(esperienze),
            hint: "Notti in hotel/agriturismo + coperti food, accompagnatori inclusi",
            formula: `${int(local)} × (${p.tassoAdesioneHotel}%×${fmtDec(p.moltiplicatoreHotel, 1)} + ${p.tassoAdesioneAperitivo}%×${fmtDec(p.moltiplicatoreAperitivo, 1)})`,
          },
          {
            label: "Dipendenti stabilizzati dalla retention",
            value: int(stabilizzati),
            hint: `Churn ${fmtDec(p.churnRateAsIs, 1)}% → ${fmtDec(p.churnRateToBe, 1)}%: revocare il welfare revocherebbe i benefit`,
            formula: `${int(local)} × (${fmtDec(p.churnRateAsIs, 1)}% − ${fmtDec(p.churnRateToBe, 1)}%)`,
          },
        ];
      },
    },
    requisiti: [
      { icon: FileCheck2, text: "Partita IVA e bilanci o ultimo bilancio depositato" },
      { icon: ShieldCheck, text: "Budget CSR o welfare già stanziato (nessun nuovo esborso)" },
      { icon: BadgeCheck, text: "Almeno 10 dipendenti presso la sede servizia" },
      { icon: Handshake, text: "Nomina di un referente HR/CSR per l'attivazione" },
    ],
    vantaggi: [
      "Zero canoni di piattaforma: l'operatore vending già presente in azienda fa da hub.",
      "Welfare 100% deducibile da budget CSR esistente (art. 51 TUIR).",
      "Touchpoint di sostenibilità concreti sul posto di lavoro: ESG misurabile, non dichiarativo.",
      "Retention documentata: churn contrattuale 10% → 2%.",
      "Campagna di adesione dipendenti gestita dall'operatore con kit HR pronto all'uso.",
    ],
    faq: [
      {
        q: "Quanto costa all'azienda attivare il piano?",
        a: "Zero costi di attivazione e zero canoni ricorrenti. L'azienda sposta sul circuito voucher welfare il budget CSR che già destina a benefit: il valore è identico, ma genera esperienze reali, retention misurabile e rendicontazione ESG.",
      },
      {
        q: "Il welfare è deducibile?",
        a: "Sì. I voucher esperienziali rientrano tra i benefit di cui all'art. 51 TUIR: l'impresa li deduce e i dipendenti li ricevono senza concorrenza alla formazione del reddito entro i limiti di legge.",
      },
      {
        q: "Come si misura l'impatto ESG?",
        a: "La piattaforma produce un report annuale: esperienze erogate, occupazione indotta nel territorio, chilometri logistici evitati e CO₂ risparmiata sulla filiera Km 0 — dati pronti per il bilancio di sostenibilità (CSRD).",
      },
      {
        q: "Cosa succede se un dipendente non usa i voucher?",
        a: "I voucher sono nominali e trasferibili ai familiari entro i termini; l'adesione è volontaria e i tassi di utilizzo tipici (16% hotel, 25% food) sono già conteggiati nei piani, quindi il budget non viene mai superato.",
      },
    ],
    form: {
      intro: "Candidatura aziendale al circuito di welfare territoriale. Un referente HR ti contatta entro 48 ore con il piano di attivazione su misura.",
      fields: [
        { name: "ragioneSociale", label: "Ragione sociale", type: "text", placeholder: "Es. Rossi Manufacturing S.p.A.", required: true },
        { name: "referente", label: "Referente HR / CSR", type: "text", placeholder: "Nome e cognome", required: true },
        { name: "email", label: "Email aziendale", type: "email", placeholder: "nome@azienda.it", required: true },
        { name: "dipendenti", label: "Dipendenti nella sede", type: "number", placeholder: "Es. 120", required: true },
        { name: "piva", label: "Partita IVA", type: "text", placeholder: "IT01234567890", required: true },
        { name: "note", label: "Note (facoltativo)", type: "textarea", placeholder: "Es. due turni, sede con distributori automatici già installati…" },
      ],
      submitLabel: "Invia candidatura aziendale",
    },
  },

  {
    id: "addetti",
    index: 1,
    name: "Addetti delle Imprese Clienti",
    short: "Addetti & Dipendenti",
    role: "Beneficiari e motore virale",
    ambito:
      "Accesso a benefit reali — soggiorni, ristorazione, spettacolo — e consegna delle produzioni di qualità direttamente sul posto di lavoro, a costo zero.",
    accent: "#7fce9b",
    accentSoft: "rgba(127,206,155,0.14)",
    icon: Users,
    pillarMetric: (p) => eur(p.costoVoucherHotel + p.costoVoucherAperitivo),
    pillarSub: () => "valore benefit per addetto / anno",
    micro: {
      slider: {
        label: "Panieri Km 0 ordinati al mese",
        min: 0,
        max: 12,
        step: 1,
        default: (p) => Math.min(4, Math.max(1, Math.round(p.frequenzaAcquistiKmZero / 2))),
        unit: "panieri",
      },
      rows: (p, _r, local) => {
        const benefit = p.costoVoucherHotel + p.costoVoucherAperitivo;
        const ordiniAnno = local * 12;
        const kmEvitati = ordiniAnno * p.trattaLogisticaEvitata;
        return [
          {
            label: "Valore lordo benefit / anno",
            value: eur(benefit),
            hint: `Voucher hotel ${eur(p.costoVoucherHotel)} + esperienza food ${eur(p.costoVoucherAperitivo)}: costo di ingresso €0`,
            formula: `${eur(p.costoVoucherHotel)} + ${eur(p.costoVoucherAperitivo)}`,
            accent: "primary",
          },
          {
            label: "Spesa locale generata in ufficio",
            value: eur(ordiniAnno * p.scontrinoMedioKmZero),
            hint: "Panieri di produttori del territorio consegnati sui giri vending esistenti",
            formula: `${int(local)} × 12 × ${eur(p.scontrinoMedioKmZero)}`,
          },
          {
            label: "Trasporto evitato per la consegna",
            value: `${int(kmEvitati)} km`,
            hint: `Zero spese di trasporto per te: la consegna viaggia sul giro già pianificato · −${fmtDec(kmEvitati * p.fattoreEmissioniTrasporto, 0)} kg CO₂`,
            formula: `${int(local)} × 12 × ${p.trattaLogisticaEvitata} km`,
          },
        ];
      },
    },
    requisiti: [
      { icon: BadgeCheck, text: "Matricola o email aziendale di una impresa cliente" },
      { icon: FileCheck2, text: "Documento di identità per la verifica del benefit" },
      { icon: ShieldCheck, text: "Accettazione dell'informativa privacy sui dati dei benefit" },
      { icon: Handshake, text: "Nessun costo di ingresso, mai" },
    ],
    vantaggi: [
      "Voucher esperienziali finanziati al 100% dall'azienda: hotel, food ed eventi.",
      "Panieri Km 0 consegnati in ufficio: zero spese di trasporto, zero code.",
      "Certificato welfare personale: mostrandolo ad amici sblocchi nuovi benefit virali.",
      "Accesso al matching grant culturale: platee qualificate a prezzo zero.",
      "Gli accompagnatori (familiari) moltiplicano il valore del voucher ×2.",
    ],
    faq: [
      {
        q: "Devo pagare qualcosa?",
        a: "No. L'iscrizione è gratuita e i voucher sono finanziati dal budget welfare della tua azienda. L'unica spesa possibile è l'eventuale upgrade esperienziale che scegli liberamente.",
      },
      {
        q: "Come ricevo i panieri Km 0?",
        a: "Ordini dalla piattaforma entro il mercoledì; il venerdì il paniere arriva in sede consegnato dal giro di rifornimento dei distributori automatici. Nessun costo di spedizione.",
      },
      {
        q: "I voucher scadono?",
        a: "Hanno validità 12 mesi dall'emissione e sono utilizzabili in più strutture convenzionate. Puoi cedere un voucher a un familiare: il benefit si moltiplica con gli accompagnatori.",
      },
      {
        q: "Cos'è il certificato welfare?",
        a: "È il badge digitale che attesti la partecipazione al circuito. Condividendolo con amici e conoscenti attivi il referral HR-to-HR: se la loro azienda aderisce, guadagni benefit aggiuntivi.",
      },
    ],
    form: {
      intro: "Registrazione addetto: ricevi i voucher welfare dell'azienda e l'accesso alla filiera Km 0 consegnata in ufficio.",
      fields: [
        { name: "nome", label: "Nome e cognome", type: "text", placeholder: "Es. Giulia Bianchi", required: true },
        { name: "email", label: "Email", type: "email", placeholder: "giulia.bianchi@azienda.it", required: true },
        { name: "matricola", label: "Matricola aziendale", type: "text", placeholder: "Es. MAT-10482", required: true },
        { name: "azienda", label: "Azienda", type: "text", placeholder: "Ragione sociale del datore di lavoro", required: true },
        { name: "sede", label: "Sede / ufficio", type: "text", placeholder: "Es. Sede di Torino, piano 2" },
        {
          name: "preferenza",
          label: "Voucher preferito",
          type: "select",
          options: ["Entrambi", "Soggiorno hotel", "Esperienza food"],
        },
      ],
      submitLabel: "Attiva i miei benefit",
    },
  },

  {
    id: "produttori",
    index: 2,
    name: "Produttori Filiera Km 0",
    short: "Produttori Km 0",
    role: "Canale diretto ad alto valore",
    ambito:
      "Canale di sbocco commerciale diretto ad alto valore aggiunto, disintermediazione rispetto alla GDO, prezzo pieno garantito su ogni paniere.",
    accent: "#a3e635",
    accentSoft: "rgba(163,230,53,0.14)",
    icon: Sprout,
    pillarMetric: (_p, r) => eur(r.fatturatoKm0),
    pillarSub: () => "fatturato filiera corta / anno",
    micro: {
      slider: {
        label: "Panieri consegnati a settimana",
        min: 1,
        max: 60,
        step: 1,
        default: () => 12,
        unit: "panieri",
      },
      rows: (p, _r, local) => {
        const sett = local * 52;
        const fatturato = sett * p.scontrinoMedioKmZero;
        const km = sett * p.trattaLogisticaEvitata;
        return [
          {
            label: "Fatturato diretto stimato / anno",
            value: eur(fatturato),
            hint: `Prezzo pieno garantito: ${eur(p.scontrinoMedioKmZero)} a paniere, 0% commissioni di piattaforma`,
            formula: `${int(local)} × 52 × ${eur(p.scontrinoMedioKmZero)}`,
            accent: "primary",
          },
          {
            label: "Chilometri di trasporto evitati",
            value: `${int(km)} km`,
            hint: "Consegna in concessionaria logistica della flotta vending: tratte dedicate azzerate",
            formula: `${int(local)} × 52 × ${p.trattaLogisticaEvitata} km`,
          },
          {
            label: "CO₂ evitata (Scope 3 certificabile)",
            value: `−${fmtDec((km * p.fattoreEmissioniTrasporto) / 1000, 1)} t`,
            hint: `Dato rendicontabile per il report di sostenibilità dei clienti · ${p.fattoreEmissioniTrasporto} kg/km`,
            formula: `${int(km)} km × ${p.fattoreEmissioniTrasporto} kg/km`,
          },
        ];
      },
    },
    requisiti: [
      { icon: FileCheck2, text: "Impresa agricola iscritta al Registro delle Imprese (CCIAA)" },
      { icon: Leaf, text: "Produzioni del territorio: filiera corta certificabile" },
      { icon: ShieldCheck, text: "Dichiarazione di conformità igienico-sanitaria (HACCP)" },
      { icon: Handshake, text: "Disponibilità a consegne sul giro logistico condiviso" },
    ],
    vantaggi: [
      "Sbocco B2B diretto e programmato: ordini settimanali ricorrenti, non occasionali.",
      "Disintermediazione dalla GDO: prezzo pieno, zero commissioni, zero referenze.",
      "Logistica condivisa con la flotta dei distributori: tratte dedicate azzerate.",
      "Rendicontazione Scope 3 GHG certificabile per i tuoi clienti corporate.",
      "Relazione diretta con il consumatore finale: dati sui consumi, non solo fatturato.",
    ],
    faq: [
      {
        q: "Quanto ricavo realmente su un paniere?",
        a: "Il 100% del prezzo convenzionato: il circuito non applica commissioni di piattaforma. Il costo di consegna è assorbito dalla flotta vending che già percorre le tratte.",
      },
      {
        q: "Devo organizzare i trasporti?",
        a: "No. Consegni i panieri in un punto di raccolta convenzionato; la distribuzione finale avviene sui giri di rifornimento esistenti. Le tratte dedicate — e le relative emissioni — si azzerano.",
      },
      {
        q: "Come vengono stabiliti i volumi?",
        a: "I volumi sono concordati a inizio stagione in base alle adesioni delle aziende servite. La programmazione settimanale ti garantisce ordini prevedibili, non picchi casuali.",
      },
      {
        q: "Posso partecipare con produzioni non alimentari?",
        a: "Sì: artigianato, vivaismo e trasformati rientrano nel circuito se coerenti con la filiera territoriale e conformi agli standard igienico-sanitari.",
      },
    ],
    form: {
      intro: "Candidatura produttore: entra nella filiera corta che rifornisce i luoghi di lavoro del territorio.",
      fields: [
        { name: "azienda", label: "Azienda agricola", type: "text", placeholder: "Es. Cascina del Ponte", required: true },
        { name: "referente", label: "Referente", type: "text", placeholder: "Nome e cognome", required: true },
        { name: "email", label: "Email", type: "email", placeholder: "info@cascina.it", required: true },
        { name: "comune", label: "Comune / Provincia", type: "text", placeholder: "Es. Pinerolo (TO)", required: true },
        { name: "produzioni", label: "Produzioni tipiche", type: "textarea", placeholder: "Es. ortaggi, formaggi, miele, confetture…" },
        {
          name: "certificazioni",
          label: "Certificazioni",
          type: "select",
          options: ["Nessuna", "Biologico", "DOP / IGP", "Km0 verificato"],
        },
      ],
      submitLabel: "Candida la mia azienda",
    },
  },

  {
    id: "accoglienza",
    index: 3,
    name: "Strutture Ricettive & Food",
    short: "Ricettività & Food",
    role: "Occupazione infrasettimanale",
    ambito:
      "Occupazione e consumo nei periodi infrasettimanali, disintermediazione dalle commissioni predatorie delle piattaforme OTA, moltiplicatore d'indotto per accompagnatori.",
    accent: "#e2a63d",
    accentSoft: "rgba(226,166,61,0.14)",
    icon: Hotel,
    pillarMetric: (_p, r) => eur(r.quotaHotel),
    pillarSub: () => "volume d'affari diretto hotel",
    micro: {
      slider: {
        label: "Camere convenzionate",
        min: 1,
        max: 60,
        step: 1,
        default: () => 12,
        unit: "camere",
      },
      rows: (p, _r, local) => {
        const notti = local * 365 * (p.tassoAdesioneHotel / 100) * p.moltiplicatoreHotel;
        const volume = notti * p.prezzoHotel;
        const commissioniOta = volume * 0.18;
        return [
          {
            label: "Volume d'affari diretto / anno",
            value: eur(volume),
            hint: `Tariffa convenzionata ${eur(p.prezzoHotel)} · nessuna commissione OTA sul canale welfare`,
            formula: `${int(local)} × 365 × ${p.tassoAdesioneHotel}% × ${fmtDec(p.moltiplicatoreHotel, 1)} × ${eur(p.prezzoHotel)}`,
            accent: "primary",
          },
          {
            label: "Commissioni OTA risparmiate",
            value: eur(commissioniOta),
            hint: "Rispetto al canale delle piattaforme turistiche (commissione media 18%): liquidazione diretta e garantita",
            formula: `${eur(volume)} × 18%`,
          },
          {
            label: "Notti infrasettimanali generate",
            value: int(notti),
            hint: "Riempimento dei giorni morti: i voucher si usano fuori alta stagione",
            formula: `${int(local)} × 365 × ${p.tassoAdesioneHotel}% × ${fmtDec(p.moltiplicatoreHotel, 1)}`,
          },
        ];
      },
    },
    requisiti: [
      { icon: FileCheck2, text: "Struttura regolarmente registrata (SCIA / codice struttura)" },
      { icon: BadgeCheck, text: "Tariffa convenzionata e disponibilità infrasettimanale" },
      { icon: ShieldCheck, text: "Polizza RC e conformità alle norme di sicurezza" },
      { icon: CalendarCheck, text: "Contingenti di camere/coperti concordati e aggiornabili" },
    ],
    vantaggi: [
      "Occupazione nei periodi infrasettimanali, quando la struttura è vuota.",
      "Disintermediazione dalle commissioni predatorie delle OTA (18% medio).",
      "Liquidazione rapida e garantita dei voucher: flusso di cassa prevedibile.",
      "Moltiplicatore d'indotto: ogni voucher porta accompagnatori (×2,5 sul territorio).",
      "Visibilità qualificata su un circuito corporate, non su listini aggregati.",
    ],
    faq: [
      {
        q: "Come funziona la liquidazione dei voucher?",
        a: "La struttura carica il voucher in piattaforma e riceve il pagamento entro 30 giorni, garantito dal circuito. Nessuna trattenuta, nessuna commissione: la tariffa convenzionata è il tuo ricavo netto.",
      },
      {
        q: "Devo accettare prenotazioni tutto l'anno?",
        a: "No: concordi contingenti di camere o coperti per periodo. L'obiettivo è riempire l'infrasettimanale — puoi chiudere i contingenti in alta stagione.",
      },
      {
        q: "Gli ospiti voucher sono di basso profilo?",
        a: "Sono dipendenti di aziende del territorio con benefit erogati dall'azienda: potere di spesa strutturato e feedback verificati. L'accompagnatore moltiplica la spesa accessoria sul territorio.",
      },
      {
        q: "Posso aderire con un ristorante o un agriturismo?",
        a: "Sì. Hotel, agriturismi, ristoranti e cantine rientrano nello stesso circuito con le stesse regole di liquidazione e contingenti.",
      },
    ],
    form: {
      intro: "Candidatura struttura: entra nel circuito welfare con tariffe convenzionate e liquidazione garantita.",
      fields: [
        { name: "struttura", label: "Nome della struttura", type: "text", placeholder: "Es. Hotel Centrale", required: true },
        {
          name: "tipologia",
          label: "Tipologia",
          type: "select",
          options: ["Hotel", "Agriturismo", "Ristorante", "Cantina / Enoteca"],
          required: true,
        },
        { name: "referente", label: "Referente", type: "text", placeholder: "Nome e cognome", required: true },
        { name: "email", label: "Email", type: "email", placeholder: "info@struttura.it", required: true },
        { name: "comune", label: "Comune", type: "text", placeholder: "Es. Saluzzo (CN)", required: true },
        { name: "unita", label: "Camere / coperti disponibili", type: "number", placeholder: "Es. 18" },
      ],
      submitLabel: "Invia candidatura struttura",
    },
  },

  {
    id: "cultura",
    index: 4,
    name: "Operatori Culturali & Eventi",
    short: "Cultura & Eventi",
    role: "Matching grant & audience",
    ambito:
      "Ampliamento del pubblico, attivazione del fondo Matching Grant per la copertura dei biglietti omaggio, viralità da passaparola (K-Factor) e misurazione dell'impatto economico territoriale.",
    accent: "#c4b5fd",
    accentSoft: "rgba(196,181,253,0.14)",
    icon: Drama,
    pillarMetric: (_p, r) => int(r.biglietti),
    pillarSub: () => "biglietti omaggio finanziati / anno",
    micro: {
      slider: {
        label: "Repliche dell'evento / anno",
        min: 1,
        max: 24,
        step: 1,
        default: (p) => Math.max(1, Math.min(12, Math.round(p.personePerEvento / 100))),
        unit: "repliche",
      },
      rows: (p, _r, local) => {
        const presenze = local * p.personePerEvento;
        const indotto = presenze * p.spesaMediaTerritorioEvento;
        return [
          {
            label: "Presenze aggiuntive generate",
            value: int(presenze),
            hint: `Platee qualificate dai dipendenti delle aziende partner · ${p.personePerEvento} persone per replica`,
            formula: `${int(local)} × ${int(p.personePerEvento)}`,
            accent: "primary",
          },
          {
            label: "Indotto economico sul territorio",
            value: eur(indotto),
            hint: `Spesa media per spettatore su trasporti, ristorazione e shopping: ${eur(p.spesaMediaTerritorioEvento)}`,
            formula: `${int(presenze)} × ${eur(p.spesaMediaTerritorioEvento)}`,
          },
          {
            label: "Biglietti omaggio in matching grant",
            value: int(_r.biglietti),
            hint: `Grant della startup a ${eur(p.costoBiglietto)}/biglietto, ripagato dalle commissioni sui voucher`,
            formula: `${int(_r.biglietti)} × ${eur(p.costoBiglietto)} = ${eur(_r.costoBiglietti)}`,
          },
        ];
      },
    },
    requisiti: [
      { icon: FileCheck2, text: "Ente, compagnia o startup culturale con codice fiscale / P.IVA" },
      { icon: BadgeCheck, text: "Programmazione di almeno una produzione all'anno" },
      { icon: ShieldCheck, text: "Conformità agli obblighi SIAE e agibilità del luogo" },
      { icon: Handshake, text: "Adesione al fondo Matching Grant e rendicontazione" },
    ],
    vantaggi: [
      "Matching grant: i biglietti omaggio sono co-finanziati dalla startup del circuito.",
      "Ampliamento del pubblico: platee qualificate da dipendenti delle aziende partner.",
      "Viralità da passaparola programmata: K-Factor misurabile e convergente.",
      "Misurazione dell'impatto economico territoriale per bandi e sponsor.",
      "Co-finanziamento garantito: nessun anticipo di cassa per l'organizzatore.",
    ],
    faq: [
      {
        q: "Cos'è esattamente il Matching Grant?",
        a: "È un fondo con cui la startup del circuito co-finanzia i biglietti omaggio destinati ai dipendenti-beneficiari. Il costo del grant è ripagato dalle commissioni sui voucher hotel e food: il tuo evento incassa pubblico nuovo a costo marginale zero.",
      },
      {
        q: "Come vengono distribuiti i biglietti?",
        a: "Attraverso i voucher welfare delle aziende partner: ogni voucher sblocca un biglietto omaggio per gli eventi in programma. La piattaforma gestisce prenotazioni e controllo accessi.",
      },
      {
        q: "Devo scontare il mio cartellino?",
        a: "No. Il grant copre il biglietto omaggio; gli altri canali di vendita restano invariati. Il circuito aggiunge pubblico senza erodere il tuo prezzo di listino.",
      },
      {
        q: "Come si misura l'impatto?",
        a: "Report per edizione: presenze, fedeli, referral generati e indotto economico sul territorio (spesa media per spettatore). Dati utilizzabili per bandi, sponsor e rendicontazione.",
      },
    ],
    form: {
      intro: "Candidatura operatore culturale: accedi al fondo Matching Grant e alle platee del circuito welfare.",
      fields: [
        { name: "ente", label: "Compagnia / ente / festival", type: "text", placeholder: "Es. Associazione Scena Aperta", required: true },
        { name: "referente", label: "Referente", type: "text", placeholder: "Nome e cognome", required: true },
        { name: "email", label: "Email", type: "email", placeholder: "info@scenaaperta.it", required: true },
        {
          name: "tipologia",
          label: "Tipologia",
          type: "select",
          options: ["Teatro", "Festival", "Musica / live", "Startup culturale"],
          required: true,
        },
        { name: "produzioni", label: "Produzioni / anno", type: "number", placeholder: "Es. 8" },
        { name: "descrizione", label: "Descrizione attività", type: "textarea", placeholder: "Rassegne, residenze, pubblico abituale…" },
      ],
      submitLabel: "Candida il mio progetto",
    },
  },
];

/* icone usate nei requisiti (ri-esport per comodità) */
export const REQ_ICONS = { ShieldCheck, FileCheck2, Handshake, BadgeCheck, SproutIcon, Leaf, Euro, Banknote, CalendarCheck };
