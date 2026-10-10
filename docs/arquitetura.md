# Arquitetura

## O repositório hoje

Há documentação, `.env.example` sem segredo e uma CI de qualidade de Markdown. Não há
processo, banco nem pasta de aplicação. O layout abaixo é o desenho aprovado em
2026-08-01 para a implementação; ainda não está criado.

## Desenho da Fatia 1

```text
vault (GitHub, leitura) ──► apps/api ──► PostgreSQL (Neon)
                               │
                               ├── packages/connectors
                               ├── packages/intelligence
                               └── packages/domain   (sem I/O)
                                     ▲
apps/web (Descobertas, Aplicações) ──┘
apps/cli
```

| Pasta prevista | Papel |
| --- | --- |
| `apps/web` | React 18 + Vite. Abas Descobertas e Aplicações |
| `apps/api` | Express, REST, captura e watcher do vault |
| `apps/cli` | `source:add`, `source:run`, `project:add`, `project:sync`, `analyze:pending` |
| `packages/domain` | Entidades, canonicalização, dedup e scores. Sem I/O |
| `packages/connectors` | `Connector` e o conector do vault via API do GitHub |
| `packages/intelligence` | `LlmProvider`: `mock`, `claude-cli` e `anthropic-api` (desligado) |
| `packages/shared` | Tipos, config e logger |

`packages/domain` não importa `connectors` nem `intelligence`. É o que permite testar
dedup e canonicalização sem rede e sem LLM.

Duas interfaces fecham o desenho. `Connector` descobre e busca itens de uma fonte.
`LlmProvider` devolve análise validada por schema. O conector web da Fatia 2 entra
sem mudar o domínio.

## Onde roda

| Peça | Lugar na Fatia 1 |
| --- | --- |
| `apps/web` e `apps/api` | Máquina do usuário, com `npm run dev` |
| PostgreSQL | Neon, projeto `nexolume`, id `shiny-feather-64709994`, região `us-east-2` |
| Celular | Cloudflare Tunnel com Cloudflare Access |
| Worker, scheduler, VPS, Docker, GHCR | Não entram nesta fatia |

O watcher vive dentro do processo da API. Se a máquina ficar desligada, a próxima
execução compara o SHA do HEAD e recupera o intervalo. Não há deploy na Vercel: a
Fatia 1 precisa de processo contínuo e do `claude-cli` local.

## Fluxo de dados

1. Ler a árvore de `raw/` no HEAD do vault.
2. Comparar o blob SHA de cada arquivo com o que está guardado.
3. Extrair frontmatter, corpo e `## Transcript`.
4. Calcular `canonical_id` e `content_hash`.
5. Gravar novo, repetido ou alterado. Enfileirar análise só para novo ou alterado.
6. Resumir todo item e, quando houver correspondência, gerar recomendação com
   evidência dos dois lados.

A fila fica no próprio Postgres. Se o provedor de LLM falhar, o item permanece
aguardando análise e a captura não é refeita.

`canonical_id` colapsa URLs do mesmo vídeo, status do X ou página web:

```text
https://www.youtube.com/watch?v=XdhI-Dnnrmg  →  youtube:XdhI-Dnnrmg
https://youtu.be/XdhI-Dnnrmg?si=abc           →  youtube:XdhI-Dnnrmg
https://x.com/user/status/123?s=20            →  x:123
https://addyosmani.com/blog/post/?utm_source=x →  url:addyosmani.com/blog/post
```

## Dados

Treze tabelas: `sources`, `source_runs`, `content_items`, `content_item_files`,
`transcript_segments`, `topics`, `content_item_topics`, `projects`, `insights`,
`evidence`, `recommendations`, `feedback` e `jobs`. Não há tabela de usuário: a
Fatia 1 é de uma pessoa só. A spec, seção 4, registra o que saiu do modelo de 19
tabelas e por quê.

## Integrações

| Sistema | Uso na Fatia 1 |
| --- | --- |
| GitHub API | Leitura do vault e dos repositórios ligados como projeto |
| Neon | Postgres. Sem Docker na máquina de desenvolvimento |
| LLM | `mock` na CI e `claude-cli` na máquina. `anthropic-api` fica desligado |
| Cloudflare | Túnel e Access, para abrir no celular. Sem Access, o túnel não sobe |

A chamada de análise não recebe ferramenta. Conteúdo de terceiro entra em bloco
rotulado como não confiável, e a resposta fora do schema é erro.
