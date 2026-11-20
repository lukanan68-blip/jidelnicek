import { UNIT_LABEL } from '../data/ingredients';
import { iconOf } from '../data/icons';
import { fmtAmount, fmtKc, fmtKcFine, fmtPrice } from '../lib/format';
import type { PriceLine } from '../lib/planner';

/** Cena jídla rozepsaná po surovinách: množství × cena za kg/l/kus = částka. */
export function PriceLines({ lines }: { lines: PriceLine[] }) {
  const total = lines.reduce((s, l) => s + l.cost, 0);
  return (
    <ul className="lines">
      {lines.map((l) => (
        <li key={l.id}>
          <span className="ln-name">
            <span className="ico" aria-hidden="true">
              {iconOf(l.id)}
            </span>{' '}
            {l.name}
          </span>
          <b>{l.have ? 'doma' : fmtKcFine(l.cost)}</b>
          <small>
            {l.have
              ? 'máš doma, nekupuješ'
              : `${fmtAmount(l.unit, l.amount)} × ${fmtPrice(l.unitPrice)}/${UNIT_LABEL[l.unit]}${l.onSale ? ' · akce' : ''}`}
          </small>
        </li>
      ))}
      <li className="total">
        <span>Celkem</span>
        <b>{fmtKc(total)}</b>
      </li>
    </ul>
  );
}
