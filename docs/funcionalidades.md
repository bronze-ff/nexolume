# Funcionalidades

Estado em 2026-10-10: nenhuma tela existe. O que segue é o comportamento aprovado da
Fatia 1, ainda não implementado. A fonte completa é a
[spec](superpowers/specs/2026-08-01-nexolume-fatia-1-design.md).

## Captura

O usuário clipa com o Obsidian Web Clipper. A nota cai em `raw/` no vault
`bronze-ff/obsidian-second-brain` e a automação de backup faz push. O Nexolume lê
esse repositório pela API do GitHub, somente leitura, e não descobre conteúdo na web
nesta fatia.

Cada arquivo novo ou alterado vira item canônico, com resumo e pontos principais.
Dois arquivos com a mesma URL viram um item só. A duplicata real do corpus de
2026-08-01 (`Meu Segundo Cérebro` e a cópia de MD5 idêntico) é o caso de teste.

## Descobertas

Lista tudo o que entrou no vault, do mais recente para o mais antigo. Por item:
título, autor, data, origem (YouTube, X ou web), resumo curto, pontos principais,
temas, estado real da transcrição e link direto. Em vídeo, o timestamp do trecho
`**2:11** ·` vira `?t=131` na URL da fonte.

Item sem recomendação continua nesta aba. Descarte é resultado, não falha.

## Aplicações

Só o que casou com algum projeto conectado, agrupado por projeto. Por recomendação:
por que se aplica, evidência na fonte, evidência no projeto (arquivo e trecho),
benefício, risco, esforço, confiança e o próximo passo.

A ação principal é copiar a instrução pronta para colar numa sessão do projeto. O
Nexolume não aplica a mudança.

## Fontes e projetos

A tela de fontes mostra o SHA e a data do último commit lido, e permite
reprocessar uma execução que falhou. Pelo menos um repositório do GitHub entra como
projeto, também somente leitura.

Enquanto a aplicação local está aberta, um watcher dentro do processo da API consulta
o HEAD do vault a cada 5 minutos e processa só o que mudou. Não há cron externo nesta
fatia.

## O que fica para outras fatias

| Fatia | Entra |
| --- | --- |
| 2 | Conectores de `ratos.link` e `biip.club` |
| 3 | Agenda persistente, deploy em VPS, provedor `anthropic-api` |
| 4 | Digest diário e semanal |
| 5 | Conector do X pela API oficial, atrás de feature flag |
| 6 | Busca semântica com `pgvector`, se a busca textual não bastar |
| 7 | Feedback alterando a prioridade futura |

O conector local Windows está cancelado enquanto o vault for um repositório git.
