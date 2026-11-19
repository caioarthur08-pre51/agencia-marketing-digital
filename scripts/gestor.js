(function () {
  "use strict";
  const store = window.EloData; const shell = window.EloShell; if (!store || !shell) return;
  const planDialog = document.querySelector("[data-plan-dialog]"); const planForm = document.querySelector("[data-plan-form]");
  const scheduleDialog = document.querySelector("[data-schedule-dialog]"); const scheduleForm = document.querySelector("[data-schedule-form]");
  const metricLabels = { reach: "Alcance", impressions: "Impressões", clicks: "Cliques", contacts: "Contatos", conversions: "Conversões", investment: "Investimento (R$)", revenue: "Receita (R$)" };
  const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  function esc(value) { return String(value ?? "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char])); }
  function num(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; }
  function companyFor(data, campaign) { return data.companies.find((item) => item.id === campaign.companyId); }
  function metricFields(prefix) { return Object.entries(metricLabels).map(([key, label]) => `<label class="campo-formulario"><span>${label}</span><input type="number" min="0" step="${["investment", "revenue"].includes(key) ? "0.01" : "1"}" name="${prefix}.${key}"></label>`).join(""); }
  function setOptions(select, values, placeholder = "") { select.innerHTML = placeholder ? `<option value="">${esc(placeholder)}</option>` : ""; values.forEach((value) => select.add(new Option(value, value))); }
  function campaignOptions(select, selected = "") { const data = store.load(); select.innerHTML = '<option value="">Selecione uma campanha</option>'; data.campaigns.forEach((campaign) => select.add(new Option(shell.campaignLabel(campaign, data), campaign.id))); select.value = selected; }
  function materialOptions(container, items, selected, type) {
    if (!items.length) { container.innerHTML = '<p class="texto-vazio-inline">Nenhum material salvo nesta campanha.</p>'; return; }
    container.innerHTML = items.map((item) => { const label = type === "copy" ? `${item.type} · ${item.text.slice(0, 70)}` : `${item.variant} · ${item.title}`; return `<label class="opcao-material"><input type="checkbox" value="${item.id}" ${selected.includes(item.id) ? "checked" : ""}> <span>${esc(label)}</span></label>`; }).join("");
  }
  function loadPlan(campaignId) {
    const data = store.load(); const campaign = data.campaigns.find((item) => item.id === campaignId); if (!campaign) return;
    Object.entries(campaign).forEach(([key, value]) => { if (planForm.elements[key] && !["channels", "targetMinors", "repeatedContact"].includes(key)) planForm.elements[key].value = value ?? ""; });
    planForm.elements.campaignId.value = campaign.id; planForm.elements.targetMinors.checked = campaign.targetMinors; planForm.elements.repeatedContact.checked = campaign.repeatedContact;
    document.querySelectorAll('[data-channel-checkboxes] input').forEach((input) => { input.checked = campaign.channels.includes(input.value); });
    document.querySelectorAll('[data-account-fields] input').forEach((input) => { input.value = campaign.accounts[input.dataset.accountChannel] || ""; });
    Object.keys(metricLabels).forEach((key) => { planForm.elements[`goals.${key}`].value = campaign.goals[key] || ""; planForm.elements[`results.${key}`].value = campaign.results[key] || ""; });
    materialOptions(document.querySelector("[data-copy-options]"), data.copies.filter((item) => item.campaignId === campaign.id), campaign.selectedCopyIds, "copy");
    materialOptions(document.querySelector("[data-briefing-options]"), data.briefings.filter((item) => item.campaignId === campaign.id), campaign.selectedBriefingIds, "briefing");
    document.querySelector("[data-plan-message]").textContent = "";
  }
  function openPlan(id = "") {
    const data = store.load(); if (!data.campaigns.length) { shell.toast("Crie uma campanha no CRM antes de planejar.", "error"); return; }
    planForm.reset(); campaignOptions(planForm.elements.campaignId, id || data.campaigns[0].id); loadPlan(planForm.elements.campaignId.value); planDialog.showModal();
  }
  function scheduleMaterials() {
    const data = store.load(); const id = scheduleForm.elements.campaignId.value;
    const copies = data.copies.filter((item) => item.campaignId === id); const briefs = data.briefings.filter((item) => item.campaignId === id);
    scheduleForm.elements.copyId.innerHTML = '<option value="">Sem copy vinculada</option>'; copies.forEach((item) => scheduleForm.elements.copyId.add(new Option(`${item.type} · ${item.text.slice(0, 55)}`, item.id)));
    scheduleForm.elements.briefingId.innerHTML = '<option value="">Sem peça vinculada</option>'; briefs.forEach((item) => scheduleForm.elements.briefingId.add(new Option(`${item.variant} · ${item.title}`, item.id)));
  }
  function openSchedule(record = null, campaignId = "") {
    const data = store.load(); if (!data.campaigns.length) { shell.toast("Crie uma campanha no CRM antes de usar a agenda.", "error"); return; }
    scheduleForm.reset(); campaignOptions(scheduleForm.elements.campaignId, record?.campaignId || campaignId || data.campaigns[0].id); scheduleMaterials();
    scheduleForm.elements.date.value = new Date().toISOString().slice(0, 10); scheduleForm.elements.time.value = "09:00";
    if (record) Object.entries(record).forEach(([key, value]) => { if (scheduleForm.elements[key]) scheduleForm.elements[key].value = value ?? ""; });
    document.querySelector("[data-schedule-message]").textContent = ""; scheduleDialog.showModal();
  }
  function gateAction(campaign, status, label) {
    const gate = store.auditGate(campaign.id); if (!gate.allowed) { shell.toast(`${label} bloqueado: ${gate.reason} Abra uma nova revisão na Auditoria.`, "error"); return; }
    store.saveCampaign({ ...campaign, managerStatus: status, simulatedAction: label, simulatedAt: new Date().toISOString() }); render(); shell.toast(`${label} registrado como simulação. Nenhuma rede social foi acessada.`);
  }
  function percent(value, goal) { return goal > 0 ? Math.min(100, Math.max(0, value / goal * 100)) : 0; }
  function metricText(value, kind) { if (value === null) return "Sem dados suficientes"; return kind === "money" ? money.format(value) : `${value.toFixed(2)}%`; }
  function renderPerformance() {
    const data = store.load(); const select = document.querySelector("[data-performance-campaign]"); const id = select.value || data.campaigns[0]?.id; const campaign = data.campaigns.find((item) => item.id === id); const panel = document.querySelector("[data-performance-panel]");
    if (!campaign) { panel.innerHTML = '<div class="estado-vazio compacto"><p>Cadastre uma campanha para visualizar resultados.</p></div>'; return; }
    const calculated = store.metrics(campaign); const keys = ["reach", "impressions", "clicks", "contacts", "conversions", "investment", "revenue"];
    panel.innerHTML = `<div class="grade-comparacao">${keys.map((key) => { const result = num(campaign.results[key]); const goal = num(campaign.goals[key]); const monetary = ["investment", "revenue"].includes(key); const reached = key === "investment" ? result <= goal && goal > 0 : result >= goal && goal > 0; return `<article><div><span>${metricLabels[key]}</span><strong>${monetary ? money.format(result) : result.toLocaleString("pt-BR")}</strong><small>Meta: ${monetary ? money.format(goal) : goal.toLocaleString("pt-BR")}</small></div><span class="selo-meta ${reached ? "atingida" : "pendente"}">${goal ? (reached ? "Atingida" : "Não atingida") : "Sem meta"}</span><span class="barra-meta"><span style="width:${percent(result, goal)}%"></span></span></article>`; }).join("")}</div>
      <div class="grade-indicadores-calculados"><article><span>CTR</span><strong>${metricText(calculated.ctr, "percent")}</strong><small>Cliques ÷ impressões</small></article><article><span>CPC médio</span><strong>${metricText(calculated.cpc, "money")}</strong><small>Investimento ÷ cliques</small></article><article><span>Custo por contato</span><strong>${metricText(calculated.costPerContact, "money")}</strong><small>Investimento ÷ contatos</small></article><article><span>Taxa de conversão</span><strong>${metricText(calculated.conversionRate, "percent")}</strong><small>Conversões ÷ cliques</small></article><article><span>ROI</span><strong>${metricText(calculated.roi, "percent")}</strong><small>(Receita − custo) ÷ custo</small></article></div>`;
  }
  function render() {
    const data = store.load(); const query = document.querySelector("[data-manager-search]").value.toLowerCase(); const status = document.querySelector("[data-manager-status-filter]").value; const type = document.querySelector("[data-manager-type-filter]").value;
    const campaigns = data.campaigns.filter((campaign) => { const company = companyFor(data, campaign); return (!query || `${campaign.product} ${company?.name}`.toLowerCase().includes(query)) && (!status || campaign.managerStatus === status) && (!type || campaign.campaignType === type); });
    document.querySelector("[data-active-count]").textContent = data.campaigns.filter((item) => item.managerStatus === "Em andamento").length;
    const budgetTotal = data.campaigns.reduce((sum, item) => sum + num(item.budgetPlanned), 0); const spendTotal = data.campaigns.reduce((sum, item) => sum + num(item.results.investment), 0);
    document.querySelector("[data-budget-total]").textContent = money.format(budgetTotal);
    document.querySelector("[data-spend-total]").textContent = money.format(spendTotal);
    document.querySelector("[data-budget-balance]").textContent = money.format(budgetTotal - spendTotal);
    document.querySelector("[data-revenue-total]").textContent = money.format(data.campaigns.reduce((sum, item) => sum + num(item.results.revenue), 0));
    const body = document.querySelector("[data-manager-list]");
    body.innerHTML = campaigns.map((campaign) => { const company = companyFor(data, campaign); const gate = store.auditGate(data, campaign.id); return `<tr><td data-label="Campanha"><strong>${esc(campaign.product)}</strong><small>${esc(company?.name || "Empresa removida")} · ${esc(campaign.campaignType)}</small></td><td data-label="Status"><span class="selo-status-gestor">${esc(campaign.managerStatus)}</span></td><td data-label="Canais">${campaign.channels.length ? campaign.channels.map((item) => `<span class="tag-canal">${esc(item)}</span>`).join(" ") : "—"}</td><td data-label="Período">${shell.formatDate(campaign.startDate)} a ${shell.formatDate(campaign.endDate)}</td><td data-label="Orçamento">${money.format(campaign.budgetPlanned)}</td><td data-label="Auditoria"><span class="selo-auditoria ${gate.allowed ? "aprovada" : "bloqueada"}">${gate.allowed ? "Liberada" : "Bloqueada"}</span></td><td data-label="Ações"><div class="acoes-linha"><button data-edit-plan="${campaign.id}">Editar</button><button data-add-schedule="${campaign.id}">Agendar</button><button data-publish="${campaign.id}">Ativar/Publicar</button><a href="auditoria.html?campanha=${campaign.id}">Auditar</a></div></td></tr>`; }).join("");
    document.querySelector("[data-manager-empty]").hidden = campaigns.length > 0; document.querySelector(".tabela-responsiva").hidden = campaigns.length === 0;
    const perfSelect = document.querySelector("[data-performance-campaign]"); const old = perfSelect.value; perfSelect.innerHTML = ""; data.campaigns.forEach((item) => perfSelect.add(new Option(shell.campaignLabel(item, data), item.id))); perfSelect.value = data.campaigns.some((item) => item.id === old) ? old : data.campaigns[0]?.id || ""; renderPerformance();
    const schedules = data.schedules.slice().sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)); const list = document.querySelector("[data-schedule-list]");
    list.innerHTML = schedules.map((item) => { const campaign = data.campaigns.find((entry) => entry.id === item.campaignId); const copy = data.copies.find((entry) => entry.id === item.copyId); const brief = data.briefings.find((entry) => entry.id === item.briefingId); return `<article class="item-agenda"><time datetime="${item.date}T${item.time}"><strong>${shell.formatDate(item.date)}</strong><span>${esc(item.time)}</span></time><div><span class="tag-canal">${esc(item.channel)}</span><h3>${esc(item.format)} · ${esc(campaign?.product || "Campanha removida")}</h3><p>${copy ? `Copy: ${esc(copy.text.slice(0, 90))}` : "Sem copy vinculada"}${brief ? ` · Peça: ${esc(brief.title)}` : ""}</p></div><div class="acoes-linha"><button data-edit-schedule="${item.id}">Editar</button><button class="acao-perigo" data-delete-schedule="${item.id}">Excluir</button></div></article>`; }).join("");
    document.querySelector("[data-schedule-empty]").hidden = schedules.length > 0;
  }

  document.querySelector("[data-goal-fields]").innerHTML = metricFields("goals"); document.querySelector("[data-result-fields]").innerHTML = metricFields("results");
  document.querySelector("[data-channel-checkboxes]").innerHTML = store.CHANNELS.map((channel) => `<label><input type="checkbox" value="${channel}"> ${channel}</label>`).join("");
  document.querySelector("[data-account-fields]").innerHTML = store.CHANNELS.map((channel) => `<label class="campo-formulario"><span>${channel}</span><input data-account-channel="${channel}" maxlength="100" placeholder="Perfil ou conta fictícia"></label>`).join("");
  setOptions(planForm.elements.managerStatus, store.CAMPAIGN_STATUS); setOptions(document.querySelector("[data-manager-status-filter]"), store.CAMPAIGN_STATUS, "Todos"); setOptions(scheduleForm.elements.channel, store.CHANNELS, "Selecione um canal");
  planForm.elements.campaignId.addEventListener("change", () => loadPlan(planForm.elements.campaignId.value));
  planForm.addEventListener("submit", (event) => {
    event.preventDefault(); const data = store.load(); const campaign = data.campaigns.find((item) => item.id === planForm.elements.campaignId.value); if (!campaign) return;
    const targetStatus = planForm.elements.managerStatus.value; if (["Agendada", "Em andamento"].includes(targetStatus)) { const gate = store.auditGate(data, campaign.id); if (!gate.allowed) { document.querySelector("[data-plan-message]").textContent = `Não é possível usar o status ${targetStatus}: ${gate.reason}`; return; } }
    const channels = [...document.querySelectorAll('[data-channel-checkboxes] input:checked')].map((input) => input.value); const accounts = {}; document.querySelectorAll('[data-account-fields] input').forEach((input) => { if (input.value.trim()) accounts[input.dataset.accountChannel] = input.value.trim(); });
    const metrics = (prefix) => Object.fromEntries(Object.keys(metricLabels).map((key) => [key, num(planForm.elements[`${prefix}.${key}`].value)]));
    const selectedCopyIds = [...document.querySelectorAll('[data-copy-options] input:checked')].map((input) => input.value); const selectedBriefingIds = [...document.querySelectorAll('[data-briefing-options] input:checked')].map((input) => input.value);
    store.saveCampaign({ ...campaign, campaignType: planForm.elements.campaignType.value, managerStatus: targetStatus, startDate: planForm.elements.startDate.value, endDate: planForm.elements.endDate.value, responsible: planForm.elements.responsible.value.trim(), budgetPlanned: num(planForm.elements.budgetPlanned.value), strategy: planForm.elements.strategy.value.trim(), callToAction: planForm.elements.callToAction.value.trim(), managerNotes: planForm.elements.managerNotes.value.trim(), targetMinors: planForm.elements.targetMinors.checked, repeatedContact: planForm.elements.repeatedContact.checked, channels, accounts, selectedCopyIds, selectedBriefingIds, goals: metrics("goals"), results: metrics("results") });
    planDialog.close(); render(); shell.toast("Planejamento e resultados atualizados.");
  });
  scheduleForm.elements.campaignId.addEventListener("change", scheduleMaterials);
  scheduleForm.addEventListener("submit", (event) => { event.preventDefault(); const fields = Object.fromEntries(new FormData(scheduleForm).entries()); if (!fields.campaignId || !fields.date || !fields.time || !fields.channel || !fields.format.trim()) { document.querySelector("[data-schedule-message]").textContent = "Preencha campanha, data, horário, canal e formato."; return; } const current = store.load().schedules.find((item) => item.id === fields.id); store.saveSchedule({ ...current, ...fields }); scheduleDialog.close(); render(); shell.toast(current ? "Item da agenda atualizado." : "Conteúdo adicionado à agenda."); });
  document.querySelectorAll("[data-open-plan]").forEach((button) => button.addEventListener("click", () => openPlan())); document.querySelectorAll("[data-open-schedule]").forEach((button) => button.addEventListener("click", () => openSchedule())); document.querySelectorAll("[data-close-dialog]").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));
  document.querySelector("[data-manager-list]").addEventListener("click", (event) => { const data = store.load(); const edit = event.target.closest("[data-edit-plan]"); const schedule = event.target.closest("[data-add-schedule]"); const publish = event.target.closest("[data-publish]"); if (edit) openPlan(edit.dataset.editPlan); if (schedule) { const campaign = data.campaigns.find((item) => item.id === schedule.dataset.addSchedule); const gate = store.auditGate(data, campaign.id); if (!gate.allowed) { shell.toast(`Agendamento bloqueado: ${gate.reason}`, "error"); return; } openSchedule(null, campaign.id); } if (publish) { const campaign = data.campaigns.find((item) => item.id === publish.dataset.publish); gateAction(campaign, "Em andamento", "Ativação/publicação"); } });
  document.querySelector("[data-schedule-list]").addEventListener("click", (event) => { const data = store.load(); const edit = event.target.closest("[data-edit-schedule]"); const remove = event.target.closest("[data-delete-schedule]"); if (edit) openSchedule(data.schedules.find((item) => item.id === edit.dataset.editSchedule)); if (remove) { const item = data.schedules.find((entry) => entry.id === remove.dataset.deleteSchedule); if (item && confirm("Excluir este item da agenda?")) { store.removeSchedule(item.id); render(); shell.toast("Item removido da agenda."); } } });
  ["[data-manager-search]", "[data-manager-status-filter]", "[data-manager-type-filter]"].forEach((selector) => document.querySelector(selector).addEventListener("input", render)); document.querySelector("[data-performance-campaign]").addEventListener("change", renderPerformance);
  document.querySelector("[data-export-manager-json]").addEventListener("click", () => { const data = store.load(); shell.download(`elo-digital-gestor-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ version: data.version, campaigns: data.campaigns, schedules: data.schedules }, null, 2), "application/json"); });
  document.querySelector("[data-export-manager-csv]").addEventListener("click", () => { const data = store.load(); const quote = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`; const header = ["Empresa", "Campanha", "Modalidade", "Status", "Canais", "Início", "Fim", "Orçamento", "Investimento", "Receita", "CTR", "CPC", "Custo por contato", "Conversão", "ROI"]; const rows = data.campaigns.map((campaign) => { const metrics = store.metrics(campaign); return [companyFor(data, campaign)?.name, campaign.product, campaign.campaignType, campaign.managerStatus, campaign.channels.join(", "), campaign.startDate, campaign.endDate, campaign.budgetPlanned, campaign.results.investment, campaign.results.revenue, metrics.ctr ?? "", metrics.cpc ?? "", metrics.costPerContact ?? "", metrics.conversionRate ?? "", metrics.roi ?? ""]; }); shell.download(`elo-digital-gestor-${new Date().toISOString().slice(0, 10)}.csv`, `\ufeff${[header, ...rows].map((row) => row.map(quote).join(";")).join("\r\n")}`, "text/csv;charset=utf-8"); });
  render();
}());
