import type { Discount } from '../lib/types';

/**
 * Slevy načtené z letáků. Ceny jsou přepočtené na kg / l / ks podle jednotek, které používá aplikace.
 * Platnost se hlídá: po skončení se sleva přestane počítat a zmizí ze seznamu.
 * Aktualizuje se ručně (zadáním „aktualizuj letáky“), obchody neposkytují oficiální data.
 */
export const LEAFLETS_UPDATED = '2026-11-20';

export interface LeafletSource {
  id: string;
  store: string;
  title: string;
  from: string;
  to: string;
  url: string;
  /** Co z letáku v aplikaci je a co ne. */
  note: string;
}

export interface LeafletDeal {
  /** Id letáku (LeafletSource.id). */
  source: string;
  store: string;
  ingredientId: string;
  /** Akční cena za 1 kg / 1 l / 1 ks (podle suroviny). */
  price: number;
  from: string;
  to: string;
  label: string;
  note?: string;
}

export const LEAFLET_SOURCES: LeafletSource[] = [
  {
    id: 'albert-47sm',
    store: 'Albert',
    title: 'Albert supermarket (47SM akční leták)',
    from: '2026-11-18',
    to: '2026-11-24',
    url: 'https://www.albert.cz/aktualni-letaky',
    note: 'Vybrané základní suroviny z letáku, přečtené ručně. Obsluhované úseky (šunka) nemusí mít každá prodejna.',
  },
  {
    id: 'kaufland-ponava',
    store: 'Kaufland',
    title: 'Kaufland Brno-Ponava (týdenní nabídka)',
    from: '2026-11-18',
    to: '2026-11-24',
    url: 'https://prodejny.kaufland.cz/letak.html',
    note: 'Nabídka prodejny Brno-Ponava (číslo CZ4310) spárovaná s cenami z přehledu nabídky. Platnost se u položek liší (někde jen pá–ne).',
  },
  {
    id: 'lidl-1119',
    store: 'Lidl',
    title: 'Lidl akční leták (čtvrtek 19.–22. 11.)',
    from: '2026-11-19',
    to: '2026-11-22',
    url: 'https://www.lidl.cz/c/akcni-letak/s10008644',
    note: 'Vybrané základní suroviny z letáku, přečtené ručně z obrázků stránek.',
  },
  {
    id: 'lidl-1123',
    store: 'Lidl',
    title: 'Lidl akční leták (pondělí 23.–25. 11.)',
    from: '2026-11-23',
    to: '2026-11-25',
    url: 'https://www.lidl.cz/c/akcni-letak/s10008644',
    note: 'Začíná v pondělí. Vybrané základní suroviny, přečtené ručně z obrázků stránek.',
  },
  {
    id: 'lidl-1126',
    store: 'Lidl',
    title: 'Lidl akční leták (čtvrtek 26.–29. 11.)',
    from: '2026-11-26',
    to: '2026-11-29',
    url: 'https://www.lidl.cz/c/akcni-letak/s10008644',
    note: 'Začíná ve čtvrtek. Vybrané základní suroviny, přečtené ručně z obrázků stránek.',
  },
];

export const LEAFLET_DEALS: LeafletDeal[] = [
  { source: 'albert-47sm', store: 'Albert', ingredientId: 'kureci-prsa', price: 129.9, from: '2026-11-18', to: '2026-11-24', label: 'Kuřecí prsní řízky chlazené (1 kg)' },
  { source: 'albert-47sm', store: 'Albert', ingredientId: 'veprova-plec', price: 129.9, from: '2026-11-18', to: '2026-11-24', label: 'Vepřová plec bez kosti v celku (1 kg)' },
  { source: 'albert-47sm', store: 'Albert', ingredientId: 'kure-cele', price: 64.9, from: '2026-11-18', to: '2026-11-24', label: 'Kuře bez drobů chlazené (1 kg)' },
  { source: 'albert-47sm', store: 'Albert', ingredientId: 'kureci-stehna', price: 89.9, from: '2026-11-18', to: '2026-11-24', label: 'Kuřecí stehna chlazená (1 kg)' },
  { source: 'albert-47sm', store: 'Albert', ingredientId: 'mlete', price: 124.8, from: '2026-11-18', to: '2026-11-24', label: 'Výrobek z mletého vepřového masa (480 g, 59,90 Kč)', note: 'není čisté mleté maso' },
  { source: 'albert-47sm', store: 'Albert', ingredientId: 'sunka', price: 169.0, from: '2026-11-18', to: '2026-11-24', label: 'Vepřová euro šunka standardní jakost (100 g)', note: 'jen obsluhovaný úsek' },
  { source: 'albert-47sm', store: 'Albert', ingredientId: 'sunka', price: 199.0, from: '2026-11-18', to: '2026-11-24', label: 'Premium vepřová šunka nejvyšší jakost (100 g)', note: 'jen obsluhovaný úsek' },
  { source: 'albert-47sm', store: 'Albert', ingredientId: 'vejce', price: 2.99, from: '2026-11-18', to: '2026-11-24', label: 'Albert vejce z podestýlky M (10 ks, 29,90 Kč)' },
  { source: 'albert-47sm', store: 'Albert', ingredientId: 'spenat', price: 57.25, from: '2026-11-18', to: '2026-11-24', label: 'Gustona špenát sekaný mražený (400 g, 22,90 Kč)' },
  { source: 'albert-47sm', store: 'Albert', ingredientId: 'eidam', price: 147.6, from: '2026-11-18', to: '2026-11-24', label: 'Albert eidam 45 % (250 g, 36,90 Kč)' },
  { source: 'albert-47sm', store: 'Albert', ingredientId: 'jogurt', price: 9.9, from: '2026-11-18', to: '2026-11-24', label: 'Jogurt z Valašska bílý (150 g)' },
  { source: 'albert-47sm', store: 'Albert', ingredientId: 'mleko', price: 11.9, from: '2026-11-18', to: '2026-11-24', label: 'Madeta trvanlivé mléko 1,5 % (1 l)' },
  { source: 'albert-47sm', store: 'Albert', ingredientId: 'rajcata-konzerva', price: 19.9, from: '2026-11-18', to: '2026-11-24', label: 'Giana rajčata krájená (400 g)' },
  { source: 'albert-47sm', store: 'Albert', ingredientId: 'cocka', price: 59.8, from: '2026-11-18', to: '2026-11-24', label: 'Lagris čočka velkozrnná (500 g, 29,90 Kč)' },
  { source: 'albert-47sm', store: 'Albert', ingredientId: 'cervena-cocka', price: 71.8, from: '2026-11-18', to: '2026-11-24', label: 'Nature\'s Promise Bio červená čočka (500 g, 35,90 Kč)' },
  { source: 'albert-47sm', store: 'Albert', ingredientId: 'kuskus', price: 65.8, from: '2026-11-18', to: '2026-11-24', label: 'Bacchini kuskus (500 g, 32,90 Kč)' },
  { source: 'albert-47sm', store: 'Albert', ingredientId: 'okurka', price: 16.9, from: '2026-11-18', to: '2026-11-24', label: 'Okurka salátová hadovka (1 ks)' },
  { source: 'albert-47sm', store: 'Albert', ingredientId: 'jablka', price: 19.9, from: '2026-11-18', to: '2026-11-24', label: 'Jablka červená (1 kg)' },
  { source: 'albert-47sm', store: 'Albert', ingredientId: 'mouka', price: 9.9, from: '2026-11-18', to: '2026-11-24', label: 'Albert mouka hladká (1 kg)' },
  { source: 'kaufland-ponava', store: 'Kaufland', ingredientId: 'brambory', price: 13.95, from: '2026-11-18', to: '2026-11-24', label: 'K-Jarmark-Brambory konzumní žluté pozdní Varný typ: B (2 kg balení)' },
  { source: 'kaufland-ponava', store: 'Kaufland', ingredientId: 'chleb', price: 42.34, from: '2026-11-23', to: '2026-11-24', label: 'Slunečnicový chléb (470 g)' },
  { source: 'kaufland-ponava', store: 'Kaufland', ingredientId: 'chleb', price: 49.8, from: '2026-11-20', to: '2026-11-22', label: 'Mistrovský chléb (500 g)' },
  { source: 'kaufland-ponava', store: 'Kaufland', ingredientId: 'chleb', price: 49.83, from: '2026-11-18', to: '2026-11-24', label: 'K-Jarmark Staročeský chléb (600 g)' },
  { source: 'kaufland-ponava', store: 'Kaufland', ingredientId: 'cibule', price: 12.9, from: '2026-11-20', to: '2026-11-22', label: 'Cibule žlutá kuchyňská (1 kg)' },
  { source: 'kaufland-ponava', store: 'Kaufland', ingredientId: 'cocka', price: 51.8, from: '2026-11-18', to: '2026-11-24', label: 'Menu Gold Čočka (500 g)' },
  { source: 'kaufland-ponava', store: 'Kaufland', ingredientId: 'jablka', price: 17.45, from: '2026-11-20', to: '2026-11-22', label: 'Jablka (2 kg balení)' },
  { source: 'kaufland-ponava', store: 'Kaufland', ingredientId: 'jablka', price: 36.63, from: '2026-11-18', to: '2026-11-24', label: 'K-Jarmark Jablka červená (3 kg balení)' },
  { source: 'kaufland-ponava', store: 'Kaufland', ingredientId: 'jogurt', price: 6.5, from: '2026-11-18', to: '2026-11-24', label: 'K-Jarmark Jogurt bílý (150 g)' },
  { source: 'kaufland-ponava', store: 'Kaufland', ingredientId: 'jogurt', price: 7.09, from: '2026-11-18', to: '2026-11-24', label: 'Olma Klasik Bílý jogurt (400 g)' },
  { source: 'kaufland-ponava', store: 'Kaufland', ingredientId: 'jogurt', price: 9.08, from: '2026-11-04', to: '2026-12-01', label: 'Hollandia Jogurt bílý bezlaktózový (180 g)' },
  { source: 'kaufland-ponava', store: 'Kaufland', ingredientId: 'jogurt', price: 10.9, from: '2026-11-04', to: '2026-12-01', label: 'K-Bio Jogurt bílý (150 g)' },
  { source: 'kaufland-ponava', store: 'Kaufland', ingredientId: 'klobasa', price: 89.0, from: '2026-11-18', to: '2026-11-24', label: 'Váhala Špekáčky klasik (100 g)' },
  { source: 'kaufland-ponava', store: 'Kaufland', ingredientId: 'klobasa', price: 129.0, from: '2026-11-20', to: '2026-11-22', label: 'Prantl Ostravské klobásy (100 g)' },
  { source: 'kaufland-ponava', store: 'Kaufland', ingredientId: 'klobasa', price: 132.92, from: '2026-11-18', to: '2026-11-24', label: 'MASO UZENINY PÍSEK Ostravská klobása (240 g)' },
  { source: 'kaufland-ponava', store: 'Kaufland', ingredientId: 'kure-cele', price: 69.9, from: '2026-11-18', to: '2026-11-24', label: 'K-Purland Kuře bez drobů balené (cena za 1 kg)' },
  { source: 'kaufland-ponava', store: 'Kaufland', ingredientId: 'kure-cele', price: 69.9, from: '2026-11-18', to: '2026-11-24', label: 'Kuře bez drobů (cena za 1 kg)' },
  { source: 'kaufland-ponava', store: 'Kaufland', ingredientId: 'kureci-stehna', price: 59.96, from: '2026-11-18', to: '2026-11-24', label: 'Master Good Kuřecí stehna (2500 g)' },
  { source: 'kaufland-ponava', store: 'Kaufland', ingredientId: 'kureci-stehna', price: 79.9, from: '2026-11-18', to: '2026-11-24', label: 'Kuřecí stehna (cena za 1 kg)' },
  { source: 'kaufland-ponava', store: 'Kaufland', ingredientId: 'kureci-stehna', price: 79.9, from: '2026-11-18', to: '2026-11-24', label: 'Kuřecí stehna (cena za 1 kg)' },
  { source: 'kaufland-ponava', store: 'Kaufland', ingredientId: 'kuskus', price: 59.8, from: '2026-11-18', to: '2026-11-24', label: 'Sapori Mediterranei Kuskus (500 g)' },
  { source: 'kaufland-ponava', store: 'Kaufland', ingredientId: 'mleko', price: 10.9, from: '2026-11-20', to: '2026-11-22', label: 'Tatra Mléko trvanlivé (1 l)' },
  { source: 'kaufland-ponava', store: 'Kaufland', ingredientId: 'mleko', price: 16.9, from: '2026-11-18', to: '2026-11-24', label: 'Madeta Jihočeské mléko trvanlivé plnotučné (1 l)' },
  { source: 'kaufland-ponava', store: 'Kaufland', ingredientId: 'mleko', price: 16.9, from: '2026-11-18', to: '2026-11-24', label: 'Pragolaktos Mléko polotučné bez laktózy (1 l)' },
  { source: 'kaufland-ponava', store: 'Kaufland', ingredientId: 'mleko', price: 21.9, from: '2026-11-18', to: '2026-11-24', label: 'Olma Mléko čerstvé (1 l PET láhev)' },
  { source: 'kaufland-ponava', store: 'Kaufland', ingredientId: 'mouka', price: 12.11, from: '2026-11-18', to: '2026-11-24', label: 'K-Jarmark Mouka (900 g/1 kg)' },
  { source: 'kaufland-ponava', store: 'Kaufland', ingredientId: 'okurka', price: 13.9, from: '2026-11-18', to: '2026-11-22', label: 'Okurka salátová (1 kus)' },
  { source: 'kaufland-ponava', store: 'Kaufland', ingredientId: 'paprika', price: 69.9, from: '2026-11-23', to: '2026-11-24', label: 'Paprika kapie (1 kg)' },
  { source: 'kaufland-ponava', store: 'Kaufland', ingredientId: 'rajcata', price: 47.25, from: '2026-11-04', to: '2026-12-01', label: 'K-BIO Rajčata (400 g)' },
  { source: 'kaufland-ponava', store: 'Kaufland', ingredientId: 'ryze', price: 49.98, from: '2026-11-18', to: '2026-11-24', label: 'Arax Basmati rýže (5 kg)' },
  { source: 'kaufland-ponava', store: 'Kaufland', ingredientId: 'salat', price: 19.9, from: '2026-11-18', to: '2026-11-24', label: 'Salát ledový (1 kus)' },
  { source: 'kaufland-ponava', store: 'Kaufland', ingredientId: 'smetana', price: 10.9, from: '2026-11-18', to: '2026-11-24', label: 'K-Jarmark Smetana na vaření (200 g)' },
  { source: 'kaufland-ponava', store: 'Kaufland', ingredientId: 'sunka', price: 169.0, from: '2026-11-20', to: '2026-11-22', label: 'Bivoj Baby šunka nejvyšší jakosti (100 g)' },
  { source: 'kaufland-ponava', store: 'Kaufland', ingredientId: 'sunka', price: 199.0, from: '2026-11-18', to: '2026-11-24', label: 'K-Jarmark Dušená šunka výběrová (100 g)' },
  { source: 'kaufland-ponava', store: 'Kaufland', ingredientId: 'sunka', price: 199.0, from: '2026-11-18', to: '2026-11-24', label: 'Bivoj Šunka nejvyšší jakosti Shaved (100 g)' },
  { source: 'kaufland-ponava', store: 'Kaufland', ingredientId: 'sunka', price: 199.0, from: '2026-11-18', to: '2026-11-24', label: 'Váhala Farmářská šunka nejvyšší jakosti (100 g)' },
  { source: 'kaufland-ponava', store: 'Kaufland', ingredientId: 'eidam', price: 119.0, from: '2026-11-18', to: '2026-11-24', label: 'K-JARMARK Český eidam 30% Přírodní polotvrdý sýr (100 g)' },
  { source: 'kaufland-ponava', store: 'Kaufland', ingredientId: 'eidam', price: 149.5, from: '2026-11-18', to: '2026-11-24', label: 'K-CLASSIC Eidam 40% strouhaný sýr (200 g)' },
  { source: 'kaufland-ponava', store: 'Kaufland', ingredientId: 'eidam', price: 162.25, from: '2026-11-20', to: '2026-11-22', label: 'Gouda Přírodní polotvrdý sýr plátky (400 g)' },
  { source: 'kaufland-ponava', store: 'Kaufland', ingredientId: 'tunak', price: 39.9, from: '2026-11-04', to: '2026-12-01', label: 'K-Classic Tuňák ve vl. šťávě (185 g-195 g/150 g)' },
  { source: 'kaufland-ponava', store: 'Kaufland', ingredientId: 'tvaroh', price: 17.9, from: '2026-11-20', to: '2026-11-22', label: 'Tatra Tvaroh polotučný (250 g)' },
  { source: 'kaufland-ponava', store: 'Kaufland', ingredientId: 'tvaroh', price: 19.9, from: '2026-11-20', to: '2026-11-22', label: 'Tatra Tvaroh tučný (250 g)' },
  { source: 'kaufland-ponava', store: 'Kaufland', ingredientId: 'vlocky', price: 21.8, from: '2026-11-18', to: '2026-11-24', label: 'K-Classic Ovesné vločky (500 g)' },
  { source: 'lidl-1119', store: 'Lidl', ingredientId: 'sunka', price: 199.0, from: '2026-11-19', to: '2026-11-22', label: 'Pikok Pure dušená šunka nejvyšší jakosti (100 g)' },
  { source: 'lidl-1119', store: 'Lidl', ingredientId: 'brambory', price: 9.99, from: '2026-11-19', to: '2026-11-22', label: 'Brambory přílohové (10 kg, 99,90 Kč)' },
  { source: 'lidl-1119', store: 'Lidl', ingredientId: 'kureci-prsa', price: 89.9, from: '2026-11-19', to: '2026-11-22', label: 'Kuřecí prsa s kostí (1 kg)', note: 's kostí' },
  { source: 'lidl-1119', store: 'Lidl', ingredientId: 'mlete', price: 128.43, from: '2026-11-19', to: '2026-11-22', label: 'Mleté maso mix 100 % (700 g, 89,90 Kč)' },
  { source: 'lidl-1119', store: 'Lidl', ingredientId: 'salat', price: 24.9, from: '2026-11-19', to: '2026-11-22', label: 'Ledový salát (1 ks)' },
  { source: 'lidl-1119', store: 'Lidl', ingredientId: 'eidam', price: 130.62, from: '2026-11-19', to: '2026-11-22', label: 'Pilos eidam blok (650 g, 84,90 Kč)' },
  { source: 'lidl-1119', store: 'Lidl', ingredientId: 'tvaroh', price: 14.95, from: '2026-11-19', to: '2026-11-22', label: 'Pilos tučný tvaroh (500 g, 29,90 Kč)' },
  { source: 'lidl-1119', store: 'Lidl', ingredientId: 'ryze', price: 27.98, from: '2026-11-19', to: '2026-11-22', label: 'Arax rýže bílá dlouhozrnná (5 kg, 139,90 Kč)' },
  { source: 'lidl-1119', store: 'Lidl', ingredientId: 'veprova-plec', price: 59.9, from: '2026-11-20', to: '2026-11-22', label: 'Vepřová kýta bez kosti (1 kg)', note: 'kýta, ne plec' },
  { source: 'lidl-1119', store: 'Lidl', ingredientId: 'jablka', price: 19.9, from: '2026-11-20', to: '2026-11-22', label: 'Jablka zelená Golden Delicious (1 kg)' },
  { source: 'lidl-1119', store: 'Lidl', ingredientId: 'chleb', price: 49.83, from: '2026-11-19', to: '2026-11-22', label: 'Řemeslný pecen pšenično-žitný (600 g, 29,90 Kč)' },
  { source: 'lidl-1123', store: 'Lidl', ingredientId: 'mleko', price: 11.9, from: '2026-11-23', to: '2026-11-25', label: 'Pilos trvanlivé mléko plnotučné (1 l)' },
  { source: 'lidl-1123', store: 'Lidl', ingredientId: 'veprova-plec', price: 69.9, from: '2026-11-23', to: '2026-11-25', label: 'Vepřová pečeně bez kosti (1 kg)', note: 'pečeně, ne plec' },
  { source: 'lidl-1123', store: 'Lidl', ingredientId: 'mrkev', price: 11.9, from: '2026-11-23', to: '2026-11-25', label: 'Mrkev (1 kg)' },
  { source: 'lidl-1123', store: 'Lidl', ingredientId: 'brokolice', price: 49.8, from: '2026-11-23', to: '2026-11-25', label: 'Brokolice (500 g, 24,90 Kč)' },
  { source: 'lidl-1123', store: 'Lidl', ingredientId: 'mlete', price: 129.8, from: '2026-11-23', to: '2026-11-25', label: 'Kuřecí mělněné maso (500 g, 64,90 Kč)', note: 'kuřecí' },
  { source: 'lidl-1123', store: 'Lidl', ingredientId: 'kureci-stehna', price: 84.9, from: '2026-11-23', to: '2026-11-25', label: 'Kuřecí stehna a křídla mix (1 kg)', note: 'mix se křídly' },
  { source: 'lidl-1123', store: 'Lidl', ingredientId: 'klobasa', price: 131.6, from: '2026-11-23', to: '2026-11-25', label: 'Pikok kuřecí párky (250 g, 32,90 Kč)' },
  { source: 'lidl-1123', store: 'Lidl', ingredientId: 'tunak', price: 30.82, from: '2026-11-23', to: '2026-11-25', label: 'Nixe tuňák ve vlastní šťávě (4×195 g, 129,90 Kč)' },
  { source: 'lidl-1123', store: 'Lidl', ingredientId: 'chleb', price: 48.91, from: '2026-11-23', to: '2026-11-29', label: 'Chléb s podmáslím (550 g, 26,90 Kč)' },
  { source: 'lidl-1123', store: 'Lidl', ingredientId: 'veprova-plec', price: 129.9, from: '2026-11-23', to: '2026-11-25', label: 'Vepřové řízky z kýty (1 kg)', note: 'kýta, ne plec' },
  { source: 'lidl-1123', store: 'Lidl', ingredientId: 'mozzarella', price: 169.0, from: '2026-11-23', to: '2026-11-25', label: 'Italat mozzarella (200 g, 16,90 Kč)', note: 'cena za 100 g po odkapání' },
  { source: 'lidl-1126', store: 'Lidl', ingredientId: 'okurka', price: 13.9, from: '2026-11-26', to: '2026-11-29', label: 'Okurka salátová (1 ks)' },
  { source: 'lidl-1126', store: 'Lidl', ingredientId: 'mlete', price: 124.75, from: '2026-11-26', to: '2026-11-29', label: 'Maso z farmy vepřové mleté (400 g, 49,90 Kč)' },
  { source: 'lidl-1126', store: 'Lidl', ingredientId: 'ryba', price: 178.74, from: '2026-11-26', to: '2026-11-29', label: 'Ocean Sea aljašská treska filety mražené (500 g, 84,90 Kč)' },
  { source: 'lidl-1126', store: 'Lidl', ingredientId: 'mouka', price: 19.95, from: '2026-11-26', to: '2026-11-29', label: 'Babiččina volba hladká / polohrubá (2 kg, 39,90 Kč)' },
  { source: 'lidl-1126', store: 'Lidl', ingredientId: 'cibule', price: 12.9, from: '2026-11-26', to: '2026-11-29', label: 'Cibule žlutá (1 kg)' },
  { source: 'lidl-1126', store: 'Lidl', ingredientId: 'avokado', price: 22.9, from: '2026-11-26', to: '2026-11-29', label: 'Avokádo (1 ks)' },
  { source: 'lidl-1126', store: 'Lidl', ingredientId: 'rajcata', price: 79.8, from: '2026-11-26', to: '2026-11-29', label: 'Cherry rajčata (500 g, 39,90 Kč)', note: 'cherry' },
  { source: 'lidl-1126', store: 'Lidl', ingredientId: 'veprova-plec', price: 149.83, from: '2026-11-26', to: '2026-11-29', label: 'Vepřová krkovice plátky s kostí (600 g, 89,90 Kč)', note: 'krkovice s kostí' },
  { source: 'lidl-1126', store: 'Lidl', ingredientId: 'hermelin', price: 159.2, from: '2026-11-26', to: '2026-11-29', label: 'Lakmilk balkánský sýr (125 g, 19,90 Kč)', note: 'balkánský sýr' },
  { source: 'lidl-1126', store: 'Lidl', ingredientId: 'sunka', price: 169.0, from: '2026-11-26', to: '2026-11-29', label: 'Pikok výběrová šunka krájená (100 g, 16,90 Kč)' },
  { source: 'lidl-1126', store: 'Lidl', ingredientId: 'klobasa', price: 99.87, from: '2026-11-27', to: '2026-11-29', label: 'Pikok vepřové párečky (750 g, 74,90 Kč)', note: 'platí od pátku' },
];

/** Slevy z letáků ve tvaru, který používá počítání cen. */
export function leafletDiscounts(): Discount[] {
  return LEAFLET_DEALS.map((d, i) => ({
    id: `leaflet-${i}`,
    store: d.store,
    ingredientId: d.ingredientId,
    price: d.price,
    validFrom: d.from,
    validTo: d.to,
  }));
}
