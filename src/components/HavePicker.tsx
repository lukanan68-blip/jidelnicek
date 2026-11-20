import { useState } from 'react';
import { iconOf } from '../data/icons';
import { INGREDIENTS, MEAT_IDS, type Ingredient } from '../data/ingredients';

interface Props {
  have: string[];
  toggleHave: (id: string) => void;
  clearHave: () => void;
}

const norm = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const GROUPS: { title: string; pick: (i: Ingredient) => boolean }[] = [
  { title: 'Přílohy', pick: (i) => i.kind === 'side' },
  { title: 'Maso a ryby', pick: (i) => MEAT_IDS.has(i.id) },
  { title: 'Vejce a luštěniny', pick: (i) => i.kind === 'protein' && !MEAT_IDS.has(i.id) },
  { title: 'Mléčné výrobky a sýry', pick: (i) => i.kind === 'dairy' },
  { title: 'Zelenina a ovoce', pick: (i) => i.kind === 'veg' },
  { title: 'Ostatní', pick: (i) => i.kind === 'other' },
];

/** Seznam surovin, které už mám doma. Plánovač k nim vybere jídla, kde se spotřebují. */
export function HavePicker({ have, toggleHave, clearHave }: Props) {
  const [q, setQ] = useState('');
  const query = norm(q.trim());
  const shown = (i: Ingredient) => !query || norm(i.name).includes(query);

  return (
    <details className="card have-picker">
      <summary>
        <h2>
          Co už mám doma <span className="muted">({have.length})</span>
        </h2>
        <span className="muted have-sum">
          {have.length > 0
            ? have
                .slice(0, 12)
                .map((id) => iconOf(id))
                .join(' ')
            : 'Klepni a vyber suroviny, které už máš'}
        </span>
      </summary>
      <p className="hint">
        Označ, co už máš. Plánovač k tomu dohledá zbytek: vybírá jídla, ve kterých se tyhle suroviny spotřebují, a
        nepočítá je do ceny nákupu. Výběr se pamatuje i pro další jídelníčky.
      </p>
      {have.length > 0 && (
        <button className="mini" onClick={clearHave}>
          Smazat výběr ({have.length})
        </button>
      )}
      <label className="have-search">
        Hledat surovinu
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="např. rýže, kuře, mrkev" />
      </label>
      {GROUPS.map((g) => {
        const items = INGREDIENTS.filter((i) => g.pick(i) && shown(i));
        if (items.length === 0) return null;
        return (
          <fieldset key={g.title} className="have-group">
            <legend>{g.title}</legend>
            <div className="have-chips">
              {items.map((i) => {
                const on = have.includes(i.id);
                return (
                  <button
                    key={i.id}
                    className={`chip ${on ? 'on' : ''}`}
                    aria-pressed={on}
                    onClick={() => toggleHave(i.id)}
                  >
                    <span className="ico" aria-hidden="true">
                      {iconOf(i.id)}
                    </span>{' '}
                    {i.name.replace(/\s*\(.*\)$/, '')}
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}
      {have.length > 0 && (
        <button className="mini" onClick={clearHave}>
          Smazat výběr
        </button>
      )}
    </details>
  );
}
