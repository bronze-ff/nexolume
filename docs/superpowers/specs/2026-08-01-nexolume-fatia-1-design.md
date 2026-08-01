# Nexolume — Fatia 1: design

- **Data:** 2026-08-01
- **Status:** aprovado para planejamento
- **Escopo:** primeira fatia vertical funcional
- **Decisão de origem:** conversa de brainstorming de 2026-08-01

---

## 1. O que o Nexolume é — e o que ele não é

**Proposta de valor:** *do sinal ao projeto.*

O que ficou claro durante o brainstorming, e que reduz o projeto ao seu núcleo real:

> **A inteligência já existe e já é boa.** Um agente com acesso ao vault e ao repositório
> já produz análise de qualidade — isso foi verificado empiricamente em 2026-08-01, quando
> uma sessão do Claude analisou 10 clippings contra o projeto Olume Chat, encontrou uma
> lacuna real no `docs/SEGURANCA.md` e **descartou 7 dos 10 itens** com o motivo declarado.
>
> O Nexolume não é um motor de inteligência. Ele é **memória, deduplicação, cobertura
> multi-projeto e repetição** em volta de uma inteligência que já funciona.

### O que ele faz

| Faz | Não faz |
|---|---|
| Lê o vault do Obsidian e processa tudo que entra | Descobre conteúdo sozinho (isso é Fatia 2) |
| Resume e extrai pontos principais de **todo** item | Substitui a curadoria humana do clipper |
| Relaciona descobertas aos projetos conectados | Altera repositório, abre PR ou roda comando |
| Lembra o que já processou | Escreve no vault |
| Entrega instrução pronta para você aplicar | Aplica a mudança |

### Regra de produto que define a hierarquia

**O resumo é a base garantida. A recomendação é o bônus.**

Todo item que entra no vault rende resumo e pontos principais — inclusive os que não se
aplicam a projeto nenhum. Na análise verificada acima, 7 de 10 itens não geraram
recomendação; no desenho anterior eles desapareceriam. Aqui eles aparecem na aba
Descobertas com seu valor próprio.

---

## 2. Fonte única: o vault do Obsidian

A fonte da Fatia 1 é **um repositório**: `bronze-ff/obsidian-second-brain` (privado),
lido pela API do GitHub, somente leitura.

O usuário navega (artigo, vídeo, Reddit, X), clica na extensão **Obsidian Web Clipper**,
e o conteúdo cai em `raw/` como markdown com frontmatter. A automação de backup do vault
commita e faz push. O Nexolume lê dali.

### Por que essa fonte, e não scraping web

| Problema que desaparece | Por quê |
|---|---|
| Provedor de transcrição do YouTube | O clipper já traz `## Transcript` com timestamps — é o caminho *"arquivo enviado pelo usuário"*, legítimo e previsto no escopo original |
| Conector local Windows | O vault é repo git com remoto; a API do GitHub substitui o companion CLI |
| SSRF, robots.txt, parsing frágil de listagem | O conteúdo já foi buscado e normalizado |
| Partida a frio da relevância | Tudo em `raw/` é algo que o usuário já decidiu que valia a pena |

### Estado verificado do corpus (2026-08-01)

| Métrica | Valor |
|---|---|
| Clippings em `raw/` | 48 arquivos, 1,29 MB, média 27 KB |
| Com `## Transcript` e timestamps | 39 de 48 |
| Domínios | 39 youtube.com, 3 x.com, 2 artigos web |
| Duplicata real presente | `Meu Segundo Cérebro….md` e `… 1.md` — MD5 idêntico `5d2b8905d144533ce80e48e07d488135` |
| Sincronia local ↔ remoto | 0 à frente, 0 atrás, 0 não commitados |

Essa duplicata é o caso de teste de idempotência do dia um: dois arquivos, um item.

### Formato do clipping

```markdown
---
title: "Code Review Morreu"
source: "https://www.youtube.com/watch?v=XdhI-Dnnrmg"
author:
  - "[[Lucas Montano]]"
published: 2026-07-29
created: 2026-08-01
description: "..."
tags:
  - "clippings"
---
![](https://www.youtube.com/watch?v=XdhI-Dnnrmg)

<descrição e corpo>

## Transcript

**0:00** · Primeiro segmento.

**2:11** · Segundo segmento.
```

`**2:11** ·` converte para `?t=131` sobre a URL do `source:` — é assim que toda evidência
de vídeo aponta para o momento exato.

---

## 3. Arquitetura

```
apps/
  web/          React 18 + Vite — abas Descobertas e Aplicações
  api/          Node + Express — REST, disparo de coleta, watcher do vault
  cli/          source:add · source:run · project:add · project:sync · analyze:pending
packages/
  domain/       entidades, canonicalização, dedup, scores — SEM I/O
  connectors/   Connector + ObsidianVaultConnector (API do GitHub)
  intelligence/ LlmProvider + mock | claude-cli | anthropic-api
  shared/       tipos, config, logger
```

**Invariante de dependência:** `packages/domain` não importa `connectors` nem
`intelligence`. É o que permite testar dedup, canonicalização e score sem rede e sem LLM.

### As duas interfaces que decidem o futuro

```ts
interface Connector {
  discover(source: Source): Promise<RawItem[]>
  fetch(item: RawItem): Promise<FetchedItem>
}

interface LlmProvider {
  analyze(input: AnalysisInput): Promise<AnalysisResult>  // saída validada por schema
}
```

O `ObsidianVaultConnector` é a primeira implementação de `Connector`. O conector web da
Fatia 2 é a segunda, sem tocar no domínio.

### Onde roda — Fatia 1

| Componente | Onde |
|---|---|
| `apps/web`, `apps/api` | máquina do usuário, `npm run dev` |
| PostgreSQL | **Neon**, projeto `nexolume`, ID `shiny-feather-64709994`, região `us-east-2` |
| Acesso pelo celular | **Cloudflare Tunnel + Cloudflare Access** |
| Worker persistente separado, scheduler, VPS, Docker, GHCR | **não existem nesta fatia** |

O *watcher* do vault (seção 5) roda **dentro do processo do `apps/api`**, não como
serviço separado. Ele vive enquanto o `npm run dev` estiver aberto e morre junto. Isso é
deliberado: um processo a menos para operar, e nenhum estado depende dele estar vivo —
se ficar horas parado, a próxima execução compara o SHA do HEAD e recupera tudo que
entrou no intervalo.

**Por que o banco não é local:** a máquina não tem Docker nem PostgreSQL instalados.
Neon dá Postgres real sem instalar nada, com FTS nativo e `pgvector` disponível quando
houver caso — e quando a Fatia 3 subir na infraestrutura persistente, **não há migração
de dados**. SQLite trocaria um problema de hoje por uma migração garantida depois, com
dialeto diferente e sem FTS equivalente.

**Por que não a VPS agora:** subir lá exige, pelo contrato de `~/.agents/infra/vps-compartilhada.md`,
domínio sem colidir no Traefik, limites de memória e CPU, health check declarando o SHA,
monitor externo próprio e CI publicando imagem no GHCR. É meio dia de trabalho e
cerimônia desproporcional para um app de um usuário só. Entra quando *"rodar com o
computador desligado"* virar dor real — Fatia 3.

---

## 4. Modelo de dados

13 tabelas. O modelo de domínio original propunha 19; a instrução era simplificar e
registrar as decisões.

### Tabelas mantidas

| Tabela | Papel |
|---|---|
| `sources` | fonte cadastrada (`type = 'obsidian_vault'`) |
| `source_runs` | horário, estratégia, encontrados, novos, repetidos, falhas |
| `content_items` | o item canônico |
| `content_item_files` | mapeia arquivo do vault → item; **é a tabela que prova a duplicata** |
| `transcript_segments` | `start_seconds` + texto |
| `topics` · `content_item_topics` | temas |
| `projects` | perfil vivo + `last_synced_commit` |
| `insights` | resumo, pontos principais, alegações, scores |
| `evidence` | toda alegação aponta para fonte e timestamp |
| `recommendations` | projeto, descoberta, por quê, evidências, benefício, risco, esforço, próximo passo |
| `feedback` | classificação registrada |
| `jobs` | fila no próprio Postgres |

### Decisões de simplificação

| Removida | Decisão |
|---|---|
| `User` | Single-user. Multi-tenant vira migração *expand/contract* adicionando `user_id` e chaves compostas. Não se cria coluna especulativa. |
| `SourceSchedule` | Fatia 3 |
| `ContentSnapshot` | Histórico de alteração só quando houver caso real; `content_items.content_hash` basta |
| `Transcript` (cabeçalho) | Virou `content_items.transcript_status` — uma tabela a menos, requisito preservado |
| `ProjectSnapshot` | Perfil atual + commit no próprio `projects` |
| `ProjectMatch` | Fundida em `recommendations` — match que não vira recomendação não serve nesta fatia |
| `Digest` | Fatia 4 |

### A chave de deduplicação

```
canonical_id:
  https://www.youtube.com/watch?v=XdhI-Dnnrmg&t=90   →  youtube:XdhI-Dnnrmg
  https://youtu.be/XdhI-Dnnrmg?si=abc                →  youtube:XdhI-Dnnrmg
  https://x.com/user/status/123?s=20                 →  x:123
  https://addyosmani.com/blog/post/?utm_source=x     →  url:addyosmani.com/blog/post

UNIQUE (canonical_id)  em content_items
```

Canonicalização: extrai ID de vídeo do YouTube em qualquer formato de URL; extrai status
ID do X; para web, normaliza host em minúsculas, remove `utm_*`, `ref`, `si`, fragmento
e barra final.

É isso que colapsa os dois arquivos do *"Segundo Cérebro"* em **um** item com **duas**
linhas em `content_item_files`. O relatório da execução diz: *2 arquivos, 1 item, 1 repetido.*

`content_hash` (SHA-256 do corpo normalizado) detecta o caso diferente: mesma URL,
conteúdo alterado — o item é reanalisado; sem alteração, não é.

---

## 5. Fluxo

### Estágio 1 — captura (determinístico, sem LLM)

```
1. lê a árvore de raw/ no HEAD do repo, pela API do GitHub
2. compara o blob SHA de cada arquivo com o armazenado
3. parse do frontmatter + corpo + ## Transcript
4. deriva canonical_id + content_hash
5. upsert por canonical_id  →  novo | repetido | alterado
6. enfileira job de análise só para novo | alterado
7. grava source_run com os números e a estratégia usada
```

### Estágio 2 — análise (consome fila)

```
8.  resumo curto + pontos principais  ← SEMPRE, para todo item
9.  alegações verificáveis, tecnologias, riscos, pré-requisitos, nível técnico
10. cada alegação gera evidence apontando para ?t=<segundos> ou âncora de texto
11. scores explicáveis: relevância, novidade, credibilidade, aplicabilidade, confiança
```

### Estágio 3 — relacionamento

```
12. insight × perfil de cada projeto conectado
13. gera recommendation com evidência externa E evidência no projeto
14. sem correspondência → nenhuma recomendação, e isso é resultado válido
```

**Por que os estágios são separados com fila própria:** se o provedor de LLM cair ou o
orçamento estourar, o item fica em `awaiting_analysis` — nada se perde e nada é
recoletado. E é o que permite, na Fatia 3, captura em um lugar e análise em outro sem
redesenho.

### Detecção de nota nova

Nem cron, nem botão, nem schedule externo:

```
enquanto a app roda:
  a cada 5 min  →  consulta o SHA do HEAD do repo do vault
  SHA mudou?    →  lista o diff  →  processa só os arquivos novos ou alterados
  SHA igual?    →  nada acontece, nada é gasto
```

Uma chamada barata à API do GitHub a cada 5 minutos. O usuário clipa, a automação de
backup faz push, e em até 5 minutos o item aparece na aba Descobertas.

**Consequência que precisa estar visível:** existe atraso de propagação entre clipar e
aparecer. A tela Fontes mostra **o SHA e a data do último commit lido** — o mesmo
princípio de *prova de versão no ar* que o contrato de infraestrutura exige para deploy,
aplicado a dado.

**Upgrade futuro:** com o túnel Cloudflare de pé, webhook do GitHub dispara o
processamento na hora. É refinamento, não fundação — o polling não depende de nada.

---

## 6. Telas

Duas abas. A divisão vem de um requisito explícito: *"mesmo o vídeo que não faz sentido
em nenhum projeto, quero que retorne as informações principais."*

### Aba 1 — Descobertas

Tudo que entrou no vault, processado. Item mais recente primeiro.

Por item: título, autor, data, fonte com ícone da origem (YouTube / X / web), **resumo
curto**, **pontos principais**, temas, estado da transcrição, e link direto — com
timestamp quando houver.

Marcador visual quando o item gerou recomendação, com salto para a aba 2.

### Aba 2 — Aplicações

Só o que casou com algum projeto. Agrupado por projeto.

Por recomendação: descoberta, **por que se aplica**, evidência externa (com timestamp),
**evidência no projeto** (arquivo e trecho), benefício esperado, risco, esforço estimado,
confiança, e **próximo passo concreto**.

**Ação principal: “copiar instrução”.** Gera o texto pronto para colar numa sessão focada
no projeto, já com a evidência dos dois lados e os caminhos de arquivo. O Nexolume não
aplica nada — ele entrega a munição. Isso é o fluxo real do usuário, não um enfeite.

### Princípios de design assumidos

- **Score nunca é caixa-preta.** Toda pontuação exibida abre o porquê. Um número sem
  justificativa não vai para a tela.
- **Descarte é informação.** A aba Descobertas mostra itens sem recomendação com a mesma
  dignidade — 7 de 10 é o caso comum, não a exceção.
- Contraste de corpo de texto ≥ 4.5:1 verificado, não estimado.
- Comprimento de linha entre 65 e 75 caracteres nos resumos.
- Nada de grade de cards idênticos, faixa colorida lateral, texto em gradiente ou
  *eyebrow* em caixa alta sobre cada seção.
- `PRODUCT.md` e `DESIGN.md` são criados por `/impeccable init` na fase de implementação,
  antes do primeiro componente.

---

## 7. Provedores de LLM

| Provedor | Onde roda | Papel |
|---|---|---|
| `mock` | testes e CI | determinístico, custo zero, CI verde sem credencial |
| `claude-cli` | máquina do usuário | verificação com modelo real pela assinatura, custo marginal zero |
| `anthropic-api` | implementado e **desligado** | liga na Fatia 3, quando o agendamento subir na infraestrutura persistente |

Trocado por `NEXOLUME_LLM_PROVIDER` no `.env`. **É decisão de deploy, não de arquitetura.**

### Por que não Claude Code rodando na VPS

Foi avaliado e recusado por motivo técnico, não jurídico: o Claude Code é um agente com
Bash e acesso a arquivos. Colocar conteúdo raspado de terceiros dentro dele é entregar
entrada não confiável a um processo com shell — e, pelo contrato de infraestrutura, todos
os containers da VPS compartilham a rede `coolify`, o que significa que um prompt
injection bem-sucedido alcançaria a produção do Olume Chat. Com a API, o modelo só pode
devolver texto.

### O prompt de análise

**Modelado no resultado verificado de 2026-08-01**, não inventado. Aquela saída é o
padrão-ouro dos testes: dado o mesmo vault e o mesmo repositório, a análise precisa

1. encontrar a lacuna do `docs/SEGURANCA.md` do Olume Chat, e
2. **descartar** os vídeos de venda de automação sem forçar encaixe.

**Descarte correto é critério de aceite tanto quanto achado correto.**

---

## 8. Segurança

| Situação | Comportamento |
|---|---|
| GitHub indisponível ou rate limit | `source_run` falha com erro registrado, reprocessável na tela Fontes |
| Frontmatter malformado | item marcado `parse_failed`, **visível**, não derruba a execução |
| LLM indisponível ou orçamento estourado | item fica `awaiting_analysis`, captura preservada |
| Conteúdo do clipping | entra em bloco delimitado e rotulado como **não confiável**; instruções do sistema nunca se misturam a ele |
| Saída do modelo | validada por schema — resposta fora do formato é erro, não texto livre |
| Chamada de análise | **sem ferramentas, sem acesso a arquivo, sem shell.** Texto entra, JSON sai |
| Repositório público | connection string, tokens e dumps de conteúdo **nunca** entram no git |
| Túnel Cloudflare | **obrigatoriamente** atrás de Cloudflare Access. Túnel sem autenticação expõe o segundo cérebro na internet |

Sobre prompt injection: a defesa real não é filtrar o texto — é o modelo não ter nada
para executar. Por isso a chamada de análise não recebe ferramenta nenhuma.

---

## 9. Custo

| Item | Custo |
|---|---|
| Neon, plano free | R$ 0 |
| API do GitHub, token existente, somente leitura | R$ 0 |
| LLM na Fatia 1 (`mock` + `claude-cli`) | R$ 0 |
| Cloudflare Tunnel + Access | R$ 0 |
| **Total da Fatia 1** | **R$ 0** |

Referência para quando o `anthropic-api` ligar: o backfill completo do vault
(~320k tokens de entrada) com filtro em Haiku 4.5 e análise em Sonnet 5 sai por
**cerca de US$ 1,00**, uma vez.

Controle de custo desde já: hash e cache antes de chamar o modelo; nunca reanalisar
conteúdo sem alteração; filtro barato antes do modelo caro; registro de tokens, custo e
latência por etapa; orçamento diário e mensal com parada do processamento não essencial.

---

## 10. Testes

| Teste | Prova |
|---|---|
| dedup com o par real *"Segundo Cérebro"* | dois arquivos → um item, um repetido no relatório |
| coleta executada duas vezes | segunda execução: 0 novos, 0 duplicados criados |
| canonicalização | `watch?v=`, `youtu.be/`, `?t=`, `utm_*` convergem para o mesmo `canonical_id` |
| parser sobre fixtures copiadas do vault | frontmatter, corpo, `## Transcript` no formato `**2:11** ·` |
| timestamp → link | `2:11` vira `?t=131` sobre a URL do `source:` |
| provedor `mock` | determinístico, CI verde sem credencial |
| resumo garantido | **todo** item analisado tem resumo e pontos principais, com ou sem recomendação |
| recomendação | contém evidência externa **e** evidência no projeto |
| descarte | itens sem correspondência real **não** geram recomendação forçada |

**Regra de portão:** o teste de integração que precisa do token do GitHub **falha** quando
o token não existe. Não pula. Suite que pula em silêncio dá verde falso, que é pior que
suite ausente.

---

## 11. Critérios de aceite da Fatia 1

1. O vault pode ser cadastrado como fonte e coletado sob demanda.
2. Nota nova no vault é detectada e processada sem intervenção, em até 5 minutos.
3. O sistema diferencia item novo, repetido e alterado, e mostra os números por execução.
4. Falhas são visíveis na tela Fontes e podem ser reprocessadas.
5. Cada item mostra o estado real da transcrição — nunca inventa transcrição.
6. **Todo** item processado aparece na aba Descobertas com resumo e pontos principais.
7. Toda alegação tem evidência com link e, em vídeo, timestamp.
8. Pelo menos um repositório do GitHub é conectado como projeto, somente leitura.
9. Recomendações citam evidência da fonte **e** do projeto, e têm próximo passo concreto.
10. A recomendação pode ser copiada como instrução pronta para outra sessão.
11. A segunda execução da mesma fonte é idempotente.
12. Existe modo de desenvolvimento com respostas de IA simuladas.
13. O README executa o projeto inteiro no Windows.
14. O sistema nunca altera repositório, nunca abre PR e nunca escreve no vault.

---

## 12. Decisões registradas

| # | Decisão | Motivo |
|---|---|---|
| 1 | Fonte da Fatia 1 é o vault, não `biip.club` | Elimina transcrição, conector local e SSRF do caminho crítico; corpus real de 48 itens com duplicata para provar idempotência |
| 2 | Nexolume **nunca** escreve no vault | O `CLAUDE.md` do vault já define quem escreve o quê; segundo escritor cria conflito com a automação de backup |
| 3 | Resumo é base, recomendação é bônus | 7 de 10 itens não geram recomendação; sem isso o sistema não devolveria nada em 70% do que o usuário clipa |
| 4 | Banco no Neon, não local nem SQLite | Sem Docker na máquina; Postgres real, sem migração quando a Fatia 3 subir |
| 5 | Projeto próprio no Neon, separado do `olume-chat` | Contrato de infraestrutura: isolamento de dado por fronteira de projeto |
| 6 | Detecção por polling do HEAD, não cron nem schedule externo | Reage ao evento em vez de horário fixo; sem infraestrutura adicional |
| 7 | Acesso móvel por Cloudflare Tunnel + Access, não VPS nem Vercel | Vercel não roda processo persistente nem `claude-cli`; VPS é cerimônia desproporcional |
| 8 | 13 tabelas em vez de 19 | Ver seção 4 |
| 9 | Análise sem ferramentas | Conteúdo de terceiros não deve alcançar um processo com shell |
| 10 | `ratos.link` e `biip.club` adiados para a Fatia 2 | Ambos são clipáveis; o conteúdo deles já chega pelo vault. Constrói-se o conector quando faltar descoberta, não antes |
| 11 | Prompt de análise derivado do resultado verificado, não inventado | Existe um padrão-ouro real de 2026-08-01 |

---

## 13. Pendências humanas

| # | Pendência | Desbloqueia |
|---|---|---|
| 1 | Cadência da automação de backup do vault | Define o atraso máximo entre clipar e aparecer |
| 2 | Domínio para o túnel Cloudflare — subdomínio de `olumechat.com.br` ou outro | Acesso pelo celular |
| 3 | Banco criado em `us-east-2`; os outros projetos estão em `sa-east-1` | Recriar pelo console se a latência incomodar |
| 4 | Repositório `nexolume` está **público** | Regra de ouro sobre `.env`, fixtures e dumps precisa ser cumprida sem exceção |

---

## 14. Fora de escopo — e onde cada coisa entra

| Fatia | Conteúdo |
|---|---|
| **2** | Conectores web: `ratos.link` (agregador) e `biip.club` (fonte de conteúdo próprio). O badge *A FONTE* do `ratos.link` entrega a descoberta de fontes filhas |
| **3** | Agendamento persistente, deploy na VPS via GHCR + Coolify, provedor `anthropic-api`, orçamento aplicado |
| **4** | Digest diário e semanal |
| **5** | Conector do X pela API oficial, atrás de feature flag |
| **6** | Busca semântica com `pgvector`, quando a busca textual do Postgres não bastar |
| **7** | Aprendizado do feedback alterando prioridade futura |
| **—** | Conector local Windows: **cancelado enquanto o vault for repositório git** |

---

## 15. Próximo passo

`superpowers:writing-plans` produz o plano de implementação a partir desta spec. O DAG
resultante é a entrada de `orquestrar-projeto`, que coordena os subagentes executores.
`/impeccable init` cria `PRODUCT.md` e `DESIGN.md` antes do primeiro componente de
interface.
