import { useMemo, useRef } from 'react';
import { HISTORY_GROUPS, INGREDIENT_MAP } from '../data/ingredients';
import { RECIPE_MAP } from '../data/recipes';
import { addDays, agoLabel, daysBetween, formatShort, uid } from '../lib/format';
import { buildLast } from '../lib/planner';
import type { HistoryEntry } from '../lib/types';

interface Props {
  history: HistoryEntry[];
  setHistory: (fn: (h: HistoryEntry[]) => HistoryEntry[]) => void;
  today: string;
}

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
          Zaklikni, kdy jsi naposledy jedl kterou přílohu, maso, zeleninu nebo ovoce. Jídelníček se podle toho rozloží tak, aby se
          střídalo. Stačí zhruba posledních 7 dní.
        </p>
      </section>

      {HISTORY_GROUPS.map((g) => (
        <section key={g.title} className="card">
          <details open>
            <summary className="group-title">
              {g.title} <span className="muted">({g.ids.length})</span>
            </summary>
            <ul className="hist">
              {g.ids.map((id) => {
                const i = INGREDIENT_MAP[id];
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
                      <button onClick={() => add(i.id, addDays(today, -2))}>−2 dny</button>
                      <DateButton label={`Jiné datum pro ${i.name}`} max={today} onPick={(d) => add(i.id, d)} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </details>
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

/** Tlačítko „jiné datum“: otevře kalendář, aby nezabíralo celý řádek jako políčko. */
function DateButton({ label, max, onPick }: { label: string; max: string; onPick: (date: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <span className="datebtn">
      <button
        type="button"
        aria-label={label}
        title="Jiné datum"
        onClick={() => {
          const el = ref.current;
          if (!el) return;
          if (typeof el.showPicker === 'function') el.showPicker();
          else el.focus();
        }}
      >
        📅
      </button>
      <input
        ref={ref}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        max={max}
        value=""
        onChange={(e) => e.target.value && onPick(e.target.value)}
      />
    </span>
  );
}
