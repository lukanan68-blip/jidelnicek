import type { Recipe } from './recipes';

/**
 * Ukázkové fotky k našim receptům: podobné jídlo z některého z webů s recepty (vždy s odkazem na originál).
 * Klíč je id receptu. Fotka se jen odkazuje (nekopíruje se do aplikace).
 */
export const OWN_PHOTOS: Record<string, NonNullable<Recipe['photo']>> = {
  'karbanatky': { url: 'https://www.toprecepty.cz/fotky/recepty/1104/stavnate-karbanatky-z-trouby-s-bramborami-293094-677-508-nw.jpg', site: 'Toprecepty', link: 'https://www.toprecepty.cz/recept/87848-stavnate-karbanatky-z-trouby-s-bramborami/', similar: true },
  'kureci-paprika': { url: 'https://www.toprecepty.cz/fotky/recepty/0697/kure-na-paprice-i-pro-zacatecniky-249917-677-508-nw.jpg', site: 'Toprecepty', link: 'https://www.toprecepty.cz/recept/28963-kure-na-paprice-i-pro-zacatecniky/', similar: true },
  'kureci-stehna-pecena': { url: 'https://www.toprecepty.cz/fotky/recepty/1106/pecene-kure-na-zeli-se-smetanou-a-cesnekem-293262-677-508-nw.jpg', site: 'Toprecepty', link: 'https://www.toprecepty.cz/recept/87920-pecena-kureci-stehna-na-zeli-se-smetanou-a-cesnekem/', similar: true },
  'kureci-rizky': { url: 'https://www.toprecepty.cz/fotky/recepty/1105/kureci-rizek-v-testicku-293188-677-508-nw.jpg', site: 'Toprecepty', link: 'https://www.toprecepty.cz/recept/87896-kureci-rizek-v-testicku/', similar: true },
  'rizoto-kureci': { url: 'https://www.toprecepty.cz/fotky/recepty/1104/rizoto-z-trouby-podle-moniky-absolonove-293081-677-508-nw.jpg', site: 'Toprecepty', link: 'https://www.toprecepty.cz/recept/87853-rizoto-z-trouby-podle-moniky-absolonove/', similar: true },
  'rizoto-zeleninove': { url: 'https://ms1.ostium.cz/instance/web-recepty/jYNqXt9M/h276w407t.jpg', site: 'Recepty.cz', link: 'https://www.recepty.cz/recept/safranove-rizoto-s-cuketami-145561', similar: true },
  'pecene-kure': { url: 'https://www.apetitonline.cz/sites/default/files/styles/medium/public/recepty/Bezchybne_pomalu_pecene_kure_2007_11.jpg.webp', site: 'Apetit', link: 'https://www.apetitonline.cz/recept/bezchybne-pomalu-pecene-kure', similar: true },
  'kureci-houby': { url: 'https://www.apetitonline.cz/sites/default/files/styles/medium/public/kure_na_zampionech_12018_0.jpg.webp', site: 'Apetit', link: 'https://www.apetitonline.cz/recept/kure-na-zampionech', similar: true },
  'wrapy-kureci': { url: 'https://www.apetitonline.cz/sites/default/files/styles/medium/public/svacinovy_wrap_0.jpg.webp', site: 'Apetit', link: 'https://www.apetitonline.cz/recept/svacinovy-wrap', similar: true },
  'cocka-kyselo': { url: 'https://www.apetitonline.cz/sites/default/files/styles/medium/public/novorocni_cocka_nakyselo_0.jpg.webp', site: 'Apetit', link: 'https://www.apetitonline.cz/recept/novorocni-cocka-na-kyselo', similar: true },
  'cocka-kari': { url: 'https://www.apetitonline.cz/sites/default/files/styles/medium/public/cervenocockovy_dhal_s_cizrnou_1.jpg.webp', site: 'Apetit', link: 'https://www.apetitonline.cz/recept/cervenocockovy-dhal-s-cizrnou', similar: true },
  'cizrnove-kari': { url: 'https://www.apetitonline.cz/sites/default/files/styles/medium/public/rajcatovo-cizrnove_kari_0.jpg.webp', site: 'Apetit', link: 'https://www.apetitonline.cz/recept/rajcatovo-cizrnove-kari', similar: true },
  'veprovy-gulas': { url: 'https://www.toprecepty.cz/fotky/recepty/0003/klasicky-hospodsky-gulas-vidensky-4552-677-508-nw.jpg', site: 'Toprecepty', link: 'https://www.toprecepty.cz/recept/4007-klasicky-hospodsky-gulas-vidensky/', similar: true },
  'segedinsky-gulas': { url: 'https://www.toprecepty.cz/fotky/recepty/0061/segedinsky-gulas-148245-v2-677-508-nw.jpg', site: 'Toprecepty', link: 'https://www.toprecepty.cz/recept/38145-segedinsky-gulas/', similar: true },
  'fazolovy-gulas': { url: 'https://www.apetitonline.cz/sites/default/files/styles/medium/public/recepty/beans-6383380_1280.jpg.webp', site: 'Apetit', link: 'https://www.apetitonline.cz/recept/fazolovy-gulas', similar: true },
  'zeli-klobasa': { url: 'https://www.apetitonline.cz/sites/default/files/styles/medium/public/recepty/Dusene_hlavkove_zeli_2010_10.jpg.webp', site: 'Apetit', link: 'https://www.apetitonline.cz/recept/dusene-hlavkove-zeli', similar: true },
  'smazena-ryze': { url: 'https://www.apetitonline.cz/sites/default/files/styles/medium/public/recepty/EggFriedRice.jpg.webp', site: 'Apetit', link: 'https://www.apetitonline.cz/recept/smazena-ryze-s-vejci', similar: true },
  'chilli': { url: 'https://www.apetitonline.cz/sites/default/files/styles/medium/public/chilli_con_carne_0.jpg.webp', site: 'Apetit', link: 'https://www.apetitonline.cz/recept/chilli-con-carne', similar: true },
  'cockova-polevka-zel': { url: 'https://www.apetitonline.cz/sites/default/files/styles/medium/public/cockovapolevka_0.jpg.webp', site: 'Apetit', link: 'https://www.apetitonline.cz/recept/husta-cockova-polevka', similar: true },
  'cockova-polevka': { url: 'https://www.apetitonline.cz/sites/default/files/styles/medium/public/cockovapolevka_0.jpg.webp', site: 'Apetit', link: 'https://www.apetitonline.cz/recept/husta-cockova-polevka', similar: true },
  'smazeny-syr': { url: 'https://ms1.ostium.cz/instance/web-recepty/jX9FUrLR/h276w407t.jpg', site: 'Recepty.cz', link: 'https://www.recepty.cz/recept/smazeny-syr-s-brusinkovou-tatarkou-145752', similar: true },
  'testoviny-spenat': { url: 'https://www.apetitonline.cz/sites/default/files/styles/medium/public/recepty/20260122_T%C4%9Bstoviny_se_smetanou_%C5%A1pen%C3%A1tem_a_s%C3%BDrem_foto-5.jpg.webp', site: 'Apetit', link: 'https://www.apetitonline.cz/recept/testoviny-se-smetanou-spenatem-syrem', similar: true },
  'ryba-zelenina': { url: 'https://ms3.ostium.cz/instance/web-recepty/jl85s6s6/h276w407t.jpg', site: 'Recepty.cz', link: 'https://www.recepty.cz/recept/losos-na-pare-s-restovanou-zeleninou-161248', similar: true },
};

/**
 * Přímý odkaz na podobný recept na webu pro naše recepty, ke kterým nemáme fotku.
 * (U receptů s fotkou je odkaz u fotky.) Klíč je id receptu.
 */
export const OWN_LINKS: Record<string, { site: string; url: string }> = {
  'bolonske': { site: 'Mandimu', url: 'https://mandimu.cz/blogs/recepty/bolonska-omacka' },
  'lasagne': { site: 'Mandimu', url: 'https://mandimu.cz/blogs/recepty/rychle-lasagne' },
  'zapecene-testoviny': { site: 'Mandimu', url: 'https://mandimu.cz/blogs/recepty/zapecene-testoviny-se-zeleninou' },
  'testoviny-tunak': { site: 'Recepty.cz', url: 'https://www.recepty.cz/recept/penne-s-tunakem-a-kukurici-154112' },
  'zapeceny-kvetak': { site: 'Apetit', url: 'https://www.apetitonline.cz/recept/zapeceny-kvetak-s-bramborami' },
  'omeleta-syr': { site: 'Vilgain', url: 'https://vilgain.cz/syrova-omeleta' },
  'omeleta-sunka': { site: 'Vilgain', url: 'https://vilgain.cz/syrova-omeleta' },
  'kase-banan': { site: 'Mandimu', url: 'https://mandimu.cz/blogs/recepty/ovesna-kase-s-karamelizovanym-bananem' },
};
