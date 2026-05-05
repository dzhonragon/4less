/**
 * Docs build script
 *
 * Source files (4less templates and markdown):
 *   docs/pages/index.4l     → docs/index.html
 *   docs/pages/guide.4l     → docs/pages/guide/index.html
 *   docs/*.md               → docs/pages/guide/<slug>/index.html
 *   docs/pages/components/*.4l → compiled and injected into guide pages
 *
 * Usage: npm run docs:build  (runs `npm run build` first via the npm script)
 */

import * as esbuild from 'esbuild';
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const root  = resolve(__dir, '..');

// ── 1. Import 4less from compiled dist/ ──────────────────────────────────
const { compile } = await import(resolve(root, 'dist/index.js'));

// ── 2. Bundle browser entry ──────────────────────────────────────────────
console.log('Bundling src/browser.ts → docs/4less.js …');
await esbuild.build({
  entryPoints: [resolve(root, 'src/browser.ts')],
  bundle:      true,
  format:      'esm',
  platform:    'browser',
  minify:      true,
  outfile:     resolve(root, 'docs/4less.js'),
  logLevel:    'silent',
});
console.log('  done');

// ── 3. Helpers ───────────────────────────────────────────────────────────
const esc = s => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function readFile(relPath) {
  return readFileSync(resolve(root, relPath), 'utf8');
}

function compileFile(relPath) {
  return compile(readFile(relPath));
}

// ── 3b. Custom 4less syntax highlighter (site-palette colors) ────────────
// Character-by-character tokenizer avoids regex re-processing own output.
const KEYWORDS = new Set(['for', 'in', 'if', 'else', 'else-if', 'component']);
function highlight4l(src) {
  const out = [];
  let i = 0;
  const peek = () => src[i] ?? '';
  const eat  = () => src[i++];

  while (i < src.length) {
    const ch = peek();

    // String literal
    if (ch === '"') {
      let s = eat(); // opening "
      while (i < src.length && peek() !== '"') {
        s += eat();
      }
      s += eat(); // closing "
      out.push(`<span style="color:#6ee7b7">${s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span>`);
      continue;
    }

    // Variable $name
    if (ch === '$') {
      let s = eat();
      while (/[a-zA-Z0-9_]/.test(peek())) s += eat();
      out.push(`<span style="color:#c084fc">${s}</span>`);
      continue;
    }

    // ID selector #foo (must be preceded by word char, }, or whitespace to avoid # in other contexts)
    if (ch === '#' && /[a-zA-Z_]/.test(src[i + 1] ?? '')) {
      let s = eat(); // #
      while (/[a-zA-Z0-9_-]/.test(peek())) s += eat();
      out.push(`<span style="color:#38bdf8">${s}</span>`);
      continue;
    }

    // Class selector .foo
    if (ch === '.' && /[a-zA-Z_]/.test(src[i + 1] ?? '')) {
      let s = eat(); // .
      while (/[a-zA-Z0-9_-]/.test(peek())) s += eat();
      out.push(`<span style="color:#38bdf8">${s}</span>`);
      continue;
    }

    // Word: keyword, attribute key (word followed by :), or plain identifier
    if (/[a-zA-Z_]/.test(ch)) {
      let word = '';
      while (/[a-zA-Z0-9_-]/.test(peek())) word += eat();
      if (peek() === ':') {
        // attribute key
        out.push(`<span style="color:#94a3b8">${word}</span>`);
      } else if (KEYWORDS.has(word)) {
        out.push(`<span style="color:#818cf8">${word}</span>`);
      } else {
        out.push(word);
      }
      continue;
    }

    // Negation operator
    if (ch === '!') { eat(); out.push(`<span style="color:#818cf8">!</span>`); continue; }

    // HTML special chars
    if (ch === '<') { eat(); out.push('&lt;'); continue; }
    if (ch === '>') { eat(); out.push('&gt;'); continue; }
    if (ch === '&') { eat(); out.push('&amp;'); continue; }

    out.push(eat());
  }

  return out.join('');
}

// ── 4. Shared HTML head ──────────────────────────────────────────────────
const SITE_URL  = 'https://4less.dzhonragon.com';
const SITE_NAME = '4less';

function htmlHead(title, description, canonicalPath = '/') {
  const canonical = `${SITE_URL}${canonicalPath}`;
  const t = esc(title);
  const d = esc(description);
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <meta name="description" content="${d}"/>
  <meta name="robots" content="index, follow"/>
  <title>${t}</title>
  <link rel="canonical" href="${canonical}"/>

  <!-- Open Graph -->
  <meta property="og:type"        content="website"/>
  <meta property="og:site_name"   content="${SITE_NAME}"/>
  <meta property="og:title"       content="${t}"/>
  <meta property="og:description" content="${d}"/>
  <meta property="og:url"         content="${canonical}"/>

  <!-- Twitter Card -->
  <meta name="twitter:card"        content="summary"/>
  <meta name="twitter:title"       content="${t}"/>
  <meta name="twitter:description" content="${d}"/>
  <meta name="twitter:creator"     content="@dzhonragon"/>

  <script src="https://cdn.tailwindcss.com"></script>
  <script>tailwind.config = { darkMode: 'class' }</script>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
  <style>
    body { font-family: 'Inter', system-ui, sans-serif; }
    code, pre, .font-mono, textarea { font-family: 'JetBrains Mono', ui-monospace, monospace; }
    iframe { display: block; }
  </style>
</head>`;
}

// ── 5. Syntax showcase cards ─────────────────────────────────────────────
const CARD_CSS = `
  *{box-sizing:border-box;font-family:system-ui,sans-serif;font-size:14px;line-height:1.6;color:#111}
  body{margin:0;padding:16px;background:#f8fafc}
  div{margin:2px 0}
  .card{background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:12px}
  h1{font-size:1.3em;font-weight:700;margin:0 0 4px}
  h2{font-size:1.1em;font-weight:600;margin:0 0 4px}
  h3{font-size:1em;font-weight:600;margin:0 0 4px}
  p{margin:2px 0;color:#475569}
  ul{margin:4px 0;padding-left:18px}
  li{margin:1px 0}
  a{color:#6366f1;text-decoration:none}
  .badge{background:#e0e7ff;color:#4338ca;border-radius:4px;padding:2px 7px;font-size:.8em;font-weight:600;margin-right:4px;display:inline-block}
  .btn{background:#6366f1;color:#fff;border-radius:6px;padding:5px 14px;display:inline-block;font-weight:500}
  input{border:1px solid #cbd5e1;border-radius:5px;padding:5px 9px;width:100%;margin:3px 0}
  label{font-size:.82em;font-weight:500;color:#64748b;display:block;margin-top:6px}
  form{display:flex;flex-direction:column;gap:2px}
`;

function syntaxCard(title, src, vars = {}) {
  let rendered;
  try { rendered = compile(src, vars); }
  catch (e) { rendered = `<span style="color:red">${esc(e.message)}</span>`; }
  const srcdoc = esc(`<!doctype html><html><head><style>${CARD_CSS}</style></head><body>${rendered}</body></html>`);
  return `<div class="syntax-card rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden" data-state="source">
  <div class="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
    <span class="text-xs text-zinc-400 font-mono">${esc(title)}</span>
    <div class="flex gap-1">
      <button class="card-tab card-tab-source text-xs font-mono px-2 py-0.5 rounded text-white bg-zinc-700">4less</button>
      <button class="card-tab card-tab-preview text-xs font-mono px-2 py-0.5 rounded text-zinc-400">preview</button>
    </div>
  </div>
  <div class="source-pane overflow-x-auto bg-zinc-950" style="min-height:160px">
    <pre style="margin:0;padding:14px 16px;color:#d1d5db;font-size:.75rem;line-height:1.6;font-family:inherit">${highlight4l(src.trim())}</pre>
  </div>
  <div class="preview-pane hidden" style="min-height:160px">
    <iframe class="w-full border-0" style="height:160px" srcdoc="${srcdoc}" scrolling="auto"></iframe>
  </div>
</div>`;
}

const syntaxCards = [
  syntaxCard('Elements',
    `div.card {\n  h2 "Components"\n  p "Build UIs declaratively."\n  a "Read docs" href:"/docs"\n}`),
  syntaxCard('Variables',
    `div {\n  h1 $name\n  p $role\n}`,
    { name: 'Alice', role: 'Frontend developer' }),
  syntaxCard('Loops',
    `ul {\n  for item in stack: li $item\n}`,
    { stack: ['TypeScript', 'React', 'Tailwind'] }),
  syntaxCard('Conditionals',
    `if admin: p "Admin panel"\nelse: p "Public only"`,
    { admin: false }),
  syntaxCard('Attr interpolation',
    `a "Profile" href:"/u/$user"\nimg src:"/avatars/$user.png" alt:$user`,
    { user: 'alice' }),
  syntaxCard('Components',
    `component Badge { span.badge $label }\n\nBadge label:"stable"\nBadge label:"v2.0"`),
].join('\n');

// ── 6. Landing page editor examples & scripts ────────────────────────────
const EDITOR_EXAMPLES = {
  hello: `div#app {\n  h1 "Hello, 4less"\n  p "A minimal DSL for HTML."\n}`,
  card:  `component Card {\n  div.card {\n    h3 $title\n    p $body\n  }\n}\n\nCard title:"Getting started" body:"Write less HTML."\nCard title:"Zero deps" body:"No runtime bloat."`,
  loop:  `div {\n  h2 "Stack"\n  ul {\n    for item in items: li $item\n  }\n}`,
  form:  `form {\n  label "Name"\n  input type:"text" placeholder:"Your name"\n  label "Email"\n  input type:"email" placeholder:"you@example.com"\n  button.btn "Send"\n}`,
};

const PREVIEW_CSS = `*{box-sizing:border-box;font-family:system-ui,sans-serif;line-height:1.5;color:#111;font-size:14px}body{margin:0;padding:16px;background:#f8fafc}div{margin:2px 0}.card{background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:12px}h1{font-size:1.4em;font-weight:700;margin:0 0 4px}h2{font-size:1.15em;font-weight:600;margin:0 0 4px}h3{font-size:1em;font-weight:600;margin:0 0 4px}p{margin:2px 0;color:#475569}ul{margin:4px 0;padding-left:18px}li{margin:1px 0}a{color:#6366f1}form{display:flex;flex-direction:column;gap:4px}.badge{background:#e0e7ff;color:#4338ca;border-radius:4px;padding:2px 7px;font-size:.8em;font-weight:600;margin-right:4px;display:inline-block}.btn{background:#6366f1;color:#fff;border-radius:6px;padding:5px 14px;display:inline-block}input{border:1px solid #cbd5e1;border-radius:5px;padding:5px 9px;width:100%;margin:2px 0}label{font-size:.82em;font-weight:500;color:#64748b;display:block;margin-top:4px}`;

const LANDING_SCRIPT = `<script type="module">
import {
  parse, generate, ParseError,
  HtmlGenerator, ReactGenerator, VueGenerator, AstroGenerator,
} from './4less.js';

const PREVIEW_CSS = ${JSON.stringify(PREVIEW_CSS)};
const EXAMPLES = ${JSON.stringify(EDITOR_EXAMPLES, null, 2)};

// ── Syntax card toggles ──────────────────────────────────────────────────
document.querySelectorAll('.syntax-card').forEach(card => {
  const tabSource  = card.querySelector('.card-tab-source');
  const tabPreview = card.querySelector('.card-tab-preview');
  const sourcePan  = card.querySelector('.source-pane');
  const previewPan = card.querySelector('.preview-pane');

  function activate(tab) {
    [tabSource, tabPreview].forEach(t => {
      t.classList.remove('text-white', 'bg-zinc-700');
      t.classList.add('text-zinc-400');
    });
    tab.classList.remove('text-zinc-400');
    tab.classList.add('text-white', 'bg-zinc-700');
  }

  tabSource.addEventListener('click', () => {
    activate(tabSource);
    sourcePan.classList.remove('hidden');
    previewPan.classList.add('hidden');
    card.dataset.state = 'source';
  });

  tabPreview.addEventListener('click', () => {
    activate(tabPreview);
    previewPan.classList.remove('hidden');
    sourcePan.classList.add('hidden');
    card.dataset.state = 'preview';
  });
});

// ── Hero mini editor ─────────────────────────────────────────────────────
const heroInput      = document.getElementById('hero-input');
const heroPreview    = document.getElementById('hero-preview');
const heroTabCode    = document.getElementById('hero-tab-code');
const heroTabPreview = document.getElementById('hero-tab-preview');

const DEFAULT_VARS = {
  name: 'Alice',
  role: 'Frontend developer',
  admin: true,
  show: true,
  items: ['TypeScript', 'React', 'Vue'],
  stack: ['TypeScript', 'React', 'Tailwind'],
  label: 'stable',
};

function runHero() {
  try {
    const html = generate(parse(heroInput.value), new HtmlGenerator({ vars: DEFAULT_VARS }));
    heroPreview.srcdoc = \`<!doctype html><html><head><style>\${PREVIEW_CSS}</style></head><body>\${html}</body></html>\`;
  } catch (e) {
    const msg = e instanceof ParseError
      ? e.errors.map(r => \`line \${r.line}:\${r.col} — \${r.message}\`).join('\\n')
      : String(e);
    heroPreview.srcdoc = \`<!doctype html><html><head><style>body{margin:16px;font:12px/1.5 monospace;color:#f87171;background:#0a0a0a}</style></head><body><pre>\${msg}</pre></body></html>\`;
  }
}

function heroActivateTab(active, inactive, showEl, hideEl) {
  active.classList.replace('text-zinc-400', 'text-white');
  active.classList.add('bg-zinc-700');
  inactive.classList.remove('bg-zinc-700');
  inactive.classList.replace('text-white', 'text-zinc-400');
  showEl.classList.remove('hidden');
  hideEl.classList.add('hidden');
}

heroTabPreview.addEventListener('click', () => {
  heroActivateTab(heroTabPreview, heroTabCode, heroPreview, heroInput);
  runHero();
});
heroTabCode.addEventListener('click', () => {
  heroActivateTab(heroTabCode, heroTabPreview, heroInput, heroPreview);
});
heroInput.addEventListener('input', runHero);
heroInput.addEventListener('keydown', e => {
  if (e.key !== 'Tab') return;
  e.preventDefault();
  const s = heroInput.selectionStart;
  heroInput.value = heroInput.value.slice(0, s) + '  ' + heroInput.value.slice(heroInput.selectionEnd);
  heroInput.selectionStart = heroInput.selectionEnd = s + 2;
  runHero();
});
heroInput.value = EXAMPLES.hello;
runHero();

// ── Full playground ──────────────────────────────────────────────────────
const editorInput   = document.getElementById('editor-input');
const editorOutput  = document.getElementById('editor-output');
const editorPreview = document.getElementById('editor-preview');
const tabs   = document.querySelectorAll('#format-tabs .tab-btn');
const exBtns = document.querySelectorAll('.example-btn');
let format = 'html';

function runEditor() {
  try {
    const ast = parse(editorInput.value);
    if (format === 'preview') {
      const html = generate(ast, new HtmlGenerator({ vars: DEFAULT_VARS }));
      editorPreview.srcdoc = \`<!doctype html><html><head><style>\${PREVIEW_CSS}</style></head><body>\${html}</body></html>\`;
      editorOutput.classList.add('hidden');
      editorPreview.classList.remove('hidden');
    } else {
      const gens = {
        html:  new HtmlGenerator({ vars: DEFAULT_VARS }),
        react: new ReactGenerator(),
        vue:   new VueGenerator(),
        astro: new AstroGenerator({ fragment: false }),
      };
      editorOutput.textContent = generate(ast, gens[format]);
      editorOutput.className = 'text-emerald-400 font-mono text-sm p-4 whitespace-pre-wrap';
      editorOutput.classList.remove('hidden');
      editorPreview.classList.add('hidden');
    }
  } catch (e) {
    editorPreview.classList.add('hidden');
    editorOutput.className = 'text-red-400 font-mono text-sm p-4 whitespace-pre-wrap';
    editorOutput.classList.remove('hidden');
    editorOutput.textContent = e instanceof ParseError
      ? e.errors.map(r => \`line \${r.line}:\${r.col} — \${r.message}\`).join('\\n')
      : String(e);
  }
}

tabs.forEach(btn => btn.addEventListener('click', () => {
  tabs.forEach(b => { b.classList.remove('active', 'text-white', 'bg-zinc-700'); b.classList.add('text-zinc-400'); });
  btn.classList.add('active', 'text-white', 'bg-zinc-700');
  btn.classList.remove('text-zinc-400');
  format = btn.dataset.format;
  runEditor();
}));

exBtns.forEach(btn => btn.addEventListener('click', () => {
  editorInput.value = EXAMPLES[btn.dataset.example] ?? '';
  runEditor();
}));

editorInput.addEventListener('keydown', e => {
  if (e.key !== 'Tab') return;
  e.preventDefault();
  const s = editorInput.selectionStart;
  editorInput.value = editorInput.value.slice(0, s) + '  ' + editorInput.value.slice(editorInput.selectionEnd);
  editorInput.selectionStart = editorInput.selectionEnd = s + 2;
  runEditor();
});
editorInput.addEventListener('input', runEditor);
editorInput.value = EXAMPLES.hello;
runEditor();

// ── Copy button ──────────────────────────────────────────────────────────
const copyBtn = document.getElementById('copy-btn');
if (copyBtn) {
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText('npm install @dzhonragon/4less').catch(() => {});
    copyBtn.textContent = 'copied';
    setTimeout(() => copyBtn.textContent = 'copy', 1500);
  });
}
</script>`;

// ── 7. Build landing page (index.html) ───────────────────────────────────
console.log('Building docs/index.html from pages/index.4l …');
const indexBody = compile(readFile('docs/pages/index.4l'));
const indexFinal = indexBody.replace(
  '<span id="__syntax-showcase__"></span>',
  `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">${syntaxCards}</div>`,
);

mkdirSync(resolve(root, 'docs'), { recursive: true });
writeFileSync(resolve(root, 'docs/CNAME'), '4less.dzhonragon.com\n');
writeFileSync(resolve(root, 'docs/index.html'),
  `${htmlHead('4less', '4less — minimal DSL that compiles to HTML, React, Vue and Astro. Zero dependencies.', '/')}
<body class="bg-zinc-950 text-zinc-100 min-h-screen">
${indexFinal}
${LANDING_SCRIPT}
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "4less",
  "description": "Minimal DSL for HTML with variables, loops and conditionals. Compile to React, Vue, Astro or plain HTML. Zero dependencies.",
  "url": "${SITE_URL}",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Any",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "author": { "@type": "Person", "name": "dzhonragon", "url": "https://github.com/dzhonragon" },
  "codeRepository": "https://github.com/dzhonragon/4less",
  "license": "https://opensource.org/licenses/MIT",
  "programmingLanguage": "TypeScript"
}
</script>
</body>
</html>`,
);
console.log('  done');

// ── 8. Guide pages config ────────────────────────────────────────────────
const GUIDE_PAGES = [
  { slug: 'getting-started', fallbackTitle: 'Getting Started' },
  { slug: 'syntax',          fallbackTitle: 'Syntax Reference' },
  { slug: 'api-reference',   fallbackTitle: 'API Reference' },
  { slug: 'cli',             fallbackTitle: 'CLI Reference' },
  { slug: 'integrations',    fallbackTitle: 'Integrations' },
];

// ── 9. Build guide hub (pages/guide/index.html) ─────────────────────────
console.log('Building docs/pages/guide/index.html from pages/guide.4l …');
const guideBody = compile(readFile('docs/pages/guide.4l'));

const guideCards = GUIDE_PAGES.map(({ slug, fallbackTitle }) => {
  const mdSrc = readFile(`docs/${slug}.md`);
  const titleMatch = mdSrc.match(/^title:\s*(.+)$/m);
  const descMatch = mdSrc.match(/^description:\s*(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : fallbackTitle;
  const desc = descMatch ? descMatch[1].trim() : '';

  return `<a class="block rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4 hover:border-zinc-600 transition-colors" href="${slug}/">
  <p class="text-sm font-semibold text-white">${esc(title)}</p>
  <p class="mt-1 text-xs text-zinc-400">${esc(desc)}</p>
</a>`;
}).join('\n        ');

const guideFinal = guideBody.replace(
  /(<div[^>]+\bid="__guide-cards__"[^>]*>)<\/div>/,
  `<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">\n        ${guideCards}\n      </div>`,
);

mkdirSync(resolve(root, 'docs/pages/guide'), { recursive: true });
writeFileSync(resolve(root, 'docs/pages/guide/index.html'),
  `${htmlHead('Documentation — 4less', '4less documentation — getting started, syntax reference, API, CLI, and integrations.', '/pages/guide/')}
<body class="bg-zinc-950 text-zinc-100 min-h-screen">
${guideFinal}
</body>
</html>`,
);
console.log('  done');

// ── 9. Markdown renderer ─────────────────────────────────────────────────
function renderInline(s) {
  return s
    .replace(/`([^`\n]+)`/g, '<code class="bg-zinc-800 text-emerald-400 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-indigo-400 hover:text-indigo-300 underline">$1</a>');
}

function renderMarkdown(src) {
  let title = '';

  // Strip frontmatter
  src = src.replace(/^---\n[\s\S]*?\n---\n/, m => {
    const t = m.match(/^title:\s*(.+)$/m);
    if (t) title = t[1].trim();
    return '';
  });

  // Protect fenced code blocks
  const codeBlocks = [];
  src = src.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const i = codeBlocks.length;
    const inner = lang === '' || lang === '4l'
      ? highlight4l(code.trim())
      : `<span style="color:#6ee7b7">${esc(code.trim())}</span>`; // emerald-300 for ts/js/bash/html
    codeBlocks.push(
      `<pre class="bg-zinc-900 border border-zinc-800 rounded-xl p-4 overflow-x-auto my-5" style="font-size:.85rem;line-height:1.6;font-family:inherit">${inner}</pre>`,
    );
    return `\x00CODE${i}\x00`;
  });

  // Tables  |col|col|\n|---|---|\n|val|val|
  src = src.replace(/(\|.+\|\n\|[-| :]+\|\n(?:\|.+\|\n?)+)/g, tableBlock => {
    const lines = tableBlock.trim().split('\n');
    const headers = lines[0].split('|').filter((_, i, a) => i > 0 && i < a.length - 1);
    const rows = lines.slice(2);
    const ths = headers.map(h =>
      `<th class="px-4 py-2 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">${renderInline(h.trim())}</th>`
    ).join('');
    const trs = rows.map(row => {
      const cells = row.split('|').filter((_, i, a) => i > 0 && i < a.length - 1);
      const tds = cells.map(c =>
        `<td class="px-4 py-2.5 text-sm text-zinc-300 border-t border-zinc-800">${renderInline(c.trim())}</td>`
      ).join('');
      return `<tr class="hover:bg-zinc-900/50">${tds}</tr>`;
    }).join('');
    return `<div class="my-6 overflow-x-auto rounded-xl border border-zinc-800"><table class="w-full"><thead class="bg-zinc-900"><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>`;
  });

  // Headings
  src = src
    .replace(/^#### (.+)$/gm, '<h4 class="text-base font-semibold text-white mt-6 mb-2">$1</h4>')
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-white mt-8 mb-3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-white mt-10 mb-4 pb-2 border-b border-zinc-800">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold text-white mb-2">$1</h1>');

  // Horizontal rule
  src = src.replace(/^---$/gm, '<hr class="border-zinc-800 my-8"/>');

  // Inline elements
  src = renderInline(src);

  // Paragraphs (skip block-level elements and code placeholders)
  const paras = src.split(/\n\n+/).map(p => {
    p = p.trim();
    if (!p) return '';
    if (/^\x00CODE\d+\x00$/.test(p)) return p;
    if (/^<(h[1-6]|hr|div|table|ul|ol|pre|blockquote)/.test(p)) return p;
    return `<p class="text-zinc-400 leading-relaxed mb-4">${p.replace(/\n/g, ' ')}</p>`;
  }).filter(Boolean).join('\n');

  // Restore code blocks
  const html = paras.replace(/\x00CODE(\d+)\x00/g, (_, i) => codeBlocks[parseInt(i)]);

  return { title, html };
}

// ── 10. Build individual guide pages ────────────────────────────────────
const sidebarHtml = compileFile('docs/pages/components/doc-sidebar.4l');
const navHtml     = compileFile('docs/pages/components/navigation.4l');
const footerHtml  = compileFile('docs/pages/components/page-footer.4l');

const SIDEBAR_ACTIVE_SCRIPT = `<script>
const path = location.pathname.replace(/\\/?$/, '/');
document.querySelectorAll('.sidebar-link').forEach(a => {
  if (a.pathname.replace(/\\/?$/, '/') === path) {
    a.classList.add('text-zinc-100', 'bg-zinc-800', 'font-medium');
    a.classList.remove('text-zinc-400');
  }
});
</script>`;

for (const { slug, fallbackTitle } of GUIDE_PAGES) {
  console.log(`Building docs/pages/guide/${slug}/index.html …`);
  const mdSrc = readFile(`docs/${slug}.md`);
  const { title, html: contentHtml } = renderMarkdown(mdSrc);
  const pageTitle = title || fallbackTitle;

  const html = `${htmlHead(`${pageTitle} — 4less`, `${pageTitle} — 4less documentation`, `/pages/guide/${slug}/`)}
<body class="bg-zinc-950 text-zinc-100 min-h-screen">
${navHtml}
<div class="lg:hidden border-b border-zinc-800 px-4 py-2.5 flex items-center gap-2 text-sm">
  <a href="/pages/guide/" class="text-zinc-400 hover:text-zinc-100 transition-colors">Guide</a>
  <span class="text-zinc-700">/</span>
  <span class="text-zinc-300">${pageTitle}</span>
</div>
<div class="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:flex gap-10">
  <div class="hidden lg:block">${sidebarHtml}</div>
  <article class="flex-1 min-w-0 max-w-none">
    ${contentHtml}
  </article>
</div>
${footerHtml}
${SIDEBAR_ACTIVE_SCRIPT}
</body>
</html>`;

  mkdirSync(resolve(root, `docs/pages/guide/${slug}`), { recursive: true });
  writeFileSync(resolve(root, `docs/pages/guide/${slug}/index.html`), html);
  console.log('  done');
}

console.log('\nDone. Preview: npm run docs:preview');
