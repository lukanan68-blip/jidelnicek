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
  { id: 'syr', name: 'Sýr (eidam)', unit: 'kg', price: 190, kind: 'dairy' },

  // zelenina, ovoce, ostatní
  { id: 'cibule', name: 'Cibule', unit: 'kg', price: 25, kind: 'veg' },
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
  { id: 'strouhanka', name: 'Strouhanka', unit: 'kg', price: 45, kind: 'other' },
  { id: 'mouka', name: 'Mouka', unit: 'kg', price: 22, kind: 'other' },
];

export const INGREDIENT_MAP: Record<string, Ingredient> = Object.fromEntries(
  INGREDIENTS.map((i) => [i.id, i]),
);

/** Suroviny, u kterých hlídáme, kdy jsme je jedli naposledy. */
export const TRACKED_KINDS: Kind[] = ['side', 'protein'];

export const STORES = ['Albert', 'Lidl', 'Kaufland', 'Billa', 'Tesco', 'Globus', 'Norma'] as const;
export type Store = (typeof STORES)[number];

export const UNIT_LABEL: Record<Unit, string> = { kg: 'kg', l: 'l', ks: 'ks' };
