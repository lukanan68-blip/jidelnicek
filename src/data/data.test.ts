import { describe, expect, it } from 'vitest';
import { HISTORY_GROUPS, INGREDIENT_MAP, INGREDIENTS } from './ingredients';
import { dishIcon, iconOf, plateParts, INGREDIENT_ICON } from './icons';
import { HOUR, RECIPES, hasMeat, totalMin } from './recipes';

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

  it('je dost rychlých jídel (do 35 minut) pro týdenní plán', () => {
    const mains = RECIPES.filter((r) => r.meal === 'main');
    expect(mains.filter((r) => totalMin(r) <= 35).length).toBeGreaterThanOrEqual(14);
    expect(mains.filter((r) => !hasMeat(r) && totalMin(r) <= 35).length).toBeGreaterThanOrEqual(8);
  });

  it('je dost jídel bez masa pro týdenní plán', () => {
    expect(RECIPES.filter((r) => r.meal === 'main' && !hasMeat(r)).length).toBeGreaterThanOrEqual(14);
    expect(RECIPES.filter((r) => r.meal === 'breakfast' && !hasMeat(r)).length).toBeGreaterThanOrEqual(7);
  });

  it('každá surovina má vlastní symbol a každý recept symbol jídla i talíř', () => {
    for (const i of INGREDIENTS) expect(INGREDIENT_ICON[i.id], i.name).toBeDefined();
    expect(iconOf('neexistuje')).toBe('🍽️');
    for (const r of RECIPES) {
      expect(dishIcon(r, r.sides[0]), r.name).toBeTruthy();
      const parts = plateParts(r, r.sides[0]);
      expect(parts.length, r.name).toBeGreaterThan(0);
      expect(parts.length).toBeLessThanOrEqual(5);
    }
  });

  it('fotky jsou odkazy na https a vždy s odkazem na originál', () => {
    const withPhoto = RECIPES.filter((r) => r.photo);
    expect(withPhoto.length).toBeGreaterThan(60);
    for (const r of withPhoto) {
      expect(r.photo!.url, r.name).toMatch(/^https:\/\/.+\.(jpg|jpeg|png|webp)$/i);
      expect(r.photo!.link, r.name).toMatch(/^https:\/\//);
      expect(r.photo!.site, r.name).toBeTruthy();
    }
    // u našich receptů je fotka vždy označená jako podobné jídlo
    const own = withPhoto.filter((r) => !r.source);
    expect(own.length).toBeGreaterThan(10);
    for (const r of own) expect(r.photo!.similar, r.name).toBe(true);
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
