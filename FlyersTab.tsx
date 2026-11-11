import { useState, type FormEvent } from 'react';
import { INGREDIENTS, INGREDIENT_MAP, STORES, UNIT_LABEL } from '../data/ingredients';
import { fmtKc, formatShort, uid } from '../lib/format';
import type { Discount, PriceOverrides } from '../lib/types';

interface Props {
  discounts: Discount[];
  setDiscounts: (fn: (d: Discount[]) => Discount[]) => void;
  prices: PriceOverrides;
  today: string;
}

export function FlyersTab({ discounts, setDiscounts, prices, today }: Props) {
  const [store, setStore] = useState<string>(STORES[0]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [validTo, setValidTo] = useState('');
  const [error, setError] = useState('');

  const ing = INGREDIENTS.find((i) => i.name.toLowerCase() === name.trim().toLowerCase());

  function submit(e: FormEvent) {
    e.preventDefault();
    const p = Number(price.replace(',', '.'));
    if (!ing) return setError('Vyber surovinu ze seznamu.');
    if (!(p > 0)) return setError('Zadej akční cenu.');
    setError('');
    setDiscounts((d) => [...d, { id: uid(), store, ingredientId: ing.id, price: p, validTo: validTo || undefined }]);
    setName('');
    setPrice('');
  }

  const active = discounts.filter((d) => !d.validTo || d.validTo >= today);
  const expired = discounts.length - active.length;

  return (
    <div className="stack">
      <section className="card">
        <h2>Slevy z letáků</h2>
        <p className="hint">
          Slevy zatím zapisuješ ručně, obchody nenabízejí oficiální data. Otevři si letáky (třeba na{' '}
          <a href="https://www.kupi.cz/" target="_blank" rel="noreferrer">
            kupi.cz
          </a>
          ) a přepiš jen to, co tě zajímá. Plánovač pak slevové suroviny uprednostní a nákup rozdělí podle obchodů.
        </p>
        <form onSubmit={submit} className="stack-s">
          <div className="grid2">
            <label>
              Obchod
              <select value={store} onChange={(e) => setStore(e.target.value)}>
                {STORES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              Surovina
              <input list="ingredients" value={name} onChange={(e) => setName(e.target.value)} placeholder="např. Kuřecí prsa" />
              <datalist id="ingredients">
                {INGREDIENTS.map((i) => (
                  <option key={i.id} value={i.name} />
                ))}
              </datalist>
            </label>
            <label>
              Akční cena (Kč za {ing ? UNIT_LABEL[ing.unit] : 'kg / l / ks'})
              <input
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={ing ? `běžně ${prices[ing.id] ?? ing.price}` : ''}
              />
            </label>
            <label>
              Platí do (nepovinné)
              <input type="date" value={validTo} onChange={(e) => setValidTo(e.target.value)} />
            </label>
          </div>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <button className="primary">Přidat slevu</button>
        </form>
      </section>

      <section className="card">
        <h3>Aktuální slevy</h3>
        {active.length === 0 ? (
          <p className="muted">Zatím žádné. Bez slev se počítá běžná cena.</p>
        ) : (
          <ul className="log">
            {[...active]
              .sort((a, b) => a.store.localeCompare(b.store, 'cs'))
              .map((d) => {
                const i = INGREDIENT_MAP[d.ingredientId];
                return (
                  <li key={d.id}>
                    <span>
                      <b>{d.store}</b> · {i.name} · {fmtKc(d.price)}/{UNIT_LABEL[i.unit]}
                      {d.validTo && <small className="muted"> do {formatShort(d.validTo)}</small>}
                    </span>
                    <button aria-label="Smazat slevu" onClick={() => setDiscounts((x) => x.filter((e) => e.id !== d.id))}>
                      ✕
                    </button>
                  </li>
                );
              })}
          </ul>
        )}
        {expired > 0 && (
          <p className="muted">
            {expired} prošlých slev se nepočítá.{' '}
            <button className="link" onClick={() => setDiscounts((x) => x.filter((d) => !d.validTo || d.validTo >= today))}>
              Smazat prošlé
            </button>
          </p>
        )}
      </section>
    </div>
  );
}
