import { INGREDIENT_MAP, PACKS, STAPLE_IDS } from '../data/ingredients';
import { RECIPES, RECIPE_MAP, hasMeat, matchesDuration, sourceOf, type DurationFilter, type MealType, type Recipe } from '../data/recipes';
import { addDays, daysBetween, fmtAmount, uid } from './format';
import {
  SLOT_ORDER,
  type Slot,
  type Discount,
  type HistoryEntry,
  type Plan,
  type PlanDay,
  type PlanMeal,
  type PriceOverrides,
  type Settings,
} from './types';

/** Postupně rostoucí váha ceny při hledání levnějšího plánu. */
export const LAMBDAS = [0, 0.15, 0.3, 0.6, 1, 1.8, 3, 6, 12];

// ---------------------------------------------------------------- ceny

export interface PriceFns {
  base(id: string): number;
  eff(id: string): number;
  best(id: string): { store: string; price: number } | undefined;
  /** Cena suroviny v daném obchodě: akční cena z letáku, jinak běžná (odhad). */
  at(id: string, store: string): number;
  /** Obchody, které mají platné slevy z letáků. */
  stores: string[];
  /** Surovina je doma, nekupuje se a nic nestojí. */
  has(id: string): boolean;
  /** Nakupuje se jen v tomto obchodě (jinak v nejlevnějším, může jich být víc). */
  store?: string;
}

export interface PriceOptions {
  store?: string;
  have?: Iterable<string>;
}

export function makePriceFns(
  overrides: PriceOverrides,
  discounts: Discount[],
  today: string,
  opts: PriceOptions = {},
): PriceFns {
  const have = new Set(opts.have ?? []);
  const rawBase = (id: string) => overrides[id] ?? INGREDIENT_MAP[id].price;
  const base = (id: string) => (have.has(id) ? 0 : rawBase(id));
  const active = discounts.filter(
    (d) =>
      (!d.validFrom || d.validFrom <= today) &&
      (!d.validTo || d.validTo >= today) &&
      (!opts.store || d.store === opts.store),
  );
  const best = (id: string) => {
    if (have.has(id)) return undefined;
    let b: Discount | undefined;
    for (const d of active) {
      if (d.ingredientId === id && d.price < rawBase(id) && (!b || d.price < b.price)) b = d;
    }
    return b ? { store: b.store, price: b.price } : undefined;
  };
  const eff = (id: string) => (have.has(id) ? 0 : (best(id)?.price ?? rawBase(id)));
  const at = (id: string, store: string) => {
    if (have.has(id)) return 0;
    let p = rawBase(id);
    for (const d of active) if (d.store === store && d.ingredientId === id && d.price < p) p = d.price;
    return p;
  };
  const stores = [...new Set(active.map((d) => d.store))];
  return { base, eff, best, at, stores, has: (id) => have.has(id), store: opts.store };
}

export function amountCost(id: string, amount: number, price: number): number {
  return INGREDIENT_MAP[id].unit === 'ks' ? amount * price : (amount / 1000) * price;
}

/** Kolik balení je potřeba a kolik stojí, když se kupují celá balení. Bez balení (na váhu, po kuse) vrací null. */
export function packInfo(id: string, amount: number, unitPrice: number): { packs: number; packAmount: number; cost: number; label: string } | null {
  const ing = INGREDIENT_MAP[id];
  const packAmount = PACKS[id];
  if (!ing || !packAmount || packAmount <= 1) return null;
  const packs = Math.max(1, Math.ceil(amount / packAmount - 0.05));
  const cost = packs * amountCost(id, packAmount, unitPrice);
  return { packs, packAmount, cost, label: (packs > 1 ? `${packs}× ` : '') + fmtAmount(ing.unit, packAmount) };
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

/** Kolikrát větší množství se u jídla vaří (na kolik dní). */
export function mealMult(m: PlanMeal): number {
  return m.batchDays ?? (m.doubled ? 2 : 1);
}

export function planMealCost(meal: PlanMeal, pf: PriceFns): number {
  if (meal.leftover) return 0;
  return mealCost(RECIPE_MAP[meal.recipeId], meal.sideId, mealMult(meal), pf.eff);
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
  duration?: DurationFilter;
  noMeat?: boolean;
  sources?: string[];
  /** 'only' = jen jednoduchá večeřová jídla, 'exclude' = bez nich (obědy). */
  light?: 'only' | 'exclude';
  /** Jídla, která už se nedávno navrhovala. Dostanou malou penalizaci, aby se nenabízelo pořád totéž. */
  recent?: Set<string>;
  lambda: number;
  used: Set<string>;
  exclude?: Set<string>;
  /** Kolik nejlepších kandidátů vrátit (výchozí 1). */
  want?: number;
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

/** Jak moc se pořadí jídel míchá náhodou (body skóre), aby se při každém návrhu neukazovalo pořád totéž. */
const RANDOMNESS = 30;

/** Penalizace za jídlo, které se nedávno navrhovalo. */
const RECENT_PENALTY = 28;

/** Kolik dalších jídel se u každého chodu nabídne k výběru. */
export const ALT_COUNT = 3;

function rankCandidates(p: Pick): Cand[] {
  const allowed = (r: Recipe) =>
    r.meal === p.type &&
    !p.exclude?.has(r.id) &&
    matchesDuration(r, p.duration) &&
    (!p.noMeat || !hasMeat(r)) &&
    (!p.batchOnly || !r.noBatch);
  const fromSources = p.sources && p.sources.length ? RECIPES.filter((r) => allowed(r) && p.sources!.includes(sourceOf(r))) : null;
  // z vybraných webů nic nevyhovuje (třeba snídaně) = vezmou se recepty odkudkoliv
  let pool = fromSources && fromSources.length > 0 ? fromSources : RECIPES.filter(allowed);
  // večeře jen jednoduché, obědy bez nich; když by nic nezbylo, filtr se vynechá
  if (p.light) {
    const lighter = pool.filter((r) => (p.light === 'only' ? !!r.light : !r.light));
    if (lighter.length >= (p.want ?? 1)) pool = lighter;
    else if (p.light === 'only') {
      const alt = RECIPES.filter((r) => allowed(r) && r.light);
      if (alt.length >= (p.want ?? 1)) pool = alt;
    }
  }

  const score = (recipes: Recipe[]): Cand[] => {
    const bestPerRecipe = new Map<string, Cand>();
    for (const recipe of recipes) {
      const sideOptions: (string | undefined)[] = recipe.sides.length ? recipe.sides : [undefined];
      for (const sideId of sideOptions) {
        const ings = mealIngredients(recipe, sideId, p.mult);
        let sc = recipeScore(p.recDist(recipe.id));
        let savings = 0;
        let cost = 0;
        for (const [id, amount] of ings) {
          const kind = INGREDIENT_MAP[id].kind;
          if (kind === 'side') sc += trackedScore(p.dist(id), 1.6);
          else if (kind === 'protein') sc += trackedScore(p.dist(id), 1.0);
          else if (kind === 'veg' && !STAPLE_IDS.has(id)) sc += trackedScore(p.dist(id), 0.5);
          const eff = amountCost(id, amount, p.pf.eff(id));
          cost += eff;
          savings += amountCost(id, amount, p.pf.base(id)) - eff;
        }
        sc += Math.min(savings * 0.6, 30);
        // suroviny, které už mám doma: raději jídla, ve kterých se spotřebují
        let haveBonus = 0;
        for (const [id] of ings) {
          if (!p.pf.has(id) || STAPLE_IDS.has(id)) continue;
          const k = INGREDIENT_MAP[id].kind;
          haveBonus += k === 'protein' ? 14 : k === 'side' ? 10 : k === 'veg' ? 5 : 2;
        }
        sc += Math.min(haveBonus, 40);
        sc -= p.lambda * cost;
        if (p.recent?.has(recipe.id)) sc -= RECENT_PENALTY;
        sc += p.rnd() * RANDOMNESS;
        const prev = bestPerRecipe.get(recipe.id);
        if (!prev || sc > prev.score) bestPerRecipe.set(recipe.id, { recipe, sideId, cost, score: sc });
      }
    }
    return [...bestPerRecipe.values()].sort((x, y) => y.score - x.score);
  };

  // nejdřív jídla, která v plánu ještě nejsou; až když jich je málo, doplní se i už použitá
  const want = p.want ?? 1;
  const fresh = pool.filter((r) => !p.used.has(r.id));
  const ranked = score(fresh);
  if (ranked.length < want) {
    const taken = new Set(ranked.map((c) => c.recipe.id));
    ranked.push(...score(pool.filter((r) => !taken.has(r.id))).slice(0, want - ranked.length));
  }
  return ranked.slice(0, Math.max(want, 1));
}

// ---------------------------------------------------------------- plán

export interface PlanInput {
  settings: Settings;
  history: HistoryEntry[];
  discounts: Discount[];
  prices: PriceOverrides;
  today: string;
  seed: number;
  /** Nakupuje se jen v tomto obchodě. */
  store?: string;
  /** Suroviny, které jsou doma (neplatí se). */
  have?: string[];
  /** Jídla z posledních návrhů, která se teď raději nevolí. */
  recent?: string[];
}

function run(input: PlanInput, lambda: number): { days: PlanDay[]; total: number; missing: number } {
  const { settings } = input;
  const pf = makePriceFns(input.prices, input.discounts, input.today, { store: input.store, have: input.have });
  const last = buildLast(input.history);
  const rnd = mulberry32(input.seed);
  const recentSet = new Set(input.recent ?? []);
  const used = new Set<string>();
  const leftovers = new Map<string, PlanMeal>(); // klíč „den:chod“
  const days: PlanDay[] = [];
  let total = 0;
  let missing = 0;
  const repeatOf = (slot: Slot) => Math.max(1, Math.min(4, settings.repeat?.[slot] ?? 1));
  const anyRepeat = repeatOf('lunch') > 1 || repeatOf('dinner') > 1;
  const batchOn = settings.batch && !anyRepeat;

  for (let d = 0; d < settings.days; d++) {
    const date = addDays(settings.startDate, d);
    const meals: PlanMeal[] = [];
    const dist = (id: string) => (last.ing[id] ? Math.max(0, daysBetween(last.ing[id], date)) : Infinity);
    const recDist = (id: string) => (last.rec[id] ? Math.max(0, daysBetween(last.rec[id], date)) : Infinity);

    for (const slot of SLOT_ORDER) {
      if (!settings.slots[slot]) continue;

      const lo = leftovers.get(`${d}:${slot}`);
      if (lo) {
        meals.push(lo);
        touch(last, RECIPE_MAP[lo.recipeId], lo.sideId, date);
        continue;
      }

      // na kolik dní se tohle jídlo uvaří najednou
      let cover = 1;
      let pairLunch = false;
      if (slot === 'dinner' && batchOn && settings.slots.lunch && d % 2 === 0 && d + 1 < settings.days) {
        cover = 2; // večeře = zítřejší oběd
        pairLunch = true;
      } else if (repeatOf(slot) > 1 && d % repeatOf(slot) === 0) {
        cover = Math.min(repeatOf(slot), settings.days - d);
      }
      const ranked = rankCandidates({
        type: slot === 'breakfast' ? 'breakfast' : 'main',
        mult: cover,
        batchOnly: cover > 1,
        duration: settings.duration,
        noMeat: settings.noMeat,
        sources: settings.sources,
        recent: recentSet,
        light: settings.easyDinner === false || slot === 'breakfast' ? undefined : slot === 'dinner' ? 'only' : 'exclude',
        lambda,
        used,
        want: 1 + ALT_COUNT,
        dist,
        recDist,
        pf,
        rnd,
      });
      const best = ranked[0];
      if (!best) {
        missing++;
        continue;
      }

      const alts = ranked.slice(1).map((c) => ({ recipeId: c.recipe.id, sideId: c.sideId }));
      meals.push({ slot, recipeId: best.recipe.id, sideId: best.sideId, batchDays: cover > 1 ? cover : undefined, alts });
      total += best.cost;
      used.add(best.recipe.id);
      touch(last, best.recipe, best.sideId, date);
      for (let k = 1; k < cover; k++) {
        const target = pairLunch ? 'lunch' : slot;
        leftovers.set(`${d + k}:${target}`, { slot: target, recipeId: best.recipe.id, sideId: best.sideId, leftover: true });
      }
    }
    days.push({ date, meals });
  }
  return { days, total, missing };
}

export function generatePlan(input: PlanInput): Plan {
  type Run = ReturnType<typeof run>;
  let chosen: Run | undefined;
  let cheapest: Run | undefined;

  const budgetLimit = input.settings.useBudget === false ? Infinity : input.settings.budget;

  for (const lambda of LAMBDAS) {
    const r = run(input, lambda);
    if (!cheapest || r.total < cheapest.total) cheapest = r;
    if (r.total <= budgetLimit) {
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
    missing: final.missing,
  };
}

/** Najde zbytky, které z tohoto jídla budou v dalších dnech (stejné jídlo na víc dní). */
function followers(plan: Plan, dayIdx: number, target: PlanMeal): [number, number][] {
  const out: [number, number][] = [];
  for (let k = 1; k < mealMult(target); k++) {
    const mi = plan.days[dayIdx + k]?.meals.findIndex((m) => m.leftover && m.recipeId === target.recipeId) ?? -1;
    if (mi >= 0) out.push([dayIdx + k, mi]);
  }
  return out;
}

/** Vybere jednu z nabízených alternativ. Původní jídlo se zařadí mezi alternativy. */
export function chooseAlternative(plan: Plan, dayIdx: number, mealIdx: number, altIdx: number): Plan {
  const target = plan.days[dayIdx]?.meals[mealIdx];
  const alt = target?.alts?.[altIdx];
  if (!target || !alt || target.leftover) return plan;

  const fol = followers(plan, dayIdx, target);
  const alts = [
    { recipeId: target.recipeId, sideId: target.sideId },
    ...(target.alts ?? []).filter((_, i) => i !== altIdx),
  ];
  const days = plan.days.map((day, di) => ({
    ...day,
    meals: day.meals.map((m, mi) => {
      if (di === dayIdx && mi === mealIdx) return { ...m, recipeId: alt.recipeId, sideId: alt.sideId, alts };
      if (fol.some(([fd, fm]) => fd === di && fm === mi)) return { ...m, recipeId: alt.recipeId, sideId: alt.sideId };
      return m;
    }),
  }));
  return { ...plan, days };
}

/** Nabídne u jednoho chodu nové alternativy (jiné než ty, které jsou vidět). */
export function moreAlternatives(
  plan: Plan,
  dayIdx: number,
  mealIdx: number,
  ctx: {
    history: HistoryEntry[];
    discounts: Discount[];
    prices: PriceOverrides;
    today: string;
    store?: string;
    have?: string[];
  },
  seed: number,
): Plan {
  const target = plan.days[dayIdx]?.meals[mealIdx];
  if (!target || target.leftover) return plan;
  const fol = followers(plan, dayIdx, target);
  const isTarget = (di: number, mi: number) =>
    (di === dayIdx && mi === mealIdx) || fol.some(([fd, fm]) => fd === di && fm === mi);

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
  const base = {
    type: (target.slot === 'breakfast' ? 'breakfast' : 'main') as MealType,
    mult: mealMult(target),
    batchOnly: mealMult(target) > 1,
    duration: plan.settings.duration,
    noMeat: plan.settings.noMeat,
    sources: plan.settings.sources,
    light: (plan.settings.easyDinner === false || target.slot === 'breakfast' ? undefined : target.slot === 'dinner' ? 'only' : 'exclude') as 'only' | 'exclude' | undefined,
    lambda: 0,
    used,
    want: ALT_COUNT,
    dist: (id: string) => nearest(ingDates[id]),
    recDist: (id: string) => nearest(recDates[id]),
    pf: makePriceFns(ctx.prices, ctx.discounts, ctx.today, { store: ctx.store, have: ctx.have }),
    rnd: mulberry32(seed),
  };

  // vynechat to, co je právě vybrané nebo vidět; došly-li nové, začít znovu bez videných
  const seen = new Set([target.recipeId, ...(target.alts ?? []).map((a) => a.recipeId)]);
  let ranked = rankCandidates({ ...base, exclude: seen });
  if (ranked.length === 0) ranked = rankCandidates({ ...base, exclude: new Set([target.recipeId]) });
  if (ranked.length === 0) return plan;

  const alts = ranked.map((c) => ({ recipeId: c.recipe.id, sideId: c.sideId }));
  const days = plan.days.map((day, di) => ({
    ...day,
    meals: day.meals.map((m, mi) => (di === dayIdx && mi === mealIdx ? { ...m, alts } : m)),
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
  /** Cena za 1 kg / 1 l / 1 ks, podle které se počítá. */
  unitPrice: number;
  /** Surovina je doma, nekupuje se. */
  have: boolean;
}

export function buildShopping(plan: Plan, pf: PriceFns): ShopRow[] {
  const totals = new Map<string, number>();
  for (const day of plan.days) {
    for (const m of day.meals) {
      if (m.leftover) continue;
      for (const [id, a] of mealIngredients(RECIPE_MAP[m.recipeId], m.sideId, mealMult(m))) {
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
      unitPrice: pf.eff(id),
      have: pf.has(id),
    });
  }
  return rows.sort((a, b) => a.name.localeCompare(b.name, 'cs'));
}

// ---------------------------------------------------------------- celý nákup v jednom obchodě

export interface StoreBasket {
  store: string;
  /** Kolik by stál celý nákup, kdyby se koupil jen v tomto obchodě. */
  total: number;
  /** Kolik položek je tam v akci. */
  onSale: number;
  /** O kolik je to dražší než nejlevnější jednotlivý obchod. */
  extra: number;
}

export interface BasketComparison {
  stores: StoreBasket[];
  /** Cena celého nákupu za běžné ceny (odhad). */
  base: number;
  /** Nejlevnější kombinace: každá surovina tam, kde je nejlevnější. */
  mixed: number;
}

/** Porovná, kolik by stál celý nákup v jednotlivých obchodech. Jen s načtenými letáky, jinak běžná cena. */
export function compareStores(rows: ShopRow[], pf: PriceFns): BasketComparison {
  const sum = (price: (r: ShopRow) => number) => rows.reduce((s, r) => s + amountCost(r.id, r.amount, price(r)), 0);
  const stores: StoreBasket[] = pf.stores
    .map((store) => ({
      store,
      total: sum((r) => pf.at(r.id, store)),
      onSale: rows.filter((r) => pf.at(r.id, store) < pf.base(r.id)).length,
      extra: 0,
    }))
    .filter((s) => s.onSale > 0)
    .sort((a, b) => a.total - b.total);
  const cheapest = stores[0]?.total ?? 0;
  for (const s of stores) s.extra = s.total - cheapest;
  return { stores, base: sum((r) => pf.base(r.id)), mixed: sum((r) => pf.eff(r.id)) };
}

// ---------------------------------------------------------------- cena jídla v jednotlivých obchodech

/** Jedna surovina jídla: množství, cena za jednotku a výsledná částka. */
export interface PriceLine {
  id: string;
  name: string;
  unit: 'kg' | 'l' | 'ks';
  amount: number;
  /** Cena za 1 kg / 1 l / 1 ks. */
  unitPrice: number;
  cost: number;
  /** Je v tomto obchodě v akci (levnější než běžná cena). */
  onSale: boolean;
  /** Je doma, takže nic nestojí. */
  have: boolean;
}

export interface MealStorePrice {
  store: string;
  /** Cena všech surovin jídla, kdyby se koupily jen v tomto obchodě. */
  total: number;
  /** Kolik surovin jídla je tam v akci. */
  onSale: number;
  /** Cena po jednotlivých surovinách. */
  lines: PriceLine[];
}

export interface MealStorePrices {
  /** Obchody, kde je aspoň jedna surovina jídla v akci, od nejlevnějšího. */
  stores: MealStorePrice[];
  /** Cena jídla za běžné ceny (odhad), bez slev. */
  base: number;
  /** Cena po jednotlivých surovinách za běžné ceny. */
  baseLines: PriceLine[];
}

/** Kolik stojí celé jídlo v každém obchodě zvlášť (aby se nemuselo chodit do víc obchodů). */
export function mealPricesByStore(
  recipeId: string,
  sideId: string | undefined,
  mult: number,
  pf: PriceFns,
): MealStorePrices {
  const ings = mealIngredients(RECIPE_MAP[recipeId], sideId, mult);
  const linesAt = (price: (id: string) => number): PriceLine[] =>
    ings.map(([id, amount]) => ({
      id,
      name: INGREDIENT_MAP[id].name,
      unit: INGREDIENT_MAP[id].unit,
      amount,
      unitPrice: price(id),
      cost: amountCost(id, amount, price(id)),
      onSale: price(id) < pf.base(id),
      have: pf.has(id),
    }));
  const total = (lines: PriceLine[]) => lines.reduce((s, l) => s + l.cost, 0);
  const stores = pf.stores
    .map((store) => {
      const lines = linesAt((id) => pf.at(id, store));
      return { store, total: total(lines), onSale: lines.filter((l) => l.onSale).length, lines };
    })
    .filter((s) => s.onSale > 0)
    .sort((a, b) => a.total - b.total);
  const baseLines = linesAt((id) => pf.base(id));
  return { stores, base: total(baseLines), baseLines };
}

// ---------------------------------------------------------------- kde nakoupit

export interface BuyItem {
  id: string;
  name: string;
}

export interface BuyGroup {
  store: string;
  items: BuyItem[];
  /** Kolik se u tohoto obchodu za tyhle suroviny zaplatí (akční ceny). */
  cost: number;
  /** Kolik se u tohoto obchodu ušetří proti běžné ceně. */
  saving: number;
}

export interface WhereToBuy {
  groups: BuyGroup[];
  /** Suroviny bez slevy v načtených letácích (kup kdekoliv). */
  other: BuyItem[];
  /** Odhad ceny surovin bez slevy. */
  otherCost: number;
  /** Suroviny, které jsou doma. */
  have: BuyItem[];
  saving: number;
}

/** Kde nakoupit suroviny jednoho jídla nejlevněji (podle nejnižší akční ceny). */
export function whereToBuy(
  recipeId: string,
  sideId: string | undefined,
  mult: number,
  pf: PriceFns,
): WhereToBuy {
  const byStore = new Map<string, BuyGroup>();
  const other: BuyItem[] = [];
  const have: BuyItem[] = [];
  let otherCost = 0;
  let saving = 0;
  for (const [id, amount] of mealIngredients(RECIPE_MAP[recipeId], sideId, mult)) {
    const name = INGREDIENT_MAP[id].name.replace(/\s*\(.*\)$/, '');
    if (pf.has(id)) {
      have.push({ id, name });
      continue;
    }
    const best = pf.best(id);
    if (!best) {
      other.push({ id, name });
      otherCost += amountCost(id, amount, pf.base(id));
      continue;
    }
    const paid = amountCost(id, amount, best.price);
    const save = amountCost(id, amount, pf.base(id)) - paid;
    const g = byStore.get(best.store) ?? { store: best.store, items: [], cost: 0, saving: 0 };
    g.items.push({ id, name });
    g.cost += paid;
    g.saving += save;
    byStore.set(best.store, g);
    saving += save;
  }
  return { groups: [...byStore.values()].sort((a, b) => b.saving - a.saving), other, otherCost, have, saving };
}
