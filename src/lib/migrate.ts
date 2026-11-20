import { INGREDIENT_MAP } from '../data/ingredients';
import type { Discount, HistoryEntry, PriceOverrides } from './types';

/** Suroviny, které se přejmenovaly nebo rozdělily. Starý uložený záznam se převede na novou surovinu. */
const RENAMED: Record<string, string> = { syr: 'eidam' };

const fix = (id: string): string => RENAMED[id] ?? id;
const known = (id: string): boolean => !!INGREDIENT_MAP[id];

export function migrateIds(ids: string[]): string[] {
  return [...new Set(ids.map(fix).filter(known))];
}

export function migrateHistory(h: HistoryEntry[]): HistoryEntry[] {
  return h.map((e) => ({ ...e, ingredientIds: migrateIds(e.ingredientIds) }));
}

export function migrateDiscounts(d: Discount[]): Discount[] {
  return d.map((x) => ({ ...x, ingredientId: fix(x.ingredientId) })).filter((x) => known(x.ingredientId));
}

export function migratePrices(p: PriceOverrides): PriceOverrides {
  const out: PriceOverrides = {};
  for (const [k, v] of Object.entries(p)) if (known(fix(k)) && !(fix(k) in out)) out[fix(k)] = v;
  return out;
}
