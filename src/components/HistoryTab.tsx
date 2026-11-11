import { useMemo } from 'react';
import { INGREDIENTS, INGREDIENT_MAP } from '../data/ingredients';
import { RECIPE_MAP } from '../data/recipes';
import { addDays, agoLabel, daysBetween, formatShort, uid } from '../lib/format';
import { buildLast } from '../lib/planner';
import type { HistoryEntry } from '../lib/types';

interface Props {
  history: HistoryEntry[];
  setHistory: (fn: (h: HistoryEntry[]) => HistoryEntry[]) => void;
  today: string;
}

const GROUPS: { kind: 'side' | 'protein'; title: string }[] = [
  { kind: 'side', title: 'Přílohy' },
  { kind: 'protein', title: 'Maso, vejce a luštěniny' },
];

export function HistoryTab({ history, setHistory, today }: Props) {
  const last = useMemo(() => buildLast(history).ing, [history]);

  function add(id: string, date: string) {
    setHistory((h) => [...h, { id: uid(), date, ingredientIds: [id] }]);
  }

  const log = [...history].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 20);

  return (
    <div className="stack">
      <section className="card">
        <h2>Co jsem jedl</h2>
        <p className="hint">
          Zaklikni, kdy jsi naposledy jedl kterou přílohu a maso. Jídelníček se podle toho rozloží tak, aby se
          střídalo. Stačí zhruba posledních 7 dní.
        </p>
      </section>

      {GROUPS.map((g) => (
        <section key={g.kind} className="card">
          <h3>{g.title}</h3>
          <ul className="hist">
            {INGREDIENTS.filter((i) => i.kind === g.kind).map((i) => {
              const d = last[i.id];
              return (
                <li key={i.id}>
                  <div className="hist-name">
                    <b>{i.name}</b>
                    <span className={d ? '' : 'muted'}>
                      {d ? `${agoLabel(Math.max(0, daysBetween(d, today)))} (${formatShort(d)})` : 'bez záznamu'}
                    </span>
                  </div>
                  <div className="hist-btns">
                    <button onClick={() => add(i.id, today)}>Dnes</button>
                    <button onClick={() => add(i.id, addDays(today, -1))}>Včera</button>
                    <button onClick={() => add(i.id, addDays(today, -2))}>Před 2 dny</button>
                    <input
                      type="date"
                      aria-label={`Jiné datum pro ${i.name}`}
                      max={today}
                      value=""
                      onChange={(e) => e.target.value && add(i.id, e.target.value)}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <section className="card">
        <h3>Poslední záznamy</h3>
        {log.length === 0 ? (
          <p className="muted">Zatím nic.</p>
        ) : (
          <ul className="log">
            {log.map((h) => (
              <li key={h.id}>
                <span>
                  <b>{formatShort(h.date)}</b>{' '}
                  {h.recipeId
                    ? RECIPE_MAP[h.recipeId]?.name
                    : h.ingredientIds.map((id) => INGREDIENT_MAP[id]?.name).join(', ')}
                </span>
                <button aria-label="Smazat záznam" onClick={() => setHistory((x) => x.filter((e) => e.id !== h.id))}>
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
