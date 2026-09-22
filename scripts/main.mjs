import { ID, PRESETS, eligible, validEffect, bonusOptions } from "./core.mjs";
import { registerAutomatic, initializeSettings } from "./spells.mjs";

const escape = value => String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const report = error => { console.error(ID, error); ui.notifications.error(`Marcas Vinculadas: ${error.message}`); };
const activeGM = () => game.users.activeGM?.id === game.user.id;
const seen = new WeakMap();

function allActors() {
  const actors = new Map(game.actors.map(a => [a.uuid, a]));
  for (const scene of game.scenes) for (const token of scene.tokens) {
    if (token.actor) actors.set(token.actor.uuid, token.actor);
  }
  return [...actors.values()];
}

async function concentrationAlive(uuid) {
  if (!uuid) return true;
  const effect = await fromUuid(uuid);
  return Boolean(effect && validEffect(effect, game.time.worldTime) && effect.statuses?.has("concentrating"));
}

export async function addBonus(workflow) {
  if (!workflow.actor || workflow.isFumble || !workflow.damageRolls?.length) return;
  if (workflow.activity?.actionType === "heal" || workflow.damageRolls.every(r => ["healing", "temphp"].includes(r.options?.type))) return;
  const targets = [...(workflow.targets ?? [])];
  const isAttack = Boolean(workflow.activity?.attack);
  const hits = new Set([...(workflow.hitTargets ?? []), ...(workflow.hitTargetsEC ?? [])].map(t => t.document?.uuid ?? t.uuid));
  const context = {
    sourceUuid: workflow.actor.uuid, actionType: workflow.activity?.actionType,
    isAttack, isSpell: workflow.item?.type === "spell", now: game.time.worldTime
  };
  const matches = [];
  for (const target of targets) {
    if (isAttack && !hits.has(target.document?.uuid ?? target.uuid)) continue;
    for (const effect of target.actor?.effects ?? []) {
      const mark = effect.flags?.[ID]?.mark;
      if (!mark || !validEffect(effect, context.now) || !eligible(mark, context)) continue;
      if (await concentrationAlive(mark.concentrationUuid)) matches.push({ effect, mark });
    }
  }
  if (!matches.length) return;
  if (targets.length !== 1) {
    ui.notifications.warn("Marcas Vinculadas: faça uma rolagem por alvo para incluir o bônus da marca.");
    return;
  }
  // Key by the original evaluated damage rolls. Repeated hooks do not duplicate a bonus;
  // a new damage roll in the same workflow recomputes it.
  const previous = seen.get(workflow);
  const baseRolls = workflow.damageRolls;
  if (previous?.baseRolls === baseRolls) return;
  const state = { baseRolls, rolls: [] };
  seen.set(workflow, state);
  try {
    const existing = (workflow.bonusDamageRolls ?? []).filter(r => !r.options?.[ID]);
    for (const { mark } of matches) {
      const options = bonusOptions(mark, workflow);
      options[ID] = true;
      const roll = new CONFIG.Dice.DamageRoll(mark.formula, workflow.actor.getRollData(), options);
      await roll.evaluate();
      state.rolls.push(roll);
    }
    await workflow.setBonusDamageRolls([...existing, ...state.rolls]);
  } catch (error) {
    seen.delete(workflow);
    throw error;
  }
}

export async function applyMark({ source, target, preset, concentrationUuid = null, seconds = 3600, castUuid = null }) {
  if (!game.user.isGM) throw new Error("O mestre deve aplicar ou transferir as marcas.");
  if (!source || !target || !PRESETS[preset]) throw new Error("Origem, alvo ou perfil inválido.");
  if (seconds !== null) seconds = Number(seconds);
  if (seconds !== null && (!Number.isFinite(seconds) || seconds <= 0)) throw new Error("Informe uma duração positiva em segundos.");
  if (castUuid) {
    const existing = [...target.effects].find(e => e.flags?.[ID]?.mark?.castUuid === castUuid);
    if (existing) return existing;
  }
  if (concentrationUuid) {
    const concentration = await fromUuid(concentrationUuid);
    if (concentration?.parent?.uuid !== source.uuid || !await concentrationAlive(concentrationUuid)) {
      throw new Error("Selecione uma concentração ativa do causador da marca.");
    }
  }
  const mark = { ...PRESETS[preset], preset, sourceUuid: source.uuid, concentrationUuid, castUuid,
    expiresAt: seconds === null ? null : game.time.worldTime + seconds };
  const old = allActors().flatMap(actor => [...actor.effects].filter(e => {
    const m = e.flags?.[ID]?.mark;
    return m?.sourceUuid === source.uuid && m.preset === preset;
  }));
  if (concentrationUuid && preset !== "curse") {
    const previous = old.map(e => e.flags[ID].mark).find(m => m.concentrationUuid === concentrationUuid);
    if (previous?.expiresAt != null) {
      mark.expiresAt = Math.min(mark.expiresAt, previous.expiresAt);
      seconds = mark.expiresAt - game.time.worldTime;
      if (seconds <= 0) throw new Error("A marca anterior já expirou; lance a magia novamente.");
    }
  }
  const [effect] = await target.createEmbeddedDocuments("ActiveEffect", [{
    name: `${mark.name} • ${source.name}`, img: "icons/svg/target.svg",
    origin: source.uuid, transfer: false, disabled: false, showIcon: 2,
    duration: seconds === null ? {} : { value: seconds, units: "seconds" }, start: { time: game.time.worldTime },
    flags: { [ID]: { mark } }
  }]);
  // Only remove the old mark after the replacement exists.
  for (const prior of old) await prior.delete();
  ui.notifications.info(`Marca aplicada: ${target.name}.`);
  return effect;
}

export async function cleanup() {
  if (!activeGM()) return;
  for (const actor of allActors()) {
    const ids = [];
    for (const effect of actor.effects) {
      const mark = effect.flags?.[ID]?.mark;
      if (!mark) continue;
      if ((mark.expiresAt != null && game.time.worldTime >= mark.expiresAt) || !await concentrationAlive(mark.concentrationUuid)) ids.push(effect.id);
    }
    if (ids.length) await actor.deleteEmbeddedDocuments("ActiveEffect", ids);
  }
}

let cleanupPending = false;
function scheduleCleanup() {
  if (cleanupPending || !activeGM()) return;
  cleanupPending = true;
  setTimeout(() => { cleanupPending = false; cleanup().catch(report); }, 100);
}

export async function openMenu() {
  if (!game.user.isGM) throw new Error("Peça ao mestre para aplicar a marca. O dano dos jogadores funciona automaticamente.");
  const selected = canvas.tokens.controlled;
  const targets = [...game.user.targets];
  if (selected.length !== 1 || targets.length !== 1) throw new Error("Selecione o token do conjurador e marque exatamente um alvo (tecla T).");
  const source = selected[0].actor, target = targets[0].actor;
  if (!source || !target) throw new Error("Os dois tokens precisam ter atores.");
  const concentrations = [...source.effects].filter(e => e.statuses.has("concentrating") && validEffect(e, game.time.worldTime));
  const data = await foundry.applications.api.DialogV2.input({
    window: { title: "Aplicar / transferir marca" },
    content: `<p><strong>${escape(source.name)}</strong> → <strong>${escape(target.name)}</strong></p>
      <div class="form-group"><label>Perfil</label><select name="preset">${Object.entries(PRESETS).map(([key,p]) => `<option value="${key}">${escape(p.name)}</option>`).join("")}</select></div>
      <div class="form-group"><label>Concentração</label><select name="concentrationUuid">${concentrations.map(e => `<option value="${escape(e.uuid)}">${escape(e.name)}</option>`).join("")}<option value="">Sem concentração</option></select></div>
      <div class="form-group"><label>Duração restante (segundos)</label><input name="seconds" type="number" min="1" value="3600" required></div>
      <p>Lance a magia antes de aplicar a marca. Escolha a concentração correspondente. Confirme resistências, alcance e recursos pela magia original.</p>
      <p>Este perfil substitui a marca anterior do mesmo tipo e conjurador. Ao transferir, informe a duração restante.</p>`,
    ok: { label: "Aplicar marca" }
  });
  if (data) return applyMark({ source, target, ...data });
}

Hooks.once("init", initializeSettings);
Hooks.once("ready", () => {
  const module = game.modules.get(ID);
  module.api = { openMenu: () => openMenu().catch(report), applyMark, cleanup, presets: PRESETS };
  if (game.system.id !== "dnd5e" || !game.modules.get("midi-qol")?.active) {
    ui.notifications.error("Marcas Vinculadas requer D&D 5e e Midi-QOL ativo.");
    return;
  }
  Hooks.on("midi-qol.DamageRollComplete", workflow => addBonus(workflow).catch(report));
  registerAutomatic({ applyMark, report });
  Hooks.on("deleteActiveEffect", scheduleCleanup);
  Hooks.on("updateActiveEffect", scheduleCleanup);
  Hooks.on("updateWorldTime", scheduleCleanup);
  Hooks.on("updateUser", scheduleCleanup);
  scheduleCleanup();
});
