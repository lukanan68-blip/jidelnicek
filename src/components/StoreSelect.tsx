import { STORES } from '../data/ingredients';

interface Props {
  value: string;
  onChange: (store: string) => void;
  /** Obchody, které mají načtený leták se slevami. */
  withDeals: string[];
}

/** Kde nakupuješ: nejlevněji ve víc obchodech, nebo všechno jen v jednom. */
export function StoreSelect({ value, onChange, withDeals }: Props) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Podle nejlevnějších cen (víc obchodů)</option>
      {STORES.map((s) => (
        <option key={s} value={s}>
          Jen {s}
          {withDeals.includes(s) ? '' : ' (bez letáku)'}
        </option>
      ))}
    </select>
  );
}
