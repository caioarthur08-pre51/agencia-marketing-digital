# Agência Elo Digital

Protótipo acadêmico de uma agência fictícia de marketing digital voltada a pequenos
negócios e profissionais autônomos. A versão atual implementa a Home pública,
cadastro e autenticação demonstrativos, painel interno e os módulos integrados de
CRM, Copy e Editor. Gestor e Auditoria permanecem identificados como “Em breve”.

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
- painel interno com contadores reais e encerramento de sessão;
- CRM com cadastro, consulta, edição e exclusão de empresas e campanhas;
- pesquisa, filtro por status e ordenação no CRM;
- pontuação demonstrativa de potencial para priorização de contatos;
- backup completo em JSON, importação de JSON e exportação do CRM em CSV;
- Copy com modelos locais para legenda, story, anúncio, WhatsApp e e-mail;
- validações para prova social, urgência e escassez, sem inventar evidências;
- geração de prompt para uma ferramenta externa de IA, sem uso de API;
- histórico de textos com edição, duplicação, exclusão e exportação TXT;
- Editor com formatos de feed, story, reel e capa de reel;
- personalização de conteúdo, cores, alinhamento, posição, tamanho e peso;
- upload de imagem somente para a sessão e exportação da prévia em PNG;
- histórico de briefings com edição, duplicação e exclusão;
- integração dos três módulos por um mesmo identificador de campanha;
- dados demonstrativos vinculados da empresa fictícia Café do Bairro;
- acessibilidade por teclado, foco visível e respeito à redução de movimento.

## Fluxo entre CRM, Copy e Editor

1. No **CRM**, cadastre uma empresa e crie uma campanha vinculada a ela. Empresa,
   produto ou serviço e objetivo formam o contexto compartilhado.
2. No **Copy**, selecione a campanha. O sistema recupera o contexto, gera uma
   sugestão local editável e prepara um prompt para uma ferramenta externa.
3. No **Editor**, selecione a mesma campanha e, se desejar, importe uma versão
   salva no Copy. O briefing visual pode ser salvo e a prévia exportada em PNG.

Todos os registros ficam na chave `eloDigital.dados.v2` do `localStorage`. O botão
“Restaurar demonstração” inclui novamente apenas os exemplos ausentes e preserva
os registros criados pela equipe.

## Importação e exportação

- **Exportar JSON:** gera um backup completo de empresas, campanhas, copies e
  briefings. Contas e sessões de login não fazem parte do arquivo.
- **Importar JSON:** substitui os dados dos três módulos pelos dados do backup,
  após uma confirmação explícita.
- **Exportar CSV:** gera uma tabela do CRM com codificação UTF-8 e separador por
  ponto e vírgula, adequada para abertura no Excel.
- **TXT:** cada versão salva no Copy pode ser baixada como texto.
- **PNG:** a composição visível no Editor é renderizada como uma imagem estática.
  Um briefing de vídeo não gera o vídeo final.

## Regra da pontuação de potencial

A pontuação é um indicador demonstrativo em escala de 0 a 100 pontos, e não uma
probabilidade de venda.

- base por status: Novo contato = 25, Em análise = 45 e Proposta = 70;
- último contato em até 7 dias: +15 pontos;
- entre 8 e 30 dias: +5 pontos;
- entre 31 e 60 dias: -10 pontos;
- acima de 60 dias: -20 pontos;
- o resultado é limitado ao intervalo de 0 a 100;
- Cliente aparece como “Convertido” e Inativo como “Sem priorização”.

## Privacidade e limites

- não existe servidor, banco de dados ou autenticação real;
- nenhuma informação é transmitida pela rede;
- contas criadas ficam no `localStorage` do navegador;
- sem “Lembrar-me”, a sessão fica no `sessionStorage` e termina ao fechar a aba;
- com “Lembrar-me”, a sessão e o e-mail ficam no `localStorage`;
- a senha é representada por hash derivado e salt, mas o ambiente continua sendo apenas demonstrativo;
- limpar os dados do navegador remove as contas locais.
- imagens escolhidas no Editor não são persistidas; ao reabrir um briefing, a
  interface solicita que a imagem seja selecionada novamente;
- a importação de backup pode substituir os registros existentes dos módulos.

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

## Validação manual

- [x] Login com `admin@agencia.com` / `123456` abre o painel;
- [x] painel exibe CRM, Copy e Editor como disponíveis e atualiza contadores;
- [x] CRM lista a demonstração e calcula 85 pontos para Proposta com contato recente;
- [x] formulário do CRM abre, fecha e apresenta os campos obrigatórios;
- [x] Copy recupera o contexto da campanha selecionada;
- [x] urgência sem prazo e prova social sem evidência impedem a geração;
- [x] Copy gera texto editável e prompt local sem chamadas externas;
- [x] Editor importa uma versão do Copy da mesma campanha;
- [x] troca entre Feed, Story, Reel e Capa de reel atualiza dimensões e duração;
- [x] layout do CRM foi verificado em viewport móvel de 390 × 844 px;
- [x] scripts verificados com `node --check` e sem novos erros no console.

## Equipe

- Caio — Coordenação Geral e Integração;
- Guilherme Almeida — Arquitetura e Desenvolvimento;
- Letícia Costa — Conteúdo e Coerência Acadêmica;
- Larissa Costa — Design e Organização Visual;
- Prof. Me. Juaceli Soares da Costa Junior — Professor orientador.

Projeto acadêmico de Marketing Digital — 2026.
