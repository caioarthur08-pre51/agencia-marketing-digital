(function () {
  "use strict";

  const auth = window.EloAuth;
  const dataStore = window.EloData;
  const sessao = auth.obterSessao();

  if (!sessao?.usuario) {
    window.location.replace("login.html?acesso=necessario");
    return;
  }

  const dados = dataStore?.ensureDemoData();
  if (dados) {
    document.querySelector("[data-count-companies]").textContent = dados.companies.length;
    document.querySelector("[data-count-copies]").textContent = dados.copies.length;
    document.querySelector("[data-count-briefings]").textContent = dados.briefings.length;
    document.querySelector("[data-count-campaigns]").textContent = dados.campaigns.length;
    document.querySelector("[data-count-audits]").textContent = dados.audits.length;
    const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
    const auditoriasAtuais = dados.campaigns.map((campanha) => dataStore.latestAudit(dados, campanha.id)).filter(Boolean);
    document.querySelector("[data-summary-active]").textContent = dados.campaigns.filter((campanha) => campanha.managerStatus === "Em andamento").length;
    document.querySelector("[data-summary-investment]").textContent = moeda.format(dados.campaigns.reduce((total, campanha) => total + Number(campanha.results?.investment || 0), 0));
    document.querySelector("[data-summary-copies]").textContent = dados.copies.length;
    document.querySelector("[data-summary-briefings]").textContent = dados.briefings.length;
    document.querySelector("[data-summary-pending]").textContent = dados.campaigns.filter((campanha) => !dataStore.auditGate(dados, campanha.id).allowed).length;
    document.querySelector("[data-summary-alerts]").textContent = auditoriasAtuais.reduce((total, auditoria) => total + (auditoria.alerts || []).length, 0);
  }

  const nome = sessao.usuario.nome || "Integrante";
  const primeiroNome = nome.trim().split(/\s+/)[0];
  const iniciais = nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("") || "ED";

  document.querySelectorAll("[data-primeiro-nome]").forEach((elemento) => { elemento.textContent = primeiroNome; });
  document.querySelectorAll("[data-nome-menu]").forEach((elemento) => { elemento.textContent = nome; });
  document.querySelectorAll("[data-avatar]").forEach((elemento) => { elemento.textContent = iniciais; });

  const data = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date());
  const saidaData = document.querySelector("[data-data-painel]");
  if (saidaData) saidaData.textContent = `Acesso em ${data}`;

  document.querySelector("[data-sair]")?.addEventListener("click", () => {
    auth.encerrarSessao();
    window.location.replace("login.html?saiu=1");
  });
}());
