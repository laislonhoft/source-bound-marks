import { ID, normalize } from "./core.mjs";

export const FIGHTING = {
  greatWeaponFighting: { label: "Great Weapon Fighting / Combate com Armas Grandes (2024)", names: ["Great Weapon Fighting", "Combate com Armas Grandes", "Combate com Armas Pesadas", "Luta com Armas Grandes"] },
  greatWeaponMaster: { label: "Great Weapon Master / Mestre de Armas Grandes (2024)", names: ["Great Weapon Master", "Mestre de Armas Grandes", "Mestre em Armas Grandes", "Mestre de Armas Pesadas"] },
  dueling: { label: "Dueling / Duelismo (2024)", names: ["Dueling", "Duelismo", "Duelo"] },
  thrown: { label: "Thrown Weapon Fighting / Combate com Armas de Arremesso (2024)", names: ["Thrown Weapon Fighting", "Combate com Armas de Arremesso", "Combate com Armas Arremessadas"] },
  twoWeapon: { label: "Two-Weapon Fighting / Combate com Duas Armas (2024)", names: ["Two-Weapon Fighting", "Combate com Duas Armas", "Luta com Duas Armas"] }
};
const aliases = new Map(Object.entries(FIGHTING).flatMap(([key,p]) => p.names.map(n => [normalize(n),key])));
const decisions = new WeakMap();
const warned = new WeakSet();
const hewShown = new WeakSet();
const has = (set, key) => set?.has?.(key) ?? set?.includes?.(key) ?? false;
const escape = s => String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c]);

export function fightingProfile(item) {
  if (item?.type !== "feat") return null;
  const explicit = item.flags?.[ID]?.fighting;
  if (explicit === "off") return null;
  if (FIGHTING[explicit]) return explicit;
  if (String(item.system?.source?.rules) !== "2024") return null;
  return aliases.get(normalize(item.system?.identifier)) ?? aliases.get(normalize(item.name).replace(/2024$/, "")) ?? null;
}

function hasAutomation(item, actor) {
  if (item.flags?.["midi-qol"]?.onUseMacroName || item.flags?.dnd5e?.appliedRules?.length) return true;
  const effects = [...(item.effects ?? []), ...[...(actor?.effects ?? [])].filter(e => e.origin === item.uuid)];
  return effects.some(e => !e.disabled && !e.isSuppressed
    && ((e.system?.changes ?? e.changes ?? []).some(c => /damage|onUseMacro|rollModifiers/i.test(c.key ?? "")) || e.type === "rule"));
}

export function fightingFeatures(actor) {
  const profiles = new Set();
  for (const item of actor?.items ?? []) {
    const profile = fightingProfile(item);
    if (!profile || item.system?.disabled || item.flags?.[ID]?.fightingEnabled === false) continue;
    if (hasAutomation(item, actor)) {
      if (!warned.has(item)) {
        warned.add(item);
        globalThis.ui?.notifications?.warn(`Marcas Vinculadas: ${item.name} já tem efeito ou macro. Automação de combate ignorada para evitar duplicação.`);
      }
      continue;
    }
    profiles.add(profile);
  }
  return profiles;
}

export function weaponContext(activity, mode) {
  const item = activity?.item;
  if (item?.type !== "weapon" || !activity.attack || activity.attack.type?.classification === "spell") return null;
  const properties = item.system?.properties;
  const meleeWeapon = ["simpleM", "martialM"].includes(item.system?.type?.value);
  const rangedAttack = activity.getActionType?.(mode) === "rwak" || mode?.startsWith("thrown") || mode === "ranged";
  const offhand = Boolean(mode?.endsWith("offhand"));
  const twoHands = mode === "twoHanded" || (has(properties,"two") && !rangedAttack && !offhand);
  return { item, meleeWeapon, rangedAttack, offhand, twoHands, properties };
}

export function ownTurn(workflow) {
  const combat = globalThis.game?.combat;
  if (!combat?.started) return null;
  const combatant = combat.combatant;
  const tokenId = workflow.token?.document?.id ?? workflow.token?.id;
  if (tokenId && combatant?.tokenId) return combatant.tokenId === tokenId;
  return combatant?.actor?.uuid === workflow.actor?.uuid;
}

export async function prepareFighting(workflow, activity, config) {
  config[ID] = { ...(config[ID] ?? {}), heavyAttack: false };
  if (!workflow || workflow.aborted || workflow.abort) return;
  const weapon = weaponContext(activity, workflow.attackMode);
  if (!weapon || !fightingFeatures(workflow.actor).has("greatWeaponMaster") || !has(weapon.properties,"hvy")) return;
  const activation = activity.activation?.type;
  if (weapon.offhand || (activation && activation !== "action") || ownTurn(workflow) === false) return;
  if (!decisions.has(workflow)) {
    const pending = foundry.applications.api.DialogV2.confirm({
      window: { title: "Mestre de Armas Grandes (2024)" },
      content: "<p>Este ataque com arma Pesada faz parte da <strong>ação Atacar no seu turno</strong>?</p><p>Confirme para acrescentar proficiência ao dano. Não se aplica a ataque de oportunidade, ação bônus, Cleave ou ataque feito como parte da ação Magia.</p>",
      yes: { label: "Sim: aplicar proficiência" }, no: { label: "Não aplicar" }, rejectClose: false
    });
    decisions.set(workflow, pending);
  }
  const confirmed = await decisions.get(workflow);
  // This plain data survives the system's config cloning; it is not an item mutation.
  config[ID] = { ...(config[ID] ?? {}), heavyAttack: confirmed === true && !workflow.aborted && !workflow.abort && ownTurn(workflow) !== false };
}

export function minimumWeaponDice(formula) {
  // Do not rewrite custom pools, rerolls, references or nested expressions ambiguously.
  const plain = String(formula ?? "");
  if (!/^\s*\d+d\d+(?:min\d+)?(?:\[[^\]]*\])?\s*$/i.test(plain)) return null;
  const minimum = /min(\d+)/i.exec(plain);
  if (minimum) return Number(minimum[1]) >= 3 ? plain : plain.replace(/min\d+/i,"min3");
  return plain.replace(/(\d+d\d+)/i,"$1min3");
}

export function buildFightingDamage(process, roll) {
  const activity = process.subject;
  if (!roll.base || !roll.parts?.length || !game.modules.get("midi-qol")?.active) return;
  const weapon = weaponContext(activity, process.attackMode);
  if (!weapon) return;
  const profiles = fightingFeatures(activity.actor);
  const options = roll.options ??= {};
  // Each dialog rebuild supplies fresh parts; repeated hooks on the same parts are harmless.
  const add = (key, value) => {
    const part = `@sbmFighting.${key}`;
    if (roll.parts.includes(part)) return;
    roll.data ??= {}; roll.data.sbmFighting ??= {}; roll.data.sbmFighting[key] = value;
    roll.parts.push(part);
  };
  if (profiles.has("greatWeaponFighting") && weapon.meleeWeapon && weapon.twoHands && !weapon.rangedAttack
    && (has(weapon.properties,"two") || has(weapon.properties,"ver"))) {
    const formula = minimumWeaponDice(roll.parts[0]);
    if (formula !== null) roll.parts[0] = formula;
    else if (!options[ID]?.warnedFormula) {
      ui.notifications.warn("Marcas Vinculadas: dados básicos personalizados; configure Great Weapon Fighting manualmente nesta arma.");
      options[ID] = { ...options[ID], warnedFormula: true };
    }
  }
  if (profiles.has("dueling") && weapon.meleeWeapon && !weapon.twoHands && !weapon.offhand
    && [...activity.actor.items].filter(i => i.type === "weapon" && i.system?.equipped && i.uuid !== weapon.item.uuid).length === 0) add("dueling",2);
  if (profiles.has("thrown") && weapon.rangedAttack && has(weapon.properties,"thr")) add("thrown",2);
  if (profiles.has("twoWeapon") && weapon.offhand && has(weapon.properties,"lgt") && Number(roll.data?.mod) > 0
    && !roll.parts.some(p => /@mod\b/.test(p))) roll.parts.push("@mod");
  if (profiles.has("greatWeaponMaster") && has(weapon.properties,"hvy") && !weapon.offhand && process[ID]?.heavyAttack
    && (!process.workflow || ownTurn(process.workflow) !== false)) {
    const prof = Number(activity.actor.system?.attributes?.prof);
    if (Number.isInteger(prof) && prof > 0) add("heavyWeaponMastery",prof);
  }
}

export function remindHew(workflow) {
  if (!workflow || workflow.aborted || workflow.abort || hewShown.has(workflow)) return;
  const weapon = weaponContext(workflow.activity,workflow.attackMode);
  if (!weapon?.meleeWeapon || !fightingFeatures(workflow.actor).has("greatWeaponMaster")) return;
  const hit = (workflow.hitTargets?.size ?? 0) + (workflow.hitTargetsEC?.size ?? 0) > 0;
  const dropped = (workflow.damageList ?? []).some(d => d.oldHP > 0 && d.newHP === 0 && (d.hpDamage ?? d.appliedDamage) > 0);
  if (!(workflow.isCritical && hit) && !dropped) return;
  hewShown.add(workflow);
  ui.notifications.info("Mestre de Armas Grandes — Hew: confira o crítico ou a redução do alvo a 0 PV. Você pode atacar com a mesma arma usando uma ação bônus, se ainda tiver essa ação disponível. Faça esse ataque separadamente; ele não recebe o bônus de proficiência da ação Atacar.", { permanent: true });
}

export async function configureFighting(item) {
  if (!item.isOwner) return;
  const selected = item.flags?.[ID]?.fighting ?? "auto";
  const options = { auto: "Reconhecer nome/identificador (somente itens 2024)", off: "Desativado", ...Object.fromEntries(Object.entries(FIGHTING).map(([k,v])=>[k,v.label])) };
  const data = await foundry.applications.api.DialogV2.input({
    window: { title: `Combate: ${item.name}` },
    content: `<div class="form-group"><label>Automação</label><select name="fighting">${Object.entries(options).map(([k,v])=>`<option value="${k}" ${k===selected?"selected":""}>${escape(v)}</option>`).join("")}</select></div><p>Escolha um perfil para itens traduzidos ou renomeados. Remova automações equivalentes antes de habilitar. Arquearia e Defesa usam os efeitos nativos do sistema.</p>`,
    ok: { label: "Salvar" }
  });
  if (data && (data.fighting === "auto" || data.fighting === "off" || FIGHTING[data.fighting])) await item.setFlag(ID,"fighting",data.fighting);
}

function button(app, html) {
  const item = app.document ?? app.object;
  if (item?.documentName !== "Item" || item.type !== "feat" || !item.isOwner) return;
  const root = html instanceof HTMLElement ? html : html?.[0] ?? app.element;
  const header = root?.querySelector?.(".window-header");
  if (!header || header.querySelector("[data-sbm-fighting]")) return;
  const btn = document.createElement("button"); btn.type="button"; btn.dataset.sbmFighting=""; btn.textContent="Combate";
  btn.addEventListener("click",()=>configureFighting(item).catch(e=>ui.notifications.error(e.message))); header.append(btn);
}

export function registerFighting(report) {
  Hooks.on("midi-qol.preDamageRoll", (workflow, activity, config) => prepareFighting(workflow,activity,config).catch(report));
  Hooks.on("dnd5e.postBuildDamageRollConfig", (process,roll) => { try { buildFightingDamage(process,roll); } catch(e) { report(e); } });
  Hooks.on("midi-qol.RollComplete", workflow => { try { remindHew(workflow); } catch(e) { report(e); } });
  Hooks.on("renderApplicationV2",button); Hooks.on("renderItemSheet",button);
}
