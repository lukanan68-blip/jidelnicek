import { describe, expect, it } from 'vitest';
import { migrateDiscounts, migrateHistory, migrateIds, migratePrices } from './migrate';

describe('převod starých uložených dat', () => {
  it('sýr se změní na eidam a neznámé suroviny zmizí', () => {
    expect(migrateIds(['syr', 'eidam', 'rýže-neexistuje', 'ryze'])).toEqual(['eidam', 'ryze']);
    expect(migrateHistory([{ id: '1', date: '2026-11-01', ingredientIds: ['syr', 'ryze'] }])[0].ingredientIds).toEqual(['eidam', 'ryze']);
    expect(migrateDiscounts([{ id: 'a', store: 'Lidl', ingredientId: 'syr', price: 100 }])[0].ingredientId).toBe('eidam');
    expect(migratePrices({ syr: 170, ryze: 40 })).toEqual({ eidam: 170, ryze: 40 });
  });
});
