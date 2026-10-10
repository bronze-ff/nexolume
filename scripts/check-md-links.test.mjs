import assert from 'node:assert/strict';
import { test } from 'node:test';
import { headingSlugsFrom } from './check-md-links.mjs';

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
