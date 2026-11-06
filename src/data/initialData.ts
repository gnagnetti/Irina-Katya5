/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BoutiqueInfo, SalesObjectionItem } from '../types';

export const TARGET_BOUTIQUES = [
  'Boutique Nizhniy Novgorod',
  'Boutique Spb Bolshoy',
  'Boutique Ufa',
  "Boutique Perm'",
  'Boutique Samara',
  'Boutique Spb Nevskiy',
] as const;

export const BOUTIQUES_CATALOG: BoutiqueInfo[] = [
  {
    id: 'nizhniy-novgorod',
    name: 'Boutique Nizhniy Novgorod',
    door: 'Boutique Nizhniy Novgorod - 1',
    customerCode: '39663',
    city: 'Nizhny Novgorod',
    country: 'Russia',
    address: '23, Bolshaya Pokrovskaya St',
    buyerName: 'Buyer 1',
    buyerEmail: 'ira.mmmm@mail.ru',
    repName: 'Luca Gnagnetti',
    repEmail: 'gnagnetti1@gmail.com',
    currency: 'EUR (€)',
  },
  {
    id: 'spb-bolshoy',
    name: 'Boutique Spb Bolshoy',
    door: 'Boutique Spb Bolshoy - 1',
    customerCode: '73451',
    city: 'Saint Petersburg',
    country: 'Russia',
    address: 'P.S. Bolshoij Pr 29',
    buyerName: 'Buyer 1',
    buyerEmail: 'nevskiy.pr@gmail.com',
    repName: 'Luca Gnagnetti',
    repEmail: 'gnagnetti1@gmail.com',
    currency: 'EUR (€)',
  },
  {
    id: 'ufa',
    name: 'Boutique Ufa',
    door: 'Boutique Ufa - 1',
    customerCode: '73450',
    city: 'Ufa',
    country: 'Russia',
    address: 'Tc Art Gallery Ulitsa Chernyshevskogo, 75',
    buyerName: 'Buyer 1',
    buyerEmail: 'nevskiy.pr@gmail.com',
    repName: 'Luca Gnagnetti',
    repEmail: 'gnagnetti1@gmail.com',
    currency: 'EUR (€)',
  },
  {
    id: 'perm',
    name: "Boutique Perm'",
    door: "Boutique Perm' - 1",
    customerCode: '74326',
    city: 'Perm',
    country: 'Russia',
    address: 'Tc Galereya, Sibirskaya Str., 37',
    buyerName: 'Buyer 1',
    buyerEmail: 'nevskiy.pr@gmail.com',
    repName: 'Luca Gnagnetti',
    repEmail: 'gnagnetti1@gmail.com',
    currency: 'EUR (€)',
  },
  {
    id: 'samara',
    name: 'Boutique Samara',
    door: 'Boutique Samara - 1',
    customerCode: '39673',
    city: 'Samara',
    country: 'Russia',
    address: 'Kommunisticheskaya Str. 90 Tk Inkube',
    buyerName: 'Buyer 1',
    buyerEmail: 'nevskiy.pr@gmail.com',
    repName: 'Luca Gnagnetti',
    repEmail: 'gnagnetti1@gmail.com',
    currency: 'EUR (€)',
  },
  {
    id: 'spb-nevskiy',
    name: 'Boutique Spb Nevskiy',
    door: 'Boutique Spb Nevskiy - 1',
    customerCode: '74338',
    city: 'Saint Petersburg',
    country: 'Russia',
    address: 'Nevskiy Pr. 137',
    buyerName: 'Buyer 1',
    buyerEmail: 'nevskiy.pr@gmail.com',
    repName: 'Luca Gnagnetti',
    repEmail: 'gnagnetti1@gmail.com',
    currency: 'EUR (€)',
  },
];

export const SALES_OBJECTIONS_KNOWLEDGE_BASE: Record<string, SalesObjectionItem[]> = {
  general: [
    {
      objection: "Il prezzo al dettaglio è elevato rispetto al fast-luxury",
      customerRationale: "La cliente confronta il capo con brand commerciali di fascia media.",
      salesResponse: "Illustrare la filiera artigianale di Perugia: ogni capo Luisa Spagnoli attraversa oltre 40 passaggi sartoriali e collaudi manuali. Le fibre provengono da velli selezionati e mantengono la forma nel corso dei decenni.",
      luxuryCraftArgument: "Filati nobili Merinfleur e 100% Lana Vergine cardata a torsione calibrata, immuni al pilling e anallergici.",
      pairingSuggestion: "Proporre il total look abbinato a cintura Dominanza in pelle finitura oro per valorizzare la silhouette.",
    },
    {
      objection: "Preoccupazione per la manutenzione e il lavaggio dei capi nobili",
      customerRationale: "Timore che seta pura o alpaca si rovinino durante l'uso invernale quotidiano.",
      salesResponse: "La lana nobile e l'alpaca possiedono lanolina naturale che respinge polvere e odori; è sufficiente arieggiare il capo su stampella anatomica. Per la seta pura, la finitura antipiega consente una tenuta impeccabile.",
      luxuryCraftArgument: "Trattamento tessile protettivo Made in Italy che preserva la mano fluida e la lucentezza delle fibre naturali.",
      pairingSuggestion: "Consigliare la custodia in tela traspirante Luisa Spagnoli e la spazzola sartoriale in setole morbide.",
    },
    {
      objection: "Vestibilità percepita come morbida o d'ispirazione mannish",
      customerRationale: "La cliente desidera un fit più sagomato sul punto vita.",
      salesResponse: "L'ispirazione FW26 Runway unisce la morbidezza contemporanea alla proporzione classica italiana. Il capo è studiato per cadere a piombo senza appesantire, consentendo giochi di layering con bluse in seta pura.",
      luxuryCraftArgument: "Taglio diagonale con cuciture interne ribattute a mano per assecondare la figura con eleganza naturale.",
      pairingSuggestion: "Coordinare con la gonna a matita Fenditura e décolleté a punta per slanciare la figura.",
    },
  ],
  Knitwear: [
    {
      objection: "Sensazione di pesantezza termica in ambienti chiusi riscaldati",
      customerRationale: "Timore che il pull in alpaca/lana risulti troppo caldo durante eventi o cene.",
      salesResponse: "La struttura a nido d'ape della maglieria cardata Luisa Spagnoli garantisce termoregolazione attiva: dissipa il calore corporeo in eccesso pur trattenendo una barriera isolante contro il gelo esterno.",
      luxuryCraftArgument: "75% Lana Alpaca (WP) + 25% Poliammide nobile (PA) per leggerezza aerea e massima coibenza termica.",
      pairingSuggestion: "Indossare su canotta in seta pura o camicia Lorenas per facilitare il de-layering con stile.",
    },
  ],
  Tailoring: [
    {
      objection: "Rigidità percepita della giacca o del tailleur formale",
      customerRationale: "Desiderio di comfort totale anche nelle giornate lavorative frenetiche.",
      salesResponse: "La sartoria Luisa Spagnoli adotta spalline leggere decostruite e interni foderati in cupro traspirante, donando mobilità pari a una maglia pur mantenendo l'impeccabile rigore del doppiopetto.",
      luxuryCraftArgument: "Costruzione semi-intelata artigianale che memorizza la forma del corpo con l'indosso prolungato.",
      pairingSuggestion: "Completare con pantalone a palazzo coordinato e borsa Istorie in suede cioccolato.",
    },
  ],
  Accessories: [
    {
      objection: "Valutazione dell'accessorio come spesa accessoria",
      customerRationale: "La cliente intende acquistare solo il capo spalla principale.",
      salesResponse: "L'accessorio è la firma stilistica del look FW26: la fibbia scultura placcata oro 24k trasforma un capospalla essenziale in un abito da sera e garantisce unicità al guardaroba.",
      luxuryCraftArgument: "Pelle pregiata conciata al vegetale in Toscana e minuteria metallica con tripla doratura a spessore.",
      pairingSuggestion: "Abbinare alla borsa Intatto e orecchini Narcao per creare un punto luce coordinato.",
    },
  ],
};

export const PO_SCHEDULE_TIMELINE: Record<string, { title: string; window: string; focus: string; linesheet: string }> = {
  '19370729': {
    title: 'PO #19370729 · Boutique Nizhniy Novgorod (Drop 1)',
    window: 'Consegna: 10/03/2026 – 24/03/2026',
    focus: 'Capi sfilata, maglieria alpaca cardata, pelletteria nobile',
    linesheet: 'Fw 2026 - Sfilata',
  },
  '19370728': {
    title: 'PO #19370728 · Boutique Spb Bolshoy (Drop 1)',
    window: 'Consegna: 10/03/2026 – 24/03/2026',
    focus: 'Selezione Runway & Main Collection San Pietroburgo',
    linesheet: 'Fw 2026 - Sfilata',
  },
  '19370726': {
    title: 'PO #19370726 · Boutique Ufa (Drop 1)',
    window: 'Consegna: 10/03/2026 – 24/03/2026',
    focus: 'Art Gallery Ufa selezione maglieria e capispalla',
    linesheet: 'Fw 2026 - Sfilata',
  },
  '19370725': {
    title: "PO #19370725 · Boutique Perm' (Drop 1)",
    window: 'Consegna: 10/03/2026 – 24/03/2026',
    focus: 'Tc Galereya Perm selezione FW26',
    linesheet: 'Fw 2026 - Sfilata',
  },
  '19370724': {
    title: 'PO #19370724 · Boutique Samara (Drop 1)',
    window: 'Consegna: 10/03/2026 – 24/03/2026',
    focus: 'Tk Inkube Samara selezione FW26',
    linesheet: 'Fw 2026 - Sfilata',
  },
  '19370723': {
    title: 'PO #19370723 · Boutique Spb Nevskiy (Drop 1)',
    window: 'Consegna: 10/03/2026 – 24/03/2026',
    focus: 'Nevskiy Prospekt San Pietroburgo flagship collection',
    linesheet: 'Fw 2026 - Sfilata',
  },
};
