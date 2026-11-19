// Spell-title recognition, not UI translations. Sources and scope: LANGUAGES.md.
export const SPELL_NAMES = {
  en: { hunter: ["Hunter's Mark"], curse: ["Bestow Curse", "Beston Curse"], hex: ["Hex"], elementals: ["Conjure Minor Elementals"] },
  pt: { hunter: ["Marca do Caçador", "Marca do Predador"], curse: ["Rogar Maldição", "Lançar Maldição", "Impor Maldição"], hex: ["Bruxaria", "Danação"], elementals: ["Conjurar Elementais Menores", "Invocar Elementais Menores"] },
  es: { hunter: ["Marca del cazador"], curse: ["Imponer maldición"], hex: ["Maleficio"], elementals: ["Conjurar elementales menores"] },
  fr: { hunter: ["Marque du chasseur"], curse: ["Malédiction"], hex: ["Maléfice"], elementals: ["Invocation d’élémentaires mineurs"] },
  de: { hunter: ["Zeichen des Jägers"], curse: ["Fluch"], hex: ["Verwünschung", "Verwünschen"], elementals: ["Schwache Elementare beschwören"] },
  it: { hunter: ["Marchio del cacciatore"], curse: ["Scagliare maledizione"], hex: ["Sortilegio"], elementals: ["Evoca elementali minori"] },
  pl: { hunter: ["Znak łowcy"], curse: ["Nałożenie klątwy"], hex: ["Urok"], elementals: ["Wyczarowanie mniejszych żywiołaków"] },
  ru: { hunter: ["Метка охотника"], curse: ["Проклятие", "Наложение проклятия"], hex: ["Сглаз"], elementals: ["Призыв малых элементалей"] },
  ja: { hunter: ["ハンターズ・マーク"], curse: ["ビストウ・カース"], hex: ["ヘクス", "呪い(ヘクス)"], elementals: ["カンジャー・マイナー・エレメンタルズ"] },
  zh: { hunter: ["猎人印记", "獵人印記"], curse: ["降咒"], hex: ["脆弱诅咒", "脆弱詛咒"], elementals: ["咒唤微元素群", "咒喚微元素群"] }
};

export const normalize = value => String(value ?? "").normalize("NFKC").normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "").normalize("NFC").toLowerCase().replace(/ł/g, "l").replace(/[^\p{L}\p{N}]/gu, "");
const aliases = new Map();
for (const language of Object.values(SPELL_NAMES)) for (const [family, names] of Object.entries(language)) {
  for (const name of names) {
    const key = normalize(name);
    if (aliases.has(key) && aliases.get(key) !== family) throw new Error(`Conflicting spell alias: ${name}`);
    aliases.set(key, family);
  }
}

export function spellFamily(value) {
  const plain = String(value ?? "").replace(/\s*[([]?\s*(2014|2024)\s*[)\]]?\s*$/, "");
  const exact = aliases.get(normalize(plain));
  if (exact) return exact;
  // Accept a bilingual title only when BOTH complete titles identify the same spell.
  const pair = plain.match(/^(.+?)\s*[([]([^()[\]]+)[)\]]$/);
  if (!pair) return null;
  const first = aliases.get(normalize(pair[1]));
  return first && first === aliases.get(normalize(pair[2])) ? first : null;
}
