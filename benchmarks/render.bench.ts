/**
 * C2 — Throughput benchmarks: 4less vs Pug vs EJS vs Handlebars
 *
 * Each scenario measures ops/sec for the *render* phase (pre-compiled templates
 * where the engine supports it) and the *end-to-end* phase (parse + render).
 *
 * Run: npm run bench
 */
import { describe, bench } from 'vitest';
import pug from 'pug';
import ejs from 'ejs';
import Handlebars from 'handlebars';
import { compile as lesCompile, parse, generate, HtmlGenerator } from '../src/index.js';

// ---------------------------------------------------------------------------
// Scenario 1 — Simple element, no variables
// ---------------------------------------------------------------------------
const simpleVars = {};

const pugSimple       = pug.compile('div.container');
const ejsSimple       = ejs.compile('<div class="container"></div>');
const hbsSimple       = Handlebars.compile('<div class="container"></div>');
const lessSimpleAst   = parse('div.container');
const lessSimpleGen   = new HtmlGenerator();

describe('simple element (no vars)', () => {
  bench('4less — render (pre-parsed AST)', () => {
    generate(lessSimpleAst, lessSimpleGen);
  });
  bench('4less — end-to-end (parse + render)', () => {
    lesCompile('div.container');
  });
  bench('pug — render (pre-compiled)', () => {
    pugSimple(simpleVars);
  });
  bench('ejs — render (pre-compiled)', () => {
    ejsSimple(simpleVars);
  });
  bench('handlebars — render (pre-compiled)', () => {
    hbsSimple(simpleVars);
  });
});

// ---------------------------------------------------------------------------
// Scenario 2 — Variable substitution
// ---------------------------------------------------------------------------
const varData = { title: 'Hello World', body: 'Lorem ipsum dolor sit amet.' };

const pugVars     = pug.compile('div\n  h1= title\n  p= body');
const ejsVars     = ejs.compile('<div><h1><%= title %></h1><p><%= body %></p></div>');
const hbsVars     = Handlebars.compile('<div><h1>{{title}}</h1><p>{{body}}</p></div>');
const lessVarsAst = parse('div { h1 $title p $body }');
const lessVarsGen = new HtmlGenerator({ vars: varData });

describe('variable substitution', () => {
  bench('4less — render (pre-parsed AST)', () => {
    generate(lessVarsAst, new HtmlGenerator({ vars: varData }));
  });
  bench('4less — end-to-end', () => {
    lesCompile('div { h1 $title p $body }', varData);
  });
  bench('pug — render (pre-compiled)', () => {
    pugVars(varData);
  });
  bench('ejs — render (pre-compiled)', () => {
    ejsVars(varData);
  });
  bench('handlebars — render (pre-compiled)', () => {
    hbsVars(varData);
  });
});

// ---------------------------------------------------------------------------
// Scenario 3 — Loop (10 items)
// ---------------------------------------------------------------------------
const loopData = {
  items: ['alpha', 'beta', 'gamma', 'delta', 'epsilon',
          'zeta', 'eta', 'theta', 'iota', 'kappa'],
};

const pugLoop  = pug.compile('ul\n  each item in items\n    li= item');
const ejsLoop  = ejs.compile('<ul><% items.forEach(function(item){ %><li><%= item %></li><% }); %></ul>');
const hbsLoop  = Handlebars.compile('<ul>{{#each items}}<li>{{this}}</li>{{/each}}</ul>');
const lessLoopAst = parse('ul { for item in items: li $item }');

describe('loop — 10 items', () => {
  bench('4less — render (pre-parsed AST)', () => {
    generate(lessLoopAst, new HtmlGenerator({ vars: loopData }));
  });
  bench('4less — end-to-end', () => {
    lesCompile('ul { for item in items: li $item }', loopData);
  });
  bench('pug — render (pre-compiled)', () => {
    pugLoop(loopData);
  });
  bench('ejs — render (pre-compiled)', () => {
    ejsLoop(loopData);
  });
  bench('handlebars — render (pre-compiled)', () => {
    hbsLoop(loopData);
  });
});

// ---------------------------------------------------------------------------
// Scenario 4 — Conditional (true branch)
// ---------------------------------------------------------------------------
const condData = { show: true, message: 'Welcome back!' };

const pugCond  = pug.compile('div\n  if show\n    p= message');
const ejsCond  = ejs.compile('<div><% if (show) { %><p><%= message %></p><% } %></div>');
const hbsCond  = Handlebars.compile('<div>{{#if show}}<p>{{message}}</p>{{/if}}</div>');
const lessCond = parse('div { if show: p $message }');

describe('conditional (true branch)', () => {
  bench('4less — render (pre-parsed AST)', () => {
    generate(lessCond, new HtmlGenerator({ vars: condData }));
  });
  bench('4less — end-to-end', () => {
    lesCompile('div { if show: p $message }', condData);
  });
  bench('pug — render (pre-compiled)', () => {
    pugCond(condData);
  });
  bench('ejs — render (pre-compiled)', () => {
    ejsCond(condData);
  });
  bench('handlebars — render (pre-compiled)', () => {
    hbsCond(condData);
  });
});

// ---------------------------------------------------------------------------
// Scenario 5 — Mixed (vars + loop + conditional)
// ---------------------------------------------------------------------------
const mixedData = {
  title: 'My Page',
  subtitle: 'A great page',
  showNav: true,
  navItems: ['Home', 'About', 'Blog', 'Contact'],
  body: 'Hello, world!',
};

const mixedLess = `
div#app {
  h1 $title
  h2 $subtitle
  if showNav: nav { ul { for item in navItems: li $item } }
  main { p $body }
}
`.trim();

const mixedPug = pug.compile(
  'div#app\n  h1= title\n  h2= subtitle\n  if showNav\n    nav\n      ul\n        each item in navItems\n          li= item\n  main\n    p= body'
);
const mixedEjs = ejs.compile(
  '<div id="app"><h1><%= title %></h1><h2><%= subtitle %></h2>' +
  '<% if (showNav) { %><nav><ul><% navItems.forEach(function(item){ %><li><%= item %></li><% }); %></ul></nav><% } %>' +
  '<main><p><%= body %></p></main></div>'
);
const mixedHbs = Handlebars.compile(
  '<div id="app"><h1>{{title}}</h1><h2>{{subtitle}}</h2>' +
  '{{#if showNav}}<nav><ul>{{#each navItems}}<li>{{this}}</li>{{/each}}</ul></nav>{{/if}}' +
  '<main><p>{{body}}</p></main></div>'
);
const mixedAst = parse(mixedLess);

describe('mixed (vars + loop + conditional)', () => {
  bench('4less — render (pre-parsed AST)', () => {
    generate(mixedAst, new HtmlGenerator({ vars: mixedData }));
  });
  bench('4less — end-to-end', () => {
    lesCompile(mixedLess, mixedData);
  });
  bench('pug — render (pre-compiled)', () => {
    mixedPug(mixedData);
  });
  bench('ejs — render (pre-compiled)', () => {
    mixedEjs(mixedData);
  });
  bench('handlebars — render (pre-compiled)', () => {
    mixedHbs(mixedData);
  });
});
