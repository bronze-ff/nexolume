import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const errors = [];

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (name.endsWith('.md')) out.push(full);
  }
  return out;
}

function stripInlineCode(line) {
  return line.replace(/`[^`\n]*`/g, '');
}

function unwrapInlineCode(line) {
  return line.replace(/`([^`\n]*)`/g, '$1');
}

function visibleLines(markdown, transform) {
  const lines = markdown.split(/\r?\n/);
  const visible = [];
  let fence = null;
  for (const line of lines) {
    const marker = line.match(/^( {0,3})(`{3,}|~{3,})/);
    if (marker) {
      const token = marker[2];
      if (!fence) {
        fence = { char: token[0], len: token.length };
        visible.push('');
        continue;
      }
      if (token[0] === fence.char && token.length >= fence.len) {
        fence = null;
        visible.push('');
        continue;
      }
    }
    visible.push(fence ? '' : transform(line));
  }
  return visible;
}

function linksIn(line) {
  const found = [];
  const inline = /!?\[[^\]]*\]\(\s*<?([^)\s>]+)>?/g;
  for (const match of line.matchAll(inline)) found.push(match[1]);
  const ref = /^ {0,3}\[[^\]]+\]:\s+(\S+)/.exec(line);
  if (ref) found.push(ref[1]);
  return found;
}

function isSkippable(url) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(url);
}

function githubSlug(text) {
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/[^\p{L}\p{M}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
}

const files = walk(root);
const headings = new Map();

export function headingSlugsFrom(markdown) {
  const slugs = new Set();
  const counts = new Map();
  for (const line of visibleLines(markdown, unwrapInlineCode)) {
    const heading = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!heading) continue;
    const base = githubSlug(heading[2]);
    const seen = counts.get(base) ?? 0;
    counts.set(base, seen + 1);
    slugs.add(seen === 0 ? base : `${base}-${seen}`);
  }
  return slugs;
}

/**
 * O fragmento do link é comparado como está (já decodificado) com as âncoras
 * geradas dos headings. Slugificar o fragmento aceitava âncoras que o GitHub
 * não resolve, como `#Instalação` ou `#Uso!` para o heading `## Uso`.
 */
export function anchorExists(slugs, fragment) {
  return slugs.has(fragment);
}

function headingSlugs(file) {
  if (headings.has(file)) return headings.get(file);
  const slugs = headingSlugsFrom(readFileSync(file, 'utf8'));
  headings.set(file, slugs);
  return slugs;
}

function main() {
  for (const file of files) {
    const lines = visibleLines(readFileSync(file, 'utf8'), stripInlineCode);
    lines.forEach((line, index) => {
      for (const raw of linksIn(line)) {
        if (isSkippable(raw)) continue;
        const [beforeQuery] = raw.split('?');
        const hash = beforeQuery.indexOf('#');
        const pathPart = hash === -1 ? beforeQuery : beforeQuery.slice(0, hash);
        const fragment = hash === -1 ? '' : decodeURIComponent(beforeQuery.slice(hash + 1));
        let target;
        if (pathPart === '') {
          target = file;
        } else {
          const decoded = decodeURIComponent(pathPart);
          target = decoded.startsWith('/')
            ? resolve(root, `.${decoded}`)
            : resolve(dirname(file), decoded);
        }
        const rel = relative(root, target);
        if (rel.startsWith('..') || rel.split(sep).includes('..')) {
          errors.push(`${relative(root, file)}:${index + 1}: link fora do repositório: ${raw}`);
          continue;
        }
        let exists = false;
        try {
          exists = statSync(target).isFile();
        } catch {
          exists = false;
        }
        if (!exists) {
          errors.push(`${relative(root, file)}:${index + 1}: arquivo não encontrado: ${raw}`);
          continue;
        }
        if (fragment && target.endsWith('.md') && !anchorExists(headingSlugs(target), fragment)) {
          errors.push(`${relative(root, file)}:${index + 1}: âncora não encontrada: ${raw}`);
        }
      }
    });
  }

  if (errors.length > 0) {
    console.error(errors.join('\n'));
    console.error(`\n${errors.length} link(s) interno(s) quebrado(s).`);
    process.exit(1);
  }

  console.log(`Links internos ok (${files.length} arquivo(s) markdown).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
