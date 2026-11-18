(function () {
  "use strict";
  const store = window.EloData;
  const shell = window.EloShell;
  if (!store || !shell) return;

  const form = document.querySelector("[data-copy-form]");
  const result = document.querySelector("[data-copy-result]");
  const empty = document.querySelector("[data-copy-empty]");
  const output = document.querySelector("[data-generated-text]");
  const promptOutput = document.querySelector("[data-generated-prompt]");
  const history = document.querySelector("[data-copy-history]");
  let generatedConfig = null;

  function escapeHtml(value) { return String(value ?? "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char])); }
  function configFromForm() { return Object.fromEntries(new FormData(form).entries()); }
  function currentContext(campaignId) {
    const data = store.load();
    const campaign = data.campaigns.find((item) => item.id === campaignId);
    const company = campaign && data.companies.find((item) => item.id === campaign.companyId);
    return { data, campaign, company };
  }
  function fillCampaigns(selected = "") {
    const data = store.load();
    const select = form.elements.campaignId;
    select.innerHTML = '<option value="">Selecione uma campanha</option>';
    data.campaigns.forEach((campaign) => select.add(new Option(shell.campaignLabel(campaign, data), campaign.id)));
    select.value = selected;
    showCampaignSummary();
  }
  function showCampaignSummary() {
    const { campaign, company } = currentContext(form.elements.campaignId.value);
    const box = document.querySelector("[data-campaign-summary]");
    if (!campaign || !company) { box.innerHTML = "<p>Selecione uma campanha para preencher empresa, produto, objetivo e público.</p>"; return; }
    form.elements.objective.value = campaign.objective;
    box.innerHTML = `<strong>${escapeHtml(company.name)}</strong><span>${escapeHtml(campaign.product)} · ${escapeHtml(campaign.objective)}</span><p>${escapeHtml(company.audienceSummary)}</p>`;
  }
  function updateConditionalFields() {
    document.querySelector("[data-social-proof]").hidden = form.elements.trigger.value !== "Prova social";
  }
  function showError(message, field = "") {
    document.querySelector("[data-copy-form-message]").textContent = message;
    if (field) form.elements[field]?.focus();
  }
  function validate(config) {
    form.querySelectorAll("[data-error-for]").forEach((item) => { item.textContent = ""; });
    document.querySelector("[data-copy-form-message]").textContent = "";
    if (!config.campaignId) { form.querySelector('[data-error-for="campaignId"]').textContent = "Selecione uma campanha."; showError("Selecione uma campanha para gerar o texto.", "campaignId"); return false; }
    if (config.trigger === "Prova social" && !config.socialProof.trim()) { form.querySelector('[data-error-for="socialProof"]').textContent = "Informe a avaliação ou o depoimento real."; showError("Prova social exige uma evidência informada pelo usuário.", "socialProof"); return false; }
    if (config.trigger === "Urgência" && !config.deadline.trim()) { showError("Urgência exige um prazo ou uma data real da oferta.", "deadline"); return false; }
    if (config.trigger === "Escassez" && !config.quantity.trim()) { showError("Escassez exige uma quantidade real disponível.", "quantity"); return false; }
    return true;
  }

  function callToAction(objective, type) {
    if (type === "WhatsApp") return "Responda esta mensagem para saber mais.";
    if (type === "E-mail promocional") return "Fale com a nossa equipe e confira os detalhes.";
    return ({ "Vendas": "Entre em contato e faça seu pedido.", "Geração de contatos": "Fale com a gente para receber mais informações.", "Tráfego": "Acesse o canal indicado e saiba mais.", "Engajamento": "Conte para a gente o que você achou.", "Alcance": "Compartilhe com quem também pode gostar.", "Reconhecimento de marca": "Conheça a proposta e acompanhe as novidades." })[objective] || "Saiba mais.";
  }
  function triggerLine(config) {
    if (config.trigger === "Benefício concreto") return "Uma escolha prática para aproveitar melhor o seu dia.";
    if (config.trigger === "Novidade") return "Tem novidade chegando por aqui.";
    if (config.trigger === "Prova social") return `Quem já conhece conta: “${config.socialProof.trim()}”`;
    if (config.trigger === "Urgência") return `Condição válida ${config.deadline.trim()}.`;
    if (config.trigger === "Escassez") return `Disponibilidade informada: ${config.quantity.trim()}.`;
    return "";
  }
  function offerLine(config) {
    const parts = [];
    if (config.price.trim()) parts.push(`por ${config.price.trim()}`);
    if (config.discount.trim()) parts.push(config.discount.trim());
    if (config.conditions.trim()) parts.push(config.conditions.trim());
    if (!parts.length) return "";
    return `Oferta: ${parts.join(" · ")}.`;
  }
  function opening(tone, company, product) {
    const choices = {
      Profissional: `${company} apresenta ${product}.`,
      Acolhedor: `Preparamos algo especial para você: ${product}.`,
      Criativo: `Uma boa ideia acaba de ganhar forma: ${product}.`,
      Direto: `${product}: conheça esta solução da ${company}.`,
      Promocional: `É hora de aproveitar ${product}!`
    };
    return choices[tone] || choices.Profissional;
  }
  function generateText(config, company, campaign) {
    const lines = [opening(config.tone, company.name, campaign.product), triggerLine(config), offerLine(config)];
    if (config.length !== "Curto") lines.splice(1, 0, `Pensado para ${company.audienceSummary.charAt(0).toLowerCase()}${company.audienceSummary.slice(1)}`);
    if (config.length === "Detalhado") {
      if (company.needs) lines.splice(2, 0, `A proposta ajuda quem busca ${company.needs.charAt(0).toLowerCase()}${company.needs.slice(1)}.`);
      if (campaign.notes) lines.splice(-1, 0, campaign.notes);
    }
    lines.push(callToAction(config.objective, config.type));
    let body = lines.filter(Boolean).join("\n\n");
    if (config.type === "Story") body = lines.filter(Boolean).join("\n");
    if (config.type === "WhatsApp") body = `Olá! 😊\n\n${body}`;
    if (config.type === "E-mail promocional") body = `Assunto: ${campaign.product} — conheça a proposta\n\nOlá!\n\n${body}\n\nAtenciosamente,\n${company.name}`;
    if (config.type === "Legenda para post") body += `\n\n#${company.name.replace(/[^a-zA-ZÀ-ÿ0-9]/g, "")} #MarketingDigital`;
    return body;
  }
  function generatePrompt(config, company, campaign) {
    const details = [
      `Crie ${config.type === "E-mail promocional" ? "um" : "uma"} ${config.type.toLowerCase()} em português do Brasil para a empresa fictícia ${company.name}.`,
      `Produto ou serviço: ${campaign.product}.`, `Objetivo: ${config.objective}.`, `Público-alvo: ${company.audienceSummary}.`,
      `Tom: ${config.tone.toLowerCase()}. Tamanho: ${config.length.toLowerCase()}.`, `Gatilho permitido: ${config.trigger.toLowerCase()}.`
    ];
    if (config.price.trim()) details.push(`Preço informado: ${config.price.trim()}.`);
    if (config.discount.trim()) details.push(`Desconto informado: ${config.discount.trim()}.`);
    if (config.deadline.trim()) details.push(`Prazo informado: ${config.deadline.trim()}.`);
    if (config.quantity.trim()) details.push(`Quantidade informada: ${config.quantity.trim()}.`);
    if (config.conditions.trim()) details.push(`Condições: ${config.conditions.trim()}.`);
    if (config.socialProof.trim()) details.push(`Prova social fornecida: “${config.socialProof.trim()}”.`);
    if (config.instructions.trim()) details.push(`Instruções adicionais: ${config.instructions.trim()}`);
    details.push("Não invente depoimentos, descontos, prazos, quantidades ou promessas de resultado. Use somente os dados fornecidos e inclua uma chamada para ação adequada.");
    return details.join(" ");
  }

  function present(config, text, prompt) {
    generatedConfig = { ...config };
    output.value = text; promptOutput.textContent = prompt;
    empty.hidden = true; result.hidden = false;
    document.querySelector("[data-save-copy]").textContent = config.id ? "Atualizar versão" : "Salvar no histórico";
  }
  function resetForm() {
    form.reset(); form.elements.id.value = ""; generatedConfig = null; result.hidden = true; empty.hidden = false;
    document.querySelector("[data-copy-form-message]").textContent = ""; fillCampaigns(); updateConditionalFields();
  }
  async function copyToClipboard(text, message) {
    try { await navigator.clipboard.writeText(text); shell.toast(message); }
    catch (_error) { shell.toast("Não foi possível copiar automaticamente. Selecione o conteúdo e copie manualmente.", "error"); }
  }

  function renderHistory() {
    const data = store.load();
    document.querySelector("[data-copy-count]").textContent = data.copies.length;
    history.innerHTML = data.copies.slice().sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))).map((copy) => {
      const campaign = data.campaigns.find((item) => item.id === copy.campaignId);
      const company = campaign && data.companies.find((item) => item.id === campaign.companyId);
      return `<article class="cartao-historico"><div class="topo-historico"><span class="selo-copy">${escapeHtml(copy.type)}</span><time>${shell.formatDate(copy.updatedAt)}</time></div><h3>${escapeHtml(campaign?.product || "Campanha removida")}</h3><p class="meta-historico">${escapeHtml(company?.name || "Empresa removida")} · ${escapeHtml(copy.tone)} · ${escapeHtml(copy.objective)}</p><p class="trecho-copy">${escapeHtml(copy.text)}</p><div class="acoes-linha"><button type="button" data-edit-copy="${copy.id}">Editar</button><button type="button" data-duplicate-copy="${copy.id}">Duplicar</button><button type="button" data-txt-copy="${copy.id}">TXT</button><button class="acao-perigo" type="button" data-delete-copy="${copy.id}">Excluir</button></div></article>`;
    }).join("");
    document.querySelector("[data-history-empty]").hidden = data.copies.length > 0;
  }
  function loadCopy(copy, duplicate = false) {
    resetForm();
    Object.entries(copy).forEach(([key, value]) => { if (form.elements[key]) form.elements[key].value = value ?? ""; });
    if (duplicate) form.elements.id.value = "";
    showCampaignSummary(); updateConditionalFields();
    present({ ...copy, id: duplicate ? "" : copy.id }, copy.text, copy.prompt);
    scrollTo({ top: 0, behavior: "smooth" });
    shell.toast(duplicate ? "Cópia duplicada. Ajuste e salve como uma nova versão." : "Versão carregada para edição.");
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault(); const config = configFromForm(); if (!validate(config)) return;
    const { campaign, company } = currentContext(config.campaignId);
    if (!campaign || !company) { showError("A campanha selecionada não está mais disponível.", "campaignId"); return; }
    present(config, generateText(config, company, campaign), generatePrompt(config, company, campaign));
    shell.toast("Sugestão gerada. Revise o texto antes de salvar.");
  });
  form.elements.campaignId.addEventListener("change", showCampaignSummary);
  form.elements.trigger.addEventListener("change", updateConditionalFields);
  document.querySelector("[data-clear-copy]").addEventListener("click", resetForm);
  document.querySelector("[data-copy-text]").addEventListener("click", () => copyToClipboard(output.value, "Texto copiado."));
  document.querySelector("[data-copy-prompt]").addEventListener("click", () => copyToClipboard(promptOutput.textContent, "Prompt copiado."));
  document.querySelector("[data-download-text]").addEventListener("click", () => shell.download("elo-digital-copy.txt", output.value));
  document.querySelector("[data-save-copy]").addEventListener("click", () => {
    if (!generatedConfig || !output.value.trim()) return;
    const current = store.load().copies.find((item) => item.id === generatedConfig.id);
    const saved = store.saveCopy({ ...current, ...generatedConfig, text: output.value.trim(), prompt: promptOutput.textContent, demo: current?.demo || false });
    form.elements.id.value = saved.id; generatedConfig.id = saved.id;
    document.querySelector("[data-save-copy]").textContent = "Atualizar versão"; renderHistory(); shell.toast(current ? "Versão atualizada." : "Texto salvo no histórico.");
  });
  history.addEventListener("click", (event) => {
    const data = store.load();
    const action = event.target.closest("button"); if (!action) return;
    const actionKey = ["editCopy", "duplicateCopy", "txtCopy", "deleteCopy"].find((key) => action.dataset[key]);
    if (!actionKey) return;
    const copy = data.copies.find((item) => item.id === action.dataset[actionKey]); if (!copy) return;
    if (actionKey === "editCopy") loadCopy(copy);
    if (actionKey === "duplicateCopy") loadCopy(copy, true);
    if (actionKey === "txtCopy") shell.download(`copy-${copy.type.toLowerCase().replaceAll(" ", "-")}.txt`, copy.text);
    if (actionKey === "deleteCopy" && confirm("Excluir esta versão do histórico? Esta ação não pode ser desfeita.")) { store.removeCopy(copy.id); renderHistory(); shell.toast("Versão excluída."); }
  });

  store.OBJETIVOS.forEach((value) => form.elements.objective.add(new Option(value, value)));
  fillCampaigns(new URLSearchParams(location.search).get("campanha") || "");
  renderHistory(); updateConditionalFields();
}());
