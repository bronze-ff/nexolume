# WORKFLOW — contrato de processo

Como uma mudança sai do pedido até o merge. Vale para humano e para agente.

---

## §0 O ciclo completo

| Passo | O quê | Quem |
|---|---|---|
| 1 | Pedido: uma tarefa do plano, ou um problema descrito | humano |
| 2 | Ler `AGENTS.md`, a tarefa no plano e os docs que ela toca | agente |
| 3 | Cortar a branch de `main` fresca | agente |
| 4 | Escrever o teste que falha | agente |
| 5 | Implementar até o teste passar | agente |
| 6 | `npm test` e `npm run typecheck` verdes na raiz | agente |
| 7 | Commit em português, Conventional Commits | agente |
| 8 | `git push` da branch | agente |
| 9 | Abrir o PR contra `main`, com o que foi verificado e como | agente |
| 10 | Revisar o PR | humano |
| 11 | **Merge** | **humano** |
| 12 | Deletar a branch | humano |

Os passos 10, 11 e 12 são do humano. Nenhum agente executa nenhum deles.

---

## §1 Branches

- Formato: `<tipo>/<descricao>` — ex.: `feat/conector-vault`, `docs/contratos-fundamentais`.
- Tipos: `feat`, `fix`, `refactor`, `test`, `chore`, `docs`.
- Sempre cortada de `main` **fresca** (`git fetch origin main` antes).
- **Uma tarefa = uma branch = um PR.** Tarefa que virou duas branches perdeu a
  rastreabilidade entre o plano e o histórico.
- **Nunca commitar direto na `main`.**

---

## §2 Commits

Conventional Commits, **mensagem em português**:

```
<tipo>(<escopo opcional>): <o que mudou, no imperativo>
```

```
docs: contratos fundamentais — AGENTS, WORKFLOW, SEGURANCA
feat(db): schema inicial com 13 tabelas e runner de migração idempotente
fix(canonical): trata youtu.be sem barra final
test(dedup): cobre o par real "Segundo Cérebro"
```

Tipos iguais aos das branches. O corpo do commit, quando existir, diz **por quê**, não o
que — o *o quê* já está no diff.

---

## §3 Testes

- `npm test` na raiz roda **tudo** (Vitest sobre `packages/*/test` e `apps/*/test`).
- `npm run typecheck` roda `tsc -b` em todo o monorepo.
- **Obrigatório verde antes do PR.** Sem exceção, sem "vou consertar no próximo".
- Teste que precisa de credencial **falha** quando ela não existe. Nunca `skip`, nunca
  `it.skipIf`. Suite que pula em silêncio dá verde falso, que é pior que suite ausente.
- Teste primeiro: escreva o teste que falha, veja falhar, então implemente.

---

## §4 PR

- Sempre contra `main`.
- O corpo diz **o que foi verificado e como** — comando rodado e saída observada, não
  "testado localmente".
- Um PR por tarefa.

### O merge é do humano

**Não faça merge. Não toque na `main`.**

O porquê, para ninguém "otimizar" este portão daqui a três meses: **subir e lançar são
eventos diferentes.** Código verde no CI significa que ele não quebrou o que existia —
não significa que a mudança é a certa, que o comportamento é o desejado, ou que este é o
momento de ela existir. Quem decide isso é quem responde pelo produto. Automatizar o
merge junta as duas decisões numa só e apaga a única fronteira onde um erro de julgamento
ainda é barato de reverter.

---

## §5 Dúvida

Se o plano não responde alguma coisa, **não chute**.

Imprima uma linha começando com `PERGUNTA:` e **pare**:

```
PERGUNTA: o `esforco` da recomendação aceita valor fora de baixo|medio|alto?
```

Chute vira convenção: o próximo agente lê o código, assume que foi decidido, e o erro
deixa de ser visível. Uma pergunta custa minutos; uma convenção errada custa refatoração.

---

## §6 Banco

- Migração é **numerada** — `001_inicial.sql`, `002_….sql` — e vive em
  `apps/api/src/db/migrations/`.
- Migração é **idempotente**: `IF NOT EXISTS` em tudo; backfill com guarda que impede
  reaplicar.
- **O histórico inteiro roda a cada `npm run migrar`.** Não existe "rodar só a última".
  É isso que garante que ambiente novo sobe igual ao antigo.
- Nunca editar migração já aplicada. Corrija com uma migração nova.
- Mudança de schema que remove ou renomeia coluna é *expand/contract*: adiciona, migra o
  uso, só então remove — em migrações separadas.

---

## §7 Nunca commitar

- Segredo de qualquer tipo: `.env`, connection string, token, chave.
- `node_modules/`, `dist/`, `build/`, `coverage/`, `*.tsbuildinfo`.
- Dump de conteúdo capturado, `*.dump`, `*.sql.gz`, `/output/`, `/tmp/`.

Fixtures de teste são a exceção deliberada: vivem em `packages/*/test/fixtures/` e entram
no git **uma a uma**, escolhidas, nunca por lote. Se precisou de `git add -f`, pare e
pergunte — a regra existe justamente para o caso que parece exceção.

---

## §8 Orquestração

O projeto é tocado com a skill `orquestrar-projeto`: tarefas são despachadas para
subagentes executores em worktrees isoladas, e o coordenador verifica antes de liberar a
onda seguinte.

**Dependência entre tarefas só existe no DAG do plano, nunca inferida do título.** Duas
tarefas com nomes parecidos podem ser independentes; duas com nomes sem relação nenhuma
podem ter dependência real. O DAG está no fim de
`docs/superpowers/plans/2026-08-01-fatia-1.md`, seção "Como executar" — ele é a fonte de
verdade da ordem.

`worker_done` significa **pronto para verificação**, não *aceito*.
