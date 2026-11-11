// Slepí výsledek buildu do jednoho souboru jidelnicek.html, který jde otevřít dvojklikem (bez serveru).
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const dist = new URL('../dist/', import.meta.url);
let html = readFileSync(new URL('index.html', dist), 'utf8');
const assets = readdirSync(new URL('assets/', dist));

for (const f of assets.filter((a) => a.endsWith('.css'))) {
  const css = readFileSync(new URL(`assets/${f}`, dist), 'utf8');
  html = html.replace(new RegExp(`<link[^>]*${f}[^>]*>`), () => `<style>${css}</style>`);
}
for (const f of assets.filter((a) => a.endsWith('.js'))) {
  const js = readFileSync(new URL(`assets/${f}`, dist), 'utf8').replace(/<\/script/gi, '<\\/script');
  html = html.replace(new RegExp(`<script[^>]*${f}[^>]*></script>`), () => `<script type="module">${js}</script>`);
}
html = html.replace(/<link rel="icon"[^>]*>/, '');
writeFileSync(new URL('../jidelnicek.html', import.meta.url), html);
console.log('jidelnicek.html hotovo,', Math.round(html.length / 1024), 'kB');
