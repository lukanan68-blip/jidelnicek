import { INGREDIENT_MAP, STAPLE_IDS } from '../data/ingredients';
import { RECIPES, RECIPE_MAP, type MealType, type Recipe } from '../data/recipes';
import { addDays, daysBetween, uid } from './format';
import {
  SLOT_ORDER,
  type Discount,
  type HistoryEntry,
  type Plan,
  type PlanDay,
  type PlanMeal,
  type PriceOverrides,
  type Settings,
} from './types';

/** Co je „rychlé“: aktivní čas do tolika minut. */
export const QUICK_MAX = 35;

/** Postupně rostoucí váha ceny při hledání levnějšího plánu. */
export const LAMBDAS = [0, 0.15, 0.3, 0.6, 1, 1.8, 3, 6, 12];

// ---------------------------------------------------------------- ceny

export interface PriceFns {
  base(id: string): number;
  eff(id: string): number;
  best(id: string): { store: string; price: number } | undefined;
}

export function makePriceFns(
  overrides: PriceOverrides,
  discounts: Discount[],
  today: string,
): PriceFns {
  const base = (id: string) => overrides[id] ?? INGREDIENT_MAP[id].price;
  const active = discounts.filter((d) => !d.validTo || d.validTo >= today);
  const best = (id: string) => {
    let b: Discount | undefined;
    for (const d of active) {
      if (d.ingredientId === id && d.price < base(id) && (!b || d.price < b.price)) b = d;
    }
    return b ? { store: b.store, price: b.price } : undefined;
  };
  const eff = (id: string) => best(id)?.price ?? base(id);
  return { base, eff, best };
}

export function amountCost(id: string, amount: number, price: number): number {
  return INGREDIENT_MAP[id].unit === 'ks' ? amount * price : (amount / 1000) * price;
}

export function sideAmount(recipe: Recipe, sideId: string): number {
  return recipe.sideAmounts?.[sideId] ?? INGREDIENT_MAP[sideId].portion ?? 0;
}

export function mealIngredients(
  recipe: Recipe,
  sideId: string | undefined,
  mult = 1,
): [string, number][] {
  const list: [string, number][] = recipe.ing.map(([id, a]) => [id, a * mult]);
  if (sideId) list.push([sideId, sideAmount(recipe, sideId) * mult]);
  return list;
}

export function mealCost(
  recipe: Recipe,
  sideId: string | undefined,
  mult: number,
  price: (id: string) => number,
): number {
  return mealIngredients(recipe, sideId, mult).reduce(
    (sum, [id, a]) => sum + amountCost(id, a, price(id)),
    0,
  );
}

export function planMealCost(meal: PlanMeal, pf: PriceFns): number {
  if (meal.leftover) return 0;
  return mealCost(RECIPE_MAP[meal.recipeId], meal.sideId, meal.doubled ? 2 : 1, pf.eff);
}

export function planCost(plan: Plan, pf: PriceFns): number {
  let total = 0;
  for (const day of plan.days) for (const m of day.meals) total += planMealCost(m, pf);
  return total;
}

// ---------------------------------------------------------------- historie

export interface LastMaps {
  ing: Record<string, string>;
  rec: Record<string, string>;
}

export function buildLast(history: HistoryEntry[], excludeSource?: string): LastMaps {
  const ing: Record<string, string> = {};
  const rec: Record<string, string> = {};
  for (const h of history) {
    if (excludeSource && h.source === excludeSource) continue;
    for (const id of h.ingredientIds) if (!ing[id] || ing[id] < h.date) ing[id] = h.date;
    if (h.recipeId && (!rec[h.recipeId] || rec[h.recipeId] < h.date)) rec[h.recipeId] = h.date;
  }
  return { ing, rec };
}

function touch(last: LastMaps, recipe: Recipe, sideId: string | undefined, date: string) {
  for (const [id] of mealIngredients(recipe, sideId)) {
    if (!last.ing[id] || last.ing[id] < date) last.ing[id] = date;
  }
  last.rec[recipe.id] = date;
}

// ---------------------------------------------------------------- skóre

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function trackedScore(dist: number, weight: number): number {
  const v = dist === Infinity ? 8 : dist <= 1 ? -22 : dist <= 3 ? -10 : dist <= 6 ? 0 : Math.min(dist, 21) * 0.5;
  return v * weight;
}

function recipeScore(dist: number): number {
  return dist === Infinity ? 12 : dist < 10 ? -30 + dist : Math.min(dist, 40) * 0.4;
}

interface Pick {
  type: MealType;
  mult: number;
  batchOnly: boolean;
  quick: boolean;
  lambda: number;
  used: Set<string>;
  exclude?: string;
  dist: (ingredientId: string) => number;
  recDist: (recipeId: string) => number;
  pf: PriceFns;
  rnd: () => number;
}

interface Cand {
  recipe: Recipe;
  sideId?: string;
  cost: number;
  score: number;
}

function pickBest(p: Pick): Cand | undefined {
  let pool = RECIPES.filter(
    (r) =>
      r.meal === p.type &&
      r.id !== p.exclude &&
      (!p.quick || r.min <= QUICK_MAX) &&
      (!p.batchOnly || !r.noBatch),
  );
  const fresh = pool.filter((r) => !p.used.has(r.id));
  if (fresh.length) pool = fresh;

  let best: Cand | undefined;
  for (const recipe of pool) {
    const sideOptions: (string | undefined)[] = recipe.sides.length ? recipe.sides : [undefined];
    for (const sideId of sideOptions) {
      const ings = mealIngredients(recipe, sideId, p.mult);
      let score = recipeScore(p.recDist(recipe.id));
      let savings = 0;
      let cost = 0;
      for (const [id, amount] of ings) {
        const kind = INGREDIENT_MAP[id].kind;
        if (kind === 'side') score += trackedScore(p.dist(id), 1.6);
        else if (kind === 'protein') score += trackedScore(p.dist(id), 1.0);
        else if (kind === 'veg' && !STAPLE_IDS.has(id)) score += trackedScore(p.dist(id), 0.5);
        const eff = amountCost(id, amount, p.pf.eff(id));
        cost += eff;
        savings += amountCost(id, amount, p.pf.base(id)) - eff;
      }
      score += Math.min(savings * 0.6, 30);
      if (p.quick) score -= recipe.min * 0.4;
      score -= p.lambda * cost;
      score += p.rnd() * 6;
      if (!best || score > best.score) best = { recipe, sideId, cost, score };
    }
  }
  return best;
}

// ---------------------------------------------------------------- plán

export interface PlanInput {
  settings: Settings;
  history: HistoryEntry[];
  discounts: Discount[];
  prices: PriceOverrides;
  today: string;
  seed: number;
}

function run(input: PlanInput, lambda: number): { days: PlanDay[]; total: number } {
  const { settings } = input;
  const pf = makePriceFns(input.prices, input.discounts, input.today);
  const last = buildLast(input.history);
  const rnd = mulberry32(input.seed);
  const used = new Set<string>();
  const leftovers = new Map<number, PlanMeal>();
  const days: PlanDay[] = [];
  let total = 0;

  for (let d = 0; d < settings.days; d++) {
    const date = addDays(settings.startDate, d);
    const meals: PlanMeal[] = [];
    const dist = (id: string) => (last.ing[id] ? Math.max(0, daysBetween(last.ing[id], date)) : Infinity);
    const recDist = (id: string) => (last.rec[id] ? Math.max(0, daysBetween(last.rec[id], date)) : Infinity);

    for (const slot of SLOT_ORDER) {
      if (!settings.slots[slot]) continue;

      const lo = slot === 'lunch' ? leftovers.get(d) : undefined;
      if (lo) {
        meals.push(lo);
        touch(last, RECIPE_MAP[lo.recipeId], lo.sideId, date);
        continue;
      }

      const batchPair =
        settings.batch && slot === 'dinner' && settings.slots.lunch && d % 2 === 0 && d + 1 < settings.days;
      const best = pickBest({
        type: slot === 'breakfast' ? 'breakfast' : 'main',
        mult: batchPair ? 2 : 1,
        batchOnly: batchPair,
        quick: settings.quick,
        lambda,
        used,
        dist,
        recDist,
        pf,
        rnd,
      });
      if (!best) continue;

      meals.push({ slot, recipeId: best.recipe.id, sideId: best.sideId, doubled: batchPair || undefined });
      total += best.cost;
      used.add(best.recipe.id);
      touch(last, best.recipe, best.sideId, date);
      if (batchPair) {
        leftovers.set(d + 1, { slot: 'lunch', recipeId: best.recipe.id, sideId: best.sideId, leftover: true });
      }
    }
    days.push({ date, meals });
  }
  return { days, total };
}

export function generatePlan(input: PlanInput): Plan {
  let chosen: { days: PlanDay[]; total: number } | undefined;
  let cheapest: { days: PlanDay[]; total: number } | undefined;

  for (const lambda of LAMBDAS) {
    const r = run(input, lambda);
    if (!cheapest || r.total < cheapest.total) cheapest = r;
    if (r.total <= input.settings.budget) {
      chosen = r;
      break;
    }
  }
  const final = chosen ?? cheapest!;
  return {
    id: uid(),
    seed: input.seed,
    settings: input.settings,
    days: final.days,
    cheapestCost: cheapest!.total,
  };
}

/** Vymění jedno jídlo za další nejlepší variantu, ostatní nechá. */
export function swapMeal(
  plan: Plan,
  dayIdx: number,
  mealIdx: number,
  ctx: { history: HistoryEntry[]; discounts: Discount[]; prices: PriceOverrides; today: string },
  seed: number,
): Plan {
  const target = plan.days[dayIdx]?.meals[mealIdx];
  if (!target || target.leftover) return plan;

  const pair = target.doubled
    ? plan.days[dayIdx + 1]?.meals.findIndex((m) => m.leftover && m.recipeId === target.recipeId)
    : -1;

  const isTarget = (di: number, mi: number) =>
    (di === dayIdx && mi === mealIdx) || (pair !== undefined && pair >= 0 && di === dayIdx + 1 && mi === pair);

  // kdy se co jí (historie + ostatní jídla v plánu)
  const ingDates: Record<string, string[]> = {};
  const recDates: Record<string, string[]> = {};
  const push = (m: Record<string, string[]>, k: string, d: string) => (m[k] ??= []).push(d);
  for (const h of ctx.history) {
    for (const id of h.ingredientIds) push(ingDates, id, h.date);
    if (h.recipeId) push(recDates, h.recipeId, h.date);
  }
  const used = new Set<string>();
  plan.days.forEach((day, di) =>
    day.meals.forEach((m, mi) => {
      if (isTarget(di, mi)) return;
      used.add(m.recipeId);
      for (const [id] of mealIngredients(RECIPE_MAP[m.recipeId], m.sideId)) push(ingDates, id, day.date);
      push(recDates, m.recipeId, day.date);
    }),
  );

  const date = plan.days[dayIdx].date;
  const nearest = (dates: string[] | undefined) =>
    dates && dates.length ? Math.min(...dates.map((d) => Math.abs(daysBetween(d, date)))) : Infinity;

  const best = pickBest({
    type: target.slot === 'breakfast' ? 'breakfast' : 'main',
    mult: target.doubled ? 2 : 1,
    batchOnly: !!target.doubled,
    quick: plan.settings.quick,
    lambda: 0,
    used,
    exclude: target.recipeId,
    dist: (id) => nearest(ingDates[id]),
    recDist: (id) => nearest(recDates[id]),
    pf: makePriceFns(ctx.prices, ctx.discounts, ctx.today),
    rnd: mulberry32(seed),
  });
  if (!best) return plan;

  const days = plan.days.map((day, di) => ({
    ...day,
    meals: day.meals.map((m, mi) => {
      if (di === dayIdx && mi === mealIdx) return { ...m, recipeId: best.recipe.id, sideId: best.sideId };
      if (isTarget(di, mi)) return { ...m, recipeId: best.recipe.id, sideId: best.sideId };
      return m;
    }),
  }));
  return { ...plan, days };
}

// ---------------------------------------------------------------- nákup

export interface ShopRow {
  id: string;
  name: string;
  unit: 'kg' | 'l' | 'ks';
  amount: number;
  cost: number;
  baseCost: number;
  store?: string;
  discountPrice?: number;
}

export function buildShopping(plan: Plan, pf: PriceFns): ShopRow[] {
  const totals = new Map<string, number>();
  for (const day of plan.days) {
    for (const m of day.meals) {
      if (m.leftover) continue;
      for (const [id, a] of mealIngredients(RECIPE_MAP[m.recipeId], m.sideId, m.doubled ? 2 : 1)) {
        totals.set(id, (totals.get(id) ?? 0) + a);
      }
    }
  }
  const rows: ShopRow[] = [];
  for (const [id, amount] of totals) {
    const ing = INGREDIENT_MAP[id];
    const best = pf.best(id);
    rows.push({
      id,
      name: ing.name,
      unit: ing.unit,
      amount,
      cost: amountCost(id, amount, pf.eff(id)),
      baseCost: amountCost(id, amount, pf.base(id)),
      store: best?.store,
      discountPrice: best?.price,
    });
  }
  return rows.sort((a, b) => a.name.localeCompare(b.name, 'cs'));
}
