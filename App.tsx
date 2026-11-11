import { useMemo, useState } from 'react';
import { FlyersTab } from './components/FlyersTab';
import { HistoryTab } from './components/HistoryTab';
import { PlanTab } from './components/PlanTab';
import { PricesTab } from './components/PricesTab';
import { ShoppingTab } from './components/ShoppingTab';
import { todayISO } from './lib/format';
import { generatePlan, makePriceFns, swapMeal } from './lib/planner';
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

export default function App() {
  const today = todayISO();
  const [tab, setTab] = useState<Tab>('plan');
  const [settings, setSettings] = useStored<Settings>('jid.settings', {
    days: 3,
    budget: 400,
    slots: { breakfast: true, lunch: true, dinner: true },
    quick: true,
    batch: false,
    startDate: today,
  });
  const [history, setHistory] = useStored<HistoryEntry[]>('jid.history', []);
  const [discounts, setDiscounts] = useStored<Discount[]>('jid.discounts', []);
  const [prices, setPrices] = useStored<PriceOverrides>('jid.prices', {});
  const [plan, setPlan] = useStored<Plan | null>('jid.plan', null);
  const [checked, setChecked] = useStored<Record<string, boolean>>('jid.checked', {});

  const pf = useMemo(() => makePriceFns(prices, discounts, today), [prices, discounts, today]);

  // starý uložený začátek v minulosti neposouvá plán do minulosti
  const effectiveSettings = { ...settings, startDate: settings.startDate < today ? today : settings.startDate };

  function onGenerate() {
    const seed = Math.floor(Math.random() * 1e9);
    setPlan(generatePlan({ settings: effectiveSettings, history, discounts, prices, today, seed }));
    setChecked({});
  }

  function onSwap(dayIdx: number, mealIdx: number) {
    if (!plan) return;
    const seed = Math.floor(Math.random() * 1e9);
    setPlan(swapMeal(plan, dayIdx, mealIdx, { history, discounts, prices, today }, seed));
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
            today={today}
            onGenerate={onGenerate}
            onSwap={onSwap}
            goTo={setTab}
          />
        )}
        {tab === 'shop' && <ShoppingTab plan={plan} pf={pf} checked={checked} setChecked={setChecked} goTo={setTab} />}
        {tab === 'history' && <HistoryTab history={history} setHistory={setHistory} today={today} />}
        {tab === 'flyers' && <FlyersTab discounts={discounts} setDiscounts={setDiscounts} prices={prices} today={today} />}
        {tab === 'prices' && <PricesTab prices={prices} setPrices={setPrices} />}
      </main>

      <footer>Data se ukládají jen v tomhle prohlížeči. Ceny jsou orientační odhad.</footer>
    </div>
  );
}
