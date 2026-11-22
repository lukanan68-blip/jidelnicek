import { useMemo, useRef } from 'react';
import { iconOf } from '../data/icons';
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

  /** Zapsáno u suroviny v tento den (jakýmkoliv způsobem). */
  const isOn = (id: string, date: string) => history.some((e) => e.date === date && e.ingredientIds.includes(id));
  /** Dá se zrušit jen ručně zapsané; to, co přišlo z „Snědeno“ u jídla, se maže v seznamu níž. */
  const manual = (id: string, date: string) =>
    history.some((e) => e.date === date && !e.recipeId && e.ingredientIds.length === 1 && e.ingredientIds[0] === id);

  function toggle(id: string, date: string) {
    if (manual(id, date)) {
      setHistory((h) => h.filter((e) => !(e.date === date && !e.recipeId && e.ingredientIds.length === 1 && e.ingredientIds[0] === id)));
    } else if (!isOn(id, date)) {
      setHistory((h) => [...h, { id: uid(), date, ingredientIds: [id] }]);
    }
  }

  function add(id: string, date: string) {
    if (!isOn(id, date)) setHistory((h) => [...h, { id: uid(), date, ingredientIds: [id] }]);
  }

  // posledních 7 dní: dnes, včera, předevčírem a dál se jménem dne
  const dayChips = Array.from({ length: 7 }, (_, k) => {
    const date = addDays(today, -k);
    const wd = new Date(date + 'T00:00:00Z').toLocaleDateString('cs-CZ', { weekday: 'short', timeZone: 'UTC' });
    const label = k === 0 ? 'Dnes' : k === 1 ? 'Včera' : k === 2 ? 'Předevčírem' : `${wd} ${formatShort(date)}`;
    return { date, label };
  });

  const log = [...history].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 20);

  return (
    <div className="stack">
      <section className="card">
        <h2>Co jsem jedl</h2>
        <p className="hint">
          Zaklikni, kdy jsi naposledy jedl kterou přílohu, maso, zeleninu nebo ovoce. Jídelníček se podle toho rozloží tak, aby se
          střídalo. Stačí zhruba posledních 7 dní. U každé suroviny si zaklikni všechny dny, kdy jsi ji jedl (třeba dnes, včera a
          předevčírem). Dalším klepnutím den zase zrušíš.
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
                      <b>
                        <span className="ico" aria-hidden="true">
                          {iconOf(i.id)}
                        </span>{' '}
                        {i.name}
                      </b>
                      <span className={d ? '' : 'muted'}>
                        {d ? `${agoLabel(Math.max(0, daysBetween(d, today)))} (${formatShort(d)})` : 'bez záznamu'}
                      </span>
                    </div>
                    <div className="hist-btns">
                      {dayChips.map((c) => {
                        const on = isOn(i.id, c.date);
                        const locked = on && !manual(i.id, c.date);
                        return (
                          <button
                            key={c.date}
                            className={`day-chip ${on ? 'on' : ''}`}
                            aria-pressed={on}
                            disabled={locked}
                            title={locked ? 'Zapsáno z jídla, smaž to dole v seznamu záznamů' : undefined}
                            onClick={() => toggle(i.id, c.date)}
                          >
                            {on ? '✓ ' : ''}
                            {c.label}
                          </button>
                        );
                      })}
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
