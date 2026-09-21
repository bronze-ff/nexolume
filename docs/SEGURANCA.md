# SEGURANÇA — checklist de PR

Todo PR confirma estes itens **um a um**, no corpo do PR. "Não se aplica" é resposta
válida; silêncio não é.

As restrições G1–G6 do plano da Fatia 1 são a base; os dez itens abaixo são o contrato
verificável que elas produzem.

---

## Checklist

1. **Segredo nunca tem fallback fraco:** ausência falha o boot, não cai em default.
2. **Segredo não aparece em log, em resposta de API, nem mascarado.** Mascarar convida a
   logar; o certo é não passar pelo log.
3. **Toda URL que o sistema busca é validada:** bloqueio de IP privado e de metadata de
   nuvem, timeout, teto de tamanho e teto de redirecionamento.
4. **Conteúdo de terceiros é sempre tratado como não confiável.** Entra em bloco
   delimitado e rotulado, separado das instruções do sistema.
5. **A análise roda sem ferramentas.** Sem bash, sem acesso a arquivo, sem MCP. Texto
   entra, JSON sai.
6. **Nenhuma escrita em repositório de projeto, em PR, ou no vault.**
7. **Rate limit e retry com backoff em toda chamada externa.**
8. **Proveniência:** todo item guarda de onde veio e em qual commit foi lido.
9. **Erro para o usuário é genérico; detalhe vai para o log do servidor.**
10. **Teste de regressão para cada correção de segurança**, com o porquê no comentário.

---

## Notas que evitam o mal-entendido

**Sobre o item 3, na Fatia 1.** Hoje o sistema chama **só** a API do GitHub, com host
conhecido — parece que o validador de URL não tem função. Ele existe desde já mesmo
assim: a Fatia 2 traz conectores web (`ratos.link`, `biip.club`) que buscam URL arbitrária,
e validador improvisado sob pressão de entrega é como SSRF entra. Construir agora custa
pouco e fixa o formato antes de haver um caso urgente.

**Sobre o item 4 e o item 5, juntos.** A defesa real contra injeção de prompt não é
filtrar o texto do clipping — filtro sempre tem buraco. É o modelo **não ter nada para
executar**. Por isso a chamada de análise não recebe ferramenta nenhuma, e por isso o
Claude Code rodando em servidor foi recusado: ele é um agente com shell e acesso a
arquivo, e conteúdo de terceiros não deve alcançar um processo com essa capacidade.

**Sobre o item 6.** É contrato de produto, não só de segurança. O `CLAUDE.md` do vault
já define quem escreve o quê; um segundo escritor entra em conflito com a automação de
backup — e o conflito é silencioso.

**Sobre o repositório ser público.** Connection string, token e dump de conteúdo
capturado **nunca** entram no git. Histórico não se apaga: um segredo commitado está
vazado mesmo depois de removido, e a resposta correta é rotacioná-lo, não reescrever o
histórico.

**Sobre o túnel Cloudflare.** Quando o acesso móvel entrar, o túnel fica
**obrigatoriamente** atrás de Cloudflare Access. **Access primeiro, túnel depois** — nunca
o contrário. Um túnel sem autenticação expõe o segundo cérebro inteiro na internet
pública.

---

## Comportamento esperado por falha

| Situação | Comportamento |
|---|---|
| GitHub indisponível ou rate limit | `source_run` falha com erro registrado, reprocessável na tela Fontes |
| Frontmatter malformado | item marcado `parse_falhou`, **visível**, não derruba a execução |
| LLM indisponível ou orçamento estourado | item fica `aguardando_analise`, captura preservada |
| Saída do modelo fora do schema | erro — nunca aceito como texto livre |
| Segredo ausente no boot | processo não sobe, com a chave faltante nomeada no erro |
