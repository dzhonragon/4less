# Estrutura do Repositório

## 📁 Diretórios

```
4less/
├── .github/
│   ├── workflows/          # GitHub Actions CI/CD
│   │   ├── ci.yml          # Testes em PRs/commits
│   │   ├── pages.yml        # Deploy docs
│   │   └── release.yml      # Publish npm
│   └── ISSUE_TEMPLATE/      # Templates de issues
│
├── src/                     # Código-fonte TypeScript
│   ├── core/
│   │   ├── lexer.ts         # Tokenização
│   │   ├── parser.ts        # Parse → AST
│   │   ├── expand.ts        # Expansão de componentes
│   │   └── types.ts         # Tipos TypeScript
│   ├── generators/
│   │   ├── base.ts          # Classe base
│   │   ├── html.ts          # → HTML
│   │   ├── react.ts         # → React JSX
│   │   ├── vue.ts           # → Vue template
│   │   ├── astro.ts         # → Astro
│   │   └── json.ts          # → JSON
│   ├── plugins/
│   │   ├── vite.ts          # Plugin Vite
│   │   ├── webpack.ts       # Plugin Webpack
│   │   └── esbuild.ts       # Plugin esbuild
│   ├── browser.ts           # Build para browser
│   ├── cli.ts               # CLI executable
│   └── index.ts             # Entry point
│
├── dist/                    # Build output (gerado)
│   ├── index.js
│   ├── cli.js (com shebang)
│   ├── plugins/
│   └── ...
│
├── docs/                    # Documentação
│   ├── README.md            # SHORT overview
│   ├── getting-started.md   # Guia início
│   ├── syntax.md            # Linguagem
│   ├── api-reference.md     # APIs TypeScript
│   ├── cli.md               # CLI reference
│   ├── integrations.md      # Plugins
│   ├── pages/
│   │   ├── index.4l         # Landing page
│   │   ├── guide.4l         # Doc hub
│   │   └── components/      # Componentes reutilizáveis
│   ├── index.html           # Homepage (gerado)
│   ├── 4less.js             # Browser bundle (gerado)
│   └── pages/guide/         # Doc pages (gerado)
│
├── tests/                   # Testes
│   ├── core/
│   │   ├── parser.test.ts
│   │   └── components.test.ts
│   └── security/
│       ├── xss.test.ts
│       ├── nesting.test.ts
│       └── unicode.test.ts
│
├── scripts/
│   ├── build-docs.mjs       # Build documentação
│   ├── add-shebang.mjs      # CLI shebang
│   └── ...
│
├── .changeset/              # Changesets (release management)
│   └── config.json
│
├── .github/workflows/       # CI/CD
├── package.json
├── package-lock.json
├── tsconfig.json
├── .gitignore
├── README.md                # Root readme
├── CONTRIBUTING.md
├── RELEASE.md               # ← Release guide
├── LICENSE
└── REPOSITORY_STRUCTURE.md  # ← Este arquivo
```

---

## 🌿 Estratégia de Branches

### Branch Principal

```
main
  ├─ v2.0.0 (tag)
  ├─ v2.0.1 (tag) 
  ├─ v2.1.0 (tag)
  └─ v3.0.0 (tag)
```

**Regras:**
- ✅ Sempre estável e pronto para produção
- ✅ Apenas merge de release PRs
- ✅ GitHub Actions publica no npm automaticamente
- ✅ Cria tags semânticas automaticamente

---

### Branch de Desenvolvimento

```
develop
  ├─ feature/loop-optimization
  ├─ feature/vue-generator
  ├─ bugfix/parser-edge-case
  ├─ hotfix/cli-windows
  └─ refactor/type-system
```

**Regras:**
- Próxima versão em desenvolvimento
- PRs target `develop` por default
- Opcional: deploy canais `next`/`beta` no npm

---

## 📝 Convenções de Commits

Use **Conventional Commits** para automação:

```
type(scope): subject

body

footer
```

### Tipos:

| Tipo | Versão | Exemplo |
|------|--------|---------|
| `feat` | minor ↑ | `feat(parser): add support for nested loops` |
| `fix` | patch ↑ | `fix(vue): add missing :key binding` |
| `docs` | sem bump | `docs: update readme` |
| `style` | sem bump | `style: format code` |
| `refactor` | sem bump | `refactor: reorganize generators` |
| `perf` | sem bump | `perf: optimize parser speed` |
| `test` | sem bump | `test: add edge case tests` |
| `chore` | sem bump | `chore: update dependencies` |
| `BREAKING CHANGE` | major ↑ | `feat!: remove deprecated API` |

### Exemplos:

```bash
# Patch (1.0.0 → 1.0.1)
git commit -m "fix(html): escape attributes correctly"

# Minor (1.0.0 → 1.1.0)
git commit -m "feat(cli): add --format json output"

# Major (1.0.0 → 2.0.0)
git commit -m "feat!: redesign component syntax
BREAKING CHANGE: components now use ComponentName instead of @Name"

# Documentação (sem bump)
git commit -m "docs(guide): add advanced examples"
```

---

## 🔄 Fluxo de Pull Request

### 1. Criar Feature Branch

```bash
git checkout -b feature/meu-feature
# ou
git checkout -b bugfix/nome-bug
```

### 2. Fazer Commits Semânticos

```bash
git commit -m "feat(parser): add support for X"
git commit -m "test: add tests for X"
git commit -m "docs: document X feature"
```

### 3. Push e PR para `develop`

```bash
git push origin feature/meu-feature
# Abrir PR no GitHub
```

### 4. Review e Merge

- ✅ CI passa (testes, build, lint)
- ✅ 1+ approval
- Merge squash ou rebase (opcional)

### 5. Release para Main

Quando `develop` tiver features prontas:

```bash
# Criar PR: develop → main
# Merge cria release automático
```

---

## 🏷️ Versionamento Semântico

`MAJOR.MINOR.PATCH`

- **MAJOR** (2.0.0): Breaking changes
- **MINOR** (1.1.0): Nova feature
- **PATCH** (1.0.1): Bug fix

Exemplos:
- `1.0.0` - Primeira release
- `1.0.1` - Bug fix
- `1.1.0` - Nova feature
- `2.0.0` - Redesign/breaking change

---

## 📦 Publicação

### Automática (via GitHub Actions)

```
feature branch
    ↓
PR → develop (CI testa)
    ↓
Merge → develop
    ↓
PR → main (changesets cria version bump)
    ↓
Merge → main
    ↓
CI publica npm + cria tag
    ↓
Release no GitHub
```

### Manual (fallback)

```bash
npm version patch   # Atualiza package.json + tag
npm publish        # Publica no npm
git push --tags    # Envia tags
```

---

## ✅ Checklist para Release

- [ ] Tudo em `main` testado
- [ ] Versão bumped (`npm version`)
- [ ] CHANGELOG atualizado
- [ ] `npm publish` executado
- [ ] Tags pushed (`git push --tags`)
- [ ] Release criada no GitHub
- [ ] Docs atualizadas

---

## 🚫 Proteção de Branches

### Main branch rules:

```
✅ Require pull request reviews
✅ Dismiss stale PR approvals
✅ Require status checks (CI)
✅ Require branches up-to-date
❌ Não permitir force push
```

### Develop branch rules:

```
✅ Require pull request reviews (1)
✅ Require status checks (CI)
❌ Não permitir force push
```

---

## 📚 Recursos

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Changesets](https://github.com/changesets/changesets)
