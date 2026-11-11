import { describe, expect, it } from 'vitest';
import { HISTORY_GROUPS, INGREDIENT_MAP, INGREDIENTS } from './ingredients';
import { RECIPES } from './recipes';

describe('data', () => {
  it('recepty odkazují jen na existující suroviny a přílohy', () => {
    for (const r of RECIPES) {
      for (const [id] of r.ing) expect(INGREDIENT_MAP[id], `${r.id}: ${id}`).toBeDefined();
      for (const s of r.sides) expect(INGREDIENT_MAP[s]?.kind, `${r.id}: ${s}`).toBe('side');
    }
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
