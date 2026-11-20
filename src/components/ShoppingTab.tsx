import { useMemo } from 'react';
import { UNIT_LABEL } from '../data/ingredients';
import { iconOf } from '../data/icons';
import { fmtAmount, fmtKc, fmtPrice, inStore } from '../lib/format';
import { buildShopping, compareStores, type PriceFns, type ShopRow } from '../lib/planner';
import type { Plan } from '../lib/types';
import { StoreBadge } from './StoreBadge';
import { StoreSelect } from './StoreSelect';

interface Props {
  plan: Plan | null;
  /** Ceny podle zvoleného způsobu nákupu (jeden obchod, nebo nejlevněji). */
  pf: PriceFns;
  /** Ceny ve všech obchodech, pro porovnání. */
  pfAll: PriceFns;
  checked: Record<string, boolean>;
  setChecked: (fn: (c: Record<string, boolean>) => Record<string, boolean>) => void;
  shopStore: string;
  setShopStore: (store: string) => void;
  toggleHave: (id: string) => void;
  clearHave: () => void;
  goTo: (tab: 'plan') => void;
}

const NO_STORE = 'Bez slevy – kdekoliv';

export function ShoppingTab({
  plan,
  pf,
  pfAll,
  checked,
  setChecked,
  shopStore,
  setShopStore,
  toggleHave,
  clearHave,
  goTo,
}: Props) {
  const allRows = useMemo(() => (plan ? buildShopping(plan, pf) : []), [plan, pf]);
  const compareRows = useMemo(() => (plan ? buildShopping(plan, pfAll) : []), [plan, pfAll]);

  if (!plan) {
    return (
      <section className="card">
        <p>Nákupní seznam vznikne z jídelníčku.</p>
        <button className="primary" onClick={() => goTo('plan')}>
          Nejdřív navrhnout jídelníček
        </button>
      </section>
    );
  }

  const rows = allRows.filter((r) => !r.have);
  const haveRows = allRows.filter((r) => r.have);
  const single = !!pf.store;

  // jeden obchod = jeden seznam se všemi surovinami, jinak podle nejlevnějšího obchodu
  const groups = new Map<string, ShopRow[]>();
  for (const r of rows) {
    const k = single ? pf.store! : (r.store ?? NO_STORE);
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }
  const saving = (rs: ShopRow[]) => rs.reduce((s, r) => s + (r.baseCost - r.cost), 0);
  const ordered = [...groups.entries()].sort(([a, ra], [b, rb]) => {
    if (a === NO_STORE) return 1;
    if (b === NO_STORE) return -1;
    return saving(rb) - saving(ra);
  });

  const sum = (rs: ShopRow[]) => rs.reduce((s, r) => s + r.cost, 0);
  const total = sum(rows);
  const compare = compareStores(compareRows, pfAll);
  const keyOf = (r: ShopRow) => `${plan.id}:${r.id}`;

  function copy() {
    const text = ordered
      .map(
        ([store, rs]) =>
          `${store} (asi ${fmtKc(sum(rs))})\n` + rs.map((r) => `- ${r.name}: ${fmtAmount(r.unit, r.amount)}`).join('\n'),
      )
      .join('\n\n');
    navigator.clipboard?.writeText(text).catch(() => undefined);
  }

  return (
    <div className="stack">
      <section className="card summary ok">
        <div className="big">
          {single ? `Nákup jen ${inStore(pf.store!)}` : 'Nákup'}: {fmtKc(total)}
          <span> za {rows.length} položek</span>
        </div>
        <label className="field-wide">
          Kde nakupuješ
          <StoreSelect value={shopStore} onChange={setShopStore} withDeals={pfAll.stores} />
        </label>
        {!single && (
          <ul className="store-totals">
            {ordered.map(([store, rs]) => (
              <li key={store}>
                <span>{store === NO_STORE ? store : <StoreBadge store={store} />}</span>
                <b>{fmtKc(sum(rs))}</b>
              </li>
            ))}
          </ul>
        )}
        <p>
          {single
            ? `Všechny suroviny koupíš ${inStore(pf.store!)}. Co má v letáku slevu, je za akční cenu, ostatní za běžnou cenu (odhad). `
            : ''}
          Cena je za množství, které se spotřebuje. V obchodě koupíš celá balení, takže skutečný účet bude o něco vyšší.
          Sůl, olej a koření se nepočítají.
        </p>
        <div className="row">
          <button onClick={copy}>Zkopírovat seznam</button>
        </div>
      </section>

      {compare.stores.length > 0 && (
        <section className="card">
          <h3>Kolik zaplatíš, když nakoupíš všechno v jednom obchodě</h3>
          <p className="hint">
            Cena celého nákupu, když se tam koupí všechny suroviny z jídelníčku. Co v letáku obchodu není, počítá se
            za běžnou cenu (odhad), proto jsou rozdíly jen podle slev z letáků.
          </p>
          <ul className="store-totals">
            {compare.stores.map((s, i) => (
              <li key={s.store} className={`${i === 0 ? 'best' : ''} ${pf.store === s.store ? 'chosen' : ''}`}>
                <span>
                  <StoreBadge store={s.store} />
                  <small className="muted">
                    {' '}
                    · {s.onSale} položek v akci{i > 0 ? `, o ${fmtKc(s.extra)} dráž` : ', nejlevnější z jednoho obchodu'}
                  </small>
                </span>
                <span className="store-pick">
                  <b>{fmtKc(s.total)}</b>
                  <button className="mini" disabled={pf.store === s.store} onClick={() => setShopStore(s.store)}>
                    {pf.store === s.store ? 'Vybráno' : 'Nakoupit tady'}
                  </button>
                </span>
              </li>
            ))}
            <li>
              <span>
                Bez slev (běžné ceny)
                <small className="muted"> · odhad</small>
              </span>
              <b>{fmtKc(compare.base)}</b>
            </li>
            <li className={`best ${!pf.store ? 'chosen' : ''}`}>
              <span>
                Nejlevnější kombinace obchodů
                <small className="muted"> · každá surovina tam, kde je nejlevnější</small>
              </span>
              <span className="store-pick">
                <b>{fmtKc(compare.mixed)}</b>
                <button className="mini" disabled={!pf.store} onClick={() => setShopStore('')}>
                  {!pf.store ? 'Vybráno' : 'Použít'}
                </button>
              </span>
            </li>
          </ul>
        </section>
      )}

      {ordered.map(([store, rs]) => (
        <section key={store} className="card">
          <h3>
            {store === NO_STORE ? store : <StoreBadge store={store} />}
            <small className="save">
              {' '}
              · zaplatíš {single ? 'celkem' : ''} asi {fmtKc(sum(rs))}
              {store !== NO_STORE && saving(rs) > 0.5 && `, ušetříš ${fmtKc(saving(rs))}`}
              {store === NO_STORE && ' (odhad)'}
            </small>
          </h3>
          <ul className="shop">
            {rs.map((r) => (
              <li key={r.id} className={checked[keyOf(r)] ? 'got' : ''}>
                <input
                  id={`buy-${r.id}`}
                  type="checkbox"
                  checked={!!checked[keyOf(r)]}
                  onChange={(e) => setChecked((c) => ({ ...c, [keyOf(r)]: e.target.checked }))}
                />
                <div className="name">
                  <label htmlFor={`buy-${r.id}`}>
                    <span className="ico" aria-hidden="true">
                      {iconOf(r.id)}
                    </span>{' '}
                    {r.name}
                    <small>
                      {' '}
                      {fmtPrice(r.unitPrice)}/{UNIT_LABEL[r.unit]}
                      {r.discountPrice !== undefined ? ' · akce' : ''}
                    </small>
                  </label>
                  <button className="have-btn" onClick={() => toggleHave(r.id)} aria-label={`Mám doma: ${r.name}`}>
                    Mám doma
                  </button>
                </div>
                <span className="amt">{fmtAmount(r.unit, r.amount)}</span>
                <span className="price">{fmtKc(r.cost)}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {haveRows.length > 0 && (
        <section className="card">
          <h3>
            Mám doma ({haveRows.length})
            <small className="muted"> · nekupuješ a nepočítá se do ceny</small>
          </h3>
          <ul className="shop">
            {haveRows.map((r) => (
              <li key={r.id} className="got">
                <span aria-hidden="true" />
                <div className="name">
                  <span>
                    <span className="ico" aria-hidden="true">
                      {iconOf(r.id)}
                    </span>{' '}
                    {r.name}
                  </span>
                  <button className="have-btn on" onClick={() => toggleHave(r.id)} aria-label={`Vrátit do nákupu: ${r.name}`}>
                    Vrátit do nákupu
                  </button>
                </div>
                <span className="amt">{fmtAmount(r.unit, r.amount)}</span>
                <span className="price">doma</span>
              </li>
            ))}
          </ul>
          <p className="hint">
            Co máš doma, si aplikace pamatuje i pro další jídelníčky.{' '}
            <button className="link" onClick={clearHave}>
              Zrušit všechno
            </button>
          </p>
        </section>
      )}
    </div>
  );
}
