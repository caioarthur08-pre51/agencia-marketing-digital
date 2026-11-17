(function () {
  "use strict";

  const cabecalho = document.querySelector("[data-cabecalho]");
  const botaoMenu = document.querySelector("[data-menu-botao]");
  const menu = document.querySelector("[data-menu]");
  const elementosReveal = Array.from(document.querySelectorAll(".reveal"));

  function atualizarCabecalho() {
    cabecalho?.classList.toggle("rolado", window.scrollY > 14);
  }

  function fecharMenu() {
    if (!botaoMenu || !menu) return;
    botaoMenu.setAttribute("aria-expanded", "false");
    botaoMenu.querySelector(".sr-only").textContent = "Abrir menu";
    menu.classList.remove("aberto");
    document.body.classList.remove("menu-aberto");
  }

  botaoMenu?.addEventListener("click", () => {
    const abrir = botaoMenu.getAttribute("aria-expanded") !== "true";
    botaoMenu.setAttribute("aria-expanded", String(abrir));
    botaoMenu.querySelector(".sr-only").textContent = abrir ? "Fechar menu" : "Abrir menu";
    menu?.classList.toggle("aberto", abrir);
    document.body.classList.toggle("menu-aberto", abrir);
  });

  menu?.querySelectorAll("a").forEach((link) => link.addEventListener("click", fecharMenu));
  window.addEventListener("scroll", atualizarCabecalho, { passive: true });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 860) fecharMenu();
  });
  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") fecharMenu();
  });

  atualizarCabecalho();

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
    elementosReveal.forEach((elemento) => elemento.classList.add("visivel"));
  } else {
    const observador = new IntersectionObserver((entradas) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        entrada.target.classList.add("visivel");
        observador.unobserve(entrada.target);
      });
    }, { threshold: 0.13, rootMargin: "0px 0px -30px" });

    elementosReveal.forEach((elemento) => observador.observe(elemento));
  }
}());
