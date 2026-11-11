import { useMemo } from 'react';
import { INGREDIENT_MAP, STAPLE_IDS } from '../data/ingredients';
import { RECIPE_MAP, RECIPE_SITES, recipeSearchUrl } from '../data/recipes';
import { agoLabel, daysBetween, fmtAmount, fmtKc, formatDay, formatShort, uid } from '../lib/format';
import {
  QUICK_MAX,
  buildLast,
  mealIngredients,
  planCost,
  planMealCost,
  type PriceFns,
} from '../lib/planner';
import { SLOT_LABEL, SLOT_ORDER, type HistoryEntry, type Plan, type PlanMeal, type Settings } from '../lib/types';

interface Props {
  settings: Settings;
  setSettings: (fn: (s: Settings) => Settings) => void;
  plan: Plan | null;
  history: HistoryEntry[];
  setHistory: (fn: (h: HistoryEntry[]) => HistoryEntry[]) => void;
  pf: PriceFns;
  today: string;
  onGenerate: () => void;
  onSwap: (dayIdx: number, mealIdx: number) => void;
  goTo: (tab: 'history') => void;
}

export function PlanTab({ settings, setSettings, plan, history, setHistory, pf, today, onGenerate, onSwap, goTo }: Props) {
  const total = plan ? planCost(plan, pf) : 0;
  const baseTotal = plan ? planCost(plan, { ...pf, eff: pf.base }) : 0;
  const saved = baseTotal - total;
  const over = plan ? total > plan.settings.budget + 0.5 : false;
  const anySlot = SLOT_ORDER.some((s) => settings.slots[s]);

  return (
    <div className="stack">
      <section className="card">
        <h2>Zadání</h2>
        <div className="grid2">
          <label>
            Počet dní
            <select
              value={settings.days}
              onChange={(e) => setSettings((s) => ({ ...s, days: Number(e.target.value) }))}
            >
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label>
            Rozpočet pro 2 lidi (Kč)
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={10}
              value={settings.budget}
              onChange={(e) => setSettings((s) => ({ ...s, budget: Math.max(0, Number(e.target.value)) }))}
            />
          </label>
          <label>
            Začátek
            <input
              type="date"
              value={settings.startDate}
              onChange={(e) => e.target.value && setSettings((s) => ({ ...s, startDate: e.target.value }))}
            />
          </label>
        </div>

        <fieldset>
          <legend>Co plánovat</legend>
          <div className="chips">
            {SLOT_ORDER.map((slot) => (
              <label key={slot} className="check">
                <input
                  type="checkbox"
                  checked={settings.slots[slot]}
                  onChange={(e) => setSettings((s) => ({ ...s, slots: { ...s.slots, [slot]: e.target.checked } }))}
                />
                {SLOT_LABEL[slot]}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="check">
          <input
            type="checkbox"
            checked={settings.quick}
            onChange={(e) => setSettings((s) => ({ ...s, quick: e.target.checked }))}
          />
          <span>
            Nechci u toho trávit moc času
            <small> – jen jídla do {QUICK_MAX} min u sporáku</small>
          </span>
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={settings.batch}
            onChange={(e) => setSettings((s) => ({ ...s, batch: e.target.checked }))}
          />
          <span>
            Vařit dvojitě
            <small> – večeře se uvaří na 2 dny a druhý den je z ní oběd</small>
          </span>
        </label>

        <div className="row">
          <button className="primary" onClick={onGenerate} disabled={!anySlot}>
            {plan ? 'Navrhnout znovu' : 'Navrhnout jídelníček'}
          </button>
        </div>
        {history.length === 0 && (
          <p className="hint">
            Tip: napřed si v záložce{' '}
            <button className="link" onClick={() => goTo('history')}>
              Co jsem jedl
            </button>{' '}
            zaznač přílohy a maso z posledních dnů. Podle toho se pak budou střídat.
          </p>
        )}
      </section>

      {plan && (
        <>
          <section className={`card summary ${over ? 'warn' : 'ok'}`} role="status">
            <div className="big">
              Odhad: {fmtKc(total)} <span>z {fmtKc(plan.settings.budget)}</span>
            </div>
            {over ? (
              <p>
                Za tuhle částku to nevyjde. Nejlevnější plán, který jsem našel, stojí asi {fmtKc(plan.cheapestCost)}.
                Zvedni rozpočet, ubaluj počet jídel (třeba bez snídaní) nebo zadej slevy z letáků.
              </p>
            ) : (
              <p>
                Vejdeš se do rozpočtu, zbývá asi {fmtKc(plan.settings.budget - total)}.
                {saved > 1 && <> Slevy z letáků ušetří asi {fmtKc(saved)}.</>}
              </p>
            )}
          </section>

          {plan.days.map((day, di) => (
            <section key={day.date} className="card">
              <h3 className="cap">{formatDay(day.date)}</h3>
              <div className="meals">
                {day.meals.map((meal, mi) => (
                  <MealCard
                    key={`${meal.slot}-${meal.recipeId}-${mi}`}
                    plan={plan}
                    dayIdx={di}
                    date={day.date}
                    meal={meal}
                    history={history}
                    setHistory={setHistory}
                    pf={pf}
                    today={today}
                    onSwap={() => onSwap(di, mi)}
                  />
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}

interface MealProps {
  plan: Plan;
  dayIdx: number;
  date: string;
  meal: PlanMeal;
  history: HistoryEntry[];
  setHistory: (fn: (h: HistoryEntry[]) => HistoryEntry[]) => void;
  pf: PriceFns;
  today: string;
  onSwap: () => void;
}

function MealCard({ plan, dayIdx, date, meal, history, setHistory, pf, today, onSwap }: MealProps) {
  const recipe = RECIPE_MAP[meal.recipeId];
  const key = `${plan.id}:${dayIdx}:${meal.slot}`;
  const eaten = history.some((h) => h.source === key);
  const last = useMemo(() => buildLast(history, key), [history, key]);
  const mult = meal.doubled ? 2 : 1;
  const ings = mealIngredients(recipe, meal.sideId, mult);
  const cost = planMealCost(meal, pf);

  const tracked = ings
    .map(([id]) => INGREDIENT_MAP[id])
    .filter((i) => i.kind === 'side' || i.kind === 'protein')
    .sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'side' ? -1 : 1));

  const veg = ings.map(([id]) => INGREDIENT_MAP[id]).filter((i) => i.kind === 'veg' && !STAPLE_IDS.has(i.id));

  function toggleEaten() {
    if (eaten) {
      setHistory((h) => h.filter((e) => e.source !== key));
    } else {
      const when = date > today ? today : date;
      setHistory((h) => [
        ...h,
        { id: uid(), date: when, recipeId: recipe.id, ingredientIds: ings.map(([id]) => id), source: key },
      ]);
    }
  }

  return (
    <article className={`meal ${eaten ? 'eaten' : ''}`}>
      <div className="meal-head">
        <span className="slot">{SLOT_LABEL[meal.slot]}</span>
        <span className="cost">{meal.leftover ? 'zbytky' : fmtKc(cost)}</span>
      </div>
      <h4>{recipe.name}</h4>
      <p className="meta">
        {meal.leftover
          ? 'Zbytky z včerejší večeře, nevaří se.'
          : `⏱ ${recipe.min} min${recipe.extra ? ` + ${recipe.extra} min samo` : ''}${meal.doubled ? ' · vaříš dvojitou porci' : ''}`}
      </p>

      {tracked.length > 0 && (
        <ul className="rotation">
          {tracked.map((i) => {
            const d = last.ing[i.id];
            const label = d ? `naposledy ${agoLabel(Math.max(0, daysBetween(d, today)))} (${formatShort(d)})` : 'bez záznamu';
            return (
              <li key={i.id} className={i.kind === 'side' ? 'side' : ''}>
                <b>{i.kind === 'side' ? 'Příloha: ' : ''}{i.name}</b> – {label}
              </li>
            );
          })}
        </ul>
      )}

      {veg.length > 0 && (
        <p className="veg-line">
          <b>Zelenina a ovoce:</b>{' '}
          {veg
            .map((i) => {
              const d = last.ing[i.id];
              return `${i.name} ${d ? agoLabel(Math.max(0, daysBetween(d, today))) : 'bez záznamu'}`;
            })
            .join(' · ')}
        </p>
      )}

      <details>
        <summary>Suroviny pro 2 lidi</summary>
        <ul className="ings">
          {ings.map(([id, a]) => {
            const i = INGREDIENT_MAP[id];
            const best = pf.best(id);
            return (
              <li key={id}>
                <span>
                  {i.name} <em>{fmtAmount(i.unit, a)}</em>
                </span>
                {best && !meal.leftover && <span className="tag">sleva {best.store}</span>}
              </li>
            );
          })}
        </ul>
      </details>

      <div className="actions">
        <button className={eaten ? 'done' : ''} onClick={toggleEaten} aria-pressed={eaten}>
          {eaten ? '✓ Snědeno' : 'Snědeno'}
        </button>
        {!meal.leftover && <button onClick={onSwap}>Vyměnit</button>}
      </div>
      <details className="sites">
        <summary>Najít recept na webu</summary>
        <div className="site-links">
          {RECIPE_SITES.map((s) => (
            <a key={s.name} href={recipeSearchUrl(recipe, s.domain)} target="_blank" rel="noreferrer">
              {s.name}
            </a>
          ))}
        </div>
      </details>
    </article>
  );
}
