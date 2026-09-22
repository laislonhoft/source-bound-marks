import test from "node:test";
import assert from "node:assert/strict";
import { ID, spellProfile, castDuration } from "../scripts/core.mjs";
import { requestFromSpell, processSpellRequest } from "../scripts/spells.mjs";

function setup(profile = "hunter2024", level = 1) {
  const user = { id: "player" };
  const activity = { id: "activity", ...(profile === "curse" ? { save: {} } : {}) };
  const concentration = { uuid: "Actor.c.ActiveEffect.conc", statuses: new Set(["concentrating"]), duration: { remaining: 100 } };
  const source = { uuid: "Actor.c", effects: new Map([["conc", concentration]]), testUserPermission: u => u.id === user.id };
  const item = { uuid: "Actor.c.Item.spell", actor: source, name: profile === "curse" ? "Bestow Curse" : "Hunter's Mark", type: "spell",
    flags: {}, system: { level, source: { rules: "2024" }, activities: new Map([[activity.id, activity]]) } };
  const token = { uuid: "Scene.s.Token.t", documentName: "Token", actor: { uuid: "Actor.t" } };
  const message = { uuid: "ChatMessage.cast", author: user, system: { spellLevel: level },
    flags: { dnd5e: { item: { uuid: item.uuid }, use: { concentrationId: "conc" } }, "midi-qol": { failedSaveUuids: [token.uuid] } },
    async setFlag(scope, key, value) { (this.flags[scope] ??= {})[key] = value; } };
  const workflow = { item, activity, chatCard: message, targets: new Set([token]), failedSaves: new Set([token]) };
  globalThis.game = { user: { id: "gm" }, users: { activeGM: { id: "gm" } }, time: { worldTime: 100 }, settings: { get: () => "hunter2024" } };
  const docs = new Map([[item.uuid, item], [token.uuid, token]]);
  globalThis.fromUuid = async uuid => docs.get(uuid);
  const confirmations = [];
  globalThis.foundry = { applications: { api: { DialogV2: { confirm: async options => { confirmations.push(options); return true; } } } } };
  const applied = [];
  const apply = async options => { applied.push(options); return { uuid: "Actor.t.ActiveEffect.mark" }; };
  return { item, token, message, workflow, source, apply, applied, confirmations, concentration };
}

test("recognizes existing spells, translations and explicit renamed configuration", () => {
  assert.equal(spellProfile({ type: "spell", name: "Marca do Caçador", system: { source: { rules: "2014" } } }), "hunter2014");
  assert.equal(spellProfile({ type: "spell", name: "Rogar Maldição" }), "curse");
  assert.equal(spellProfile({ type: "spell", name: "Beston Curse" }), "curse");
  assert.equal(spellProfile({ type: "spell", name: "Custom", flags: { [ID]: { profile: "hunter2024" } } }), "hunter2024");
  assert.equal(spellProfile({ type: "spell", name: "Hunter's Mark", flags: { [ID]: { profile: "off" } } }), null);
  assert.equal(spellProfile({ type: "weapon", name: "Hunter's Mark" }), null);
});
test("upcast durations include permanent curse", () => {
  assert.equal(castDuration("hunter2024", 3), 28800);
  assert.equal(castDuration("hunter2014", 5), 86400);
  assert.equal(castDuration("curse", 3), 60);
  assert.equal(castDuration("curse", 4), 600);
  assert.equal(castDuration("curse", 9), null);
});
test("player casting an ordinary Hunter's Mark requests and applies through the GM", async () => {
  const { workflow, message, apply, applied } = setup();
  await requestFromSpell(workflow); await processSpellRequest(message, "player", apply);
  assert.equal(applied.length, 1); assert.equal(applied[0].preset, "hunter2024");
  assert.equal(applied[0].concentrationUuid, "Actor.c.ActiveEffect.conc");
  assert.equal(applied[0].castUuid, message.uuid); assert.equal(message.flags[ID].result.applied, true);
});
test("repeated completion and message updates do not apply twice", async () => {
  const { workflow, message, apply, applied } = setup();
  await requestFromSpell(workflow); await requestFromSpell(workflow);
  await processSpellRequest(message, "player", apply); await processSpellRequest(message, "player", apply);
  assert.equal(applied.length, 1);
});
test("successful curse save produces no request or prompt", async () => {
  const { workflow, message, confirmations } = setup("curse", 3); workflow.failedSaves.clear();
  await requestFromSpell(workflow); assert.equal(message.flags[ID], undefined); assert.equal(confirmations.length, 0);
});
test("failed curse save confirms the damage option and binds concentration", async () => {
  const { workflow, message, confirmations, apply, applied } = setup("curse", 3);
  await requestFromSpell(workflow); await processSpellRequest(message, "player", apply);
  assert.equal(confirmations.length, 1); assert.equal(applied[0].seconds, 60);
  assert.equal(applied[0].concentrationUuid, "Actor.c.ActiveEffect.conc");
});
test("declining curse damage leaves the spell's other options untouched", async () => {
  const { workflow, message } = setup("curse", 3);
  foundry.applications.api.DialogV2.confirm = async () => false;
  await requestFromSpell(workflow); assert.equal(message.flags[ID], undefined);
});
test("explicit curse damage profile does not ask again; level 5 needs no concentration", async () => {
  const { workflow, item, message, confirmations, apply, applied, source } = setup("curse", 5);
  item.flags[ID] = { profile: "curse" }; source.effects.clear();
  await requestFromSpell(workflow); await processSpellRequest(message, "player", apply);
  assert.equal(confirmations.length, 0); assert.equal(applied[0].concentrationUuid, null); assert.equal(applied[0].seconds, 28800);
});
test("aborted spells and unrelated spells create nothing", async () => {
  const { workflow, message, item } = setup(); workflow.aborted = true;
  await requestFromSpell(workflow); workflow.aborted = false; item.name = "Fireball";
  await requestFromSpell(workflow); assert.equal(message.flags[ID], undefined);
});
test("no GM yields a clear error without persisting a request", async () => {
  const { workflow, message } = setup(); game.users.activeGM = null;
  await assert.rejects(() => requestFromSpell(workflow), /mestre conectado/); assert.equal(message.flags[ID], undefined);
});
test("GM rejects missing concentration, wrong author and mismatched item", async () => {
  const { workflow, message, apply, source } = setup(); await requestFromSpell(workflow);
  await assert.rejects(() => processSpellRequest(message, "impostor", apply), /autor/);
  source.effects.clear(); await assert.rejects(() => processSpellRequest(message, "player", apply), /Concentração/);
  message.flags[ID].request.itemUuid = "Actor.other.Item.spell";
  await assert.rejects(() => processSpellRequest(message, "player", apply), /corresponde/);
});
test("GM checks persisted failed save instead of trusting the requested curse", async () => {
  const { workflow, message, apply } = setup("curse", 3); await requestFromSpell(workflow);
  message.flags["midi-qol"].failedSaveUuids = [];
  await assert.rejects(() => processSpellRequest(message, "player", apply), /resistência falha/);
});
test("secondary GM does not duplicate the effect", async () => {
  const { workflow, message, apply, applied } = setup(); await requestFromSpell(workflow);
  game.user.id = "another-gm"; await processSpellRequest(message, "player", apply); assert.equal(applied.length, 0);
});
