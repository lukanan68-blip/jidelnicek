import { useMemo, useState } from 'react';
import { FlyersTab } from './components/FlyersTab';
import { HistoryTab } from './components/HistoryTab';
import { PlanTab } from './components/PlanTab';
import { PricesTab } from './components/PricesTab';
import { ShoppingTab } from './components/ShoppingTab';
import { leafletDiscounts } from './data/leaflets';
import { SOURCE_OPTIONS, type DurationFilter } from './data/recipes';
import { todayISO } from './lib/format';
import { chooseAlternative, generatePlan, makePriceFns, moreAlternatives } from './lib/planner';
import type { Discount, HistoryEntry, Plan, PriceOverrides, Settings } from './lib/types';
import { useStored } from './lib/useStored';

type Tab = 'plan' | 'shop' | 'history' | 'flyers' | 'prices';

const TABS: { id: Tab; label: string }[] = [
  { id: 'plan', label: 'Jídelníček' },
  { id: 'shop', label: 'Nákup' },
  { id: 'history', label: 'Co jsem jedl' },
  { id: 'flyers', label: 'Letáky' },
  { id: 'prices', label: 'Ceny' },
];

/** Starší nastavení mělo „rychlý režim“ a jen dvě délky. Převede se na tři volby. */
function migrateDuration(s: Partial<Settings> & { quick?: boolean }): DurationFilter {
  const d = (s.duration ?? {}) as Partial<DurationFilter>;
  if (typeof d.fast === 'boolean') return { fast: d.fast, short: !!d.short, long: !!d.long };
  if (s.quick) return { fast: true, short: false, long: false };
  return { fast: true, short: d.short !== false, long: d.long !== false };
}

export default function App() {
  const today = todayISO();
  const [tab, setTab] = useState<Tab>('plan');
  const [settings, setSettings] = useStored<Settings>('jid.settings', {
    days: 3,
    budget: 400,
    useBudget: true,
    useDate: true,
    slots: { breakfast: true, lunch: true, dinner: true },
    noMeat: false,
    duration: { fast: true, short: false, long: false },
    batch: false,
    repeat: { lunch: 1, dinner: 1 },
    startDate: today,
  });
  const [history, setHistory] = useStored<HistoryEntry[]>('jid.history', []);
  const [discounts, setDiscounts] = useStored<Discount[]>('jid.discounts', []);
  const [prices, setPrices] = useStored<PriceOverrides>('jid.prices', {});
  const [plan, setPlan] = useStored<Plan | null>('jid.plan', null);
  const [checked, setChecked] = useStored<Record<string, boolean>>('jid.checked', {});
  // kde nakupuji (prázdné = nejlevněji ve víc obchodech) a co mám doma
  const [shopStore, setShopStore] = useStored<string>('jid.shopStore', '');
  const [have, setHave] = useStored<string[]>('jid.have', []);

  // slevy z letáků (součást aplikace) + ty, které si zadáš ručně
  const allDiscounts = useMemo(() => [...leafletDiscounts(), ...discounts], [discounts]);
  // starý uložený začátek v minulosti neposouvá plán do minulosti
  const effectiveSettings: Settings = {
    ...settings,
    duration: migrateDuration(settings),
    noMeat: !!settings.noMeat,
    sources: settings.sources?.filter((s) => SOURCE_OPTIONS.includes(s)) ?? SOURCE_OPTIONS,
    repeat: { lunch: settings.repeat?.lunch ?? 1, dinner: settings.repeat?.dinner ?? 1 },
    useBudget: settings.useBudget !== false,
    useDate: settings.useDate !== false,
    startDate: settings.useDate === false || settings.startDate < today ? today : settings.startDate,
  };

  // slevy se berou k prvnímu dni plánu (plán na pondělí použije pondělní leták)
  const refDate = plan ? (plan.settings.startDate < today ? today : plan.settings.startDate) : effectiveSettings.startDate;
  // pfAll = všechny obchody (pro porovnání), pf = podle zvoleného způsobu nákupu
  const pfAll = useMemo(() => makePriceFns(prices, allDiscounts, refDate, { have }), [prices, allDiscounts, refDate, have]);
  const pf = useMemo(
    () => (shopStore ? makePriceFns(prices, allDiscounts, refDate, { store: shopStore, have }) : pfAll),
    [prices, allDiscounts, refDate, have, shopStore, pfAll],
  );
  const toggleHave = (id: string) => setHave((h) => (h.includes(id) ? h.filter((x) => x !== id) : [...h, id]));


  function onGenerate() {
    const seed = Math.floor(Math.random() * 1e9);
    setPlan(generatePlan({
        settings: effectiveSettings,
        history,
        discounts: allDiscounts,
        prices,
        today: effectiveSettings.startDate,
        seed,
        store: shopStore || undefined,
        have,
      }));
    setChecked({});
  }

  function onChoose(dayIdx: number, mealIdx: number, altIdx: number) {
    if (!plan) return;
    setPlan(chooseAlternative(plan, dayIdx, mealIdx, altIdx));
  }

  function onMore(dayIdx: number, mealIdx: number) {
    if (!plan) return;
    const seed = Math.floor(Math.random() * 1e9);
    setPlan(moreAlternatives(plan, dayIdx, mealIdx, { history, discounts: allDiscounts, prices, today: refDate, store: shopStore || undefined, have }, seed));
  }

  return (
    <div className="app">
      <header>
        <h1>Jídelníček</h1>
        <p>pro 2 lidi, podle rozpočtu, času a letáků</p>
      </header>

      <nav aria-label="Sekce">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} aria-current={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      <main>
        {tab === 'plan' && (
          <PlanTab
            settings={effectiveSettings}
            setSettings={setSettings}
            plan={plan}
            history={history}
            setHistory={setHistory}
            pf={pf}
            pfAll={pfAll}
            today={today}
            shopStore={shopStore}
            setShopStore={setShopStore}
            storesWithDeals={pfAll.stores}
            toggleHave={toggleHave}
            have={have}
            clearHave={() => setHave([])}
            onGenerate={onGenerate}
            onChoose={onChoose}
            onMore={onMore}
            goTo={setTab}
          />
        )}
        {tab === 'shop' && (
          <ShoppingTab
            plan={plan}
            pf={pf}
            pfAll={pfAll}
            checked={checked}
            setChecked={setChecked}
            shopStore={shopStore}
            setShopStore={setShopStore}
            toggleHave={toggleHave}
            clearHave={() => setHave([])}
            goTo={setTab}
          />
        )}
        {tab === 'history' && <HistoryTab history={history} setHistory={setHistory} today={today} />}
        {tab === 'flyers' && <FlyersTab discounts={discounts} setDiscounts={setDiscounts} prices={prices} today={today} />}
        {tab === 'prices' && <PricesTab prices={prices} setPrices={setPrices} />}
      </main>

      <footer>Data se ukládají jen v tomhle prohlížeči. Ceny jsou orientační odhad.</footer>
    </div>
  );
}
