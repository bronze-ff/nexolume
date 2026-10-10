# Nexolume — do sinal ao projeto

Radar pessoal de conhecimento aplicado. Lê o que você salva no vault do Obsidian,
resume tudo e diz o que se aplica a quais dos seus projetos, com evidência dos dois
lados. Entrega a instrução pronta. Não altera repositório, não abre PR e não escreve
no vault.

**Status:** pré-implementação em 2026-10-10. Este repositório é só documentação. O
código da Fatia 1 ainda não existe.
**Stack prevista:** Node 24, TypeScript, Express, React 18 + Vite, PostgreSQL no Neon.
Nada disso está instalado aqui.
**Dono:** Filippe (`bronze-ff`).

## Como rodar (dev)

Não há servidor, teste de aplicação nem build. No Windows, em PowerShell, a checagem
deste repositório é:

```powershell
git clone https://github.com/bronze-ff/nexolume.git
Set-Location nexolume
npm ci
npm run verify
```

`npm run verify` faz o lint dos Markdown e confere os links internos. A CI usa Node 24
(`.nvmrc`). Node 22 ou mais novo também roda esses scripts.

## Como publicar

Não há deploy. Publicar é mergear na `main` com CI verde e Codex Review limpo.
Variáveis, segredos e o runtime previsto estão em [docs/operacao.md](docs/operacao.md).

## Estrutura

| Caminho | O que é |
| --- | --- |
| `README.md`, `AGENTS.md`, `CLAUDE.md` | Entrada para humano e para agentes |
| `docs/funcionalidades.md` | O que o produto faz |
| `docs/arquitetura.md` | Desenho aprovado da Fatia 1 |
| `docs/operacao.md` | Verificação, segredos, publicação |
| `docs/decisoes/` | ADRs |
| `docs/superpowers/` | Spec e plano aprovados em 2026-08-01 |
| `.github/workflows/ci.yml` | Lint, links e gitleaks |

## Documentação

- [Funcionalidades](docs/funcionalidades.md)
- [Arquitetura](docs/arquitetura.md)
- [Operação](docs/operacao.md)
- [Decisão 0001 — padronização](docs/decisoes/0001-padronizacao.md)
- [Spec da Fatia 1](docs/superpowers/specs/2026-08-01-nexolume-fatia-1-design.md)
- [Plano de implementação](docs/superpowers/plans/2026-08-01-fatia-1.md)

## Aviso

Este repositório é **público**. Connection string, token e conteúdo capturado não
entram no git. A lista está no `.gitignore`.
