export const ELEMENTALS = "minorElementals2024";
export function elementalFormula(level) {
  if (!Number.isInteger(level) || level < 4 || level > 9) throw new Error("Elementais Menores requer nível de conjuração entre 4 e 9.");
  return `${level - 2}d8`;
}

export function withinEmanation(workflow, target) {
  const source = workflow.token?.object ?? workflow.token;
  const destination = target?.object ?? target;
  const sourceDoc = source?.document ?? source;
  const targetDoc = destination?.document ?? destination;
  const scene = sourceDoc?.parent;
  if (!scene?.uuid || scene.uuid !== targetDoc?.parent?.uuid || source?.actor?.uuid !== workflow.actor?.uuid
    || !globalThis.MidiQOL?.getDistance) throw new Error("Elementais Menores: não foi possível medir a emanação. Use tokens na mesma cena.");
  // Midi returns distances in scene units. Never interpret an arbitrary grid unit as feet.
  const units = String(scene.grid?.units ?? "").toLowerCase().trim();
  let range;
  if (["ft", "feet", "foot", "pés", "pes"].includes(units)) range = 15;
  else if (["m", "meter", "meters", "metro", "metros"].includes(units)) range = 4.5;
  else throw new Error("Elementais Menores: configure a unidade da cena como ft ou m para medir o alcance.");
  const distance = MidiQOL.getDistance(source, destination, { wallsBlock: true, includeCover: false, includeElevation: true });
  if (!Number.isFinite(distance)) throw new Error("Elementais Menores: distância indisponível.");
  return distance >= 0 && distance <= range + 1e-8;
}

export async function chooseElement() {
  const data = await foundry.applications.api.DialogV2.input({
    window: { title: "Elementais Menores: dano deste ataque" },
    content: '<div class="form-group"><label>Tipo de dano</label><select name="damageType"><option value="acid">Ácido</option><option value="cold">Frio</option><option value="fire">Fogo</option><option value="lightning">Elétrico</option></select></div>',
    ok: { label: "Adicionar dano" }, rejectClose: false
  });
  return ["acid", "cold", "fire", "lightning"].includes(data?.damageType) ? data.damageType : null;
}
