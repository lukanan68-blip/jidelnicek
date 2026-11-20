import { describe, expect, it } from 'vitest';
import { HISTORY_GROUPS, INGREDIENT_MAP, INGREDIENTS } from './ingredients';
import { HOUR, RECIPES, totalMin } from './recipes';

describe('data', () => {
  it('recepty odkazují jen na existující suroviny a přílohy', () => {
    for (const r of RECIPES) {
      for (const [id] of r.ing) expect(INGREDIENT_MAP[id], `${r.id}: ${id}`).toBeDefined();
      for (const s of r.sides) expect(INGREDIENT_MAP[s]?.kind, `${r.id}: ${s}`).toBe('side');
    }
  });

  it('je dost jídel do hodiny i nad hodinu', () => {
    const mains = RECIPES.filter((r) => r.meal === 'main');
    expect(mains.filter((r) => totalMin(r) <= HOUR).length).toBeGreaterThanOrEqual(20);
    expect(mains.filter((r) => totalMin(r) > HOUR).length).toBeGreaterThanOrEqual(6);
  });

  it('každá sledovaná surovina je v záložce Co jsem jedl právě jednou', () => {
    const all = HISTORY_GROUPS.flatMap((g) => g.ids);
    expect(new Set(all).size).toBe(all.length);
    for (const id of all) expect(INGREDIENT_MAP[id], id).toBeDefined();
    for (const i of INGREDIENTS.filter((x) => ['side', 'protein', 'veg'].includes(x.kind))) {
      expect(all, i.name).toContain(i.id);
    }
  });
});

describe('letáky', () => {
  it('slevy odkazují na existující suroviny a mají smysluplnou platnost', async () => {
    const { LEAFLET_DEALS, LEAFLET_SOURCES } = await import('./leaflets');
    const ids = new Set(LEAFLET_SOURCES.map((x) => x.id));
    expect(LEAFLET_DEALS.length).toBeGreaterThan(20);
    for (const d of LEAFLET_DEALS) {
      expect(INGREDIENT_MAP[d.ingredientId], d.label).toBeDefined();
      expect(d.price, d.label).toBeGreaterThan(0);
      expect(d.from <= d.to, d.label).toBe(true);
      expect(ids.has(d.source), d.label).toBe(true);
    }
  });
});
