# Agência Elo Digital

Protótipo acadêmico de uma agência fictícia de marketing digital voltada a pequenos
negócios e profissionais autônomos. O sistema demonstra um fluxo integrado entre
CRM, Copy, Editor, Gestor e Auditoria, além da Home pública, cadastro, login local e
painel interno. Tudo funciona em HTML, CSS e JavaScript puros no GitHub Pages.

## Acesso publicado

<https://caioarthur08-pre51.github.io/agencia-marketing-digital/>

## Credenciais de demonstração

- E-mail: `admin@agencia.com`
- Senha: `123456`

As credenciais são públicas porque este é um ambiente acadêmico demonstrativo. O
painel simula o acesso de um integrante, mas não oferece proteção para contas reais.

## Funcionalidades

- landing page responsiva com os cinco módulos disponíveis;
- identidade visual própria da Agência Elo Digital;
- cadastro local com aviso para uso exclusivo de dados fictícios;
- senha derivada com Web Crypto/PBKDF2, sem armazenamento em texto puro;
- login, recuperação simulada, “Lembrar-me”, validação e encerramento de sessão;
- painel com contadores reais de campanhas, investimento, copies, peças, auditorias e alertas;
- CRM com cadastro, consulta, edição e exclusão de empresas e campanhas;
- pesquisa, filtro, ordenação, indicador demonstrativo de potencial e backup JSON/CSV;
- Copy com modelos locais, regras contra alegações sem evidência, prompt externo e histórico TXT;
- Editor com briefing, formatos para redes sociais, personalização, imagem temporária e PNG;
- Gestor com planejamento, agenda, metas, resultados e publicação simulada;
- Auditoria com verificações automáticas, checklist, alertas, parecer imutável e impressão;
- página de privacidade e resumo de uso de dados nos pontos de entrada do sistema;
- acessibilidade por teclado, foco visível, contraste e respeito à redução de movimento.

## Fluxo integrado

1. No **CRM**, cadastre a empresa e a campanha. Empresa, produto ou serviço,
   objetivo e identificador da campanha formam o contexto compartilhado.
2. No **Copy**, use esse contexto para gerar, editar e salvar uma sugestão de texto
   ou preparar um prompt para uma ferramenta externa de IA.
3. No **Editor**, importe uma copy da campanha, monte o briefing visual e salve a
   composição. A prévia estática pode ser exportada em PNG.
4. No **Gestor**, complete o planejamento, selecione canais e materiais, organize a
   agenda e compare metas com resultados simulados.
5. Na **Auditoria**, revise copies, peças e condições da campanha. O parecer mais
   recente decide se agendamento, ativação e publicação simulada ficam liberados.

Todos os módulos usam o mesmo identificador de campanha. Os registros permanecem
na chave `eloDigital.dados.v2` do `localStorage`; o formato interno atual é a versão
3. A chave foi mantida para migrar automaticamente os dados da etapa anterior, sem
apagar empresas, campanhas, copies ou briefings existentes.

## Gestor de campanhas

Cada campanha pode ser **Orgânica**, **Paga** ou **Híbrida** e percorre os status:

`Rascunho → Planejada → Em produção → Agendada → Em andamento → Pausada → Concluída`

Os canais disponíveis são Instagram, Facebook, WhatsApp, TikTok, YouTube e Google
Ads. Os campos de contas conectadas são apenas demonstrativos e nunca solicitam
senha, token ou credencial real.

O módulo inclui:

- tabela responsiva de campanhas e cartões de resumo;
- orçamento planejado, investimento realizado, receita e saldo de acompanhamento;
- copies e briefings vinculados à mesma campanha;
- agenda simplificada com data, horário, canal, formato e materiais relacionados;
- metas e resultados de alcance, impressões, cliques, contatos, conversões,
  investimento e receita;
- exportação dos dados do Gestor em JSON e CSV;
- botões “Agendar” e “Ativar/Publicar” claramente identificados como simulação.

### Indicadores calculados

- **CTR:** cliques ÷ impressões × 100;
- **CPC:** investimento ÷ cliques;
- **Custo por contato:** investimento ÷ contatos;
- **Taxa de conversão:** conversões ÷ cliques × 100;
- **ROI:** (receita − investimento) ÷ investimento × 100.

Quando o divisor é zero, o sistema mostra “Sem dados suficientes” em vez de gerar
um valor inválido.

## Auditoria e bloqueio

O parecer fica vinculado à campanha inteira, enquanto cada alerta pode apontar para
uma copy ou peça específica. Os resultados disponíveis são **Favorável**,
**Favorável com ajustes** e **Desfavorável**. Os níveis de alerta são
**Informativo**, **Atenção**, **Alto risco** e **Bloqueador**.

Regras locais verificam, entre outros pontos, urgência sem prazo, escassez sem
quantidade, prova social sem evidência, alegação exagerada, ausência de CTA e imagem
sem origem registrada. O checklist da equipe cobre privacidade/LGPD, clareza da
publicidade/CDC, direitos autorais, uso de imagem, acessibilidade e regras dos
canais. A proteção de crianças e adolescentes aparece apenas quando a campanha
marca público menor de idade; a verificação sobre contato reiterado aparece apenas
quando a estratégia indica esse comportamento.

Um parecer **Desfavorável** ou qualquer alerta **Bloqueador** impede:

- mudança de status para “Agendada” ou “Em andamento”;
- inclusão de conteúdo na agenda;
- ativação ou publicação simulada.

Pareceres concluídos são imutáveis. Cada mudança exige uma nova revisão, preservando
responsável, data, decisão, justificativa, checklist, alertas e aceite no histórico.
O relatório pode ser impresso ou salvo em PDF pelo próprio navegador.

## Dados demonstrativos

O botão “Restaurar demonstração” recompõe apenas os exemplos ausentes e preserva os
registros da equipe. A demonstração contém:

- empresa fictícia **Café do Bairro** e campanha de um combo de café da manhã;
- uma copy e uma peça adequadas;
- uma segunda copy com “Só hoje!” sem prazo definido;
- uma segunda peça com imagem sem origem ou licença registrada;
- planejamento, metas, resultados e parecer inicial desfavorável.

Esse segundo conjunto existe para tornar visível o fluxo de alerta e bloqueio da
Auditoria sem alterar os exemplos adequados.

## Importação e exportação

- **Backup JSON do CRM:** empresas, campanhas, copies, briefings, agenda e auditorias;
- **Importar JSON:** aceita o backup completo e normaliza automaticamente dados de versões anteriores;
- **CSV do CRM:** tabela das empresas e campanhas em UTF-8 para planilhas;
- **JSON/CSV do Gestor:** planejamento, agenda, valores e indicadores;
- **TXT do Copy:** versão textual salva;
- **PNG do Editor:** prévia estática da composição;
- **Impressão da Auditoria:** relatório preparado para impressão ou “Salvar como PDF”.

Contas de login e sessões não entram nos arquivos exportados.

## Regra da pontuação de potencial do CRM

A pontuação é um indicador demonstrativo de 0 a 100, e não uma probabilidade de venda.

- base por status: Novo contato = 25, Em análise = 45 e Proposta = 70;
- último contato em até 7 dias: +15 pontos;
- entre 8 e 30 dias: +5 pontos;
- entre 31 e 60 dias: −10 pontos;
- acima de 60 dias: −20 pontos;
- o resultado é limitado ao intervalo de 0 a 100;
- Cliente aparece como “Convertido” e Inativo como “Sem priorização”.

## Privacidade e limites

- não existe servidor, banco de dados, autenticação real ou conexão com redes sociais;
- registros do sistema ficam no `localStorage` deste navegador;
- sem “Lembrar-me”, a sessão fica no `sessionStorage`;
- com “Lembrar-me”, a sessão e o e-mail ficam no `localStorage`;
- imagens escolhidas no Editor ficam somente na sessão e não entram no `localStorage`;
- exportações podem conter os dados fictícios cadastrados pela equipe;
- limpar os dados do navegador remove contas e registros locais;
- métricas, publicação, anúncios, contas conectadas e parecer jurídico são simulações.

Consulte também [`privacidade.html`](privacidade.html).

## Execução local

Na pasta do projeto, inicie um servidor HTTP estático:

```powershell
python -m http.server 4173
```

Depois, abra `http://localhost:4173/`. O uso de HTTP em `localhost` ou de HTTPS na
publicação é necessário para o Web Crypto usado na derivação das senhas.

## Tecnologia

HTML, CSS e JavaScript puros, sem framework, dependências de execução ou serviço
externo. As fontes Manrope e Inter são servidas localmente sob a Open Font License.

## Validação manual

- [x] login de demonstração abre o painel e todos os cinco módulos;
- [x] migração preserva os dados das etapas anteriores e cria apenas campos ausentes;
- [x] CRM, Copy e Editor continuam compartilhando a mesma campanha;
- [x] Gestor apresenta os sete status, seis canais, agenda e indicadores calculados;
- [x] campanha sem parecer válido não pode ser agendada, ativada ou publicada;
- [x] Auditoria identifica “Só hoje!” sem prazo como alerta bloqueador;
- [x] Auditoria identifica imagem sem origem registrada como alto risco;
- [x] regras sobre público menor e contato reiterado aparecem somente quando aplicáveis;
- [x] histórico exibe os pareceres como revisões imutáveis;
- [x] página de privacidade abre pelos links do sistema;
- [x] Gestor e Auditoria foram verificados em viewport móvel de 390 × 844 px;
- [x] scripts verificados com `node --check` e sem erros no console do navegador.

## Referências normativas e técnicas

- [Lei Geral de Proteção de Dados Pessoais — Lei nº 13.709/2018](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [Código de Defesa do Consumidor — Lei nº 8.078/1990](https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm)
- [Lei de Direitos Autorais — Lei nº 9.610/1998](https://www.planalto.gov.br/ccivil_03/leis/l9610.htm)
- [ECA Digital — Lei nº 15.211/2025](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15211.htm)
- [Crime de perseguição — Lei nº 14.132/2021](https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14132.htm)

As verificações legais são orientações acadêmicas e não substituem consultoria
jurídica nem análise do caso concreto.

## Equipe

- Caio — Coordenação Geral e Integração;
- Guilherme Almeida — Arquitetura e Desenvolvimento;
- Letícia Costa — Conteúdo e Coerência Acadêmica;
- Larissa Costa — Design e Organização Visual;
- Prof. Me. Juaceli Soares da Costa Junior — Professor orientador.

Projeto acadêmico de Marketing Digital — 2026.
