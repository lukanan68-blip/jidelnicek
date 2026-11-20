import { describe, expect, it } from 'vitest';
import { MEAT_IDS } from '../data/ingredients';
import { HOUR, RECIPE_MAP, totalMin } from '../data/recipes';
import { QUICK_MAX, buildShopping, generatePlan, makePriceFns, mealIngredients, planCost, swapMeal, type PlanInput } from './planner';
import type { Settings } from './types';

const settings: Settings = {
  days: 3,
  budget: 1000,
  useBudget: true,
  useDate: true,
  slots: { breakfast: true, lunch: true, dinner: true },
  quick: false,
  noMeat: false,
  duration: { short: true, long: true },
  batch: false,
  startDate: '2026-11-11',
};

const base = (over: Partial<PlanInput> = {}, s: Partial<Settings> = {}): PlanInput => ({
  settings: { ...settings, ...s },
  history: [],
  discounts: [],
  prices: {},
  today: '2026-11-11',
  seed: 7,
  ...over,
});

const sidesOf = (p: ReturnType<typeof generatePlan>) =>
  p.days.flatMap((d) => d.meals.filter((m) => m.slot !== 'breakfast').map((m) => m.sideId));

describe('plánovač', () => {
  it('vytvoří všechna jídla a nezopakuje recept', () => {
    const p = generatePlan(base());
    const meals = p.days.flatMap((d) => d.meals);
    expect(meals).toHaveLength(9);
    const ids = meals.map((m) => m.recipeId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('točí přílohy za sebou', () => {
    const p = generatePlan(base({}, { days: 5, slots: { breakfast: false, lunch: true, dinner: true } }));
    const sides = sidesOf(p);
    // jídla bez přílohy (undefined) se neporovnávají, jen skutečné přílohy za sebou
    for (let i = 1; i < sides.length; i++) {
      if (sides[i] && sides[i - 1]) expect(sides[i]).not.toBe(sides[i - 1]);
    }
    expect(new Set(sides.filter(Boolean)).size).toBeGreaterThanOrEqual(4);
  });

  it('vyhne se příloze, kterou jsi jedl včera', () => {
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const p = generatePlan(
        base(
          { seed, history: [{ id: 'h', date: '2026-11-10', ingredientIds: ['ryze', 'testoviny'] }] },
          { days: 1, slots: { breakfast: false, lunch: true, dinner: false } },
        ),
      );
      const side = p.days[0].meals[0].sideId;
      expect(side).not.toBe('ryze');
      expect(side).not.toBe('testoviny');
    }
  });

  it('nevybere recept, který byl před dvěma dny', () => {
    const p = generatePlan(
      base(
        { history: [{ id: 'h', date: '2026-11-09', recipeId: 'kureci-paprika', ingredientIds: ['kureci-prsa'] }] },
        { slots: { breakfast: false, lunch: true, dinner: true } },
      ),
    );
    expect(p.days.flatMap((d) => d.meals).map((m) => m.recipeId)).not.toContain('kureci-paprika');
  });

  it('při nízkém rozpočtu vybere levnější plán', () => {
    const pf = makePriceFns({}, [], '2026-11-11');
    const rich = generatePlan(base());
    const poor = generatePlan(base({}, { budget: 250 }));
    expect(planCost(poor, pf)).toBeLessThan(planCost(rich, pf));
    expect(poor.cheapestCost).toBeGreaterThan(0);
  });

  it('filtr „do hodiny“ vybere obědy a večeře jen do 60 minut celkem', () => {
    const p = generatePlan(base({}, { days: 6, duration: { short: true, long: false } }));
    const mains = p.days.flatMap((d) => d.meals.filter((m) => m.slot !== 'breakfast'));
    expect(mains.length).toBe(12);
    for (const m of mains) expect(totalMin(RECIPE_MAP[m.recipeId])).toBeLessThanOrEqual(HOUR);
  });

  it('filtr „nad hodinu“ vybere jen delší jídla a snídaně nechá', () => {
    const p = generatePlan(base({}, { days: 4, duration: { short: false, long: true } }));
    const meals = p.days.flatMap((d) => d.meals);
    expect(meals.filter((m) => m.slot === 'breakfast')).toHaveLength(4);
    for (const m of meals.filter((x) => x.slot !== 'breakfast')) {
      expect(totalMin(RECIPE_MAP[m.recipeId])).toBeGreaterThan(HOUR);
    }
    expect(p.missing).toBe(0);
  });

  it('bez zaškrtnuté délky plán hlásí chybějící jídla', () => {
    const p = generatePlan(base({}, { days: 2, duration: { short: false, long: false } }));
    expect(p.missing).toBe(4);
  });

  it('bez rozpočtu se plánuje bez limitu a nic nechybí', () => {
    const free = generatePlan(base({}, { budget: 1, useBudget: false }));
    const rich = generatePlan(base({}, { budget: 100000 }));
    expect(free.missing).toBe(0);
    expect(free.days.flatMap((d) => d.meals.map((m) => m.recipeId))).toEqual(
      rich.days.flatMap((d) => d.meals.map((m) => m.recipeId)),
    );
  });

  it('bez masa nejsou v plánu žádné maso ani ryby, ani u snídaní, a nic nechybí', () => {
    for (const seed of [1, 2, 3]) {
      const p = generatePlan(base({ seed }, { days: 7, noMeat: true }));
      expect(p.missing).toBe(0);
      for (const m of p.days.flatMap((d) => d.meals)) {
        for (const [id] of mealIngredients(RECIPE_MAP[m.recipeId], m.sideId)) expect(MEAT_IDS.has(id), `${m.recipeId}: ${id}`).toBe(false);
      }
      expect(buildShopping(p, makePriceFns({}, [], '2026-11-20')).some((r) => MEAT_IDS.has(r.id))).toBe(false);
    }
  });

  it('rychlý režim bere jen rychlá jídla', () => {
    const p = generatePlan(base({}, { quick: true, days: 5 }));
    for (const m of p.days.flatMap((d) => d.meals)) expect(RECIPE_MAP[m.recipeId].min).toBeLessThanOrEqual(QUICK_MAX);
  });

  it('dvojitá várka: oběd další den jsou zbytky z večeře', () => {
    const p = generatePlan(base({}, { days: 4, batch: true }));
    const lunch = p.days[1].meals.find((m) => m.slot === 'lunch')!;
    const dinner = p.days[0].meals.find((m) => m.slot === 'dinner')!;
    expect(lunch.leftover).toBe(true);
    expect(lunch.recipeId).toBe(dinner.recipeId);
    expect(dinner.doubled).toBe(true);
    const pf = makePriceFns({}, [], '2026-11-11');
    const rows = buildShopping(p, pf);
    expect(rows.reduce((s, r) => s + r.cost, 0)).toBeCloseTo(planCost(p, pf), 5);
  });

  it('sleva zlevní nákup a ukáže obchod', () => {
    const p = generatePlan(base());
    const used = p.days.flatMap((d) => d.meals).map((m) => RECIPE_MAP[m.recipeId].ing[0][0]);
    const target = used[0];
    const disc = [{ id: 'd', store: 'Lidl', ingredientId: target, price: 1 }];
    const pf0 = makePriceFns({}, [], '2026-11-11');
    const pf1 = makePriceFns({}, disc, '2026-11-11');
    const row = buildShopping(p, pf1).find((r) => r.id === target)!;
    expect(row.store).toBe('Lidl');
    expect(planCost(p, pf1)).toBeLessThan(planCost(p, pf0));
  });

  it('prošlá sleva se nepočítá', () => {
    const pf = makePriceFns({}, [{ id: 'd', store: 'Lidl', ingredientId: 'vejce', price: 1, validTo: '2026-11-01' }], '2026-11-11');
    expect(pf.best('vejce')).toBeUndefined();
  });

  it('sleva, která teprve začne, se nepočítá, a po začátku už ano', () => {
    const d = [{ id: 'd', store: 'Kaufland', ingredientId: 'vejce', price: 1, validFrom: '2026-11-23', validTo: '2026-11-24' }];
    expect(makePriceFns({}, d, '2026-11-20').best('vejce')).toBeUndefined();
    expect(makePriceFns({}, d, '2026-11-23').best('vejce')?.store).toBe('Kaufland');
    expect(makePriceFns({}, d, '2026-11-25').best('vejce')).toBeUndefined();
  });

  it('výměna jídla změní recept a zachová počet jídel', () => {
    const p = generatePlan(base());
    const before = p.days[0].meals[1].recipeId;
    const q = swapMeal(p, 0, 1, { history: [], discounts: [], prices: {}, today: '2026-11-11' }, 99);
    expect(q.days[0].meals[1].recipeId).not.toBe(before);
    expect(q.days.flatMap((d) => d.meals)).toHaveLength(9);
  });
});
