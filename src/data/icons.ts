import type { Recipe } from './recipes';
import { INGREDIENT_MAP } from './ingredients';

/** Symboly (emoji) surovin, aby bylo hned vidět, o co jde. */
export const INGREDIENT_ICON: Record<string, string> = {
  // přílohy a základ
  ryze: '🍚',
  brambory: '🥔',
  testoviny: '🍝',
  kuskus: '🌾',
  bulgur: '🌾',
  pohanka: '🌾',
  knedliky: '🥟',
  chleb: '🍞',
  rohliky: '🥐',
  tortilla: '🌯',
  vlocky: '🥣',
  // maso, vejce, luštěniny
  'kureci-prsa': '🍗',
  'kureci-stehna': '🍗',
  'kure-cele': '🐔',
  hoveze: '🥩',
  bucek: '🥓',
  mlete: '🥩',
  'veprova-plec': '🥩',
  klobasa: '🌭',
  sunka: '🍖',
  ryba: '🐟',
  tunak: '🐟',
  vejce: '🥚',
  cocka: '🫘',
  'cervena-cocka': '🫘',
  cizrna: '🫘',
  fazole: '🫘',
  // mléčné
  mleko: '🥛',
  tvaroh: '🥣',
  jogurt: '🥛',
  smetana: '🥛',
  'zakysana-smetana': '🥛',
  syr: '🧀',
  // zelenina a ovoce
  cibule: '🧅',
  cesnek: '🧄',
  cuketa: '🥒',
  porek: '🥬',
  celer: '🥬',
  mrkev: '🥕',
  paprika: '🫑',
  rajcata: '🍅',
  okurka: '🥒',
  brokolice: '🥦',
  kvetak: '🥦',
  zeli: '🥬',
  spenat: '🥬',
  hrasek: '🌱',
  zampiony: '🍄',
  'rajcata-konzerva': '🥫',
  kukurice: '🌽',
  salat: '🥗',
  banany: '🍌',
  jablka: '🍎',
  bataty: '🍠',
  avokado: '🥑',
  // ostatní
  protlak: '🥫',
  strouhanka: '🍞',
  mouka: '🌾',
};

export function iconOf(id: string): string {
  return INGREDIENT_ICON[id] ?? '🍽️';
}

/** Pravidla pro typ jídla podle názvu. První shoda vyhrává. */
const DISH_RULES: [RegExp, string][] = [
  [/polévk|vývar|boršč/, '🍲'],
  [/guláš|ragú|ragu|kotlík|kyselo/, '🍲'],
  [/kari|dhal|chilli|chili/, '🍛'],
  [/špagety|těstovin|penne|lasagne|carbonara|nudle|boloň|gnocchi/, '🍝'],
  [/rizoto|rýž/, '🍚'],
  [/salát/, '🥗'],
  [/omeleta|vejce|míchan|smaženic|volské/, '🍳'],
  [/wrap|tortill/, '🌯'],
  [/topink|toast|rohlík|rohlíky|sendvič|bageta|chlebu|na chlebu/, '🥪'],
  [/palačink/, '🥞'],
  [/kaše|vločk|müsli|jogurt|tvaroh/, '🥣'],
  [/pizza/, '🍕'],
  [/řízek|řízky|steak|karbanátk|karbanátky|sekan|špíz|stripsy|kuličky/, '🥩'],
  [/kuře|kuřecí|stehn|paličk/, '🍗'],
  [/ryb|treska|pangas|štika|losos|pstruh|tuňák/, '🐟'],
  [/zapečen|gratin|pečen/, '🥘'],
  [/knedl/, '🥟'],
  [/brambor|bramborák|placičk|placky|cukeťák/, '🥔'],
];

/** Symboly, které se do náhledu talíře nedávají (jsou skoro všude a nic neřeknou). */
const HIDDEN_IN_PLATE = new Set(['mouka', 'strouhanka', 'protlak', 'smetana', 'zakysana-smetana', 'mleko', 'cesnek', 'cibule']);

/** Typ jídla jako jeden symbol („jak by zhruba mohlo vypadat“). */
export function dishIcon(recipe: Recipe, sideId?: string): string {
  const name = recipe.name.toLowerCase();
  for (const [re, icon] of DISH_RULES) if (re.test(name)) return icon;
  const main = recipe.ing.find(([id]) => INGREDIENT_MAP[id]?.kind === 'protein')?.[0] ?? sideId ?? recipe.ing[0]?.[0];
  return main ? iconOf(main) : '🍽️';
}

/** Hlavní suroviny jako řada symbolů: bílkovina, příloha, zelenina (nejvýš 5). */
export function plateParts(recipe: Recipe, sideId?: string): string[] {
  const ids = recipe.ing.map(([id]) => id);
  if (sideId) ids.push(sideId);
  const rank = (id: string) => {
    const k = INGREDIENT_MAP[id]?.kind;
    return k === 'protein' ? 0 : k === 'side' ? 1 : k === 'veg' ? 2 : 3;
  };
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of [...ids].filter((i) => !HIDDEN_IN_PLATE.has(i)).sort((a, b) => rank(a) - rank(b))) {
    const icon = iconOf(id);
    if (!seen.has(icon)) {
      seen.add(icon);
      out.push(icon);
    }
    if (out.length >= 5) break;
  }
  return out;
}
