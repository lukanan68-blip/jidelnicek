export type Unit = 'kg' | 'l' | 'ks';
export type Kind = 'side' | 'protein' | 'veg' | 'dairy' | 'other';

export interface Ingredient {
  id: string;
  name: string;
  unit: Unit;
  /** Orientační cena v Kč za 1 kg / 1 l / 1 ks. Dá se v aplikaci upravit. */
  price: number;
  kind: Kind;
  /** U příloh: výchozí porce pro 2 osoby (g nebo ks). */
  portion?: number;
}

// Ceny jsou ODHAD běžných cen, ne data z letáků. Uživatel si je upravuje v záložce „Ceny“.
export const INGREDIENTS: Ingredient[] = [
  // přílohy a základ
  { id: 'ryze', name: 'Rýže', unit: 'kg', price: 55, kind: 'side', portion: 150 },
  { id: 'brambory', name: 'Brambory', unit: 'kg', price: 25, kind: 'side', portion: 600 },
  { id: 'testoviny', name: 'Těstoviny', unit: 'kg', price: 45, kind: 'side', portion: 220 },
  { id: 'kuskus', name: 'Kuskus', unit: 'kg', price: 75, kind: 'side', portion: 150 },
  { id: 'bulgur', name: 'Bulgur', unit: 'kg', price: 70, kind: 'side', portion: 150 },
  { id: 'pohanka', name: 'Pohanka', unit: 'kg', price: 85, kind: 'side', portion: 150 },
  { id: 'knedliky', name: 'Houskový knedlík', unit: 'kg', price: 70, kind: 'side', portion: 400 },
  { id: 'chleb', name: 'Chléb', unit: 'kg', price: 56, kind: 'side', portion: 200 },
  { id: 'rohliky', name: 'Rohlíky', unit: 'ks', price: 3.5, kind: 'side', portion: 4 },
  { id: 'tortilla', name: 'Tortilly', unit: 'ks', price: 6.5, kind: 'side', portion: 4 },
  { id: 'vlocky', name: 'Ovesné vločky', unit: 'kg', price: 40, kind: 'side', portion: 80 },

  // maso, vejce, luštěniny
  { id: 'kureci-prsa', name: 'Kuřecí prsa', unit: 'kg', price: 190, kind: 'protein' },
  { id: 'kureci-stehna', name: 'Kuřecí stehna', unit: 'kg', price: 95, kind: 'protein' },
  { id: 'kure-cele', name: 'Kuře celé', unit: 'kg', price: 85, kind: 'protein' },
  { id: 'hoveze', name: 'Hovězí maso', unit: 'kg', price: 300, kind: 'protein' },
  { id: 'bucek', name: 'Vepřový bůček / slanina', unit: 'kg', price: 150, kind: 'protein' },
  { id: 'mlete', name: 'Mleté maso (mix)', unit: 'kg', price: 170, kind: 'protein' },
  { id: 'veprova-plec', name: 'Vepřová plec', unit: 'kg', price: 165, kind: 'protein' },
  { id: 'klobasa', name: 'Klobása / párky', unit: 'kg', price: 160, kind: 'protein' },
  { id: 'sunka', name: 'Šunka', unit: 'kg', price: 230, kind: 'protein' },
  { id: 'ryba', name: 'Rybí filé (mražené)', unit: 'kg', price: 200, kind: 'protein' },
  { id: 'tunak', name: 'Tuňák (konzerva)', unit: 'ks', price: 42, kind: 'protein' },
  { id: 'vejce', name: 'Vejce', unit: 'ks', price: 5.5, kind: 'protein' },
  { id: 'cocka', name: 'Čočka', unit: 'kg', price: 75, kind: 'protein' },
  { id: 'cervena-cocka', name: 'Červená čočka', unit: 'kg', price: 85, kind: 'protein' },
  { id: 'cizrna', name: 'Cizrna (konzerva)', unit: 'ks', price: 28, kind: 'protein' },
  { id: 'fazole', name: 'Fazole (konzerva)', unit: 'ks', price: 25, kind: 'protein' },

  // mléčné
  { id: 'mleko', name: 'Mléko', unit: 'l', price: 25, kind: 'dairy' },
  { id: 'tvaroh', name: 'Tvaroh (250 g)', unit: 'ks', price: 22, kind: 'dairy' },
  { id: 'jogurt', name: 'Bílý jogurt (kelímek)', unit: 'ks', price: 12, kind: 'dairy' },
  { id: 'smetana', name: 'Smetana na vaření (200 ml)', unit: 'ks', price: 20, kind: 'dairy' },
  { id: 'eidam', name: 'Eidam', unit: 'kg', price: 190, kind: 'dairy' },
  { id: 'mozzarella', name: 'Mozzarella', unit: 'kg', price: 230, kind: 'dairy' },
  { id: 'parmezan', name: 'Parmezán', unit: 'kg', price: 600, kind: 'dairy' },
  { id: 'hermelin', name: 'Hermelín', unit: 'kg', price: 280, kind: 'dairy' },
  { id: 'zakysana-smetana', name: 'Zakysaná smetana (190 g)', unit: 'ks', price: 22, kind: 'dairy' },

  // zelenina, ovoce, ostatní
  { id: 'cibule', name: 'Cibule', unit: 'kg', price: 25, kind: 'veg' },
  { id: 'cuketa', name: 'Cuketa', unit: 'kg', price: 50, kind: 'veg' },
  { id: 'porek', name: 'Pórek', unit: 'kg', price: 60, kind: 'veg' },
  { id: 'celer', name: 'Celer', unit: 'kg', price: 45, kind: 'veg' },
  { id: 'cesnek', name: 'Česnek (hlavička)', unit: 'ks', price: 8, kind: 'veg' },
  { id: 'mrkev', name: 'Mrkev', unit: 'kg', price: 28, kind: 'veg' },
  { id: 'paprika', name: 'Paprika', unit: 'kg', price: 95, kind: 'veg' },
  { id: 'rajcata', name: 'Rajčata', unit: 'kg', price: 85, kind: 'veg' },
  { id: 'okurka', name: 'Okurka', unit: 'ks', price: 20, kind: 'veg' },
  { id: 'brokolice', name: 'Brokolice', unit: 'kg', price: 75, kind: 'veg' },
  { id: 'kvetak', name: 'Květák', unit: 'kg', price: 60, kind: 'veg' },
  { id: 'zeli', name: 'Zelí', unit: 'kg', price: 25, kind: 'veg' },
  { id: 'spenat', name: 'Špenát (mražený)', unit: 'kg', price: 65, kind: 'veg' },
  { id: 'hrasek', name: 'Hrášek (mražený)', unit: 'kg', price: 75, kind: 'veg' },
  { id: 'zampiony', name: 'Žampiony', unit: 'kg', price: 120, kind: 'veg' },
  { id: 'rajcata-konzerva', name: 'Rajčata drcená (plechovka)', unit: 'ks', price: 28, kind: 'veg' },
  { id: 'kukurice', name: 'Kukuřice (konzerva)', unit: 'ks', price: 25, kind: 'veg' },
  { id: 'salat', name: 'Salát (hlávkový)', unit: 'ks', price: 28, kind: 'veg' },
  { id: 'banany', name: 'Banány', unit: 'kg', price: 40, kind: 'veg' },
  { id: 'jablka', name: 'Jablka', unit: 'kg', price: 40, kind: 'veg' },
  { id: 'bataty', name: 'Batáty', unit: 'kg', price: 55, kind: 'veg' },
  { id: 'avokado', name: 'Avokádo', unit: 'ks', price: 25, kind: 'veg' },
  { id: 'protlak', name: 'Rajčatový protlak (140 g)', unit: 'ks', price: 22, kind: 'other' },
  { id: 'strouhanka', name: 'Strouhanka', unit: 'kg', price: 45, kind: 'other' },
  { id: 'mouka', name: 'Mouka', unit: 'kg', price: 22, kind: 'other' },
];

export const INGREDIENT_MAP: Record<string, Ingredient> = Object.fromEntries(
  INGREDIENTS.map((i) => [i.id, i]),
);

/**
 * Nejmenší balení, které se dá v obchodě koupit (v g, ml nebo ks). Co se prodává na váhu nebo po kuse, tu není.
 * Je to orientační, balení se v obchodech liší.
 */
export const PACKS: Record<string, number> = {
  ryze: 500, brambory: 1000, testoviny: 500, kuskus: 500, bulgur: 500, pohanka: 500, knedliky: 1000, chleb: 500,
  tortilla: 8, vlocky: 500,
  'kureci-prsa': 500, 'kureci-stehna': 800, 'kure-cele': 1300, hoveze: 400, bucek: 300, mlete: 500, 'veprova-plec': 500,
  klobasa: 250, sunka: 100, ryba: 400, vejce: 10, cocka: 500, 'cervena-cocka': 500,
  eidam: 100, mozzarella: 125, parmezan: 100, hermelin: 100, mleko: 1000,
  spenat: 450, hrasek: 450, zampiony: 250, cibule: 1000, mrkev: 1000, strouhanka: 200, mouka: 1000,
};

/** Suroviny, u kterých hlídáme, kdy jsme je jedli naposledy. */
export const TRACKED_KINDS: Kind[] = ['side', 'protein'];

export const STORES = ['Albert', 'Lidl', 'Kaufland', 'Billa', 'Tesco', 'Globus', 'Norma'] as const;
export type Store = (typeof STORES)[number];

export const UNIT_LABEL: Record<Unit, string> = { kg: 'kg', l: 'l', ks: 'ks' };

/** Suroviny, které jsou skoro v každém jídle. Zapisují se do historie, ale plánovač je při střídání neřeší. */
export const STAPLE_IDS = new Set(['cibule', 'cesnek']);

/** Maso a ryby. Vejce, mléčné výrobky a luštěniny se za maso nepočítají. */
export const MEAT_IDS = new Set([
  'kureci-prsa',
  'kureci-stehna',
  'kure-cele',
  'mlete',
  'veprova-plec',
  'bucek',
  'hoveze',
  'klobasa',
  'sunka',
  'ryba',
  'tunak',
]);

const FRUIT_IDS = ['banany', 'jablka'];

/** Rozdělení surovin v záložce „Co jsem jedl“. */
export const HISTORY_GROUPS: { title: string; ids: string[] }[] = [
  { title: 'Přílohy', ids: INGREDIENTS.filter((i) => i.kind === 'side').map((i) => i.id) },
  {
    title: 'Maso a ryby',
    ids: ['kureci-prsa', 'kureci-stehna', 'kure-cele', 'mlete', 'veprova-plec', 'bucek', 'hoveze', 'klobasa', 'sunka', 'ryba', 'tunak'],
  },
  { title: 'Vejce a luštěniny', ids: ['vejce', 'cocka', 'cervena-cocka', 'cizrna', 'fazole'] },
  {
    title: 'Zelenina',
    ids: INGREDIENTS.filter((i) => i.kind === 'veg' && !FRUIT_IDS.includes(i.id)).map((i) => i.id),
  },
  { title: 'Ovoce', ids: FRUIT_IDS },
];
