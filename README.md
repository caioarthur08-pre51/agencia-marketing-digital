# Agência Elo Digital

Protótipo acadêmico de uma agência fictícia de marketing digital voltada a pequenos
negócios e profissionais autônomos. A primeira entrega implementa a Home pública,
cadastro e autenticação demonstrativos e um painel interno com a visão dos cinco
módulos planejados: CRM, Copy, Editor, Gestor e Auditoria.

## Acesso publicado

`https://caioarthur08-pre51.github.io/agencia-marketing-digital/`

## Credenciais de demonstração

- E-mail: `admin@agencia.com`
- Senha: `123456`

As credenciais são públicas porque este é um ambiente acadêmico demonstrativo. O
painel simula o acesso de um integrante, mas não oferece proteção para contas reais.

## Funcionalidades desta etapa

- landing page responsiva com catálogo dos cinco serviços;
- identidade visual própria da Agência Elo Digital;
- cadastro local com aviso para uso exclusivo de dados fictícios;
- senha derivada com Web Crypto/PBKDF2, sem armazenamento da senha em texto puro;
- login, validação de campos e mensagens de erro;
- opção de mostrar ou ocultar senha;
- sessão temporária ou persistente conforme a opção “Lembrar-me”;
- recuperação de senha com envio de e-mail simulado e redefinição local;
- painel interno e encerramento de sessão;
- acessibilidade por teclado, foco visível e respeito à redução de movimento.

## Privacidade e limites

- não existe servidor, banco de dados ou autenticação real;
- nenhuma informação é transmitida pela rede;
- contas criadas ficam no `localStorage` do navegador;
- sem “Lembrar-me”, a sessão fica no `sessionStorage` e termina ao fechar a aba;
- com “Lembrar-me”, a sessão e o e-mail ficam no `localStorage`;
- a senha é representada por hash derivado e salt, mas o ambiente continua sendo apenas demonstrativo;
- limpar os dados do navegador remove as contas locais.

## Execução local

Na pasta do projeto, inicie um servidor HTTP estático. Exemplo:

```powershell
python -m http.server 4173
```

Depois, abra `http://localhost:4173/`. O uso de HTTP em `localhost` ou de HTTPS na
publicação é necessário para o Web Crypto usado na derivação das senhas.

## Tecnologia

HTML, CSS e JavaScript puros, sem framework, dependências de execução ou serviço
externo. As fontes Manrope e Inter estão incluídas localmente sob a Open Font License.

## Equipe

- Caio — Coordenação Geral e Integração;
- Guilherme Almeida — Arquitetura e Desenvolvimento;
- Letícia Costa — Conteúdo e Coerência Acadêmica;
- Larissa Costa — Design e Organização Visual.

Projeto acadêmico de Marketing Digital — 2026.
