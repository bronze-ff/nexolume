# AGENTS.md — Nexolume

> Contrato de trabalho. Todo agente lê este arquivo **antes** de editar qualquer coisa
> neste repositório.

---

## 1. O que é

Nexolume é um radar pessoal de conhecimento aplicado — *do sinal ao projeto*.
Ele lê o que você salva no seu vault do Obsidian, resume e extrai os pontos principais de
**todo** item, e relaciona cada descoberta aos projetos que você conectou, com evidência
dos dois lados.
Ele **não** escreve no vault, **não** altera repositório de projeto, **não** abre PR e
**não** roda comando de projeto — entrega a análise pronta para você aplicar onde quiser.

---

## 2. Estado atual — 2026-08-01

**Pré-implementação.** A spec da Fatia 1 está aprovada e o plano de implementação existe;
o código ainda não.

| Item | Estado |
|---|---|
| Fatia 1 | em construção — 18 tarefas, ver `docs/superpowers/plans/2026-08-01-fatia-1.md` |
| Onde roda | **só local**, na máquina do usuário, com `npm run dev` |
| Banco | PostgreSQL no **Neon** — projeto `nexolume`, ID `shiny-feather-64709994`, branch `main`, database `neondb`, região `us-east-2` |
| Fonte de conteúdo | `bronze-ff/obsidian-second-brain` (privado, **somente leitura**), pasta `raw/` |
| Repositório do Nexolume | `bronze-ff/nexolume` — **público** |
| VPS, Docker, scheduler, worker separado | **não existem nesta fatia** |

O *watcher* do vault roda **dentro** do processo do `apps/api`: vive enquanto o
`npm run dev` estiver aberto e morre junto. Nada de estado depende dele estar vivo — a
próxima execução compara o SHA do HEAD e recupera tudo que entrou no intervalo.

---

## 3. Stack e estrutura

**Stack:** Node ≥ 24 · TypeScript · npm workspaces · Vitest · Express · React 18 + Vite +
Tailwind · `pg` (SQL cru, sem ORM) · Octokit · Zod · gray-matter

| Caminho | Responsabilidade |
|---|---|
| `packages/shared/src/config.ts` | Carrega e valida `.env` com Zod. Falha no boot se faltar segredo |
| `packages/shared/src/logger.ts` | Log estruturado, redação de segredo |
| `packages/domain/src/canonical.ts` | URL → `canonical_id`. **Puro** |
| `packages/domain/src/clipping.ts` | Parse de frontmatter, corpo e `## Transcript`. **Puro** |
| `packages/domain/src/dedup.ts` | Decide novo \| repetido \| alterado. **Puro** |
| `packages/domain/src/types.ts` | Entidades do domínio |
| `packages/connectors/src/connector.ts` | Interface `Connector` |
| `packages/connectors/src/obsidian-vault.ts` | Lê `raw/` pela API do GitHub |
| `packages/connectors/src/github-repo.ts` | Lê docs de um repo para o perfil vivo |
| `packages/intelligence/src/provider.ts` | Interface `LlmProvider` + schemas Zod |
| `packages/intelligence/src/mock.ts` | Provedor determinístico |
| `packages/intelligence/src/claude-cli.ts` | Provedor via `claude -p` |
| `packages/intelligence/src/prompts/analise.ts` | Prompt de análise de item |
| `packages/intelligence/src/prompts/match.ts` | Prompt de relacionamento com projeto |
| `apps/api/src/db/migrations/*.sql` | Migrações numeradas |
| `apps/api/src/db/pool.ts` | Pool `pg` + helper de transação |
| `apps/api/src/repo/*.ts` | Um arquivo por agregado (sources, items, insights, projects, recs) |
| `apps/api/src/pipeline/capturar.ts` | Estágio 1 |
| `apps/api/src/pipeline/analisar.ts` | Estágio 2 |
| `apps/api/src/pipeline/relacionar.ts` | Estágio 3 |
| `apps/api/src/watcher.ts` | Polling do HEAD do vault |
| `apps/api/src/rotas/*.ts` | REST |
| `apps/cli/src/index.ts` | Comandos |
| `apps/web/src/paginas/Descobertas.tsx` | Aba 1 |
| `apps/web/src/paginas/Aplicacoes.tsx` | Aba 2 |

---

## 4. Como rodar local

Windows, PowerShell. A versão longa, com pré-requisitos, está no `README.md`.

```powershell
git clone https://github.com/bronze-ff/nexolume.git
cd nexolume
npm install

# Segredos: copie o exemplo e preencha. O .env NUNCA entra no git.
Copy-Item .env.example .env
notepad .env

npm run migrar          # aplica o histórico inteiro de migrações — 13 tabelas
npm test                # suite completa
npm run typecheck       # tsc -b
npm run dev             # API em :3001 e web em :5173
```

Comandos da CLI, na ordem do fluxo:

```powershell
npm run cli -- source:add --tipo obsidian_vault --nome "meu vault"
npm run cli -- source:run          # captura: encontrados / novos / repetidos / alterados
npm run cli -- analyze:pending     # estágio 2 — consome a fila
npm run cli -- project:add --repo bronze-ff/nexolume --nome Nexolume
npm run cli -- project:sync        # perfil vivo do projeto
npm run cli -- relate:pending      # estágio 3 — recomendações
```

Para verificar com modelo real em vez do `mock`:

```powershell
$env:NEXOLUME_LLM_PROVIDER="claude-cli"; npm run cli -- analyze:pending --limite 3
```

> Nada disso existe ainda: o scaffolding (`package.json`, workspaces, scripts) nasce na
> Task 2 do plano da Fatia 1. Os comandos acima são o contrato que a Task 2 precisa
> cumprir.

---

## 5. Regras de ouro

Dez. Cada uma tem o porquê junto — o porquê é parte da regra, não decoração.

1. **O repositório é PÚBLICO.** `.env`, connection string, token e dump de conteúdo
   nunca entram no git. Se precisou de `git add -f`, pare e pergunte.
   Fora disso = segredo no histórico para sempre, e histórico não se apaga.
2. **O Nexolume nunca escreve no vault.** O `CLAUDE.md` do vault já define quem escreve
   o quê (`raw/` é humano, `wiki/` é o Claude Code, `notas/` é o usuário). Um segundo
   escritor entra em conflito com a automação de backup, silenciosamente.
3. **A chamada de análise não recebe ferramenta nenhuma.** Sem bash, sem arquivo, sem
   MCP. O conteúdo é de terceiros; a defesa não é filtrar o texto, é o modelo não ter
   nada para executar.
4. **Conteúdo capturado entra em bloco delimitado e rotulado como não confiável**,
   nunca concatenado às instruções do sistema. Misturar = injeção de prompt funciona.
5. **Toda saída de LLM passa por schema Zod.** Resposta fora do formato é erro, não
   texto livre. Sem isso, dado inválido entra no banco sem ninguém perceber.
6. **`packages/domain` não importa `connectors` nem `intelligence`.** É o que permite
   testar canonicalização, dedup e score sem rede e sem LLM. Quebrar isso torna o
   núcleo não testável.
7. **`canonical_id` é a identidade do item, não o caminho do arquivo.** Dois arquivos
   do vault podem apontar para o mesmo vídeo. `UNIQUE (canonical_id)` é o que faz a
   deduplicação existir.
8. **Captura e análise são estágios separados com fila.** Falha de LLM não pode
   invalidar captura — senão o sistema recoleta à toa e perde item.
9. **Teste que precisa de credencial falha quando ela não existe; nunca pula.** Suite
   que pula em silêncio dá verde falso, que é pior que suite ausente.
10. **Migração é idempotente de verdade e o histórico inteiro roda a cada deploy.**
    "Não dá erro ao repetir" não basta — backfill precisa de guarda.

---

## 6. Mapa por nível

| Escopo | Arquivo | Estado |
|---|---|---|
| Raiz | `AGENTS.md` (este) | vale para o repositório inteiro |
| `apps/api/` | — | **nenhum ainda** |
| `apps/web/` | — | **nenhum ainda** |
| `apps/cli/` | — | **nenhum ainda** |
| `packages/*` | — | **nenhum ainda** |

Nenhuma subpasta tem `AGENTS.md` próprio. Isso é deliberado: ainda não existe módulo
suficiente para justificar um. Crie um `AGENTS.md` de subpasta quando `apps/api` e
`apps/web` tiverem módulos suficientes para gerar convenção local que este arquivo não
cobre — e não antes, porque contrato duplicado diverge.

---

## 7. Índice de docs

| Doc | Que pergunta ele responde |
|---|---|
| [`docs/WORKFLOW.md`](docs/WORKFLOW.md) | Como uma mudança sai do pedido até o merge — branch, commit, teste, PR, e o que é do humano |
| [`docs/SEGURANCA.md`](docs/SEGURANCA.md) | O que todo PR precisa confirmar item a item antes de existir |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Quais pacotes existem, quem pode importar quem, quais são as duas interfaces e onde cada coisa roda |
| [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) | Quais são as 13 tabelas, o que foi removido do modelo original e por quê, e como o `canonical_id` é derivado |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | O que está fora da Fatia 1 e em qual fatia cada coisa entra |
| [`README.md`](README.md) | O que o produto é e como rodá-lo no Windows do zero |
| [`docs/superpowers/specs/2026-08-01-nexolume-fatia-1-design.md`](docs/superpowers/specs/2026-08-01-nexolume-fatia-1-design.md) | Por que cada decisão de desenho foi tomada — a spec aprovada |
| [`docs/superpowers/plans/2026-08-01-fatia-1.md`](docs/superpowers/plans/2026-08-01-fatia-1.md) | O que exatamente implementar, tarefa a tarefa, com o DAG de dependências |
