import test from "node:test";
import assert from "node:assert/strict";
import { ID, PRESETS, eligible, validEffect, bonusOptions } from "../scripts/core.mjs";

globalThis.Hooks = { once() {} };
const { addBonus, applyMark, cleanup } = await import("../scripts/main.mjs");
const context = { sourceUuid: "Actor.caster", actionType: "mwak", isAttack: true, isSpell: false, now: 50 };
const mark = (preset = "hunter2014", more = {}) => ({ ...PRESETS[preset], preset, sourceUuid: "Actor.caster", expiresAt: 100, ...more });
const effect = m => ({ id: "mark", flags: { [ID]: { mark: m } }, duration: { remaining: 50 } });

function setup(m = mark()) {
  const warning = [];
  globalThis.ui = { notifications: { warn: t => warning.push(t), info() {} } };
  globalThis.game = { time: { worldTime: 50 }, user: { id: "gm", isGM: true }, users: { activeGM: { id: "gm" } }, actors: [], scenes: [] };
  globalThis.fromUuid = async () => null;
  globalThis.CONFIG = { Dice: { DamageRoll: class {
    constructor(formula, data, options) { Object.assign(this, { formula, data, options }); }
    async evaluate() { this.total = this.options.isCritical ? 8 : 4; return this; }
  } } };
  const target = { document: { uuid: "Scene.s.Token.t" }, actor: { effects: [effect(m)] } };
  const workflow = { actor: { uuid: "Actor.caster", getRollData: () => ({}) }, activity: { attack: {}, actionType: "mwak" },
    item: { type: "weapon" }, targets: new Set([target]), hitTargets: new Set([target]),
    damageRolls: [{ options: { type: "slashing" } }], bonusDamageRolls: [],
    async setBonusDamageRolls(rolls) { this.bonusDamageRolls = rolls; } };
  return { workflow, target, warning };
}

test("only the mark's caster receives a bonus", () => {
  assert.equal(eligible(mark(), context), true);
  assert.equal(eligible(mark(), { ...context, sourceUuid: "Actor.other" }), false);
});
test("2014 weapon restriction and 2024 attack restriction", () => {
  assert.equal(eligible(mark(), { ...context, actionType: "msak" }), false);
  assert.equal(eligible(mark("hunter2024"), { ...context, actionType: "msak" }), true);
  assert.equal(eligible(mark("hunter2024"), { ...context, isAttack: false }), false);
});
test("curse accepts damaging spells without an attack", () => {
  assert.equal(eligible(mark("curse"), { ...context, isAttack: false, isSpell: true }), true);
  assert.equal(eligible(mark("curse"), { ...context, isAttack: false, isSpell: false }), false);
});
test("expired, disabled and suppressed marks do not qualify", () => {
  assert.equal(eligible(mark(), { ...context, now: 100 }), false);
  assert.equal(validEffect({ ...effect(mark()), disabled: true }, 50), false);
  assert.equal(validEffect({ ...effect(mark()), isSuppressed: true }, 50), false);
  assert.equal(validEffect({ ...effect(mark()), duration: { remaining: 0 } }, 50), false);
});
test("critical options use isCritical and never repeat weapon bonus dice", () => {
  const { workflow } = setup(); workflow.isCritical = true;
  workflow.damageRolls[0].options.critical = { multiplier: 2, bonusDice: 3 };
  const options = bonusOptions(mark(), workflow);
  assert.equal(options.isCritical, true); assert.equal(options.type, "slashing");
  assert.equal(options.critical.bonusDice, undefined);
});
test("hit appends bonus while preserving third-party bonuses", async () => {
  const { workflow } = setup(); const other = { options: { type: "fire" } };
  workflow.bonusDamageRolls = [other]; await addBonus(workflow);
  assert.equal(workflow.bonusDamageRolls.length, 2); assert.equal(workflow.bonusDamageRolls[0], other);
  assert.equal(workflow.bonusDamageRolls[1].formula, "1d6");
});
test("misses and fumbles do not add damage", async () => {
  const { workflow } = setup(); workflow.hitTargets.clear(); await addBonus(workflow);
  assert.equal(workflow.bonusDamageRolls.length, 0);
  workflow.isFumble = true; await addBonus(workflow); assert.equal(workflow.bonusDamageRolls.length, 0);
});
test("other attackers do not receive the bonus", async () => {
  const { workflow } = setup(); workflow.actor.uuid = "Actor.other"; await addBonus(workflow);
  assert.equal(workflow.bonusDamageRolls.length, 0);
});
test("lost concentration immediately suppresses bonus", async () => {
  const { workflow } = setup(mark("hunter2024", { concentrationUuid: "Actor.caster.ActiveEffect.c" }));
  await addBonus(workflow); assert.equal(workflow.bonusDamageRolls.length, 0);
});
test("active concentration enables bonus", async () => {
  const { workflow } = setup(mark("hunter2024", { concentrationUuid: "c" }));
  globalThis.fromUuid = async () => ({ statuses: new Set(["concentrating"]), duration: { remaining: 30 } });
  await addBonus(workflow); assert.equal(workflow.bonusDamageRolls[0].options.type, "force");
});
test("repeated hook is idempotent; damage reroll replaces only our bonus", async () => {
  const { workflow } = setup(); await addBonus(workflow); const first = workflow.bonusDamageRolls[0];
  await addBonus(workflow); assert.equal(workflow.bonusDamageRolls.length, 1);
  assert.equal(workflow.bonusDamageRolls[0], first);
  workflow.damageRolls = [{ options: { type: "piercing" } }]; await addBonus(workflow);
  assert.equal(workflow.bonusDamageRolls.length, 1); assert.notEqual(workflow.bonusDamageRolls[0], first);
});
test("multiple targets do not leak marked damage to unmarked actors", async () => {
  const { workflow, warning } = setup(); workflow.targets.add({ actor: { effects: [] } });
  await addBonus(workflow); assert.equal(workflow.bonusDamageRolls.length, 0); assert.equal(warning.length, 1);
});
test("healing spells never trigger curse damage", async () => {
  const { workflow } = setup(mark("curse")); workflow.item.type = "spell";
  workflow.activity = { actionType: "heal" }; workflow.damageRolls = [{ options: { type: "healing" } }];
  await addBonus(workflow); assert.equal(workflow.bonusDamageRolls.length, 0);
});
test("players cannot directly create marks", async () => {
  setup(); game.user.isGM = false;
  await assert.rejects(() => applyMark({}), /mestre/);
});
test("cleanup removes missing concentration across synthetic actors", async () => {
  setup(); const deleted = [];
  const actor = { uuid: "Scene.s.Token.t.Actor.a", effects: [effect(mark("curse", { concentrationUuid: "gone" }))],
    async deleteEmbeddedDocuments(type, ids) { deleted.push(...ids); } };
  game.scenes = [{ tokens: [{ actor }] }]; await cleanup(); assert.deepEqual(deleted, ["mark"]);
  deleted.length = 0; game.user.id = "other-gm"; await cleanup(); assert.equal(deleted.length, 0);
});
test("creation validates concentration belongs to the caster", async () => {
  setup(); globalThis.fromUuid = async () => ({ parent: { uuid: "Actor.other" } });
  await assert.rejects(() => applyMark({ source: { uuid: "Actor.caster" }, target: {}, preset: "curse", concentrationUuid: "c" }), /concentração/);
});

test("permanent curse uses v14 effect fields and survives cleanup", async () => {
  setup(); let created;
  const source = { uuid: "Actor.caster", name: "Caster", effects: [] };
  const target = { uuid: "Actor.target", name: "Target", effects: [],
    async createEmbeddedDocuments(type, data) { created = { ...data[0], uuid: "effect.uuid" }; this.effects.push(created); return [created]; },
    async deleteEmbeddedDocuments() { assert.fail("Permanent curse must not expire"); } };
  game.actors = [source, target];
  await applyMark({ source, target, preset: "curse", seconds: null, castUuid: "ChatMessage.cast" });
  assert.deepEqual(created.duration, {}); assert.equal(created.start.time, 50);
  assert.equal(created.showIcon, 2); assert.equal(created.flags[ID].mark.expiresAt, null);
  await cleanup();
  const duplicate = await applyMark({ source, target, preset: "curse", seconds: null, castUuid: "ChatMessage.cast" });
  assert.equal(duplicate, created); assert.equal(target.effects.length, 1);
});

test("transfer retains original expiration and replaces old mark only after creation", async () => {
  setup(); const operations = []; let created;
  const source = { uuid: "Actor.caster", name: "Caster", effects: [] };
  const old = { ...effect(mark("hunter2024", { concentrationUuid: "conc", expiresAt: 80 })),
    async delete() { operations.push("delete"); } };
  const previous = { uuid: "Actor.old", effects: [old] };
  const target = { uuid: "Actor.target", name: "Target", effects: [],
    async createEmbeddedDocuments(type, data) { operations.push("create"); created = data[0]; return [created]; } };
  game.actors = [source, previous, target];
  globalThis.fromUuid = async () => ({ parent: source, statuses: new Set(["concentrating"]), duration: { remaining: 100 } });
  await applyMark({ source, target, preset: "hunter2024", concentrationUuid: "conc", seconds: 3600 });
  assert.deepEqual(operations, ["create", "delete"]);
  assert.equal(created.duration.value, 30); assert.equal(created.duration.units, "seconds");
  assert.equal(created.flags[ID].mark.expiresAt, 80);
});
