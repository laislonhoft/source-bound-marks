import test from "node:test";
import assert from "node:assert/strict";
import { SPELL_NAMES, normalize } from "../scripts/spell-names.mjs";
import { spellProfile, ID } from "../scripts/core.mjs";
const spell = (name, rules = "2024") => ({ type: "spell", name, system: { source: { rules } } });
for (const [language, families] of Object.entries(SPELL_NAMES)) {
  test(`${language}: all four families, identifiers, accents and editions`, () => {
    for (const [family, names] of Object.entries(families)) for (const name of names) {
      const expected = { hunter: "hunter2024", curse: "curse", hex: "hex", elementals: "minorElementals2024" }[family];
      assert.equal(spellProfile(spell(name)), expected, name);
      assert.equal(spellProfile(spell(name.toUpperCase().normalize("NFD"))), expected, name);
      assert.equal(spellProfile({ ...spell("Renamed"), system: { identifier: name.replaceAll(" ", "-"), source: { rules: "2024" } } }), expected);
      assert.equal(spellProfile(spell(`${name} (2024)`, undefined)), expected);
      if (family === "elementals") assert.equal(spellProfile(spell(name, "2014")), null);
      if (family === "hunter") assert.equal(spellProfile(spell(name, "2014")), "hunter2014");
    }
  });
}
test("Unicode stays meaningful; unrelated spells cannot match substrings", () => {
  assert.notEqual(normalize("Сглаз"), ""); assert.notEqual(normalize("降咒"), "");
  for (const name of ["", "???", "未知", "Remove Curse", "Hexblade", "Greater Hunter's Mark", "Délivrance des malédictions", "Conjure Elemental"]) {
    assert.equal(spellProfile(spell(name)), null, name);
  }
  assert.equal(Object.keys(SPELL_NAMES).length, 10);
});
test("bilingual titles require matching families and explicit configuration wins", () => {
  assert.equal(spellProfile(spell("Сглаз [Hex]")), "hex");
  assert.equal(spellProfile(spell("Marca do Predador (Hunter's Mark)")), "hunter2024");
  assert.equal(spellProfile(spell("Fireball [Hex]")), null);
  assert.equal(spellProfile({ ...spell("Сглаз"), flags: { [ID]: { profile: "off" } } }), null);
});
test("elementals requires known 2024 rules or explicit opt-in", () => {
  assert.equal(spellProfile({ type: "spell", name: "Conjure Minor Elementals" }), null);
  assert.equal(spellProfile(spell("Conjure Minor Elementals (2024)", "2014")), null);
  assert.equal(spellProfile({ type: "spell", name: "Conjure Minor Elementals (2024)" }), "minorElementals2024");
  assert.equal(spellProfile({ type: "spell", name: "Custom", flags: { [ID]: { profile: "minorElementals2024" } } }), "minorElementals2024");
});
