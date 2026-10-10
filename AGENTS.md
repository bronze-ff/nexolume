# AGENTS.md

## O que é

Radar pessoal de conhecimento aplicado: lê o vault do Obsidian, resume cada item e
relaciona o que se aplica aos projetos conectados. Não escreve no vault, não altera
repositório de projeto e não abre PR em outro repo. A inteligência já existe; o
Nexolume é memória, deduplicação, cobertura e repetição em volta dela.

## Estado

Pré-implementação. Este repositório tem documentação e a CI que a confere. Não há
`apps/`, `packages/`, banco, workflow de deploy nem SDK. A spec e o plano da Fatia 1
estão em `docs/superpowers/` e continuam válidos. A Task 1 daquele plano foi absorvida
por esta padronização: não crie `docs/ARCHITECTURE.md`, `docs/WORKFLOW.md` nem os
outros nomes em inglês listados lá.

## Comandos

Antes de abrir ou atualizar um PR, na raiz:

```powershell
npm ci
npm run verify
```

`verify` roda o lint de Markdown e a checagem de links internos. É o mesmo comando do
job `docs` na CI. Não existe `npm test` nem `npm run build`.

A CI também roda o gitleaks só nos commits novos do PR (job `gitleaks`). Não há
secret no workflow.

## Estrutura e onde mexer

| Caminho | Mexer quando |
| --- | --- |
| `README.md` | Mudou o que um humano precisa para entrar no repo |
| `AGENTS.md` | Mudou comando, limite ou regra de review. Fonte única |
| `CLAUDE.md` | Nunca, além da linha `@AGENTS.md` |
| `docs/funcionalidades.md` | Mudou o que o produto faz, por tela |
| `docs/arquitetura.md` | Mudou desenho, pastas ou integrações |
| `docs/operacao.md` | Mudou verificação, variável, publicação ou rollback |
| `docs/decisoes/` | Decisão nova. ADR novo; não reescreva os aceitos |
| `docs/superpowers/` | Spec e plano de 2026-08-01. Corrija link quebrado; não reescreva o contrato |
| `.github/workflows/ci.yml` | A issue pedir mudança de CI. Versão de action fixa |
| `.env.example` | Nascer variável que o app futuro vá ler. Valor secreto vazio |

Código de aplicação ainda não tem pasta. Quando a Fatia 1 for implementada, o desenho
aprovado é `apps/web`, `apps/api`, `apps/cli` e `packages/domain`, `packages/connectors`,
`packages/intelligence`, `packages/shared`. `packages/domain` não importa `connectors`
nem `intelligence`.

## Não faça

- Commitar `.env`, `.env.*` (exceto `.env.example`), `.mcp.json`, token, connection
  string, DSN ou dump de clipping/transcrição. Se precisou de `git add -f`, pare.
- Reescrever histórico do git.
- Fazer merge, ou commitar direto na `main`. O merge é do Filippe.
- Comentar `@codex review` ou `@codex fix`. O review automático já cobre o PR, e um
  comentário vindo de automação é ignorado.
- Abrir ou citar trabalho no Linear. Não use identificador `FIL-`.
- Adicionar Sentry, PostHog ou outro SDK. Não há aplicação.
- Tratar o plano de 2026-08-01 como pedido para recriar docs com nome em inglês.
- Mexer em migração já aplicada. Ainda não existe migração; quando existir, o
  histórico inteiro precisa continuar rodando.
- Dar ferramenta (bash, arquivo, MCP) à chamada de análise, ou escrever no vault.

## Fluxo de issue e PR

O trabalho deste repositório fica nas GitHub Issues de `bronze-ff/nexolume`. Uma
mudança cita a issue no corpo do PR com `Fixes #n` (fecha no merge) ou `Ref #n`
(só liga). Branch a partir de `main` atualizada, no formato `<tipo>/<descricao>`
(`docs`, `feat`, `fix`, `chore`).

Todo PR passa pelo Codex Review automático. Só se mergeia com review limpa (nenhum
achado P0/P1 em aberto) e com os jobs `docs` e `gitleaks` verdes.

## Code Review Rules

- P0: segredo, token, connection string, DSN, chave ou conteúdo capturado commitado.
  O repositório é público e o histórico não se reescreve.
- P0: segredo com valor default no código, ou DSN/chave hardcoded. Sem a variável de
  ambiente, o boot falha.
- P0: escrita no vault, alteração de repositório de projeto, PR aberto em outro repo,
  ou chamada de análise com ferramenta.
- P0: `packages/domain` importando `connectors` ou `intelligence`, quando o código
  existir.
- P0: saída de LLM aceita sem validação por schema, quando o código existir.
- P1: `CLAUDE.md` com qualquer conteúdo além de `@AGENTS.md`.
- P1: menção a Linear ou identificador `FIL-`. A referência é `#n` / `Fixes #n`.
- P1: action em tag flutuante (`@v4`, `@main`) ou imagem `:latest` no workflow.
- P1: Sentry, PostHog ou outro SDK enquanto este repositório não tiver aplicação
  deployável.
- P1: link interno de Markdown quebrado, ou contrato que contradiz a spec da Fatia 1
  sem um ADR novo.
- P1: teste que depende de credencial e é pulado em vez de falhar, quando a suíte
  existir.

## Observabilidade

Não há aplicação, então não há projeto Sentry nem PostHog, e não há DSN para
configurar. Não inicialize SDK nenhum.

O contrato, para o dia em que um ADR autorizar observabilidade num app deployável:

- DSN e chaves só por variável de ambiente. Sem a variável, a inicialização não faz
  nada e o build não depende dela.
- Não logar CPF, CNPJ, telefone, e-mail, placa, nem campos `senha`, `token`,
  `authorization` ou `cookie`.
- Conteúdo de clipping é dado de terceiro e não entra em log, breadcrumb nem corpo
  de request.

## Regras de produto que já valem

1. O resumo é a base. A recomendação é o bônus. Todo item do vault ganha resumo,
   mesmo sem projeto correspondente.
2. A identidade do item é o `canonical_id`, não o caminho do arquivo.
3. Captura e análise são estágios separados. Falha de LLM não apaga a captura.
4. Conteúdo capturado entra em bloco delimitado e rotulado como não confiável.
5. A análise não recebe ferramenta. Texto entra, JSON sai.

O detalhe está na [spec](docs/superpowers/specs/2026-08-01-nexolume-fatia-1-design.md)
e nas [decisões](docs/decisoes/0001-padronizacao.md).
