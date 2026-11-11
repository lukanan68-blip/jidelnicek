export type MealType = 'breakfast' | 'main';

export interface Recipe {
  id: string;
  name: string;
  meal: MealType;
  /** Aktivní čas u sporáku / příprava v minutách. */
  min: number;
  /** Čas navíc, kdy se jídlo vaří nebo peče samo (min). */
  extra?: number;
  /** Přílohy, které k jídlu sedí. Plánovač vybere tu, kterou jsi jedl nejdéle. Prázdné = bez přílohy. */
  sides: string[];
  /** Množství přílohy pro 2 osoby (g / ks), pokud se liší od výchozí porce. */
  sideAmounts?: Record<string, number>;
  /** Suroviny bez přílohy, množství pro 2 osoby (g, ml nebo ks). */
  ing: [string, number][];
  /** Jídlo se nehodí na dvojitou várku. */
  noBatch?: boolean;
  /** Vlastní hledací dotaz pro odkaz na recept. */
  search?: string;
}

const ALL_STARCH = ['testoviny', 'ryze', 'knedliky', 'brambory'];

export const RECIPES: Recipe[] = [
  // ---------- SNÍDANĚ ----------
  { id: 'kase-banan', name: 'Ovesná kaše s banánem', meal: 'breakfast', min: 10, sides: ['vlocky'], sideAmounts: { vlocky: 100 }, ing: [['mleko', 400], ['banany', 200]] },
  { id: 'michana-vejce', name: 'Míchaná vejce s rajčetem a chlebem', meal: 'breakfast', min: 10, sides: ['chleb'], sideAmounts: { chleb: 150 }, ing: [['vejce', 4], ['rajcata', 100]] },
  { id: 'rohliky-sunka', name: 'Rohlíky se šunkou, sýrem a okurkou', meal: 'breakfast', min: 5, sides: ['rohliky'], sideAmounts: { rohliky: 4 }, ing: [['sunka', 100], ['syr', 80], ['okurka', 1]] },
  { id: 'tvaroh-jablko', name: 'Tvaroh s jablkem a vločkami', meal: 'breakfast', min: 5, sides: ['vlocky'], sideAmounts: { vlocky: 50 }, ing: [['tvaroh', 2], ['jablka', 200]] },
  { id: 'vajickova-pomazanka', name: 'Vajíčková pomazánka na chlebu', meal: 'breakfast', min: 15, sides: ['chleb'], sideAmounts: { chleb: 150 }, ing: [['vejce', 4], ['jogurt', 1], ['cibule', 30]] },
  { id: 'topinky-syr', name: 'Topinky se sýrem a rajčetem', meal: 'breakfast', min: 10, sides: ['chleb'], sideAmounts: { chleb: 200 }, ing: [['syr', 100], ['rajcata', 150]] },
  { id: 'tortilla-vejce', name: 'Tortilla s vejcem a sýrem', meal: 'breakfast', min: 12, sides: ['tortilla'], sideAmounts: { tortilla: 2 }, ing: [['vejce', 3], ['syr', 60], ['paprika', 100]] },
  { id: 'jogurt-vlocky', name: 'Jogurt s vločkami a jablkem', meal: 'breakfast', min: 5, sides: ['vlocky'], sideAmounts: { vlocky: 60 }, ing: [['jogurt', 2], ['jablka', 200]] },
  { id: 'palacinky-tvaroh', name: 'Palačinky s tvarohem', meal: 'breakfast', min: 25, sides: [], ing: [['mouka', 150], ['vejce', 2], ['mleko', 300], ['tvaroh', 2]], noBatch: true },
  { id: 'rohliky-tvaroh', name: 'Rohlíky s tvarohovou pomazánkou', meal: 'breakfast', min: 10, sides: ['rohliky'], sideAmounts: { rohliky: 4 }, ing: [['tvaroh', 2], ['cibule', 30], ['paprika', 80]] },

  // ---------- OBĚDY A VEČEŘE ----------
  { id: 'kureci-paprika', name: 'Kuřecí na paprice se smetanou', meal: 'main', min: 35, sides: ALL_STARCH, ing: [['kureci-prsa', 300], ['cibule', 100], ['paprika', 150], ['smetana', 1]] },
  { id: 'kureci-stehna-pecena', name: 'Pečená kuřecí stehna se zeleninou', meal: 'main', min: 15, extra: 40, sides: ['brambory', 'ryze', 'kuskus', 'bulgur'], ing: [['kureci-stehna', 600], ['mrkev', 200], ['cibule', 100]] },
  { id: 'testoviny-tunak', name: 'Těstoviny s tuňákem a rajčaty', meal: 'main', min: 20, sides: ['testoviny'], ing: [['tunak', 2], ['rajcata-konzerva', 1], ['cibule', 50], ['cesnek', 1]] },
  { id: 'bolonske', name: 'Boloňská omáčka', meal: 'main', min: 30, sides: ['testoviny'], ing: [['mlete', 300], ['cibule', 100], ['mrkev', 100], ['rajcata-konzerva', 1], ['cesnek', 1]], search: 'boloňské špagety' },
  { id: 'cocka-kyselo', name: 'Čočka na kyselo s vejcem', meal: 'main', min: 30, sides: ['brambory', 'chleb'], sideAmounts: { chleb: 150 }, ing: [['cocka', 200], ['cibule', 100], ['vejce', 2]] },
  { id: 'rizoto-kureci', name: 'Rizoto s kuřecím a hráškem', meal: 'main', min: 30, sides: ['ryze'], sideAmounts: { ryze: 180 }, ing: [['kureci-prsa', 250], ['hrasek', 100], ['mrkev', 100], ['cibule', 80], ['syr', 40]] },
  { id: 'veprovy-gulas', name: 'Vepřový guláš', meal: 'main', min: 25, extra: 60, sides: ['knedliky', 'chleb', 'brambory'], sideAmounts: { chleb: 250 }, ing: [['veprova-plec', 400], ['cibule', 300], ['paprika', 80]] },
  { id: 'kureci-rizky', name: 'Kuřecí řízky se zeleninovým salátem', meal: 'main', min: 35, sides: ['brambory', 'ryze'], ing: [['kureci-prsa', 300], ['vejce', 2], ['strouhanka', 80], ['mouka', 40], ['okurka', 1]], noBatch: true, search: 'kuřecí řízek' },
  { id: 'cinske-kure', name: 'Kuřecí s zeleninou na pánvi (wok)', meal: 'main', min: 25, sides: ['ryze', 'testoviny'], ing: [['kureci-prsa', 250], ['mrkev', 100], ['paprika', 100], ['cibule', 80]] },
  { id: 'zapecene-testoviny', name: 'Zapečené těstoviny se šunkou a sýrem', meal: 'main', min: 15, extra: 20, sides: ['testoviny'], ing: [['sunka', 100], ['syr', 100], ['smetana', 1]] },
  { id: 'chilli', name: 'Chilli con carne', meal: 'main', min: 30, sides: ['ryze', 'tortilla', 'chleb'], sideAmounts: { chleb: 150 }, ing: [['mlete', 250], ['fazole', 2], ['rajcata-konzerva', 1], ['cibule', 100], ['paprika', 100], ['kukurice', 1]] },
  { id: 'cizrnove-kari', name: 'Cizrnové kari se špenátem', meal: 'main', min: 25, sides: ['ryze', 'kuskus', 'bulgur'], ing: [['cizrna', 2], ['rajcata-konzerva', 1], ['cibule', 100], ['smetana', 1], ['spenat', 150]] },
  { id: 'cocka-kari', name: 'Kari z červené čočky', meal: 'main', min: 25, sides: ['ryze', 'bulgur', 'chleb'], sideAmounts: { chleb: 150 }, ing: [['cervena-cocka', 150], ['rajcata-konzerva', 1], ['cibule', 100], ['mrkev', 100]] },
  { id: 'brambory-spenat', name: 'Špenát s vejcem a bramborami', meal: 'main', min: 25, sides: ['brambory'], ing: [['spenat', 300], ['vejce', 3], ['cesnek', 1]] },
  { id: 'klobasa-kase', name: 'Opečená klobása s bramborovou kaší', meal: 'main', min: 25, sides: ['brambory'], ing: [['klobasa', 250], ['cibule', 80], ['mleko', 100]] },
  { id: 'zeli-klobasa', name: 'Dušené zelí s klobásou', meal: 'main', min: 30, sides: ['brambory', 'knedliky', 'chleb'], sideAmounts: { chleb: 200 }, ing: [['klobasa', 250], ['zeli', 300], ['cibule', 100]] },
  { id: 'smazena-ryze', name: 'Smažená rýže s vejci a zeleninou', meal: 'main', min: 20, sides: ['ryze'], sideAmounts: { ryze: 200 }, ing: [['vejce', 3], ['hrasek', 100], ['mrkev', 100], ['cibule', 80]] },
  { id: 'ryba-zelenina', name: 'Rybí filé s brokolicí', meal: 'main', min: 25, extra: 10, sides: ['brambory', 'ryze', 'kuskus'], ing: [['ryba', 300], ['brokolice', 300], ['cesnek', 1]] },
  { id: 'kureci-houby', name: 'Kuřecí nudličky na žampionech se smetanou', meal: 'main', min: 30, sides: ['testoviny', 'ryze', 'knedliky'], ing: [['kureci-prsa', 250], ['zampiony', 200], ['cibule', 80], ['smetana', 1]] },
  { id: 'wrapy-kureci', name: 'Wrapy s kuřecím a zeleninou', meal: 'main', min: 20, sides: ['tortilla'], ing: [['kureci-prsa', 250], ['paprika', 100], ['rajcata', 100], ['jogurt', 1], ['syr', 50]], noBatch: true },
  { id: 'zapeceny-kvetak', name: 'Zapečený květák se šunkou a sýrem', meal: 'main', min: 20, extra: 30, sides: ['brambory', 'chleb'], sideAmounts: { chleb: 150 }, ing: [['kvetak', 500], ['sunka', 100], ['syr', 100], ['vejce', 2], ['smetana', 1]] },
  { id: 'karbanatky', name: 'Karbanátky z mletého masa', meal: 'main', min: 35, sides: ['brambory', 'ryze'], ing: [['mlete', 350], ['vejce', 1], ['strouhanka', 50], ['cibule', 80], ['cesnek', 1], ['okurka', 1]], noBatch: true },
  { id: 'testoviny-brokolice', name: 'Těstoviny s brokolicí a sýrem', meal: 'main', min: 20, sides: ['testoviny'], ing: [['brokolice', 300], ['smetana', 1], ['syr', 60], ['cesnek', 1]] },
  { id: 'pohanka-houby', name: 'Pohanka s žampiony a vejcem', meal: 'main', min: 25, sides: ['pohanka', 'ryze', 'bulgur'], ing: [['zampiony', 250], ['cibule', 80], ['vejce', 2]] },
  { id: 'mlete-paprika', name: 'Mleté maso na pánvi s paprikou a rajčaty', meal: 'main', min: 20, sides: ['ryze', 'testoviny', 'brambory', 'kuskus'], ing: [['mlete', 300], ['paprika', 150], ['rajcata', 150], ['cibule', 80]] },
  { id: 'omeleta-sunka', name: 'Omeleta se šunkou a sýrem, salát', meal: 'main', min: 15, sides: ['chleb', 'tortilla'], sideAmounts: { chleb: 150, tortilla: 2 }, ing: [['vejce', 5], ['sunka', 80], ['syr', 60], ['salat', 1]], noBatch: true },
  { id: 'kureci-zelenina-rice', name: 'Kuřecí kousky se sladkokyselou zeleninou', meal: 'main', min: 25, sides: ['ryze', 'bulgur'], ing: [['kureci-prsa', 250], ['paprika', 120], ['kukurice', 1], ['cibule', 80]] },
  { id: 'fazolovy-gulas', name: 'Fazolový guláš s klobásou', meal: 'main', min: 25, sides: ['chleb', 'brambory'], sideAmounts: { chleb: 250 }, ing: [['fazole', 2], ['klobasa', 150], ['cibule', 100], ['paprika', 80]] },
];

export const RECIPE_MAP: Record<string, Recipe> = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

/** Weby s recepty. Odkaz otevře vyhledávání názvu jídla jen na daném webu. */
export const RECIPE_SITES: { name: string; domain?: string }[] = [
  { name: 'Toprecepty', domain: 'toprecepty.cz' },
  { name: 'Recepty.cz', domain: 'recepty.cz' },
  { name: 'Vařecha', domain: 'varecha.cz' },
  { name: 'Kuchařka pro dceru', domain: 'kucharkaprodceru.cz' },
  { name: 'Apetit', domain: 'apetitonline.cz' },
  { name: 'Lidl Kuchyně', domain: 'lidl-kuchyne.cz' },
  { name: 'Kdekoliv na webu' },
];

export function recipeSearchUrl(recipe: Recipe, domain?: string): string {
  const q = `${domain ? `site:${domain} ` : ''}${recipe.search ?? recipe.name}`;
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}
