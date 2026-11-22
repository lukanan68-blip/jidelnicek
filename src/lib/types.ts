export type Slot = 'breakfast' | 'lunch' | 'dinner';

export const SLOT_ORDER: Slot[] = ['breakfast', 'lunch', 'dinner'];
export const SLOT_ICON: Record<Slot, string> = { breakfast: '🥐', lunch: '🍲', dinner: '🍽️' };
export const SLOT_LABEL: Record<Slot, string> = {
  breakfast: 'Snídaně',
  lunch: 'Oběd',
  dinner: 'Večeře',
};

export interface Settings {
  days: number;
  budget: number;
  /** false = bez rozpočtu (plánuje se bez horního limitu ceny). */
  useBudget: boolean;
  /** false = bez data (dny jsou jen „Den 1, Den 2…“, slevy se berou k dnešku). */
  useDate: boolean;
  slots: Record<Slot, boolean>;
  /** „Nechci u toho trávit moc času“ – jen rychlá jídla. */
  /** Bez masa a ryb (vejce, mléčné výrobky a luštěniny zůstávají). */
  noMeat: boolean;
  /** Délka vaření obědů a večeří (celkový čas): do 35 minut, do hodiny a / nebo nad hodinu. */
  duration: { fast: boolean; short: boolean; long: boolean; mid?: boolean; xlong?: boolean };
  /** Večeře jen jednoduché (saláty, párky, sýry…), obědy z ostatních jídel. Chybí = zapnuto. */
  easyDinner?: boolean;
  /** Z jakých webů mají být recepty (názvy zdrojů). Chybí = ze všech. */
  sources?: string[];
  /** Večeře uvařená dvojitě = oběd další den. */
  batch: boolean;
  /** Stejný oběd / večeře na tolik dní (1 = každý den jiné jídlo). */
  repeat: { breakfast?: number; lunch: number; dinner: number };
  startDate: string;
}

export interface HistoryEntry {
  id: string;
  date: string; // YYYY-MM-DD
  recipeId?: string;
  ingredientIds: string[];
  /** Odkud záznam vznikl (plán:den:slot), aby šel poznat „už snědeno“. */
  source?: string;
}

export interface Discount {
  id: string;
  store: string;
  ingredientId: string;
  /** Akční cena za kg / l / ks. */
  price: number;
  /** Sleva platí od tohoto dne (u letáků, které teprve začnou). */
  validFrom?: string;
  validTo?: string;
}

/** Další možnost k výběru u jednoho chodu. */
export interface PlanAlt {
  recipeId: string;
  sideId?: string;
}

export interface PlanMeal {
  slot: Slot;
  recipeId: string;
  sideId?: string;
  /** Jídlo se vaří dvojitě (stačí i na další oběd). */
  /** Zastaralé (starší plány): jídlo se vaří dvojitě. Nově batchDays. */
  doubled?: boolean;
  /** Jídlo se uvaří najednou na tolik dní (stejné jídlo se jí víckrát). */
  batchDays?: number;
  /** Zbytky z včerejší večeře – nevaří se. */
  leftover?: boolean;
  /** Další jídla, ze kterých jde u tohoto chodu vybírat. */
  alts?: PlanAlt[];
}

export interface PlanDay {
  date: string;
  meals: PlanMeal[];
}

export interface Plan {
  id: string;
  seed: number;
  settings: Settings;
  days: PlanDay[];
  /** Nejnižší cena, které se u tohoto zadání podařilo dosáhnout. */
  cheapestCost: number;
  /** Kolik jídel se nepodařilo najít (málo receptů pro zvolené filtry). */
  missing?: number;
}

/** Vlastní ceny surovin (přepisují výchozí odhad). */
export type PriceOverrides = Record<string, number>;
