(function () {
  "use strict";

  const CHAVES = Object.freeze({
    usuarios: "eloDigital.usuarios.v1",
    sessaoPersistente: "eloDigital.sessao.v1",
    sessaoTemporaria: "eloDigital.sessaoTemporaria.v1",
    emailLembrado: "eloDigital.emailLembrado.v1"
  });

  const DEMO = Object.freeze({
    nome: "Equipe Elo",
    email: "admin@agencia.com",
    senha: "123456"
  });

  const encoder = new TextEncoder();

  function normalizarEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function lerJson(storage, chave, fallback) {
    try {
      const valor = storage.getItem(chave);
      return valor ? JSON.parse(valor) : fallback;
    } catch (_erro) {
      return fallback;
    }
  }

  function salvarJson(storage, chave, valor) {
    storage.setItem(chave, JSON.stringify(valor));
  }

  function bytesParaBase64(bytes) {
    let binario = "";
    bytes.forEach((byte) => { binario += String.fromCharCode(byte); });
    return btoa(binario);
  }

  function base64ParaBytes(valor) {
    const binario = atob(valor);
    return Uint8Array.from(binario, (caractere) => caractere.charCodeAt(0));
  }

  function idAleatorio() {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  async function derivarHash(senha, saltBase64) {
    if (!crypto?.subtle) {
      const erro = new Error("Abra o protótipo em HTTPS ou por um servidor local para usar o login.");
      erro.codigo = "CRYPTO_INDISPONIVEL";
      throw erro;
    }

    const salt = saltBase64 ? base64ParaBytes(saltBase64) : crypto.getRandomValues(new Uint8Array(16));
    const material = await crypto.subtle.importKey(
      "raw",
      encoder.encode(senha),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations: 120000, hash: "SHA-256" },
      material,
      256
    );

    return {
      salt: bytesParaBase64(salt),
      hash: bytesParaBase64(new Uint8Array(bits))
    };
  }

  function obterUsuarios() {
    const usuarios = lerJson(localStorage, CHAVES.usuarios, []);
    return Array.isArray(usuarios) ? usuarios : [];
  }

  function salvarUsuarios(usuarios) {
    salvarJson(localStorage, CHAVES.usuarios, usuarios);
  }

  function localizarUsuario(email) {
    const emailNormalizado = normalizarEmail(email);
    return obterUsuarios().find((usuario) => usuario.email === emailNormalizado) || null;
  }

  async function criarUsuario({ nome, email, senha, demonstracao = false }) {
    const emailNormalizado = normalizarEmail(email);
    const usuarios = obterUsuarios();

    if (usuarios.some((usuario) => usuario.email === emailNormalizado)) {
      const erro = new Error("Já existe uma conta local com este e-mail.");
      erro.codigo = "EMAIL_EXISTENTE";
      throw erro;
    }

    const credencial = await derivarHash(senha);
    const usuario = {
      id: idAleatorio(),
      nome: String(nome).trim(),
      email: emailNormalizado,
      salt: credencial.salt,
      hash: credencial.hash,
      demonstracao,
      criadoEm: new Date().toISOString()
    };

    usuarios.push(usuario);
    salvarUsuarios(usuarios);
    return { id: usuario.id, nome: usuario.nome, email: usuario.email, demonstracao };
  }

  async function garantirUsuarioDemonstracao() {
    if (localizarUsuario(DEMO.email)) return;
    await criarUsuario({
      nome: DEMO.nome,
      email: DEMO.email,
      senha: DEMO.senha,
      demonstracao: true
    });
  }

  async function autenticar(email, senha) {
    const usuario = localizarUsuario(email);
    if (!usuario) return null;

    const credencial = await derivarHash(senha, usuario.salt);
    if (credencial.hash !== usuario.hash) return null;

    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      demonstracao: Boolean(usuario.demonstracao)
    };
  }

  function criarSessao(usuario, lembrar) {
    const sessao = {
      token: idAleatorio(),
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        demonstracao: Boolean(usuario.demonstracao)
      },
      iniciadaEm: new Date().toISOString(),
      persistente: Boolean(lembrar)
    };

    localStorage.removeItem(CHAVES.sessaoPersistente);
    sessionStorage.removeItem(CHAVES.sessaoTemporaria);

    if (lembrar) {
      salvarJson(localStorage, CHAVES.sessaoPersistente, sessao);
      localStorage.setItem(CHAVES.emailLembrado, usuario.email);
    } else {
      salvarJson(sessionStorage, CHAVES.sessaoTemporaria, sessao);
      localStorage.removeItem(CHAVES.emailLembrado);
    }

    return sessao;
  }

  function obterSessao() {
    return lerJson(localStorage, CHAVES.sessaoPersistente, null)
      || lerJson(sessionStorage, CHAVES.sessaoTemporaria, null);
  }

  function encerrarSessao() {
    localStorage.removeItem(CHAVES.sessaoPersistente);
    sessionStorage.removeItem(CHAVES.sessaoTemporaria);
  }

  function obterEmailLembrado() {
    return localStorage.getItem(CHAVES.emailLembrado) || "";
  }

  async function redefinirSenha(email, novaSenha) {
    const emailNormalizado = normalizarEmail(email);
    const usuarios = obterUsuarios();
    const indice = usuarios.findIndex((usuario) => usuario.email === emailNormalizado);

    if (indice < 0) {
      const erro = new Error("Nenhuma conta local foi encontrada com este e-mail.");
      erro.codigo = "USUARIO_NAO_ENCONTRADO";
      throw erro;
    }

    if (usuarios[indice].demonstracao) {
      const erro = new Error("A conta de demonstração mantém a senha fixa 123456. Crie uma conta local para testar a redefinição.");
      erro.codigo = "DEMO_IMUTAVEL";
      throw erro;
    }

    const credencial = await derivarHash(novaSenha);
    usuarios[indice] = {
      ...usuarios[indice],
      salt: credencial.salt,
      hash: credencial.hash,
      senhaAlteradaEm: new Date().toISOString()
    };
    salvarUsuarios(usuarios);
    encerrarSessao();
  }

  window.EloAuth = Object.freeze({
    DEMO,
    garantirUsuarioDemonstracao,
    criarUsuario,
    autenticar,
    criarSessao,
    obterSessao,
    encerrarSessao,
    obterEmailLembrado,
    localizarUsuario,
    redefinirSenha,
    normalizarEmail
  });
}());
