import assert from 'node:assert/strict';
import { test } from 'node:test';
import { anchorExists, headingSlugsFrom } from './check-md-links.mjs';

test('heading com code span mantém o texto na âncora', () => {
  const markdown = [
    '```bash',
    '# Token com escopo `repo`',
    '```',
    '',
    '## Task 9: Provedor `claude-cli` e prompt de análise',
    '',
  ].join('\n');
  const slugs = headingSlugsFrom(markdown);

  assert.equal(slugs.has('task-9-provedor-claude-cli-e-prompt-de-análise'), true);
  assert.equal(slugs.has('task-9-provedor-e-prompt-de-análise'), false);
  assert.equal(slugs.has('token-com-escopo-repo'), false);
});

test('fragmento do link não é slugificado antes da comparação', () => {
  const slugs = headingSlugsFrom(['## Uso', '', '## Instalação rápida', ''].join('\n'));

  assert.equal(anchorExists(slugs, 'uso'), true);
  assert.equal(anchorExists(slugs, 'instalação-rápida'), true);
  assert.equal(anchorExists(slugs, 'Uso'), false);
  assert.equal(anchorExists(slugs, 'uso!'), false);
  assert.equal(anchorExists(slugs, 'Instalação Rápida'), false);
});
