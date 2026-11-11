import type { Unit } from '../data/ingredients';

export function todayISO(): string {
  return toISO(new Date());
}

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parse(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function addDays(iso: string, n: number): string {
  const t = new Date(parse(iso) + n * 86400000);
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`;
}

/** Počet dní od a do b (kladné, když b je později). */
export function daysBetween(a: string, b: string): number {
  return Math.round((parse(b) - parse(a)) / 86400000);
}

export function formatDay(iso: string): string {
  return new Date(parse(iso)).toLocaleDateString('cs-CZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatShort(iso: string): string {
  return new Date(parse(iso)).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    timeZone: 'UTC',
  });
}

/** „dnes“, „včera“, „před 5 dny“ – n = počet dní zpět. */
export function agoLabel(n: number): string {
  if (n <= 0) return 'dnes';
  if (n === 1) return 'včera';
  return `před ${n} dny`;
}

export function fmtKc(n: number): string {
  return `${Math.round(n)} Kč`;
}

export function fmtAmount(unit: Unit, amount: number): string {
  if (unit === 'ks') {
    const v = Math.round(amount * 10) / 10;
    return `${v} ks`;
  }
  const big = unit === 'kg' ? 'kg' : 'l';
  const small = unit === 'kg' ? 'g' : 'ml';
  if (amount >= 1000) {
    const v = Math.round(amount / 10) / 100;
    return `${String(v).replace('.', ',')} ${big}`;
  }
  return `${Math.round(amount / 5) * 5 || 5} ${small}`;
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
