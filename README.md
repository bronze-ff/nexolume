# Nexolume

> **Do sinal ao projeto.**

Radar pessoal de conhecimento aplicado. Lê o que você salva no seu vault do Obsidian,
resume tudo, e diz o que se aplica a quais dos seus projetos — com evidência dos dois
lados.

## Estado atual — 2026-08-01

**Pré-implementação.** A especificação da primeira fatia está aprovada; o código ainda
não existe.

- Spec: [`docs/superpowers/specs/2026-08-01-nexolume-fatia-1-design.md`](docs/superpowers/specs/2026-08-01-nexolume-fatia-1-design.md)
- Próximo passo: plano de implementação, depois execução

## Como funciona

```
você clipa (Web Clipper)  →  vault do Obsidian  →  push automático para o GitHub
                                                              ↓
                                          Nexolume detecta e processa
                                                              ↓
                          Descobertas: resumo e pontos principais de TUDO
                          Aplicações:  o que se encaixa em qual projeto
```

O Nexolume **não** altera repositório, **não** abre PR e **não** escreve no vault. Ele
produz a análise e entrega a instrução pronta para você aplicar onde quiser.

## Aviso

Este repositório é **público**. Connection strings, tokens e conteúdo capturado nunca
entram no git — ver `.gitignore`.
