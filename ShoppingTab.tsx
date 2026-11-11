import { useMemo } from 'react';
import { UNIT_LABEL } from '../data/ingredients';
import { fmtAmount, fmtKc } from '../lib/format';
import { buildShopping, type PriceFns, type ShopRow } from '../lib/planner';
import type { Plan } from '../lib/types';

interface Props {
  plan: Plan | null;
  pf: PriceFns;
  checked: Record<string, boolean>;
  setChecked: (fn: (c: Record<string, boolean>) => Record<string, boolean>) => void;
  goTo: (tab: 'plan') => void;
}

const NO_STORE = 'Bez slevy – kdekoliv';

export function ShoppingTab({ plan, pf, checked, setChecked, goTo }: Props) {
  const rows = useMemo(() => (plan ? buildShopping(plan, pf) : []), [plan, pf]);

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

  const groups = new Map<string, ShopRow[]>();
  for (const r of rows) {
    const k = r.store ?? NO_STORE;
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }
  const saving = (rs: ShopRow[]) => rs.reduce((s, r) => s + (r.baseCost - r.cost), 0);
  const ordered = [...groups.entries()].sort(([a, ra], [b, rb]) => {
    if (a === NO_STORE) return 1;
    if (b === NO_STORE) return -1;
    return saving(rb) - saving(ra);
  });

  const total = rows.reduce((s, r) => s + r.cost, 0);
  const keyOf = (r: ShopRow) => `${plan.id}:${r.id}`;

  function copy() {
    const text = ordered
      .map(
        ([store, rs]) =>
          `${store}\n` + rs.map((r) => `- ${r.name}: ${fmtAmount(r.unit, r.amount)}`).join('\n'),
      )
      .join('\n\n');
    navigator.clipboard?.writeText(text).catch(() => undefined);
  }

  return (
    <div className="stack">
      <section className="card summary ok">
        <div className="big">
          Nákup: {fmtKc(total)}
          <span> za {rows.length} položek</span>
        </div>
        <p>
          Cena je za množství, které se spotřebuje. V obchodě koupíš celá balení, takže skutečný účet bude o něco
          vyšší. Sůl, olej a koření se nepočítají.
        </p>
        <div className="row">
          <button onClick={copy}>Zkopírovat seznam</button>
        </div>
      </section>

      {ordered.map(([store, rs]) => (
        <section key={store} className="card">
          <h3>
            {store}
            {store !== NO_STORE && <small className="save"> ušetříš asi {fmtKc(saving(rs))}</small>}
          </h3>
          <ul className="shop">
            {rs.map((r) => (
              <li key={r.id} className={checked[keyOf(r)] ? 'got' : ''}>
                <label>
                  <input
                    type="checkbox"
                    checked={!!checked[keyOf(r)]}
                    onChange={(e) => setChecked((c) => ({ ...c, [keyOf(r)]: e.target.checked }))}
                  />
                  <span className="name">
                    {r.name}
                    {r.discountPrice !== undefined && (
                      <small>
                        {' '}
                        akce {r.discountPrice} Kč/{UNIT_LABEL[r.unit]}
                      </small>
                    )}
                  </span>
                  <span className="amt">{fmtAmount(r.unit, r.amount)}</span>
                  <span className="price">{fmtKc(r.cost)}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
