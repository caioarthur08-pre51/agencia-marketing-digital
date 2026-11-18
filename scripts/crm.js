(function () {
  "use strict";

  const store = window.EloData;
  const shell = window.EloShell;
  if (!store || !shell) return;

  const companyDialog = document.querySelector("[data-company-dialog]");
  const companyForm = document.querySelector("[data-company-form]");
  const campaignDialog = document.querySelector("[data-campaign-dialog]");
  const campaignForm = document.querySelector("[data-campaign-form]");
  const list = document.querySelector("[data-company-list]");
  const campaignList = document.querySelector("[data-campaign-list]");
  const search = document.querySelector("[data-search]");
  const statusFilter = document.querySelector("[data-filter-status]");
  const sort = document.querySelector("[data-sort]");

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
  }
  function formRecord(form) { return Object.fromEntries(new FormData(form).entries()); }
  function setSelectOptions(select, values, placeholder = "") {
    select.innerHTML = placeholder ? `<option value="">${escapeHtml(placeholder)}</option>` : "";
    values.forEach((value) => select.add(new Option(value, value)));
  }
  function clearErrors(form) {
    form.querySelectorAll("[data-error-for]").forEach((item) => { item.textContent = ""; });
    form.querySelectorAll("[aria-invalid]").forEach((item) => item.removeAttribute("aria-invalid"));
  }
  function validate(form, fields) {
    clearErrors(form);
    let valid = true;
    fields.forEach((name) => {
      const input = form.elements[name];
      if (!String(input?.value || "").trim()) {
        valid = false;
        input?.setAttribute("aria-invalid", "true");
        const error = form.querySelector(`[data-error-for="${name}"]`);
        if (error) error.textContent = "Preencha este campo.";
      }
    });
    form.querySelector("[aria-invalid]")?.focus();
    return valid;
  }

  function openCompany(record = null) {
    companyForm.reset(); clearErrors(companyForm);
    companyForm.elements.lastContact.value = new Date().toISOString().slice(0, 10);
    companyForm.elements.status.value = "Novo contato";
    document.querySelector("[data-company-title]").textContent = record ? "Editar empresa" : "Adicionar empresa";
    if (record) Object.entries(record).forEach(([key, value]) => { if (companyForm.elements[key]) companyForm.elements[key].value = value ?? ""; });
    companyDialog.showModal();
    setTimeout(() => companyForm.elements.name.focus(), 50);
  }

  function refreshCampaignCompanyOptions(selected = "") {
    const data = store.load();
    const select = campaignForm.elements.companyId;
    select.innerHTML = '<option value="">Selecione uma empresa</option>';
    data.companies.slice().sort((a, b) => a.name.localeCompare(b.name, "pt-BR")).forEach((company) => select.add(new Option(company.name, company.id)));
    select.value = selected;
  }

  function openCampaign(record = null) {
    const data = store.load();
    if (!data.companies.length) { shell.toast("Cadastre uma empresa antes de criar a campanha.", "error"); openCompany(); return; }
    campaignForm.reset(); clearErrors(campaignForm); refreshCampaignCompanyOptions(record?.companyId || "");
    document.querySelector("[data-campaign-title]").textContent = record ? "Editar campanha" : "Nova campanha";
    if (record) Object.entries(record).forEach(([key, value]) => { if (campaignForm.elements[key]) campaignForm.elements[key].value = value ?? ""; });
    campaignDialog.showModal();
    setTimeout(() => campaignForm.elements.companyId.focus(), 50);
  }

  function scoreMarkup(company) {
    const score = store.potential(company);
    if (score.kind !== "score") return `<span class="estado-pontuacao ${score.kind}">${escapeHtml(score.label)}</span>`;
    return `<div class="pontuacao-potencial"><div><strong>${score.value}</strong><span> / 100</span></div><span class="trilho-pontuacao" aria-label="${score.value} de 100 pontos"><span style="width:${score.value}%"></span></span></div>`;
  }

  function render() {
    const data = store.load();
    document.querySelector("[data-count-companies]").textContent = data.companies.length;
    document.querySelector("[data-count-campaigns]").textContent = data.campaigns.length;
    document.querySelector("[data-count-proposals]").textContent = data.companies.filter((item) => item.status === "Proposta").length;
    document.querySelector("[data-count-clients]").textContent = data.companies.filter((item) => item.status === "Cliente").length;

    const query = search.value.trim().toLocaleLowerCase("pt-BR");
    let companies = data.companies.filter((company) => {
      const haystack = `${company.name} ${company.segment} ${company.region}`.toLocaleLowerCase("pt-BR");
      return (!query || haystack.includes(query)) && (!statusFilter.value || company.status === statusFilter.value);
    });
    companies.sort((a, b) => {
      if (sort.value === "recent") return String(b.createdAt).localeCompare(String(a.createdAt));
      if (sort.value === "contact") return String(b.lastContact).localeCompare(String(a.lastContact));
      return a.name.localeCompare(b.name, "pt-BR");
    });
    list.innerHTML = companies.map((company) => {
      const count = data.campaigns.filter((campaign) => campaign.companyId === company.id).length;
      return `<tr>
        <td data-label="Empresa"><strong>${escapeHtml(company.name)}</strong><small>${escapeHtml(company.segment)} · ${escapeHtml(company.region)}</small></td>
        <td data-label="Status"><span class="selo-status status-${store.STATUS.indexOf(company.status)}">${escapeHtml(company.status)}</span></td>
        <td data-label="Último contato">${shell.formatDate(company.lastContact)}</td>
        <td data-label="Pontuação de potencial">${scoreMarkup(company)}</td>
        <td data-label="Campanhas">${count}</td>
        <td data-label="Ações"><div class="acoes-linha"><button type="button" data-edit-company="${company.id}">Visualizar / editar</button><button class="acao-perigo" type="button" data-delete-company="${company.id}">Excluir</button></div></td>
      </tr>`;
    }).join("");
    document.querySelector("[data-empty]").hidden = companies.length > 0;
    document.querySelector(".tabela-responsiva").hidden = companies.length === 0;

    campaignList.innerHTML = data.campaigns.slice().sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))).map((campaign) => {
      const company = data.companies.find((item) => item.id === campaign.companyId);
      const copies = data.copies.filter((item) => item.campaignId === campaign.id).length;
      const briefings = data.briefings.filter((item) => item.campaignId === campaign.id).length;
      return `<article class="cartao-campanha"><div><span class="selo-disponivel">Ativa no protótipo</span><h3>${escapeHtml(campaign.product)}</h3><p>${escapeHtml(company?.name || "Empresa removida")} · ${escapeHtml(campaign.objective)}</p></div><dl><div><dt>Copies</dt><dd>${copies}</dd></div><div><dt>Peças</dt><dd>${briefings}</dd></div></dl><div class="acoes-linha"><a href="copy.html?campanha=${campaign.id}">Abrir no Copy</a><a href="editor.html?campanha=${campaign.id}">Abrir no Editor</a><button type="button" data-edit-campaign="${campaign.id}">Editar</button><button class="acao-perigo" type="button" data-delete-campaign="${campaign.id}">Excluir</button></div></article>`;
    }).join("");
    document.querySelector("[data-campaign-empty]").hidden = data.campaigns.length > 0;
  }

  companyForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validate(companyForm, ["name", "segment", "region", "status", "lastContact", "audienceSummary"])) return;
    const current = store.load().companies.find((item) => item.id === companyForm.elements.id.value);
    store.saveCompany({ ...current, ...formRecord(companyForm), demo: current?.demo || false });
    companyDialog.close(); render(); shell.toast(current ? "Empresa atualizada." : "Empresa cadastrada.");
  });
  campaignForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validate(campaignForm, ["companyId", "product", "objective"])) return;
    const current = store.load().campaigns.find((item) => item.id === campaignForm.elements.id.value);
    store.saveCampaign({ ...current, ...formRecord(campaignForm), demo: current?.demo || false });
    campaignDialog.close(); render(); shell.toast(current ? "Campanha atualizada." : "Campanha criada e integrada aos módulos.");
  });

  document.querySelectorAll("[data-open-company]").forEach((button) => button.addEventListener("click", () => openCompany()));
  document.querySelectorAll("[data-open-campaign]").forEach((button) => button.addEventListener("click", () => openCampaign()));
  document.querySelectorAll("[data-close-dialog]").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));
  [search, statusFilter, sort].forEach((control) => control.addEventListener("input", render));
  list.addEventListener("click", (event) => {
    const edit = event.target.closest("[data-edit-company]");
    const remove = event.target.closest("[data-delete-company]");
    if (edit) openCompany(store.load().companies.find((item) => item.id === edit.dataset.editCompany));
    if (remove) {
      const company = store.load().companies.find((item) => item.id === remove.dataset.deleteCompany);
      if (company && confirm(`Excluir ${company.name} e todas as campanhas, copies e peças vinculadas? Esta ação não pode ser desfeita.`)) { store.removeCompany(company.id); render(); shell.toast("Empresa e registros vinculados excluídos."); }
    }
  });
  campaignList.addEventListener("click", (event) => {
    const edit = event.target.closest("[data-edit-campaign]");
    const remove = event.target.closest("[data-delete-campaign]");
    if (edit) openCampaign(store.load().campaigns.find((item) => item.id === edit.dataset.editCampaign));
    if (remove) {
      const campaign = store.load().campaigns.find((item) => item.id === remove.dataset.deleteCampaign);
      if (campaign && confirm(`Excluir a campanha “${campaign.product}” e todo o histórico vinculado no Copy e no Editor?`)) { store.removeCampaign(campaign.id); render(); shell.toast("Campanha e registros vinculados excluídos."); }
    }
  });

  document.querySelector("[data-export-json]").addEventListener("click", () => shell.download(`elo-digital-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(store.load(), null, 2), "application/json"));
  document.querySelector("[data-export-csv]").addEventListener("click", () => {
    const data = store.load();
    const quote = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const header = ["Empresa", "Segmento", "Região", "Status", "Último contato", "Pontuação", "Campanha", "Produto/serviço", "Objetivo"];
    const rows = [];
    data.companies.forEach((company) => {
      const campaigns = data.campaigns.filter((item) => item.companyId === company.id);
      const score = store.potential(company).label;
      (campaigns.length ? campaigns : [{}]).forEach((campaign) => rows.push([company.name, company.segment, company.region, company.status, company.lastContact, score, campaign.id || "", campaign.product || "", campaign.objective || ""]));
    });
    shell.download(`elo-digital-crm-${new Date().toISOString().slice(0, 10)}.csv`, `\ufeff${[header, ...rows].map((row) => row.map(quote).join(";")).join("\r\n")}`, "text/csv;charset=utf-8");
  });
  document.querySelector("[data-import-json]").addEventListener("change", async (event) => {
    const file = event.target.files[0]; if (!file) return;
    try {
      if (!confirm("Importar este backup substituirá os dados de CRM, Copy e Editor salvos neste navegador. Deseja continuar?")) return;
      store.importBackup(await file.text()); render(); shell.toast("Backup importado com sucesso.");
    } catch (error) { shell.toast(error.message || "Não foi possível importar o arquivo.", "error"); }
    finally { event.target.value = ""; }
  });
  document.querySelector("[data-restore-demo]").addEventListener("click", () => { store.ensureDemoData(); render(); shell.toast("Exemplos ausentes foram restaurados sem apagar seus registros."); });

  setSelectOptions(companyForm.elements.status, store.STATUS);
  setSelectOptions(campaignForm.elements.objective, store.OBJETIVOS, "Selecione um objetivo");
  setSelectOptions(statusFilter, store.STATUS, "Todos os status");
  render();
}());
