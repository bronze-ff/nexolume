# 0002 — Fonte única de regras

- **Data:** 2026-11-06
- **Status:** aceita

## Contexto

As regras estavam concentradas em `AGENTS.md`, com uma ponte em `CLAUDE.md`. Era
necessário alinhar a ordem do documento ao padrão v2 sem perder os limites de
segurança, produto e revisão já aceitos.

## Decisão

`AGENTS.md` passa a iniciar pelo bloco comum literal e organiza as regras em comandos,
arquitetura e regras de negócio, e regras específicas. `CLAUDE.md` continua contendo
apenas `@AGENTS.md`. Não há arquivo de fluxo de trabalho separado.

## Consequências

Há uma única fonte para regras do repositório; decisões futuras continuam registradas
nesta pasta.
