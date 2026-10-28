export const ID = "source-bound-marks";
export const PRESETS = Object.freeze({
  hunter2014: { name: "Hunter's Mark (2014)", formula: "1d6", damageType: "inherit", trigger: "weapon" },
  hunter2024: { name: "Hunter's Mark (2024)", formula: "1d6", damageType: "force", trigger: "attack" },
  curse: { name: "Bestow Curse — dano", formula: "1d8", damageType: "necrotic", trigger: "attackOrSpell" },
  hex: { name: "Hex — dano", formula: "1d6", damageType: "necrotic", trigger: "attack" }
});

export const normalize = value => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

export function spellProfile(item, defaultHunter = "hunter2024") {
  if (item?.type !== "spell") return null;
  const configured = item.flags?.[ID]?.profile;
  if (configured === "off") return null;
  if (PRESETS[configured]) return configured;
  const names = [item.name, item.system?.identifier].map(normalize);
  if (names.some(n => /^(huntersmark|marcadocacador|marcadopredador)(2014|2024)?$/.test(n))) {
    return String(item.system?.source?.rules) === "2014" || names.some(n => n.endsWith("2014")) ? "hunter2014"
      : String(item.system?.source?.rules) === "2024" || names.some(n => n.endsWith("2024")) ? "hunter2024" : defaultHunter;
  }
  if (names.some(n => ["bestowcurse", "bestoncurse", "rogarmaldicao", "lancarmaldicao", "impormaldicao"].includes(n))) return "curse";
  if (names.some(n => ["hex", "bruxaria"].includes(n))) return "hex";
  return null;
}

export function castDuration(profile, level) {
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
