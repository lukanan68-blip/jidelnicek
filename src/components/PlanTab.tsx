import { useMemo } from 'react';
import { INGREDIENT_MAP, STAPLE_IDS, UNIT_LABEL } from '../data/ingredients';
import { dishIcon, iconOf, plateParts } from '../data/icons';
import { FAST, HOUR, HOUR_HALF, RECIPES, RECIPE_MAP, RECIPE_SITES, SOURCE_OPTIONS, difficulty, recipeSearchUrl, sourceOf } from '../data/recipes';
import { agoLabel, daysBetween, dnyLabel, fmtAmount, fmtKc, fmtKcFine, fmtPrice, formatDay, formatShort, inStore, uid } from '../lib/format';
import {
  amountCost,
  buildLast,
  mealIngredients,
  mealMult,
  packInfo,
  planCost,
  mealPricesByStore,
  planMealCost,
  whereToBuy,
  type PriceFns,
} from '../lib/planner';
import { HavePicker } from './HavePicker';
import { PriceLines } from './PriceLines';
import { StoreBadge } from './StoreBadge';
import { StoreSelect } from './StoreSelect';
import navrhImg from '../assets/prekvapeni_jidlo.gif';
import { SLOT_ICON, SLOT_LABEL, SLOT_ORDER, type HistoryEntry, type Plan, type PlanMeal, type Settings } from '../lib/types';

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
  have: string[];
  clearHave: () => void;
  onGenerate: () => void;
  onChoose: (dayIdx: number, mealIdx: number, altIdx: number) => void;
  onMore: (dayIdx: number, mealIdx: number) => void;
  goTo: (tab: 'history') => void;
}

export function PlanTab({ settings, setSettings, plan, history, setHistory, pf, pfAll, today, shopStore, setShopStore, storesWithDeals, toggleHave, have, clearHave, onGenerate, onChoose, onMore, goTo }: Props) {
  const total = plan ? planCost(plan, pf) : 0;
  const baseTotal = plan ? planCost(plan, { ...pf, eff: pf.base }) : 0;
  const saved = baseTotal - total;
  const hasBudget = plan ? plan.settings.useBudget !== false : true;
  const hasDate = plan ? plan.settings.useDate !== false : true;
  const over = plan && hasBudget ? total > plan.settings.budget + 0.5 : false;
  const anySlot = SLOT_ORDER.some((s) => settings.slots[s]);
  const D = settings.duration;
  const anyDuration = D.fast || D.short || !!D.mid || !!D.xlong;
  const allDurations = D.fast && D.short && !!D.mid && !!D.xlong;
  const hasMains = settings.slots.lunch || settings.slots.dinner;
  const sources = settings.sources ?? SOURCE_OPTIONS;
  const noSource = sources.length === 0;
  const filtersActive = sources.length < SOURCE_OPTIONS.length || settings.noMeat || !(allDurations);
  const sourceCount = (name: string, meal?: 'breakfast' | 'main') =>
    RECIPES.filter((r) => sourceOf(r) === name && (!meal || r.meal === meal)).length;
  const noBreakfastInSources = settings.slots.breakfast && !noSource && sources.every((s) => sourceCount(s, 'breakfast') === 0);
  const toggleSource = (name: string, on: boolean) =>
    setSettings((s) => {
      const cur = s.sources ?? SOURCE_OPTIONS;
      return { ...s, sources: on ? [...cur.filter((x) => x !== name), name] : cur.filter((x) => x !== name) };
    });
  // co z tvých zásob se v návrhu spotřebuje
  const inPlan = new Set<string>();
  for (const day of plan?.days ?? [])
    for (const m of day.meals) {
      if (m.leftover) continue;
      for (const [id] of mealIngredients(RECIPE_MAP[m.recipeId], m.sideId)) inPlan.add(id);
    }
  const usedHave = have.filter((id) => inPlan.has(id));
  const unusedHave = have.filter((id) => !inPlan.has(id));

  return (
    <div className="stack">
      <HavePicker have={have} toggleHave={toggleHave} clearHave={clearHave} />

      <section className="card">
        <h2>Zadání</h2>
        <div className="fsec" role="group" aria-label="Odkud mají být recepty">
          <div className="fsec-title">📖 Odkud mají být recepty</div>
          <div className="chips sources">
            {SOURCE_OPTIONS.map((name) => (
              <label className="check" key={name}>
                <input type="checkbox" checked={sources.includes(name)} onChange={(e) => toggleSource(name, e.target.checked)} />
                <span>
                  {name}
                  <small className="count">{sourceCount(name)} receptů</small>
                </span>
              </label>
            ))}
          </div>
          <div className="row">
            <button className="mini" onClick={() => setSettings((s) => ({ ...s, sources: SOURCE_OPTIONS }))} disabled={sources.length === SOURCE_OPTIONS.length}>
              Smazat filtr (všechny zdroje)
            </button>
          </div>
          {noSource && (
            <p role="alert" className="error">
              Vyber aspoň jeden zdroj, jinak nemám z čeho vybírat.
            </p>
          )}
          {noBreakfastInSources && (
            <p className="hint">Z vybraných zdrojů nejsou snídaně, ty se vezmou z ostatních.</p>
          )}
        </div>
        <div className="fsec">
        <div className="fsec-title">📅 💰 Počet dní, rozpočet a datum</div>
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
        </div>

        <div className="fsec">
          <div className="fsec-title">
            Kde nakupuješ
            <span className="fsec-logos">
              <StoreBadge store="Albert" />
              <StoreBadge store="Lidl" />
              <StoreBadge store="Kaufland" />
            </span>
          </div>
          <label className="field-wide">
            <StoreSelect value={shopStore} onChange={setShopStore} withDeals={storesWithDeals} />
          </label>
        </div>

        <div className="fsec" role="group" aria-label="Co plánovat">
          <div className="fsec-title">🍽️ Co plánovat</div>
          <div className="chips">
            {SLOT_ORDER.map((slot) => (
              <label key={slot} className="check">
                <input
                  type="checkbox"
                  checked={settings.slots[slot]}
                  onChange={(e) => setSettings((s) => ({ ...s, slots: { ...s.slots, [slot]: e.target.checked } }))}
                />
                <span aria-hidden="true">{SLOT_ICON[slot]}</span> {SLOT_LABEL[slot]}
              </label>
            ))}
          </div>
          {settings.slots.dinner && (
            <label className="check">
              <input
                type="checkbox"
                checked={settings.easyDinner !== false}
                onChange={(e) => setSettings((s) => ({ ...s, easyDinner: e.target.checked }))}
              />
              <span>
                Jednoduché večeře
                <small> – saláty, těstovinové saláty, párky, klobásy, sýry, wrapy. Obědy pak bývají vydatnější jídla.</small>
              </span>
            </label>
          )}
        </div>

        {anySlot && (
          <div className="fsec" role="group" aria-label="Vařit stejné jídlo na víc dní">
            <div className="fsec-title">🔁 Vařit stejné jídlo na víc dní</div>
            <div className="grid2">
              {(['breakfast', 'lunch', 'dinner'] as const)
                .filter((slot) => settings.slots[slot])
                .map((slot) => (
                  <label key={slot}>
                    {slot === 'breakfast' ? 'Stejná snídaně na' : slot === 'lunch' ? 'Stejný oběd na' : 'Stejná večeře na'}
                    <select
                      value={settings.repeat[slot]}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          repeat: { ...s.repeat, [slot]: Number(e.target.value) },
                          batch: Number(e.target.value) > 1 && slot !== 'breakfast' ? false : s.batch,
                        }))
                      }
                    >
                      {[1, 2, 3, 4].map((n) => (
                        <option key={n} value={n}>
                          {n === 1 ? 'každý den jiné jídlo' : `${n} ${dnyLabel(n)}`}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
            </div>
            <p className="hint">Jídlo se připraví jednou a další dny se jí zbytky. Suroviny se nakoupí na všechny dny.</p>
            {settings.slots.lunch && settings.slots.dinner && (
            <label className="check">
              <input
                type="checkbox"
                checked={settings.batch}
                disabled={settings.repeat.lunch > 1 || settings.repeat.dinner > 1}
                onChange={(e) => setSettings((s) => ({ ...s, batch: e.target.checked }))}
              />
              <span>
                Večeře je zároveň zítřejší oběd
                <small> – večeře se uvaří na 2 dny a druhý den je z ní oběd</small>
              </span>
            </label>
            )}
          </div>
        )}

        <div className="fsec">
        <div className="fsec-title">🥩 Maso</div>
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
        </div>

        {hasMains && (
          <div className="fsec" role="group" aria-label="Délka vaření (obědy a večeře, celkový čas)">
            <div className="fsec-title">⏱️ Délka vaření (obědy a večeře, celkový čas)</div>
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
                  checked={!!settings.duration.mid}
                  onChange={(e) => setSettings((s) => ({ ...s, duration: { ...s.duration, mid: e.target.checked } }))}
                />
                <span>
                  Jídla do 1,5 hodiny
                  <small> – celkem do {HOUR_HALF} min</small>
                </span>
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={!!settings.duration.xlong}
                  onChange={(e) => setSettings((s) => ({ ...s, duration: { ...s.duration, xlong: e.target.checked } }))}
                />
                <span>
                  Jídla nad hodinu a půl
                  <small> – pečení, dušení, guláše, nad {HOUR_HALF} min</small>
                </span>
              </label>
            </div>
            {!allDurations && (
              <div className="row">
                <button className="mini" onClick={() => setSettings((s) => ({ ...s, duration: { fast: true, short: true, long: false, mid: true, xlong: true } }))}>
                  Smazat filtr délky
                </button>
              </div>
            )}
            {!anyDuration && (
              <p role="alert" className="error">
                Zaškrtni aspoň jednu délku, jinak nemám z čeho vybírat.
              </p>
            )}
          </div>
        )}

        <div className="row fsec">
          {filtersActive && (
            <button
              className="mini"
              onClick={() =>
                setSettings((s) => ({
                  ...s,
                  sources: SOURCE_OPTIONS,
                  noMeat: false,
                  duration: { fast: true, short: true, long: false, mid: true, xlong: true },
                }))
              }
            >
              Smazat všechny filtry
            </button>
          )}
          <button className="primary" onClick={onGenerate} disabled={!anySlot || noSource || (hasMains && !anyDuration)}>
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
          <section className="card navrh">
            <h2 className="navrh-title">Návrh</h2>
            <img className="navrh-img" src={navrhImg} alt="Animace: dárek se otevře a překvapením je jídlo" />
          </section>

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

          {have.length > 0 && (
            <section className="card have-summary">
              <p>
                <b>Z tvých zásob využito:</b>{' '}
                {usedHave.length > 0 ? usedHave.map((id) => `${iconOf(id)} ${INGREDIENT_MAP[id].name.replace(/\s*\(.*\)$/, '')}`).join(', ') : 'nic'}
              </p>
              {unusedHave.length > 0 && (
                <p className="muted">
                  Nevyužito: {unusedHave.map((id) => `${iconOf(id)} ${INGREDIENT_MAP[id].name.replace(/\s*\(.*\)$/, '')}`).join(', ')}.
                  Zkus Navrhnout znovu nebo Najít další recepty u jídel.
                </p>
              )}
            </section>
          )}

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
  const mult = mealMult(meal);
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
        <span className="slot">
          <span aria-hidden="true">{SLOT_ICON[meal.slot]}</span> {SLOT_LABEL[meal.slot]}
        </span>
        <span className="cost">{meal.leftover ? (meal.slot === 'breakfast' ? 'stejná' : 'zbytky') : fmtKc(cost)}</span>
      </div>
      <h4 className="meal-title">
        {recipe.name}
        <span className="diff"> ({difficulty(recipe)})</span>
      </h4>
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
      <div className="recipe-link">
        {recipe.source ? (
          <a className="recipe-btn" href={recipe.source.url} target="_blank" rel="noreferrer">
            📖 Otevřít recept na {recipe.source.site} ↗
          </a>
        ) : recipe.similarLink ? (
          <a className="recipe-btn" href={recipe.similarLink.url} target="_blank" rel="noreferrer">
            📖 Podobný recept na {recipe.similarLink.site} ↗
          </a>
        ) : (
          <div className="site-links search">
            <span>Najít recept:</span>
            {RECIPE_SITES.map((s) => (
              <a key={s.name} href={recipeSearchUrl(recipe, s.domain)} target="_blank" rel="noreferrer">
                {s.name}
              </a>
            ))}
          </div>
        )}
        {(recipe.source || recipe.similarLink) && (
          <details className="sites">
            <summary>Najít jiný recept na webu</summary>
            <div className="site-links">
              {RECIPE_SITES.map((s) => (
                <a key={s.name} href={recipeSearchUrl(recipe, s.domain)} target="_blank" rel="noreferrer">
                  {s.name}
                </a>
              ))}
            </div>
          </details>
        )}
      </div>
      <div className="plate" aria-hidden="true">
        <span className="dish">{dish}</span>
        <span className="parts">{plateParts(recipe, meal.sideId).filter((x) => x !== dish).join(' ')}</span>
      </div>
      <p className="meta">
        {meal.leftover
          ? meal.slot === 'breakfast'
            ? 'Stejná snídaně jako dřív, suroviny už máš nakoupené.'
            : 'Stejné jídlo jako dřív, jíš zbytky, nevaří se.'
          : `⏱ ${recipe.min} min${recipe.extra ? ` + ${recipe.extra} min samo` : ''}${mult > 1 ? ` · uvaříš najednou na ${mult} ${dnyLabel(mult)}` : ''}`}
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
      {meal.leftover && <p className="where">Suroviny jsou nakoupené u prvního dne, kdy se jídlo vaří.</p>}

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
                  {!meal.leftover && !pf.has(id) && packInfo(id, a, pf.eff(id)) && (
                    <em className="pack">
                      {' '}
                      (balení {packInfo(id, a, pf.eff(id))!.label} asi {fmtKc(packInfo(id, a, pf.eff(id))!.cost)})
                    </em>
                  )}
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
        {!meal.leftover && <button onClick={onMore}>Najít další recepty</button>}
      </div>
      {!meal.leftover && meal.alts && meal.alts.length > 0 && (
        <div className="alts">
          <h5>Nebo si vyber jiné jídlo</h5>
          <ul>
            {meal.alts.map((a, ai) => {
              const r = RECIPE_MAP[a.recipeId];
              const altMeal: PlanMeal = { slot: meal.slot, recipeId: a.recipeId, sideId: a.sideId, doubled: meal.doubled, batchDays: meal.batchDays };
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
                      {r.name} <span className="diff">({difficulty(r)})</span>
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
    </article>
  );
}
