import { useMemo } from 'react';
import { INGREDIENT_MAP, STAPLE_IDS, UNIT_LABEL } from '../data/ingredients';
import { dishIcon, iconOf, plateParts } from '../data/icons';
import { FAST, HOUR, RECIPE_MAP, RECIPE_SITES, recipeSearchUrl } from '../data/recipes';
import { agoLabel, daysBetween, fmtAmount, fmtKc, fmtKcFine, fmtPrice, formatDay, formatShort, inStore, uid } from '../lib/format';
import {
  amountCost,
  buildLast,
  mealIngredients,
  planCost,
  mealPricesByStore,
  planMealCost,
  whereToBuy,
  type PriceFns,
} from '../lib/planner';
import { PriceLines } from './PriceLines';
import { StoreBadge } from './StoreBadge';
import { StoreSelect } from './StoreSelect';
import { SLOT_LABEL, SLOT_ORDER, type HistoryEntry, type Plan, type PlanMeal, type Settings } from '../lib/types';

interface Props {
  settings: Settings;
  setSettings: (fn: (s: Settings) => Settings) => void;
  plan: Plan | null;
  history: HistoryEntry[];
  setHistory: (fn: (h: HistoryEntry[]) => HistoryEntry[]) => void;
  pf: PriceFns;
  /** Ceny ve všech obchodech, pro porovnání jídla po obchodech. */
  pfAll: PriceFns;
  today: string;
  shopStore: string;
  setShopStore: (store: string) => void;
  storesWithDeals: string[];
  toggleHave: (id: string) => void;
  onGenerate: () => void;
  onChoose: (dayIdx: number, mealIdx: number, altIdx: number) => void;
  onMore: (dayIdx: number, mealIdx: number) => void;
  goTo: (tab: 'history') => void;
}

export function PlanTab({ settings, setSettings, plan, history, setHistory, pf, pfAll, today, shopStore, setShopStore, storesWithDeals, toggleHave, onGenerate, onChoose, onMore, goTo }: Props) {
  const total = plan ? planCost(plan, pf) : 0;
  const baseTotal = plan ? planCost(plan, { ...pf, eff: pf.base }) : 0;
  const saved = baseTotal - total;
  const hasBudget = plan ? plan.settings.useBudget !== false : true;
  const hasDate = plan ? plan.settings.useDate !== false : true;
  const over = plan && hasBudget ? total > plan.settings.budget + 0.5 : false;
  const anySlot = SLOT_ORDER.some((s) => settings.slots[s]);
  const anyDuration = settings.duration.fast || settings.duration.short || settings.duration.long;
  const hasMains = settings.slots.lunch || settings.slots.dinner;

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
          <div className="field">
            <label>
              Rozpočet pro 2 lidi (Kč)
              <input
                type="number"
                inputMode="numeric"
                min={0}
                step={10}
                disabled={!settings.useBudget}
                value={settings.budget}
                onChange={(e) => setSettings((s) => ({ ...s, budget: Math.max(0, Number(e.target.value)) }))}
              />
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={!settings.useBudget}
                onChange={(e) => setSettings((s) => ({ ...s, useBudget: !e.target.checked }))}
              />
              Bez rozpočtu
            </label>
          </div>
          <div className="field">
            <label>
              Začátek
              <input
                type="date"
                disabled={!settings.useDate}
                value={settings.startDate}
                onChange={(e) => e.target.value && setSettings((s) => ({ ...s, startDate: e.target.value }))}
              />
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={!settings.useDate}
                onChange={(e) => setSettings((s) => ({ ...s, useDate: !e.target.checked }))}
              />
              Bez data
            </label>
          </div>
        </div>

        <label className="field-wide">
          Kde nakupuješ
          <StoreSelect value={shopStore} onChange={setShopStore} withDeals={storesWithDeals} />
        </label>

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
            checked={settings.batch}
            onChange={(e) => setSettings((s) => ({ ...s, batch: e.target.checked }))}
          />
          <span>
            Vařit dvojitě
            <small> – večeře se uvaří na 2 dny a druhý den je z ní oběd</small>
          </span>
        </label>

        <label className="check">
          <input
            type="checkbox"
            checked={settings.noMeat}
            onChange={(e) => setSettings((s) => ({ ...s, noMeat: e.target.checked }))}
          />
          <span>
            Bez masa
            <small> – i bez ryb a šunky, vejce, sýry a luštěniny zůstávají</small>
          </span>
        </label>

        {hasMains && (
          <fieldset>
            <legend>Délka vaření (obědy a večeře, celkový čas)</legend>
            <div className="chips">
              <label className="check">
                <input
                  type="checkbox"
                  checked={settings.duration.fast}
                  onChange={(e) => setSettings((s) => ({ ...s, duration: { ...s.duration, fast: e.target.checked } }))}
                />
                <span>
                  Jídla do {FAST} minut
                  <small> – rychlá, celkem do {FAST} min</small>
                </span>
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={settings.duration.short}
                  onChange={(e) => setSettings((s) => ({ ...s, duration: { ...s.duration, short: e.target.checked } }))}
                />
                <span>
                  Jídla do hodiny
                  <small> – celkem do {HOUR} min</small>
                </span>
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={settings.duration.long}
                  onChange={(e) => setSettings((s) => ({ ...s, duration: { ...s.duration, long: e.target.checked } }))}
                />
                <span>
                  Jídla nad hodinu
                  <small> – pečení, dušení, guláše</small>
                </span>
              </label>
            </div>
            {!anyDuration && (
              <p role="alert" className="error">
                Zaškrtni aspoň jednu délku, jinak nemám z čeho vybírat.
              </p>
            )}
          </fieldset>
        )}

        <div className="row">
          <button className="primary" onClick={onGenerate} disabled={!anySlot || (hasMains && !anyDuration)}>
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
              Odhad: {fmtKc(total)} {hasBudget && <span>z {fmtKc(plan.settings.budget)}</span>}
            </div>
            {!hasBudget ? (
              <p>
                Bez omezení rozpočtu.
                {saved > 1 && <> Slevy z letáků ušetří asi {fmtKc(saved)}.</>}
              </p>
            ) : over ? (
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

          {!!plan.missing && (
            <section className="card summary warn" role="alert">
              <p>
                Pro zvolené filtry nebylo dost receptů, chybí {plan.missing} jídel. Povol i další délku vaření nebo
                vypni Bez masa.
              </p>
            </section>
          )}

          {plan.days.map((day, di) => (
            <section key={day.date} className="card">
              <h3 className="cap">{hasDate ? formatDay(day.date) : `Den ${di + 1}`}</h3>
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
                    pfAll={pfAll}
                    today={today}
                    setShopStore={setShopStore}
                    toggleHave={toggleHave}
                    onChoose={(ai) => onChoose(di, mi, ai)}
                    onMore={() => onMore(di, mi)}
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
  pfAll: PriceFns;
  today: string;
  setShopStore: (store: string) => void;
  toggleHave: (id: string) => void;
  onChoose: (altIdx: number) => void;
  onMore: () => void;
}

function MealCard({ plan, dayIdx, date, meal, history, setHistory, pf, pfAll, today, setShopStore, toggleHave, onChoose, onMore }: MealProps) {
  const recipe = RECIPE_MAP[meal.recipeId];
  const key = `${plan.id}:${dayIdx}:${meal.slot}`;
  const eaten = history.some((h) => h.source === key);
  const last = useMemo(() => buildLast(history, key), [history, key]);
  const mult = meal.doubled ? 2 : 1;
  const ings = mealIngredients(recipe, meal.sideId, mult);
  const cost = planMealCost(meal, pf);
  const where = meal.leftover ? null : whereToBuy(meal.recipeId, meal.sideId, mult, pf);
  const dish = dishIcon(recipe, meal.sideId);
  const byStore = meal.leftover ? null : mealPricesByStore(meal.recipeId, meal.sideId, mult, pfAll);

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
      {recipe.photo && (
        <figure className="photo">
          <img
            src={recipe.photo.url}
            alt={`${recipe.name}: hotové jídlo`}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const fig = e.currentTarget.parentElement;
              if (fig) fig.style.display = 'none';
            }}
          />
          <figcaption>
            {recipe.photo.similar ? 'Podobné jídlo, foto: ' : 'Foto: '}
            <a href={recipe.photo.link} target="_blank" rel="noreferrer">
              {recipe.photo.site}
            </a>
          </figcaption>
        </figure>
      )}
      <div className="plate" aria-hidden="true">
        <span className="dish">{dish}</span>
        <span className="parts">{plateParts(recipe, meal.sideId).filter((x) => x !== dish).join(' ')}</span>
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

      {where && (
        <div className="where">
          <b>{pf.store ? `Nakoupit ${inStore(pf.store)}:` : 'Nakoupit nejlevněji:'}</b>
          {where.groups.length === 0 && where.other.length === 0 ? (
            <span> vše máš doma</span>
          ) : where.groups.length === 0 && !pf.store ? (
            <span> bez slevy v načtených letácích, kup kdekoliv</span>
          ) : (
            <ul>
              {where.groups.map((g) => (
                <li key={g.store}>
                  <StoreBadge store={g.store} />: {g.items.map((i) => `${iconOf(i.id)} ${i.name}`).join(', ')}
                  <small>
                    {' '}
                    · zaplatíš asi {fmtKc(g.cost)}, ušetříš {fmtKc(g.saving)}
                  </small>
                </li>
              ))}
              {where.other.length > 0 && (
                <li>
                  <b>{pf.store ? `${pf.store} (bez akce)` : 'Kdekoliv'}</b>: {where.other.map((i) => `${iconOf(i.id)} ${i.name}`).join(', ')}
                  <small> · asi {fmtKc(where.otherCost)}</small>
                </li>
              )}
            </ul>
          )}
          {where.have.length > 0 && (
            <p className="have-line">
              <b>Mám doma:</b> {where.have.map((i) => `${iconOf(i.id)} ${i.name}`).join(', ')}
            </p>
          )}
        </div>
      )}
      {byStore && byStore.stores.length > 0 && (
        <div className="by-store">
          <b>Cena jídla, když nakoupíš jen v jednom obchodě:</b>
          <p className="hint">Klepni na obchod a uvidíš cenu rozepsanou po surovinách.</p>
          <ul>
            {byStore.stores.map((s, i) => (
              <li key={s.store} className={`${i === 0 ? 'best' : ''} ${pf.store === s.store ? 'chosen' : ''}`}>
                <details>
                  <summary>
                    <span>
                      <StoreBadge store={s.store} />
                      <small className="muted">
                        {' '}
                        · {s.onSale} {s.onSale === 1 ? 'surovina' : s.onSale < 5 ? 'suroviny' : 'surovin'} v akci
                        {i === 0 ? ', nejlevněji' : ''}
                      </small>
                    </span>
                    <b>{fmtKc(s.total)}</b>
                  </summary>
                  <PriceLines lines={s.lines} />
                  <button className="mini" onClick={() => setShopStore(pf.store === s.store ? '' : s.store)}>
                    {pf.store === s.store ? 'Zrušit nákup jen v jednom obchodě' : `Nakupovat jen ${inStore(s.store)}`}
                  </button>
                </details>
              </li>
            ))}
            <li>
              <details>
                <summary>
                  <span>
                    Bez slev <small className="muted">· odhad</small>
                  </span>
                  <b>{fmtKc(byStore.base)}</b>
                </summary>
                <PriceLines lines={byStore.baseLines} />
              </details>
            </li>
          </ul>
        </div>
      )}
      {meal.leftover && <p className="where">Suroviny jsou nakoupené u večeře.</p>}

      <details>
        <summary>Suroviny pro 2 lidi</summary>
        <ul className="ings">
          {ings.map(([id, a]) => {
            const i = INGREDIENT_MAP[id];
            const best = pf.best(id);
            return (
              <li key={id}>
                <span>
                  <span className="ico" aria-hidden="true">
                    {iconOf(id)}
                  </span>{' '}
                  {i.name} <em>{fmtAmount(i.unit, a)}</em>
                  {!meal.leftover && (
                    <em className="ing-cost">
                      {' · '}
                      {pf.has(id) ? 'doma' : fmtKcFine(amountCost(id, a, pf.eff(id)))}
                    </em>
                  )}
                </span>
                {!meal.leftover && (
                  <button
                    className={`have-btn ${pf.has(id) ? 'on' : ''}`}
                    aria-pressed={pf.has(id)}
                    onClick={() => toggleHave(id)}
                  >
                    {pf.has(id) ? '✓ Mám doma' : 'Mám doma'}
                  </button>
                )}
                {best && !meal.leftover && (
                  <span className="tag">
                    <StoreBadge store={best.store} /> {fmtPrice(best.price)}/{UNIT_LABEL[i.unit]}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </details>

      <div className="actions">
        <button className={eaten ? 'done' : ''} onClick={toggleEaten} aria-pressed={eaten}>
          {eaten ? '✓ Snědeno' : 'Snědeno'}
        </button>
        {!meal.leftover && <button onClick={onMore}>Další možnosti</button>}
      </div>
      {!meal.leftover && meal.alts && meal.alts.length > 0 && (
        <div className="alts">
          <h5>Nebo si vyber jiné jídlo</h5>
          <ul>
            {meal.alts.map((a, ai) => {
              const r = RECIPE_MAP[a.recipeId];
              const altMeal: PlanMeal = { slot: meal.slot, recipeId: a.recipeId, sideId: a.sideId, doubled: meal.doubled };
              const w = whereToBuy(a.recipeId, a.sideId, mult, pf);
              const ap = mealPricesByStore(a.recipeId, a.sideId, mult, pfAll);
              return (
                <li key={a.recipeId}>
                  {r.photo && (
                    <img
                      className="alt-photo"
                      src={r.photo.url}
                      alt=""
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <div className="alt-info">
                    <b>
                      <span className="ico" aria-hidden="true">
                        {dishIcon(r, a.sideId)}
                      </span>{' '}
                      {r.name}
                    </b>
                    <small>
                      ⏱ {r.min}
                      {r.extra ? ` + ${r.extra}` : ''} min · {fmtKc(planMealCost(altMeal, pf))}
                      {a.sideId ? ` · příloha ${INGREDIENT_MAP[a.sideId].name}` : ''}
                      {ap.stores.length > 0
                        ? ` · nejlevněji ${inStore(ap.stores[0].store)} za ${fmtKc(ap.stores[0].total)}`
                        : w.groups.length > 0
                          ? ` · nakoupit: ${w.groups.slice(0, 3).map((g) => g.store).join(', ')}`
                          : ''}
                    </small>
                  </div>
                  <button onClick={() => onChoose(ai)} aria-label={`Vybrat ${r.name}`}>
                    Vybrat
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {recipe.source && (
        <p className="source">
          Recept z webu{' '}
          <a href={recipe.source.url} target="_blank" rel="noreferrer">
            {recipe.source.site}
          </a>
        </p>
      )}
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
