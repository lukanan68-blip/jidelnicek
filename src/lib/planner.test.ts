import { describe, expect, it } from 'vitest';
import { MEAT_IDS } from '../data/ingredients';
import { FAST, HOUR, RECIPE_MAP, difficulty, sourceOf, totalMin } from '../data/recipes';
import {
  ALT_COUNT,
  buildShopping,
  chooseAlternative,
  compareStores,
  generatePlan,
  makePriceFns,
  mealIngredients,
  mealPricesByStore,
  moreAlternatives,
  planCost,
  whereToBuy,
  type PlanInput,
} from './planner';
import type { Settings } from './types';

const settings: Settings = {
  days: 3,
  budget: 1000,
  useBudget: true,
  useDate: true,
  slots: { breakfast: true, lunch: true, dinner: true },
  noMeat: false,
  duration: { fast: true, short: true, long: true },
  batch: false,
  repeat: { lunch: 1, dinner: 1 },
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
    const p = generatePlan(base({}, { days: 6, duration: { fast: false, short: true, long: false } }));
    const mains = p.days.flatMap((d) => d.meals.filter((m) => m.slot !== 'breakfast'));
    expect(mains.length).toBe(12);
    for (const m of mains) expect(totalMin(RECIPE_MAP[m.recipeId])).toBeLessThanOrEqual(HOUR);
  });

  it('filtr „nad hodinu“ vybere jen delší jídla a snídaně nechá', () => {
    const p = generatePlan(base({}, { days: 4, duration: { fast: false, short: false, long: true } }));
    const meals = p.days.flatMap((d) => d.meals);
    expect(meals.filter((m) => m.slot === 'breakfast')).toHaveLength(4);
    for (const m of meals.filter((x) => x.slot !== 'breakfast')) {
      expect(totalMin(RECIPE_MAP[m.recipeId])).toBeGreaterThan(HOUR);
    }
    expect(p.missing).toBe(0);
  });

  it('bez zaškrtnuté délky plán hlásí chybějící jídla', () => {
    const p = generatePlan(base({}, { days: 2, duration: { fast: false, short: false, long: false } }));
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

  it('filtr „do 35 minut“ bere jen jídla do 35 minut celkem', () => {
    const p = generatePlan(base({}, { days: 5, duration: { fast: true, short: false, long: false } }));
    const mains = p.days.flatMap((d) => d.meals.filter((m) => m.slot !== 'breakfast'));
    expect(mains).toHaveLength(10);
    expect(p.missing).toBe(0);
    for (const m of mains) expect(totalMin(RECIPE_MAP[m.recipeId])).toBeLessThanOrEqual(FAST);
  });

  it('délky se sčítají: do 35 minut + nad hodinu vynechá jen jídla mezi tím', () => {
    const p = generatePlan(base({}, { days: 6, duration: { fast: true, short: false, long: true } }));
    for (const m of p.days.flatMap((d) => d.meals.filter((x) => x.slot !== 'breakfast'))) {
      const t = totalMin(RECIPE_MAP[m.recipeId]);
      expect(t <= FAST || t > HOUR, `${m.recipeId}: ${t}`).toBe(true);
    }
  });

  it('dvojitá várka: oběd další den jsou zbytky z večeře', () => {
    const p = generatePlan(base({}, { days: 4, batch: true }));
    const lunch = p.days[1].meals.find((m) => m.slot === 'lunch')!;
    const dinner = p.days[0].meals.find((m) => m.slot === 'dinner')!;
    expect(lunch.leftover).toBe(true);
    expect(lunch.recipeId).toBe(dinner.recipeId);
    expect(dinner.batchDays).toBe(2);
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

  it('stejný oběd na 2 dny: oběd se uvaří jednou a druhý den jsou zbytky', () => {
    const p = generatePlan(base({}, { days: 4, repeat: { lunch: 2, dinner: 1 } }));
    const lunch = (d: number) => p.days[d].meals.find((m) => m.slot === 'lunch')!;
    expect(lunch(0).batchDays).toBe(2);
    expect(lunch(1).leftover).toBe(true);
    expect(lunch(1).recipeId).toBe(lunch(0).recipeId);
    expect(lunch(1).sideId).toBe(lunch(0).sideId);
    expect(lunch(2).batchDays).toBe(2);
    expect(lunch(3).leftover).toBe(true);
    expect(lunch(2).recipeId).not.toBe(lunch(0).recipeId);
    // večeře zůstávají každý den jiné
    const dinners = p.days.map((d) => d.meals.find((m) => m.slot === 'dinner')!.recipeId);
    expect(new Set(dinners).size).toBe(4);
    // nákup počítá surovin tolik, kolik se uvaří (dvojnásobek), zbytky nic nestojí
    const pf = makePriceFns({}, [], '2026-11-20');
    const cooked = lunch(0);
    const rows = buildShopping({ ...p, days: [{ date: p.days[0].date, meals: [cooked] }] }, pf);
    const single = buildShopping({ ...p, days: [{ date: p.days[0].date, meals: [{ ...cooked, batchDays: undefined }] }] }, pf);
    for (const r of single) expect(rows.find((x) => x.id === r.id)!.amount).toBeCloseTo(r.amount * 2, 6);
  });

  it('stejný oběd na 3 dny, plán na 4 dny: poslední den je samostatný', () => {
    const p = generatePlan(base({}, { days: 4, repeat: { lunch: 3, dinner: 1 } }));
    const lunch = (d: number) => p.days[d].meals.find((m) => m.slot === 'lunch')!;
    expect(lunch(0).batchDays).toBe(3);
    expect(lunch(1).leftover && lunch(2).leftover).toBe(true);
    expect(lunch(3).leftover).toBeUndefined();
    expect(lunch(3).batchDays).toBeUndefined();
  });

  it('výběr alternativy u jídla na víc dní změní i všechny zbytky', () => {
    const p = generatePlan(base({}, { days: 4, repeat: { lunch: 3, dinner: 1 } }));
    const mi = p.days[0].meals.findIndex((m) => m.slot === 'lunch');
    const q = chooseAlternative(p, 0, mi, 0);
    const first = q.days[0].meals[mi];
    for (const d of [1, 2]) {
      const m = q.days[d].meals.find((x) => x.slot === 'lunch')!;
      expect(m.leftover).toBe(true);
      expect(m.recipeId).toBe(first.recipeId);
      expect(m.sideId).toBe(first.sideId);
    }
    expect(first.batchDays).toBe(3);
  });

  it('suroviny, které mám doma, plánovač preferuje a nepočítá do ceny', () => {
    let withHave = 0;
    let without = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const used = (p: ReturnType<typeof generatePlan>) =>
        p.days.some((d) => d.meals.some((m) => !m.leftover && mealIngredients(RECIPE_MAP[m.recipeId], m.sideId).some(([id]) => id === 'hoveze')));
      if (used(generatePlan(base({ seed, have: ['hoveze'] })))) withHave++;
      if (used(generatePlan(base({ seed })))) without++;
    }
    expect(withHave).toBeGreaterThan(without);
    expect(withHave).toBeGreaterThanOrEqual(10);
  });

  it('sleva, která teprve začne, se nepočítá, a po začátku už ano', () => {
    const d = [{ id: 'd', store: 'Kaufland', ingredientId: 'vejce', price: 1, validFrom: '2026-11-23', validTo: '2026-11-24' }];
    expect(makePriceFns({}, d, '2026-11-20').best('vejce')).toBeUndefined();
    expect(makePriceFns({}, d, '2026-11-23').best('vejce')?.store).toBe('Kaufland');
    expect(makePriceFns({}, d, '2026-11-25').best('vejce')).toBeUndefined();
  });

  it('u každého uvařeného chodu je několik různých jídel k výběru', () => {
    const p = generatePlan(base());
    for (const m of p.days.flatMap((d) => d.meals)) {
      expect(m.alts, m.recipeId).toHaveLength(ALT_COUNT);
      const ids = [m.recipeId, ...m.alts!.map((a) => a.recipeId)];
      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids) expect(RECIPE_MAP[id].meal).toBe(m.slot === 'breakfast' ? 'breakfast' : 'main');
    }
  });

  it('výběr alternativy ji dosadí a původní jídlo zůstane mezi nabídkou', () => {
    const p = generatePlan(base());
    const before = p.days[0].meals[1];
    const picked = before.alts![1];
    const q = chooseAlternative(p, 0, 1, 1);
    const after = q.days[0].meals[1];
    expect(after.recipeId).toBe(picked.recipeId);
    expect(after.sideId).toBe(picked.sideId);
    expect(after.alts!.map((a) => a.recipeId)).toContain(before.recipeId);
    expect(after.alts!.map((a) => a.recipeId)).not.toContain(picked.recipeId);
    expect(after.alts).toHaveLength(ALT_COUNT);
  });

  it('u dvojité večeře se výběrem změní i zbytky druhý den', () => {
    const p = generatePlan(base({}, { days: 4, batch: true }));
    const di = 0;
    const mi = p.days[di].meals.findIndex((m) => m.slot === 'dinner');
    const q = chooseAlternative(p, di, mi, 0);
    const dinner = q.days[di].meals[mi];
    const lunch = q.days[di + 1].meals.find((m) => m.slot === 'lunch')!;
    expect(lunch.leftover).toBe(true);
    expect(lunch.recipeId).toBe(dinner.recipeId);
    expect(lunch.sideId).toBe(dinner.sideId);
  });

  it('další možnosti nabídnou jiná jídla, než byla vidět', () => {
    const p = generatePlan(base());
    const m = p.days[0].meals[1];
    const seen = new Set([m.recipeId, ...m.alts!.map((a) => a.recipeId)]);
    const q = moreAlternatives(p, 0, 1, { history: [], discounts: [], prices: {}, today: '2026-11-11' }, 99);
    const next = q.days[0].meals[1];
    expect(next.recipeId).toBe(m.recipeId);
    expect(next.alts!.length).toBeGreaterThan(0);
    for (const a of next.alts!) expect(seen.has(a.recipeId)).toBe(false);
    expect(q.days.flatMap((d) => d.meals)).toHaveLength(9);
  });

  it('celý nákup v jednom obchodě: porovná obchody a kombinace je nejlevnější', () => {
    const p = generatePlan(base({}, { days: 3 }));
    const d = [
      { id: '1', store: 'Lidl', ingredientId: 'vejce', price: 1, validTo: '2026-12-31' },
      { id: '2', store: 'Kaufland', ingredientId: 'vejce', price: 3, validTo: '2026-12-31' },
      { id: '3', store: 'Kaufland', ingredientId: 'kureci-prsa', price: 20, validTo: '2026-12-31' },
    ];
    const pf = makePriceFns({}, d, '2026-11-20');
    const rows = buildShopping(p, pf);
    const cmp = compareStores(rows, pf);
    expect(cmp.stores.length).toBeGreaterThan(0);
    for (const s of cmp.stores) {
      expect(s.total).toBeLessThanOrEqual(cmp.base + 1e-9);
      expect(s.total + 1e-9).toBeGreaterThanOrEqual(cmp.mixed);
    }
    expect(cmp.mixed).toBeLessThanOrEqual(cmp.base);
    // seřazeno od nejlevnějšího, rozdíl se počítá proti prvnímu
    expect(cmp.stores[0].extra).toBe(0);
    for (let i = 1; i < cmp.stores.length; i++) expect(cmp.stores[i].total).toBeGreaterThanOrEqual(cmp.stores[i - 1].total);
    // cena v obchodě bere nejnižší akci tohoto obchodu, jinak běžnou cenu
    expect(pf.at('vejce', 'Lidl')).toBe(1);
    expect(pf.at('vejce', 'Albert')).toBe(pf.base('vejce'));
  });

  it('nákup jen v jednom obchodě: cena celého nákupu sedí na porovnání obchodů', () => {
    const p = generatePlan(base());
    const d = [
      { id: '1', store: 'Lidl', ingredientId: 'vejce', price: 1, validTo: '2026-12-31' },
      { id: '2', store: 'Lidl', ingredientId: 'kureci-prsa', price: 50, validTo: '2026-12-31' },
      { id: '3', store: 'Kaufland', ingredientId: 'vejce', price: 3, validTo: '2026-12-31' },
      { id: '4', store: 'Kaufland', ingredientId: 'rajcata', price: 20, validTo: '2026-12-31' },
    ];
    const all = makePriceFns({}, d, '2026-11-20');
    const cmp = compareStores(buildShopping(p, all), all);
    expect(cmp.stores.length).toBe(2);
    for (const s of cmp.stores) {
      const one = makePriceFns({}, d, '2026-11-20', { store: s.store });
      // v režimu jednoho obchodu se berou jen slevy tohoto obchodu
      for (const r of buildShopping(p, one)) if (r.store) expect(r.store).toBe(s.store);
      const total = buildShopping(p, one).reduce((a, r) => a + r.cost, 0);
      expect(total).toBeCloseTo(s.total, 6);
    }
  });

  it('plán pro jeden obchod počítá jen s jeho slevami', () => {
    const d = [
      { id: '1', store: 'Lidl', ingredientId: 'vejce', price: 1, validTo: '2026-12-31' },
      { id: '2', store: 'Kaufland', ingredientId: 'kureci-prsa', price: 20, validTo: '2026-12-31' },
    ];
    const plan = generatePlan({ ...base({ discounts: d }), store: 'Lidl' });
    const pf = makePriceFns({}, d, '2026-11-11', { store: 'Lidl' });
    for (const r of buildShopping(plan, pf)) expect(r.store === undefined || r.store === 'Lidl').toBe(true);
    expect(plan.days.flatMap((x) => x.meals)).toHaveLength(9);
  });

  it('mám doma: surovina nestojí nic, není k nákupu a je označená', () => {
    const p = generatePlan(base());
    const withHave = makePriceFns({}, [], '2026-11-20', { have: ['brambory', 'vejce'] });
    const without = makePriceFns({}, [], '2026-11-20');
    const rows = buildShopping(p, withHave);
    for (const r of rows) expect(r.have).toBe(r.id === 'brambory' || r.id === 'vejce');
    for (const r of rows.filter((x) => x.have)) expect(r.cost).toBe(0);
    expect(planCost(p, withHave)).toBeLessThanOrEqual(planCost(p, without));
    const w = whereToBuy('michana-vejce', 'chleb', 1, withHave);
    expect(w.have.map((i) => i.id)).toEqual(['vejce']);
    expect(w.other.map((i) => i.id)).not.toContain('vejce');
  });

  it('cena jídla v jednotlivých obchodech: od nejlevnějšího, nikdy nad cenou bez slev', () => {
    const d = [
      { id: '1', store: 'Lidl', ingredientId: 'vejce', price: 1, validTo: '2026-12-31' },
      { id: '2', store: 'Kaufland', ingredientId: 'vejce', price: 3, validTo: '2026-12-31' },
      { id: '3', store: 'Kaufland', ingredientId: 'rajcata', price: 10, validTo: '2026-12-31' },
    ];
    const pf = makePriceFns({}, d, '2026-11-20');
    const r = mealPricesByStore('michana-vejce', 'chleb', 1, pf);
    expect(r.stores.map((s) => s.store)).toEqual(['Lidl', 'Kaufland']);
    expect(r.stores.map((s) => s.onSale)).toEqual([1, 2]);
    for (const s of r.stores) expect(s.total).toBeLessThanOrEqual(r.base);
    expect(r.stores[0].total).toBeLessThanOrEqual(r.stores[1].total);
    // rozpis po surovinách: součet řádků = cena obchodu, akční řádky jsou označené
    for (const st of r.stores) {
      expect(st.lines.reduce((a, l) => a + l.cost, 0)).toBeCloseTo(st.total, 9);
      for (const l of st.lines) expect(l.cost).toBeCloseTo(l.unit === 'ks' ? l.amount * l.unitPrice : (l.amount / 1000) * l.unitPrice, 9);
    }
    const lidl = r.stores.find((x) => x.store === 'Lidl')!;
    expect(lidl.lines.find((l) => l.id === 'vejce')).toMatchObject({ unitPrice: 1, onSale: true, amount: 4, cost: 4 });
    expect(lidl.lines.find((l) => l.id === 'chleb')!.onSale).toBe(false);
    expect(r.baseLines.reduce((a, l) => a + l.cost, 0)).toBeCloseTo(r.base, 9);
    expect(r.baseLines.every((l) => !l.onSale)).toBe(true);
    // bez slev u tohoto jídla žádný obchod není
    expect(mealPricesByStore('michana-vejce', 'chleb', 1, makePriceFns({}, [], '2026-11-20')).stores).toHaveLength(0);
    // dvojitá várka stojí dvojnásobek
    const two = mealPricesByStore('michana-vejce', 'chleb', 2, pf);
    expect(two.base).toBeCloseTo(r.base * 2, 6);
  });

  it('kde nakoupit: seskupí suroviny podle nejlevnějšího obchodu a spočítá úsporu', () => {
    const d = [{ id: 'd', store: 'Lidl', ingredientId: 'vejce', price: 1, validTo: '2026-12-31' }];
    const w = whereToBuy('michana-vejce', 'chleb', 1, makePriceFns({}, d, '2026-11-20'));
    expect(w.groups).toHaveLength(1);
    expect(w.groups[0].store).toBe('Lidl');
    expect(w.groups[0].items.map((i) => i.name)).toContain('Vejce');
    expect(w.groups[0].cost).toBeGreaterThan(0);
    expect(w.otherCost).toBeGreaterThan(0);
    expect(w.groups[0].saving).toBeGreaterThan(10);
    expect(w.other.map((i) => i.name)).toContain('Chléb');
    const none = whereToBuy('michana-vejce', 'chleb', 1, makePriceFns({}, [], '2026-11-20'));
    expect(none.groups).toHaveLength(0);
    expect(none.saving).toBe(0);
  });
});

describe('zdroje receptů a míchání', () => {
  it('bere recepty jen z vybraných webů (snídaně, pro které tam nic není, odjinud)', () => {
    for (const src of [['Vilgain'], ['Mandimu (Jíme zdravě)', 'Toprecepty']]) {
      const p = generatePlan(base({}, { sources: src, days: 4 }));
      for (const m of p.days.flatMap((d) => d.meals)) {
        if (m.slot === 'breakfast') continue;
        expect(src, RECIPE_MAP[m.recipeId].name).toContain(sourceOf(RECIPE_MAP[m.recipeId]));
      }
    }
    const only = generatePlan(base({}, { sources: ['Toprecepty'], days: 2 }));
    expect(only.days.flatMap((d) => d.meals).filter((m) => m.slot === 'breakfast')).toHaveLength(2);
  });

  it('při každém návrhu ukáže jiná jídla', () => {
    const seen = new Set<string>();
    const sets: string[] = [];
    for (let seed = 1; seed <= 12; seed++) {
      const p = generatePlan(base({ seed }, { days: 3 }));
      const ids = p.days.flatMap((d) => d.meals.filter((m) => m.slot === 'dinner').map((m) => m.recipeId));
      ids.forEach((i) => seen.add(i));
      sets.push(ids.join());
    }
    expect(new Set(sets).size).toBeGreaterThan(8);
    expect(seen.size).toBeGreaterThan(20);
  });
});

describe('stejná snídaně na víc dní', () => {
  it('snídaně se opakuje a nakupuje se na všechny dny', () => {
    const p = generatePlan(base({}, { days: 4, slots: { breakfast: true, lunch: false, dinner: false }, repeat: { breakfast: 2, lunch: 1, dinner: 1 } }));
    const b = p.days.map((d) => d.meals[0]);
    expect(b[0].recipeId).toBe(b[1].recipeId);
    expect(b[1].leftover).toBe(true);
    expect(b[2].recipeId).toBe(b[3].recipeId);
    expect(b[2].recipeId).not.toBe(b[0].recipeId);
    expect(b[0].batchDays).toBe(2);
  });
});

describe('délka vaření do 1,5 h a nad 1,5 h', () => {
  it('filtr dělí podle celkového času', () => {
    const mid = generatePlan(base({}, { days: 5, duration: { fast: false, short: false, long: false, mid: true } }));
    for (const m of mid.days.flatMap((d) => d.meals).filter((m) => m.slot !== 'breakfast')) expect(totalMin(RECIPE_MAP[m.recipeId])).toBeLessThanOrEqual(90);
    const xl = generatePlan(base({}, { days: 2, duration: { fast: false, short: false, long: false, xlong: true } }));
    for (const m of xl.days.flatMap((d) => d.meals).filter((m) => m.slot !== 'breakfast')) expect(totalMin(RECIPE_MAP[m.recipeId])).toBeGreaterThan(90);
  });
});

describe('obtížnost', () => {
  it('rozlišuje všechny tři stupně', () => {
    const levels = new Set(Object.values(RECIPE_MAP).filter((r) => r.meal === 'main').map(difficulty));
    expect(levels).toEqual(new Set(['snadné', 'střední', 'náročné']));
  });
});

describe('nedávno navržená jídla', () => {
  it('při dalším návrhu se jídla z minulého návrhu raději neopakují', () => {
    let overlapWith = 0;
    let overlapWithout = 0;
    for (let seed = 1; seed <= 8; seed++) {
      const first = generatePlan(base({ seed }, { days: 3 }));
      const ids = (p: typeof first) => p.days.flatMap((d) => d.meals.map((m) => m.recipeId));
      const shown = first.days.flatMap((d) => d.meals.flatMap((m) => [m.recipeId, ...(m.alts ?? []).map((a) => a.recipeId)]));
      const a = new Set(ids(first));
      overlapWith += ids(generatePlan(base({ seed: seed + 100, recent: shown }, { days: 3 }))).filter((i) => a.has(i)).length;
      overlapWithout += ids(generatePlan(base({ seed: seed + 100 }, { days: 3 }))).filter((i) => a.has(i)).length;
    }
    expect(overlapWith).toBeLessThanOrEqual(overlapWithout);
    expect(overlapWith).toBeLessThanOrEqual(8);
  });
});
