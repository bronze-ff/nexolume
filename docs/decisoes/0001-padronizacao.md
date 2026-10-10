# 0001 — Padronização de documentação

- **Data:** 2026-10-10
- **Status:** aceita (Filippe, onda 1, 17:58 BRT)

## Contexto

O Nexolume é um repositório público de documentação. A spec e o plano da Fatia 1 já
estavam em `docs/superpowers/`. Não havia `AGENTS.md`, `CLAUDE.md`, CI nem o conjunto
`docs/funcionalidades.md`, `docs/arquitetura.md`, `docs/operacao.md`.

A padronização da casa pede README curto, uma fonte de regras para agentes,
`CLAUDE.md` apontando para ela, ADRs e uma CI rápida. O plano de 2026-08-01 pedia, na
Task 1, outro conjunto de nomes (`ARCHITECTURE.md`, `WORKFLOW.md`, `SEGURANCA.md`).
Manter os dois criaria duas fontes.

Não há aplicação. Sentry e PostHog não têm o que observar.

## Decisão

1. `AGENTS.md` é a única fonte de regras para agentes. `CLAUDE.md` contém só
   `@AGENTS.md`.
2. O contrato de produto fica em `docs/funcionalidades.md`, `docs/arquitetura.md` e
   `docs/operacao.md`. A spec e o plano de 2026-08-01 permanecem em
   `docs/superpowers/`. Nada foi movido: já estavam sob `docs/`, e o inventário desta
   onda não pedia mudança de caminho.
3. Issues ficam nas GitHub Issues de `bronze-ff/nexolume`. Referência `#n` e
   `Fixes #n`. Não se usa Linear nem identificador `FIL-`.
4. Todo PR passa pelo Codex Review automático. Merge só com review limpa (sem P0/P1
   em aberto) e CI verde. Quem mergeia é o Filippe. Agentes não comentam
   `@codex review`.
5. A CI desta fase só confere qualidade de documentação e segredo nos commits novos:
   lint de Markdown, links internos e gitleaks no intervalo do PR. Actions pinadas
   por SHA. Sem job de teste, build, Sentry release ou scan de dependência de app,
   porque não há app.
6. Não se adiciona Sentry nem PostHog. Não há DSN. Observabilidade de runtime espera
   um app deployável e um ADR próprio.
7. `.env.example` lista o contrato futuro da Fatia 1 com segredos vazios. Nenhum
   processo lê esse arquivo hoje.

## Consequências

- A Task 1 do plano não deve recriar os docs em inglês. O banner no plano aponta
  para cá.
- Quando o código nascer, `npm run verify` ganha typecheck, teste e build por cima
  destes checks, em vez de um workflow paralelo. Isso é outra mudança.
- Sentry e PostHog continuam fora até existir aplicação e uma decisão explícita.
- Labels `bug` e `feature` dos templates precisam existir no repositório para o
  GitHub aplicá-las. Criá-las é configuração da conta, não deste commit.
