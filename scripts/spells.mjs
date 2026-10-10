import { ID, PRESETS, spellProfile, castDuration, validEffect } from "./core.mjs";
import { cardItem, cardActivity, cardConcentrationId, cardLevel, recordedTarget, failedCardSave } from "./compat.mjs";

const uuidOf = token => token.document?.uuid ?? token.uuid;
const profileOf = item => spellProfile(item, game.settings.get(ID, "hunterDefault"));
const completed = new WeakSet();
const escape = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function initializeSettings() {
  game.settings.register(ID, "hunterDefault", {
    name: "Hunter's Mark: edição padrão", hint: "Usada quando a magia não informa 2014 ou 2024.",
    scope: "world", config: true, type: String, default: "hunter2024",
    choices: { hunter2014: "2014 — ataques com arma", hunter2024: "2024 — ataques; dano de força" }
  });
}

export async function requestFromSpell(workflow) {
  if (workflow.aborted || workflow.abort || completed.has(workflow)) return;
  const profile = profileOf(workflow.item);
  if (!profile) return;
  const targets = [...(workflow.targets ?? [])];
  if (targets.length !== 1) throw new Error("Selecione um único alvo antes de lançar a magia de marca.");
  const targetUuid = uuidOf(targets[0]);
  if (workflow.activity?.save && ![...(workflow.failedSaves ?? [])].some(t => uuidOf(t) === targetUuid)) return;
  // A curse must resolve its saving throw before its damage option can be applied.
  if (profile === "curse" && !workflow.activity?.save) throw new Error("Bestow Curse precisa usar uma atividade com teste de resistência no Midi-QOL.");
  const message = workflow.chatCard;
  if (!message?.uuid) throw new Error("A magia precisa gerar uma mensagem de uso no chat.");
  if (message.flags?.[ID]?.result || message.flags?.[ID]?.request) return;
  if (!game.users.activeGM) throw new Error("É necessário um mestre conectado para aplicar a marca ao alvo.");
  completed.add(workflow);
  try {
    if (profile === "curse" && workflow.item.flags?.[ID]?.profile !== "curse") {
      const confirmed = await foundry.applications.api.DialogV2.confirm({
        window: { title: "Bestow Curse: opção da maldição" },
        content: "<p>O alvo falhou na resistência. Você escolheu a opção que acrescenta <strong>1d8 de dano necrótico</strong> aos seus ataques e magias?</p>",
        yes: { label: "Sim, aplicar dano adicional" }, no: { label: "Não, outra opção" }, rejectClose: false
      });
      if (!confirmed) return;
    }
    await message.setFlag(ID, "request", {
      targetUuid, itemUuid: workflow.item.uuid, profile,
      failedSave: Boolean(workflow.activity?.save), activityId: workflow.activity?.id,
      requestedAt: game.time.worldTime
    });
  } catch (error) { completed.delete(workflow); throw error; }
}

// The request lives on the actual usage message. The GM re-resolves all documents,
// profiles, cast level and concentration instead of accepting effect data over a socket.
export async function processSpellRequest(message, userId, applyMark) {
  if (game.users.activeGM?.id !== game.user.id || message.flags?.[ID]?.result) return;
  const request = message.flags?.[ID]?.request;
  if (!request) return;
  const author = message.author ?? message.user;
  if (!author || (author.id !== userId && !game.users.get?.(userId)?.isGM)) throw new Error("A solicitação deve vir do autor da magia ou do mestre.");
  const item = await cardItem(message);
  if (!item || item.uuid !== request.itemUuid) throw new Error("A magia não corresponde à mensagem de uso.");
  const source = item?.actor;
  if (!source || !source.testUserPermission(author, "OWNER")) throw new Error("O autor não controla o conjurador.");
  const profile = profileOf(item);
  if (!profile || profile !== request.profile) throw new Error("O perfil da magia mudou ou está desativado.");
  const activity = cardActivity(message, item);
  if (!activity || activity.id !== request.activityId || (activity.item && activity.item.uuid !== item.uuid)) throw new Error("Atividade da magia não corresponde à mensagem de uso.");
  if (Array.isArray(message.system?.targets) && !recordedTarget(message, request.targetUuid)) {
    throw new Error("O alvo não está registrado na mensagem da magia.");
  }
  if (profile === "curse" && !activity.save) throw new Error("A maldição não tem teste de resistência configurado.");
  if (activity.save) {
    if (!request.failedSave || !failedCardSave(message, request.targetUuid)) {
      throw new Error("Não há uma resistência falha registrada para esse alvo.");
    }
  }
  const token = await fromUuid(request.targetUuid);
  if (token?.documentName !== "Token" || !token.actor) throw new Error("Alvo da magia não encontrado.");
  const level = cardLevel(message, item);
  if (!Number.isInteger(level) || level < 1 || level > 9) throw new Error("Nível de conjuração inválido.");
  let concentrationUuid = null;
  const needsConcentration = profile !== "curse" || level < 5;
  if (needsConcentration) {
    const concentrationId = cardConcentrationId(message);
    const concentration = source.effects.get(concentrationId);
    if (!concentration?.statuses?.has("concentrating") || !validEffect(concentration, game.time.worldTime)) {
      throw new Error("Concentração da magia não encontrada. Ative a concentração ao lançar e tente novamente.");
    }
    concentrationUuid = concentration.uuid;
  }
  let seconds = castDuration(profile, level);
  // Account for any time that passed while the GM processed the message.
  const age = Math.max(0, game.time.worldTime - request.requestedAt);
  if (!Number.isFinite(age)) throw new Error("Tempo de conjuração inválido.");
  if (seconds !== null) seconds -= age;
  if (seconds !== null && seconds <= 0) throw new Error("A duração dessa magia já terminou.");
  const effect = await applyMark({ source, target: token.actor, preset: profile, concentrationUuid, seconds, castUuid: message.uuid });
  await message.setFlag(ID, "result", { effectUuid: effect.uuid, applied: true });
}

export async function configureSpell(item) {
  if (!item.isOwner) return;
  const selected = item.flags?.[ID]?.profile ?? "auto";
  const options = { auto: "Reconhecer pelo nome / identificador", off: "Desativado", ...Object.fromEntries(Object.entries(PRESETS).map(([k,p]) => [k,p.name])) };
  const data = await foundry.applications.api.DialogV2.input({
    window: { title: `Marca: ${item.name}` },
    content: `<div class="form-group"><label>Automação ao usar a magia</label><select name="profile">${Object.entries(options).map(([key,name]) => `<option value="${key}" ${key === selected ? "selected" : ""}>${escape(name)}</option>`).join("")}</select></div><p>Bestow Curse configurado explicitamente como dano aplica essa opção sem perguntar. No modo automático, a opção é confirmada após a resistência falhar.</p>`,
    ok: { label: "Salvar" }
  });
  if (data) await item.setFlag(ID, "profile", data.profile);
}

function addSpellButton(app, html) {
  const item = app.document ?? app.object;
  if (item?.documentName !== "Item" || item.type !== "spell" || !item.isOwner) return;
  const root = html instanceof HTMLElement ? html : html?.[0] ?? app.element;
  const header = root?.querySelector?.(".window-header");
  if (!header || header.querySelector(`[data-${ID}]`)) return;
  const button = document.createElement("button");
  button.type = "button"; button.setAttribute(`data-${ID}`, "");
  button.title = "Configurar marca automática"; button.textContent = "Marca";
  button.addEventListener("click", () => configureSpell(item).catch(error => ui.notifications.error(error.message)));
  header.append(button);
}

export function registerAutomatic({ applyMark, report }) {
  let queue = Promise.resolve();
  Hooks.on("midi-qol.RollComplete", workflow => requestFromSpell(workflow).catch(report));
  Hooks.on("updateChatMessage", (message, changes, options, userId) => {
    const requested = changes.flags?.[ID]?.request ?? changes[`flags.${ID}.request`];
    if (!requested) return; // Ignore Midi's unrelated chat updates and our result write.
    if (game.users.activeGM?.id !== game.user.id || !message.flags?.[ID]?.request || message.flags?.[ID]?.result) return;
    queue = queue.then(() => processSpellRequest(message, userId, applyMark)).catch(report);
  });
  Hooks.on("renderApplicationV2", addSpellButton);
  Hooks.on("renderItemSheet", addSpellButton);
}
