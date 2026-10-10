# Operação

## Este repositório

Não há serviço no ar. A operação de hoje é manter a documentação verdadeira e o CI
verde.

Verificação local, em PowerShell:

```powershell
npm ci
npm run verify
```

O workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) tem dois jobs
em `ubuntu-24.04`, com concurrency cancelando a run antiga do mesmo ref:

| Job | O que faz | Limite |
| --- | --- | --- |
| `docs` | `npm ci` com cache e `npm run verify` (lint de Markdown e links internos) | 5 min |
| `gitleaks` | `gitleaks` v8.30.1 só no intervalo de commits novos do PR ou do push | 5 min |

Links externos não são buscados: a checagem confirma arquivo e âncora dentro do
repositório. O lint não reescreve a spec nem o plano de 2026-08-01. As regras de
estilo que aquele texto já não segue (lista colada no parágrafo, tabela compacta,
negrito no lugar de título) ficam desligadas em `.markdownlint-cli2.jsonc`. Actions ficam pinadas por SHA; a imagem do gitleaks fica na tag
`v8.30.1`. O workflow não usa secret.

`CLAUDE.md` fica fora do lint de propósito. O arquivo é só o ponteiro `@AGENTS.md`.

## Publicar

Merge na `main`, feito pelo Filippe, com os dois jobs verdes e o Codex Review sem
P0/P1 em aberto. Não há projeto Vercel, Hostinger nem outro hosting ligado a este
repo.

Rollback desta fase: reverter o commit na `main`. Não há migração nem release para
desfazer.

## Issues

GitHub Issues deste repositório. Templates em `.github/ISSUE_TEMPLATE/`. Labels
usadas pelos templates: `bug` e `feature`. Também faz sentido ter `chore` quando a
issue for criada à mão. Não há fila no Linear.

## Segredos

O repositório é público. Não entram no git: `.env`, `.mcp.json`, token, connection
string, dump de clipping e transcrição. `.env.example` documenta nomes e deixa
segredo vazio.

Nenhuma variável nova precisa ser criada na Vercel ou em secret de GitHub para esta
mudança. A CI não lê ambiente. Quando a aplicação existir, os valores reais ficam no
`.env` local da máquina, não num painel de hosting: a Fatia 1 não tem deploy.

| Nome | Situação agora | Onde o valor real vai morar |
| --- | --- | --- |
| `DATABASE_URL` | Vazio. Nenhum código lê | `.env` local. Neon, projeto `nexolume` |
| `VAULT_REPO` | `bronze-ff/obsidian-second-brain` | Já é público no exemplo |
| `VAULT_PASTA` | `raw` | Já é público no exemplo |
| `GITHUB_TOKEN` | Vazio | `.env` local. Leitura do vault |
| `NEXOLUME_LLM_PROVIDER` | `mock` | `.env` local |
| `ANTHROPIC_API_KEY` | Vazio. Fatia 3 | `.env` local, só se o provedor ligar |
| `WATCHER_INTERVALO_MS` | `300000` | `.env` local |
| `PORT` | `3001` | `.env` local |

Não existem `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `VITE_SENTRY_DSN`,
`PUBLIC_SENTRY_DSN` nem chave de PostHog. Não criar projeto desses produtos para
este repositório enquanto ele for só documentação.

## Logs e runtime previsto

Não há log de aplicação. O desenho da Fatia 1, ainda sem código, roda `apps/web` e
`apps/api` na máquina do usuário, com Postgres no Neon e acesso móvel por Cloudflare
Tunnel obrigatoriamente atrás de Cloudflare Access. Worker separado, VPS e Vercel
ficam fora dessa fatia. O detalhe está na
[arquitetura](arquitetura.md).
