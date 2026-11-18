(function () {
  "use strict";

  const auth = window.EloAuth;
  const session = auth?.obterSessao();
  if (!session?.usuario) {
    window.location.replace(`login.html?acesso=necessario&destino=${encodeURIComponent(location.pathname.split("/").pop() || "dashboard.html")}`);
    return;
  }

  window.EloData?.ensureDemoData();
  const name = session.usuario.nome || "Integrante";
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "ED";
  document.querySelectorAll("[data-nome-menu]").forEach((element) => { element.textContent = name; });
  document.querySelectorAll("[data-avatar]").forEach((element) => { element.textContent = initials; });
  document.querySelector("[data-sair]")?.addEventListener("click", () => {
    auth.encerrarSessao();
    window.location.replace("login.html?saiu=1");
  });

  let toastTimer;
  function toast(message, kind = "success") {
    let region = document.querySelector("[data-toast]");
    if (!region) {
      region = document.createElement("div");
      region.className = "toast-modulo";
      region.dataset.toast = "";
      region.setAttribute("role", "status");
      region.setAttribute("aria-live", "polite");
      document.body.append(region);
    }
    region.textContent = message;
    region.dataset.kind = kind;
    region.classList.add("visivel");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => region.classList.remove("visivel"), 3200);
  }

  function download(name, content, type = "text/plain;charset=utf-8") {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([content], { type }));
    link.download = name;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  function formatDate(value) {
    if (!value) return "—";
    const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("pt-BR").format(date);
  }

  function campaignLabel(campaign, data = window.EloData.load()) {
    const company = data.companies.find((item) => item.id === campaign.companyId);
    return `${company?.name || "Empresa removida"} · ${campaign.product}`;
  }

  window.EloShell = Object.freeze({ session, toast, download, formatDate, campaignLabel });
}());
