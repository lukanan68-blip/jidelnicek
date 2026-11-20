import albert from '../assets/logos/albert.svg';
import kaufland from '../assets/logos/kaufland.svg';
import lidl from '../assets/logos/lidl.svg';

/**
 * Loga obchodů (z jejich webů), jen k označení obchodu u jeho cen a slev.
 * Obchody bez loga se zobrazí textem.
 */
const LOGOS: Record<string, string> = { Lidl: lidl, Kaufland: kaufland, Albert: albert };

export function hasLogo(store: string): boolean {
  return store in LOGOS;
}

export function StoreBadge({ store }: { store: string }) {
  const src = LOGOS[store];
  if (!src) return <b className="store-name">{store}</b>;
  return <img className="store-logo" src={src} alt={store} title={store} height={22} />;
}
