import test from "node:test";
import assert from "node:assert/strict";
import { ID, PRESETS, castDuration } from "../scripts/core.mjs";
import { ELEMENTALS, elementalFormula, withinEmanation } from "../scripts/elementals.mjs";
globalThis.Hooks = { once() {} };
const { addBonus, applyMark } = await import("../scripts/main.mjs");
function setup(distance = 15, units = "ft") {
  const scene = { uuid: "Scene.s", grid: { units } };
  const mark = { ...PRESETS[ELEMENTALS], preset: ELEMENTALS, formula: "3d8", sourceUuid: "Actor.a", concentrationUuid: "conc", expiresAt: 600 };
  const effect = { flags: { [ID]: { mark } } };
  const actor = { uuid: "Actor.a", name: "Caster", effects: [effect], getRollData: () => ({}) };
  const token = { actor, document: { uuid: "Scene.s.Token.c", parent: scene } };
  const target = { actor: { effects: [] }, document: { uuid: "Scene.s.Token.t", parent: scene } };
  const concentration = { parent: actor, statuses: new Set(["concentrating"]) };
  globalThis.fromUuid = async () => concentration;
  globalThis.game = { time: { worldTime: 0 }, user: { id: "gm", isGM: true }, users: { activeGM: { id: "gm" } }, actors: [actor], scenes: [] };
  globalThis.ui = { notifications: { warn() {}, info() {} } };
  globalThis.MidiQOL = { configSettings: () => ({ autoCheckHit: "all" }), getDistance: (s,t,options) => {
    assert.equal(s, token); assert.equal(t, target); assert.equal(options.includeElevation, true); assert.equal(options.wallsBlock, true); return distance;
  } };
  globalThis.CONFIG = { Dice: { DamageRoll: class {
    constructor(formula, data, options) { Object.assign(this, { formula, options }); }
    async evaluate() { return this; }
  } } };
  let prompts = 0;
  globalThis.foundry = { applications: { api: { DialogV2: { input: async () => { prompts++; return { damageType: "cold" }; } } } } };
  const workflow = { actor, token, item: { type: "weapon" }, activity: { attack: {}, actionType: "mwak" },
    targets: new Set([target]), hitTargets: new Set([target]), damageRolls: [{ options: { type: "slashing" } }], bonusDamageRolls: [],
    async setBonusDamageRolls(rolls) { this.bonusDamageRolls = rolls; } };
  return { workflow, actor, target, effect, concentration, prompts: () => prompts };
}
test("errata scaling, fixed 10-minute duration and valid slots", () => {
  for (let level=4; level<=9; level++) { assert.equal(elementalFormula(level), `${level-2}d8`); assert.equal(castDuration(ELEMENTALS,level),600); }
  for (const level of [null,3,10,4.5,"4"]) assert.throws(() => elementalFormula(level));
});
for (const [distance, units, qualifies] of [[15,"ft",true],[15.1,"ft",false],[4.5,"m",true],[4.6,"m",false],[-1,"ft",false]]) {
  test(`emanation: ${distance} ${units}`, async () => {
    const { workflow, prompts } = setup(distance,units); await addBonus(workflow);
    assert.equal(workflow.bonusDamageRolls.length, qualifies ? 1 : 0); assert.equal(prompts(), qualifies ? 1 : 0);
  });
}
test("choice, critical, third-party bonuses, duplicate hooks and rerolls", async () => {
  const { workflow, prompts } = setup(); workflow.isCritical = true;
  const thirdParty = { options: {} }; workflow.bonusDamageRolls = [thirdParty];
  await addBonus(workflow); await addBonus(workflow);
  assert.equal(prompts(),1); assert.equal(workflow.bonusDamageRolls[0],thirdParty);
  assert.equal(workflow.bonusDamageRolls[1].formula,"3d8"); assert.equal(workflow.bonusDamageRolls[1].options.type,"cold");
  assert.equal(workflow.bonusDamageRolls[1].options.isCritical,true);
  workflow.damageRolls = [{ options: { type: "piercing" } }]; await addBonus(workflow);
  assert.equal(prompts(),2); assert.equal(workflow.bonusDamageRolls.length,2);
});
for (const mode of ["miss","nonattack","othercaster","concentration","disabled","cancel","losesConcentration","movesAway","multitarget","onTarget"]) {
  test(`elementals skips ${mode}`, async () => {
    const { workflow, target, effect, concentration } = setup();
    if (mode === "miss") workflow.hitTargets.clear();
    if (mode === "nonattack") delete workflow.activity.attack;
    if (mode === "othercaster") workflow.actor.uuid = "Actor.other";
    if (mode === "concentration") concentration.statuses.clear();
    if (mode === "disabled") effect.disabled = true;
    if (mode === "cancel") foundry.applications.api.DialogV2.input = async () => null;
    if (mode === "losesConcentration") foundry.applications.api.DialogV2.input = async () => { concentration.statuses.clear(); return {damageType:"fire"}; };
    if (mode === "movesAway") foundry.applications.api.DialogV2.input = async () => { MidiQOL.getDistance = () => 30; return {damageType:"fire"}; };
    if (mode === "multitarget") workflow.targets.add({document:{uuid:"other"},actor:{effects:[]}});
    if (mode === "onTarget") { workflow.actor.effects = []; target.actor.effects.push(effect); }
    await addBonus(workflow); assert.equal(workflow.bonusDamageRolls.length,0);
  });
}
test("unknown units, absent source and cross-scene attacks fail clearly", () => {
  let {workflow,target} = setup(3,"squares"); assert.throws(()=>withinEmanation(workflow,target),/unidade/);
  ({workflow,target}=setup()); target.document.parent={uuid:"Scene.other"}; assert.throws(()=>withinEmanation(workflow,target),/mesma cena/);
  ({workflow,target}=setup()); delete workflow.token; assert.throws(()=>withinEmanation(workflow,target),/tokens/);
});
test("self effect requires concentration and level, caps duration and stores scaled dice", async () => {
  const {actor} = setup(); actor.effects=[]; let created;
  actor.createEmbeddedDocuments = async (type, data) => { created = data[0]; return [created]; };
  await assert.rejects(()=>applyMark({source:actor,target:{uuid:"other"},preset:ELEMENTALS,level:4,concentrationUuid:"conc"}),/próprio/);
  await assert.rejects(()=>applyMark({source:actor,target:actor,preset:ELEMENTALS,level:4}),/concentração/);
  await applyMark({source:actor,target:actor,preset:ELEMENTALS,level:9,concentrationUuid:"conc"});
  assert.equal(created.flags[ID].mark.formula,"7d8"); assert.equal(created.duration.value,600);
});
