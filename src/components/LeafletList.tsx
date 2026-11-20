import { INGREDIENT_MAP, UNIT_LABEL } from '../data/ingredients';
import { LEAFLETS_UPDATED, LEAFLET_DEALS, LEAFLET_SOURCES } from '../data/leaflets';
import { fmtPrice, formatShort } from '../lib/format';

interface Props {
  today: string;
}

/** Slevy načtené z letáků: co platí teď, co teprve začne a co už skončilo. */
export function LeafletList({ today }: Props) {
  return (
    <section className="card">
      <h3>Načtené letáky</h3>
      <p className="hint">
        Aktualizováno {formatShort(LEAFLETS_UPDATED)} Ceny jsou přepočtené na kg, l nebo kus a počítají se do
        jídelníčku a nákupu automaticky. Po skončení platnosti se sleva přestane počítat.
      </p>
      <div className="stack-s">
        {LEAFLET_SOURCES.map((src) => {
          const deals = LEAFLET_DEALS.filter((d) => d.source === src.id && d.to >= today).sort((a, b) =>
            INGREDIENT_MAP[a.ingredientId].name.localeCompare(INGREDIENT_MAP[b.ingredientId].name, 'cs'),
          );
          const status = src.to < today ? 'skončil' : src.from > today ? `začíná ${formatShort(src.from)}` : 'platí teď';
          return (
            <details key={src.id} className="leaflet" open={deals.length > 0}>
              <summary>
                <b>{src.title}</b>
                <span className="muted">
                  {' '}
                  · {formatShort(src.from)} – {formatShort(src.to)} · {status} · {deals.length} slev
                </span>
              </summary>
              <p className="hint">
                {src.note}{' '}
                <a href={src.url} target="_blank" rel="noreferrer">
                  Otevřít leták
                </a>
              </p>
              {deals.length > 0 && (
                <ul className="log">
                  {deals.map((d, i) => {
                    const ing = INGREDIENT_MAP[d.ingredientId];
                    const upcoming = d.from > today;
                    return (
                      <li key={i}>
                        <span>
                          <b>{ing.name}</b> {fmtPrice(d.price)}/{UNIT_LABEL[ing.unit]}
                          <small className="muted">
                            {' '}
                            {d.label}
                            {d.note ? ` (${d.note})` : ''} · {upcoming ? `od ${formatShort(d.from)}` : 'do'}{' '}
                            {formatShort(d.to)}
                          </small>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </details>
          );
        })}
      </div>
    </section>
  );
}
