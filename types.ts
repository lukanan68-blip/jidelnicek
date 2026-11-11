export type Slot = 'breakfast' | 'lunch' | 'dinner';

export const SLOT_ORDER: Slot[] = ['breakfast', 'lunch', 'dinner'];
export const SLOT_LABEL: Record<Slot, string> = {
  breakfast: 'Snídaně',
  lunch: 'Oběd',
  dinner: 'Večeře',
};

export interface Settings {
  days: number;
  budget: number;
  slots: Record<Slot, boolean>;
  /** „Nechci u toho trávit moc času“ – jen rychlá jídla. */
  quick: boolean;
  /** Večeře uvařená dvojitě = oběd další den. */
  batch: boolean;
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
  validTo?: string;
}

export interface PlanMeal {
  slot: Slot;
  recipeId: string;
  sideId?: string;
  /** Jídlo se vaří dvojitě (stačí i na další oběd). */
  doubled?: boolean;
  /** Zbytky z včerejší večeře – nevaří se. */
  leftover?: boolean;
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
}

/** Vlastní ceny surovin (přepisují výchozí odhad). */
export type PriceOverrides = Record<string, number>;
