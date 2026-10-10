// D&D 5e 6 moved usage-card metadata from flags.dnd5e to message.system.
// Prefer present modern fields even when empty: legacy flags may be stale.
export function cardValue(message, modern, legacy) {
  return modern in (message.system ?? {}) ? message.system[modern] : legacy;
}

export async function cardItem(message) {
  const reference = cardValue(message, "item", message.flags?.dnd5e?.item);
  const item = message.getAssociatedItem?.() ?? (reference?.uuid ? await fromUuid(reference.uuid) : null);
  if (reference?.uuid && item?.uuid !== reference.uuid) return null;
  return item;
}

export function cardActivity(message, item) {
  const reference = cardValue(message, "activity", message.flags?.dnd5e?.activity);
  return message.getAssociatedActivity?.() ?? item.system.activities.get(reference?.id);
}

export function cardConcentrationId(message) {
  return cardValue(message, "concentration", message.flags?.dnd5e?.use?.concentrationId);
}

export function cardLevel(message, item) {
  return Number(cardValue(message, "level", message.system?.spellLevel ?? message.flags?.dnd5e?.use?.spellLevel ?? item.system.level));
}

export function recordedTarget(message, uuid) {
  const targets = message.system?.targets;
  return Array.isArray(targets) ? targets.find(t => t.token === uuid) : undefined;
}

export function failedCardSave(message, uuid) {
  // Midi 14.6.0 still persists failedSaveUuids; do not override an explicit
  // empty list using a potentially stale target descriptor.
  const failed = message.flags?.["midi-qol"]?.failedSaveUuids;
  const saved = message.flags?.["midi-qol"]?.saveUuids;
  if (saved?.includes(uuid) || recordedTarget(message, uuid)?.saved === true) return false;
  if (Array.isArray(failed)) return failed.includes(uuid);
  return recordedTarget(message, uuid)?.saved === false;
}
