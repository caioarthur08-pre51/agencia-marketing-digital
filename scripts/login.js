(function () {
  "use strict";

  const auth = window.EloAuth;
  const mensagemGlobal = document.querySelector("#mensagem-global");
  const views = Array.from(document.querySelectorAll("[data-view]"));
  let emailRecuperacao = "";

  function mostrarMensagem(texto, tipo = "erro") {
    mensagemGlobal.textContent = texto;
    mensagemGlobal.classList.toggle("sucesso", tipo === "sucesso");
    mensagemGlobal.hidden = false;
    mensagemGlobal.focus?.();
  }

  function limparMensagem() {
    mensagemGlobal.textContent = "";
    mensagemGlobal.hidden = true;
    mensagemGlobal.classList.remove("sucesso");
  }

  function abrirView(nome) {
    limparMensagem();
    views.forEach((view) => { view.hidden = view.dataset.view !== nome; });
    history.replaceState(null, "", nome === "login" ? "login.html" : `#${nome}`);
    const titulo = document.querySelector(`[data-view="${nome}"] h2`);
    titulo?.setAttribute("tabindex", "-1");
    titulo?.focus();
  }

  function definirErro(id, mensagem) {
    const campo = document.getElementById(id);
    const saida = document.querySelector(`[data-erro="${id}"]`);
    const grupo = campo?.closest(".campo-formulario");
    if (saida) saida.textContent = mensagem;
    grupo?.classList.toggle("invalido", Boolean(mensagem));
    campo?.setAttribute("aria-invalid", mensagem ? "true" : "false");
    if (saida && mensagem) campo?.setAttribute("aria-describedby", `erro-${id}`);
    if (saida) saida.id = `erro-${id}`;
  }

  function limparErros(formulario) {
    formulario.querySelectorAll(".erro-campo").forEach((saida) => { saida.textContent = ""; });
    formulario.querySelectorAll(".campo-formulario").forEach((grupo) => grupo.classList.remove("invalido"));
    formulario.querySelectorAll("[aria-invalid]").forEach((campo) => campo.setAttribute("aria-invalid", "false"));
  }

  function emailValido(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function alternarCarregamento(botao, carregando, textoCarregando = "Aguarde...") {
    if (!botao) return;
    if (carregando) {
      botao.dataset.conteudoAnterior = botao.innerHTML;
      botao.textContent = textoCarregando;
      botao.disabled = true;
    } else {
      botao.innerHTML = botao.dataset.conteudoAnterior || botao.dataset.textoPadrao || "Continuar";
      botao.disabled = false;
    }
  }

  document.querySelectorAll("[data-abrir-view]").forEach((botao) => {
    botao.addEventListener("click", () => abrirView(botao.dataset.abrirView));
  });

  document.querySelectorAll("[data-alternar-senha]").forEach((botao) => {
    botao.addEventListener("click", () => {
      const campo = document.getElementById(botao.dataset.alternarSenha);
      const mostrar = campo.type === "password";
      campo.type = mostrar ? "text" : "password";
      botao.setAttribute("aria-label", mostrar ? "Ocultar senha" : "Mostrar senha");
      botao.setAttribute("aria-pressed", String(mostrar));
      campo.focus();
    });
  });

  document.querySelector("[data-preencher-demo]")?.addEventListener("click", () => {
    document.querySelector("#login-email").value = auth.DEMO.email;
    document.querySelector("#login-senha").value = auth.DEMO.senha;
    document.querySelector("#login-senha").focus();
    limparMensagem();
  });

  document.querySelector("#form-login")?.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    limparMensagem();
    limparErros(formulario);

    const email = auth.normalizarEmail(formulario.email.value);
    const senha = formulario.senha.value;
    let valido = true;

    if (!emailValido(email)) {
      definirErro("login-email", "Informe um e-mail válido.");
      valido = false;
    }
    if (!senha) {
      definirErro("login-senha", "Digite sua senha.");
      valido = false;
    }
    if (!valido) {
      formulario.querySelector("[aria-invalid='true']")?.focus();
      return;
    }

    const botao = formulario.querySelector("button[type='submit']");
    alternarCarregamento(botao, true, "Verificando...");

    try {
      const usuario = await auth.autenticar(email, senha);
      if (!usuario) {
        mostrarMensagem("E-mail ou senha incorretos. Confira os dados ou use a conta de demonstração.");
        definirErro("login-senha", "Não foi possível validar esta credencial.");
        return;
      }
      auth.criarSessao(usuario, formulario.lembrar.checked);
      window.location.href = "dashboard.html";
    } catch (erro) {
      mostrarMensagem(erro.message || "Não foi possível acessar o protótipo neste navegador.");
    } finally {
      alternarCarregamento(botao, false);
    }
  });

  document.querySelector("#form-cadastro")?.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    limparMensagem();
    limparErros(formulario);

    const nome = formulario.nome.value.trim();
    const email = auth.normalizarEmail(formulario.email.value);
    const senha = formulario.senha.value;
    const confirmacao = formulario.confirmacao.value;
    const aceite = formulario.aceite.checked;
    let valido = true;

    if (nome.length < 2) { definirErro("cadastro-nome", "Informe um nome de demonstração."); valido = false; }
    if (!emailValido(email)) { definirErro("cadastro-email", "Informe um e-mail fictício válido."); valido = false; }
    if (senha.length < 6) { definirErro("cadastro-senha", "Use pelo menos 6 caracteres."); valido = false; }
    if (senha !== confirmacao) { definirErro("cadastro-confirmacao", "As senhas precisam ser iguais."); valido = false; }
    if (!aceite) { definirErro("aceite-dados", "Confirme o uso exclusivo de dados fictícios."); valido = false; }

    if (!valido) {
      formulario.querySelector("[aria-invalid='true']")?.focus();
      return;
    }

    const botao = formulario.querySelector("button[type='submit']");
    alternarCarregamento(botao, true, "Criando conta...");

    try {
      await auth.criarUsuario({ nome, email, senha });
      formulario.reset();
      abrirView("login");
      document.querySelector("#login-email").value = email;
      mostrarMensagem("Conta local criada. Agora entre com a senha que você definiu.", "sucesso");
      document.querySelector("#login-senha").focus();
    } catch (erro) {
      if (erro.codigo === "EMAIL_EXISTENTE") definirErro("cadastro-email", erro.message);
      else mostrarMensagem(erro.message || "Não foi possível criar a conta local.");
    } finally {
      alternarCarregamento(botao, false);
    }
  });

  document.querySelector("#form-recuperar")?.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    limparMensagem();
    limparErros(formulario);

    const email = auth.normalizarEmail(formulario.email.value);
    if (!emailValido(email)) {
      definirErro("recuperar-email", "Informe um e-mail válido.");
      formulario.email.focus();
      return;
    }

    const botao = formulario.querySelector("button[type='submit']");
    alternarCarregamento(botao, true, "Simulando envio...");

    try {
      await new Promise((resolver) => window.setTimeout(resolver, 450));
      const usuario = auth.localizarUsuario(email);
      if (!usuario) {
        mostrarMensagem("Nenhuma conta local foi encontrada. Confira o e-mail ou crie uma nova conta.");
        return;
      }
      if (usuario.demonstracao) {
        mostrarMensagem("E-mail simulado enviado. A conta de demonstração mantém a senha fixa 123456.", "sucesso");
        return;
      }

      emailRecuperacao = email;
      document.querySelector("#form-nova-senha").hidden = false;
      document.querySelector("#nova-senha").focus();
    } finally {
      alternarCarregamento(botao, false);
    }
  });

  document.querySelector("#form-nova-senha")?.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    limparMensagem();
    limparErros(formulario);

    const senha = formulario.senha.value;
    const confirmacao = formulario.confirmacao.value;
    let valido = true;
    if (senha.length < 6) { definirErro("nova-senha", "Use pelo menos 6 caracteres."); valido = false; }
    if (senha !== confirmacao) { definirErro("nova-senha-confirmacao", "As senhas precisam ser iguais."); valido = false; }
    if (!valido) return;

    const botao = formulario.querySelector("button[type='submit']");
    alternarCarregamento(botao, true, "Salvando...");
    try {
      await auth.redefinirSenha(emailRecuperacao, senha);
      formulario.reset();
      formulario.hidden = true;
      abrirView("login");
      document.querySelector("#login-email").value = emailRecuperacao;
      mostrarMensagem("Senha local atualizada. Entre novamente com a nova senha.", "sucesso");
    } catch (erro) {
      mostrarMensagem(erro.message || "Não foi possível redefinir a senha.");
    } finally {
      alternarCarregamento(botao, false);
    }
  });

  async function iniciar() {
    try {
      await auth.garantirUsuarioDemonstracao();
      const emailLembrado = auth.obterEmailLembrado();
      if (emailLembrado) {
        document.querySelector("#login-email").value = emailLembrado;
        document.querySelector("#lembrar").checked = true;
      }
      if (new URLSearchParams(window.location.search).has("saiu")) {
        mostrarMensagem("Sessão encerrada com sucesso.", "sucesso");
      }
      const hash = window.location.hash.replace("#", "");
      if (["cadastro", "recuperar"].includes(hash)) abrirView(hash);
    } catch (erro) {
      mostrarMensagem(erro.message || "O armazenamento local não está disponível neste navegador.");
    }
  }

  iniciar();
}());
