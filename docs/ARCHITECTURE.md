# ARQUITETURA

Derivado da seção 3 da spec aprovada
(`docs/superpowers/specs/2026-08-01-nexolume-fatia-1-design.md`).

---

## Pacotes

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

---

## Invariante de dependência

**`packages/domain` não importa `connectors` nem `intelligence`.**

É o que permite testar dedup, canonicalização e score sem rede e sem LLM. Quebrar isso
torna o núcleo não testável — e o núcleo é exatamente a parte que precisa de teste
determinístico, porque é onde mora a identidade dos itens.

Sentido permitido das setas:

```
apps/*        →  packages/{domain, connectors, intelligence, shared}
connectors    →  shared            (nunca domain ← connectors)
intelligence  →  shared
domain        →  shared            e mais nada
```

---

## As duas interfaces que decidem o futuro

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
Fatia 2 é a segunda, **sem tocar no domínio** — é para isso que a interface existe.

Do lado do LLM, a troca é por `NEXOLUME_LLM_PROVIDER` no `.env`: `mock` para teste e CI,
`claude-cli` para verificação com modelo real na máquina do usuário, `anthropic-api`
implementado e desligado até a Fatia 3. **É decisão de deploy, não de arquitetura.**

---

## Fluxo em três estágios

```
Estágio 1 — captura (determinístico, sem LLM)
  1. lê a árvore de raw/ no HEAD do repo, pela API do GitHub
  2. compara o blob SHA de cada arquivo com o armazenado
  3. parse do frontmatter + corpo + ## Transcript
  4. deriva canonical_id + content_hash
  5. upsert por canonical_id  →  novo | repetido | alterado
  6. enfileira job de análise só para novo | alterado
  7. grava source_run com os números e a estratégia usada

Estágio 2 — análise (consome fila)
  8.  resumo curto + pontos principais  ← SEMPRE, para todo item
  9.  alegações verificáveis, tecnologias, riscos, pré-requisitos, nível técnico
  10. cada alegação gera evidence apontando para ?t=<segundos> ou âncora de texto
  11. scores explicáveis: relevância, novidade, credibilidade, aplicabilidade, confiança

Estágio 3 — relacionamento
  12. insight × perfil de cada projeto conectado
  13. gera recommendation com evidência externa E evidência no projeto
  14. sem correspondência → nenhuma recomendação, e isso é resultado válido
```

**Por que os estágios são separados, com fila no próprio Postgres:** se o provedor de LLM
cair ou o orçamento estourar, o item fica em `aguardando_analise` — nada se perde e nada é
recoletado. E é o que permite, na Fatia 3, captura em um lugar e análise em outro sem
redesenho.

---

## Detecção de nota nova

Nem cron, nem botão, nem schedule externo:

```
enquanto a app roda:
  a cada 5 min  →  consulta o SHA do HEAD do repo do vault
  SHA mudou?    →  lista o diff  →  processa só os arquivos novos ou alterados
  SHA igual?    →  nada acontece, nada é gasto
```

Consequência que precisa estar **visível na interface**: existe atraso de propagação
entre clipar e aparecer. A tela Fontes mostra o SHA e a data do último commit lido — prova
de versão no ar, aplicada a dado.

---

## Onde roda — Fatia 1

| Componente | Onde |
|---|---|
| `apps/web`, `apps/api` | máquina do usuário, `npm run dev` |
| PostgreSQL | **Neon**, projeto `nexolume`, ID `shiny-feather-64709994`, região `us-east-2` |
| Acesso pelo celular | **Cloudflare Tunnel + Cloudflare Access** |
| Worker persistente separado, scheduler, VPS, Docker, GHCR | **não existem nesta fatia** |

O *watcher* do vault roda **dentro do processo do `apps/api`**, não como serviço separado.
Ele vive enquanto o `npm run dev` estiver aberto e morre junto. Isso é deliberado: um
processo a menos para operar, e nenhum estado depende dele estar vivo — se ficar horas
parado, a próxima execução compara o SHA do HEAD e recupera tudo que entrou no intervalo.

---

## Duas decisões que costumam ser questionadas

**Por que o banco não é local.** A máquina não tem Docker nem PostgreSQL instalados. O
Neon dá Postgres real sem instalar nada, com FTS nativo e `pgvector` disponível quando
houver caso — e quando a Fatia 3 subir na infraestrutura persistente, **não há migração de
dados**. SQLite trocaria um problema de hoje por uma migração garantida depois, com
dialeto diferente e sem FTS equivalente.

**Por que não a VPS agora.** Subir lá exige domínio sem colidir no Traefik, limites de
memória e CPU, health check declarando o SHA, monitor externo próprio e CI publicando
imagem no GHCR. É meio dia de trabalho e cerimônia desproporcional para um app de um
usuário só. Entra quando *"rodar com o computador desligado"* virar dor real — Fatia 3.
