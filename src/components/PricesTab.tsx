import { INGREDIENTS, UNIT_LABEL } from '../data/ingredients';
import type { PriceOverrides } from '../lib/types';

interface Props {
  prices: PriceOverrides;
  setPrices: (fn: (p: PriceOverrides) => PriceOverrides) => void;
}

export function PricesTab({ prices, setPrices }: Props) {
  return (
    <div className="stack">
      <section className="card">
        <h2>Běžné ceny surovin</h2>
        <p className="hint">
          Výchozí ceny jsou jen <b>orientační odhad</b>, nejsou z letáků. Uprav je podle toho, co platíš ty. Podle
          nich se počítá rozpočet.
        </p>
        <button onClick={() => setPrices(() => ({}))} disabled={Object.keys(prices).length === 0}>
          Vrátit výchozí ceny
        </button>
      </section>
      <section className="card">
        <ul className="prices">
          {INGREDIENTS.map((i) => (
            <li key={i.id}>
              <label>
                <span>{i.name}</span>
                <span className="price-in">
                  <input
                    inputMode="decimal"
                    aria-label={`Cena ${i.name} v Kč za ${UNIT_LABEL[i.unit]}`}
                    value={prices[i.id] ?? i.price}
                    onChange={(e) => {
                      const v = Number(e.target.value.replace(',', '.'));
                      setPrices((p) => {
                        const next = { ...p };
                        if (e.target.value === '' || Number.isNaN(v) || v < 0) delete next[i.id];
                        else next[i.id] = v;
                        return next;
                      });
                    }}
                  />
                  <small>Kč/{UNIT_LABEL[i.unit]}</small>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
