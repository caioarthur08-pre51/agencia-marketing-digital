(function () {
  "use strict";
  const store = window.EloData; const shell = window.EloShell; if (!store || !shell) return;
  const campaignSelect = document.querySelector("[data-audit-campaign]"); const form = document.querySelector("[data-audit-form]"); let currentAlerts = [];
  const checkValues = ["Atendido", "Precisa de ajuste", "Não se aplica"];
  function esc(value) { return String(value ?? "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char])); }
  function context(data, campaignId) { const campaign = data.campaigns.find((item) => item.id === campaignId); return { campaign, company: campaign && data.companies.find((item) => item.id === campaign.companyId), copies: data.copies.filter((item) => item.campaignId === campaignId), briefings: data.briefings.filter((item) => item.campaignId === campaignId) }; }
  function severityClass(value) { return ({ Informativo: "info", Atenção: "warning", "Alto risco": "high", Bloqueador: "block" })[value] || "info"; }
  function scan(data, campaign) {
    if (!campaign) return [];
    const copies = data.copies.filter((item) => item.campaignId === campaign.id && (!campaign.selectedCopyIds.length || campaign.selectedCopyIds.includes(item.id)));
    const briefings = data.briefings.filter((item) => item.campaignId === campaign.id && (!campaign.selectedBriefingIds.length || campaign.selectedBriefingIds.includes(item.id)));
    const alerts = [];
    copies.forEach((copy) => {
      const text = String(copy.text || "");
      if (/(só hoje|última chance|agora ou nunca)/i.test(text) && !String(copy.deadline || "").trim()) alerts.push({ severity: "Bloqueador", title: "Urgência sem prazo definido", detail: "O texto utiliza urgência, mas não informa data ou prazo verificável da oferta.", sourceType: "Copy", sourceId: copy.id });
      if (/(resultado garantido|100% garantido|milagre|sem risco)/i.test(text)) alerts.push({ severity: "Alto risco", title: "Promessa potencialmente exagerada", detail: "Revise a afirmação e registre evidências antes de utilizá-la.", sourceType: "Copy", sourceId: copy.id });
      if (copy.trigger === "Prova social" && !String(copy.socialProof || "").trim()) alerts.push({ severity: "Bloqueador", title: "Prova social sem comprovação", detail: "O gatilho foi selecionado sem avaliação ou depoimento fornecido.", sourceType: "Copy", sourceId: copy.id });
      if (copy.trigger === "Escassez" && !String(copy.quantity || "").trim()) alerts.push({ severity: "Bloqueador", title: "Escassez sem quantidade", detail: "Informe a disponibilidade real antes da publicação simulada.", sourceType: "Copy", sourceId: copy.id });
    });
    briefings.forEach((brief) => {
      if (brief.imageName && !String(brief.imageSource || "").trim()) alerts.push({ severity: "Alto risco", title: "Origem da imagem não registrada", detail: "Registre autoria, licença ou autorização do material visual.", sourceType: "Peça", sourceId: brief.id });
      if (!String(brief.cta || "").trim()) alerts.push({ severity: "Atenção", title: "Peça sem chamada para ação", detail: "Confirme se o objetivo exige um CTA e inclua-o quando aplicável.", sourceType: "Peça", sourceId: brief.id });
    });
    if (!copies.length && !briefings.length) alerts.push({ severity: "Atenção", title: "Campanha sem materiais vinculados", detail: "Selecione copies ou peças no Gestor antes de concluir a revisão.", sourceType: "Campanha", sourceId: campaign.id });
    if (campaign.targetMinors) alerts.push({ severity: "Informativo", title: "Público inclui menores", detail: "Aplique a verificação condicional do Estatuto Digital da Criança e do Adolescente.", sourceType: "Campanha", sourceId: campaign.id });
    if (campaign.repeatedContact) alerts.push({ severity: "Atenção", title: "Contato reiterado previsto", detail: "Revise frequência, consentimento e risco de abordagem invasiva.", sourceType: "Campanha", sourceId: campaign.id });
    return alerts.map((item) => ({ ...item, id: store.newId("alert") }));
  }
  function renderAlerts() {
    const container = document.querySelector("[data-auto-alerts]");
    if (!currentAlerts.length) { container.innerHTML = '<div class="sem-alertas"><span aria-hidden="true">✓</span><div><strong>Nenhum alerta automático encontrado.</strong><p>Continue com o checklist manual antes de emitir o parecer.</p></div></div>'; return; }
    container.innerHTML = currentAlerts.map((alert) => `<article class="alerta-auditoria ${severityClass(alert.severity)}"><span class="icone-risco" aria-hidden="true">${alert.severity === "Bloqueador" ? "!" : alert.severity === "Informativo" ? "i" : "△"}</span><div><span>${esc(alert.severity)} · ${esc(alert.sourceType)}</span><h4>${esc(alert.title)}</h4><p>${esc(alert.detail)}</p></div></article>`).join("");
  }
  function renderCampaign() {
    const data = store.load(); const { campaign, company, copies, briefings } = context(data, campaignSelect.value); if (!campaign) return;
    document.querySelector("[data-audit-context]").innerHTML = `<p class="rotulo-formulario">Campanha selecionada</p><h3>${esc(campaign.product)}</h3><p>${esc(company?.name || "Empresa removida")} · ${esc(campaign.objective)} · ${esc(campaign.campaignType)}</p><dl><div><dt>Status</dt><dd>${esc(campaign.managerStatus)}</dd></div><div><dt>Canais</dt><dd>${esc(campaign.channels.join(", ") || "Não definidos")}</dd></div><div><dt>CTA</dt><dd>${esc(campaign.callToAction || "Não definido")}</dd></div></dl>`;
    document.querySelector("[data-audit-materials]").innerHTML = `<div><h3>Copies vinculadas</h3>${copies.length ? copies.map((item) => `<article class="material-auditoria"><span>${esc(item.type)}</span><p>${esc(item.text.slice(0, 150))}</p></article>`).join("") : "<p>Nenhuma copy.</p>"}</div><div><h3>Peças vinculadas</h3>${briefings.length ? briefings.map((item) => `<article class="material-auditoria"><span>${esc(item.variant)}</span><p><strong>${esc(item.title)}</strong><br>${esc(item.cta || "Sem CTA")}</p></article>`).join("") : "<p>Nenhuma peça.</p>"}</div>`;
    const source = form.elements.manualSource; source.innerHTML = '<option value="">Campanha inteira</option>'; copies.forEach((item) => source.add(new Option(`Copy · ${item.type} · ${item.text.slice(0, 45)}`, `Copy|${item.id}`))); briefings.forEach((item) => source.add(new Option(`Peça · ${item.variant} · ${item.title}`, `Peça|${item.id}`)));
    const child = document.querySelector('[data-check-item="children"]'); child.hidden = !campaign.targetMinors; form.elements.children.value = campaign.targetMinors ? "Precisa de ajuste" : "Não se aplica";
    const repeated = document.querySelector('[data-check-item="repeatedContact"]'); repeated.hidden = !campaign.repeatedContact; form.elements.repeatedContact.value = campaign.repeatedContact ? "Precisa de ajuste" : "Não se aplica";
    currentAlerts = scan(data, campaign); renderAlerts(); renderHistory();
  }
  function renderHistory() {
    const data = store.load(); const audits = data.audits.filter((item) => item.campaignId === campaignSelect.value).sort((a, b) => String(b.reviewedAt).localeCompare(String(a.reviewedAt))); const container = document.querySelector("[data-audit-history]");
    document.querySelector("[data-audit-history-count]").textContent = audits.length; document.querySelector("[data-audit-empty]").hidden = audits.length > 0;
    container.innerHTML = audits.map((audit) => `<article class="item-revisao"><span class="marcador-revisao ${audit.result === "Favorável" ? "ok" : audit.result === "Desfavorável" ? "fail" : "adjust"}" aria-hidden="true"></span><div class="cabecalho-revisao"><div><span>Revisão ${audit.revision} · ${shell.formatDate(audit.reviewedAt)}</span><h3>${esc(audit.result)}</h3></div><span class="selo-risco ${severityClass(audit.riskLevel)}">${esc(audit.riskLevel)}</span></div><p>${esc(audit.summary)}</p><dl><div><dt>Responsável</dt><dd>${esc(audit.reviewedBy)}</dd></div><div><dt>Alertas</dt><dd>${(audit.alerts || []).length}</dd></div><div><dt>Ciência</dt><dd>${esc(audit.acceptedBy || "—")}</dd></div></dl><details><summary>Ver recomendações e checklist</summary><p><strong>Ajustes:</strong> ${esc(audit.recommendations)}</p><p><strong>Checklist:</strong> ${Object.entries(audit.checklist || {}).map(([key, value]) => `${esc(key)}: ${esc(value)}`).join(" · ")}</p></details><button class="botao-texto" type="button" data-print-audit="${audit.id}">Imprimir esta revisão</button></article>`).join("");
  }
  function buildReport(audit) {
    const data = store.load(); const { campaign, company } = context(data, audit.campaignId); const report = document.querySelector("[data-print-report]");
    report.innerHTML = `<header><img src="assets/logo.svg" alt=""><div><p>Agência Elo Digital</p><h1>Relatório de Auditoria</h1><span>Revisão ${audit.revision} · ${shell.formatDate(audit.reviewedAt)}</span></div></header><section><h2>Campanha</h2><dl><div><dt>Empresa</dt><dd>${esc(company?.name)}</dd></div><div><dt>Campanha</dt><dd>${esc(campaign?.product)}</dd></div><div><dt>Responsável</dt><dd>${esc(audit.reviewedBy)}</dd></div><div><dt>Resultado</dt><dd>${esc(audit.result)} · ${esc(audit.riskLevel)}</dd></div></dl></section><section><h2>Análise</h2><p>${esc(audit.summary)}</p><p><strong>Peça e oferta:</strong> ${esc(audit.offerSummary || "Não informado")}</p><p><strong>Ajustes recomendados:</strong> ${esc(audit.recommendations)}</p></section><section><h2>Checklist</h2><table><thead><tr><th>Critério</th><th>Resultado</th></tr></thead><tbody>${Object.entries(audit.checklist || {}).map(([key, value]) => `<tr><td>${esc(key)}</td><td>${esc(value)}</td></tr>`).join("")}</tbody></table><p>${esc(audit.checklistNotes || "")}</p></section><section><h2>Alertas</h2>${(audit.alerts || []).map((alert) => `<article><strong>${esc(alert.severity)} · ${esc(alert.title)}</strong><p>${esc(alert.detail)}</p></article>`).join("") || "<p>Nenhum alerta registrado.</p>"}</section><section><h2>Ciência</h2><p>${esc(audit.acceptedBy)} · ${shell.formatDate(audit.acceptedAt)}</p><p>${esc(audit.acceptanceJustification)}</p></section><footer><p>Este parecer é demonstrativo e tem finalidade acadêmica. Não substitui análise jurídica profissional.</p><p>Projeto acadêmico de Marketing Digital · 2026</p></footer>`;
  }
  function printAudit(id = "") { const data = store.load(); const audit = id ? data.audits.find((item) => item.id === id) : store.latestAudit(data, campaignSelect.value); if (!audit) { shell.toast("Ainda não existe parecer para imprimir.", "error"); return; } buildReport(audit); window.print(); }
  function renderCounts() {
    const data = store.load(); const latest = data.campaigns.map((item) => store.latestAudit(data, item.id)).filter(Boolean);
    document.querySelector("[data-audit-campaigns]").textContent = data.campaigns.length; document.querySelector("[data-audit-pending]").textContent = data.campaigns.filter((item) => !store.auditGate(data, item.id).allowed).length;
    document.querySelector("[data-blocking-alerts]").textContent = latest.reduce((sum, audit) => sum + (audit.alerts || []).filter((item) => item.severity === "Bloqueador").length, 0); document.querySelector("[data-audit-count]").textContent = data.audits.length;
  }

  document.querySelectorAll("[data-checklist] select").forEach((select) => checkValues.forEach((value) => select.add(new Option(value, value))));
  const data = store.load(); data.campaigns.forEach((campaign) => campaignSelect.add(new Option(shell.campaignLabel(campaign, data), campaign.id))); campaignSelect.value = new URLSearchParams(location.search).get("campanha") || data.campaigns[0]?.id || "";
  campaignSelect.addEventListener("change", renderCampaign); document.querySelector("[data-run-scan]").addEventListener("click", () => { renderCampaign(); shell.toast("Verificação automática atualizada."); });
  form.addEventListener("submit", (event) => {
    event.preventDefault(); const fields = Object.fromEntries(new FormData(form).entries()); const message = document.querySelector("[data-audit-message]"); message.textContent = "";
    if (!fields.summary?.trim() || !fields.recommendations?.trim() || !fields.acceptanceJustification?.trim() || !form.elements.acceptance.checked) { message.textContent = "Preencha o resumo, os ajustes, a justificativa e confirme ciência."; return; }
    const alerts = currentAlerts.map((item) => ({ ...item })); if (fields.manualSeverity && fields.manualAlertTitle.trim()) { const [sourceType = "Campanha", sourceId = campaignSelect.value] = String(fields.manualSource || `Campanha|${campaignSelect.value}`).split("|"); alerts.push({ id: store.newId("alert"), severity: fields.manualSeverity, title: fields.manualAlertTitle.trim(), detail: fields.manualAlertDetail.trim() || "Alerta registrado pela equipe.", sourceType, sourceId }); }
    const checklist = Object.fromEntries(["privacy", "advertising", "copyright", "imageRights", "accessibility", "channelRules", "children", "repeatedContact"].map((key) => [key, fields[key]]));
    if (alerts.some((item) => item.severity === "Bloqueador") && fields.result !== "Desfavorável") { message.textContent = "Um alerta bloqueador exige parecer Desfavorável até que uma nova revisão confirme o ajuste."; return; }
    if (Object.values(checklist).includes("Precisa de ajuste") && fields.result === "Favorável") { message.textContent = "O checklist contém ajustes pendentes. Use Favorável com ajustes ou Desfavorável."; return; }
    if (!confirm(`Registrar o parecer “${fields.result}” como revisão imutável? Depois de salvo, qualquer alteração exigirá uma nova revisão.`)) return;
    store.saveAudit({ campaignId: campaignSelect.value, result: fields.result, riskLevel: fields.riskLevel, summary: fields.summary.trim(), offerSummary: fields.offerSummary.trim(), checklist, checklistNotes: fields.checklistNotes.trim(), alerts, recommendations: fields.recommendations.trim(), reviewedBy: shell.session.usuario.nome, acceptedBy: shell.session.usuario.nome, acceptedAt: new Date().toISOString(), acceptanceJustification: fields.acceptanceJustification.trim() });
    form.reset(); document.querySelectorAll("[data-checklist] select").forEach((select) => { select.value = "Atendido"; }); renderCampaign(); renderCounts(); shell.toast("Parecer imutável registrado no histórico.");
  });
  document.querySelector("[data-audit-history]").addEventListener("click", (event) => { const button = event.target.closest("[data-print-audit]"); if (button) printAudit(button.dataset.printAudit); }); document.querySelector("[data-print-current]").addEventListener("click", () => printAudit());
  document.querySelectorAll("[data-checklist] select").forEach((select) => { select.value = "Atendido"; }); renderCampaign(); renderCounts();
}());
