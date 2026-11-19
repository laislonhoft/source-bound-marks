import { normalize, spellFamily } from "./spell-names.mjs";
export { normalize } from "./spell-names.mjs";
export const ID = "source-bound-marks";
export const PRESETS = Object.freeze({
  hunter2014: { name: "Hunter's Mark / Marca do Caçador (2014)", formula: "1d6", damageType: "inherit", trigger: "weapon" },
  hunter2024: { name: "Hunter's Mark / Marca do Predador (2024)", formula: "1d6", damageType: "force", trigger: "attack" },
  curse: { name: "Bestow Curse / Rogar Maldição — dano", formula: "1d8", damageType: "necrotic", trigger: "attackOrSpell" },
  hex: { name: "Hex / Bruxaria / Danação — dano", formula: "1d6", damageType: "necrotic", trigger: "attack" },
  minorElementals2024: { name: "Conjure Minor Elementals / Conjurar Elementais Menores (2024)", formula: "2d8", damageType: "choice", trigger: "attack" }
});

export function spellProfile(item, defaultHunter = "hunter2024") {
  if (item?.type !== "spell") return null;
  const configured = item.flags?.[ID]?.profile;
  if (configured === "off") return null;
  if (PRESETS[configured]) return configured;
  const names = [item.name, item.system?.identifier].map(normalize);
  const family = spellFamily(item.system?.identifier) ?? spellFamily(item.name);
  if (family === "hunter") {
    return String(item.system?.source?.rules) === "2014" || names.some(n => n.endsWith("2014")) ? "hunter2014"
      : String(item.system?.source?.rules) === "2024" || names.some(n => n.endsWith("2024")) ? "hunter2024" : defaultHunter;
  }
  if (family === "curse" || family === "hex") return family;
  if (family === "elementals" && String(item.system?.source?.rules) !== "2014" && !names.some(n => n.endsWith("2014"))
    && (String(item.system?.source?.rules) === "2024" || names.some(n => n.endsWith("2024")))) return "minorElementals2024";
  return null;
}

export function castDuration(profile, level) {
  if (profile === "minorElementals2024") return 600;
  if (profile === "curse") return level >= 9 ? null : level >= 7 ? 86400 : level >= 5 ? 28800 : level >= 4 ? 600 : 60;
  return level >= 5 ? 86400 : level >= 3 ? 28800 : 3600;
}

export function eligible(mark, { sourceUuid, actionType, isAttack, isSpell, now }) {
  if (mark.sourceUuid !== sourceUuid || (mark.expiresAt != null && now >= mark.expiresAt)) return false;
  if (mark.trigger === "weapon") return isAttack && ["mwak", "rwak"].includes(actionType);
  if (mark.trigger === "attack") return isAttack;
  return mark.trigger === "attackOrSpell" && (isAttack || isSpell);
}

export function validEffect(effect, now) {
  return !effect.disabled && !effect.isSuppressed
    && !(Number.isFinite(effect.duration?.remaining) && effect.duration.remaining <= 0)
    && !(effect.flags?.[ID]?.mark?.expiresAt != null && now >= effect.flags[ID].mark.expiresAt);
}

export function bonusOptions(mark, workflow) {
  const damageType = mark.damageType === "inherit" ? workflow.damageRolls?.[0]?.options?.type : mark.damageType;
  if (!damageType) throw new Error("Não foi possível determinar o tipo de dano do ataque.");
  const baseCritical = workflow.damageRolls?.[0]?.options?.critical ?? {};
  return { type: damageType, flavor: mark.name, isCritical: Boolean(workflow.isCritical && workflow.activity?.attack),
    critical: { multiplier: baseCritical.multiplier ?? 2,
      powerfulCritical: baseCritical.powerfulCritical ?? false, multiplyNumeric: false } };
}
