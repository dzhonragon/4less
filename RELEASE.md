# Release & Deployment Guide

Este guia explica como manter versionamento automático e deployment no npm.

## 📦 Fluxo de Release

### Opção 1: Changesets (Recomendado - Mais Controle)

**Como funciona:**
1. Cada PR/commit pode incluir um "changeset" que descreve o que mudou
2. CI automaticamente cria um PR com atualização de versão
3. Quando fazer merge em main, CI publica no npm

**Setup:**

```bash
# Instalar changesets
npm install --save-dev @changesets/cli @changesets/changelog-github

# Inicializar
npx changeset init
```

**Como usar:**

```bash
# Ao fazer uma feature, criar um changeset
npx changeset

# Responder as perguntas:
# - Qual tipo de mudança? (patch/minor/major)
# - Descrição da mudança
# Isso cria arquivo em .changeset/

# Fazer commit e push normalmente
git add .changeset/
git commit -m "feat: add new feature"
git push
```

**O que acontece:**
1. CI cria automaticamente um PR "Version Packages"
2. Quando fazer merge desse PR, CI publica no npm
3. Tags e releases são criadas no GitHub

---

### Opção 2: Semantic Release (Mais Automático)

**Como funciona:**
- Analisa commits com padrão `feat:`, `fix:`, etc
- Calcula versão automaticamente
- Publica no npm sem precisar de PRs

**Setup:**

```bash
npm install --save-dev semantic-release
```

**GitHub Action:**

```yaml
name: Release
on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci && npm run build && npm run test
      - uses: semantic-release/github-action@v4
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## 🔑 Configurar NPM Token

### No GitHub:

1. Ir para **Settings → Secrets and variables → Actions**
2. Criar novo secret: `NPM_TOKEN`
3. Obter token do npm:
   ```bash
   npm login
   cat ~/.npmrc  # Copiar o token
   ```

---

## 🏷️ Padrão de Commits

Para automação funcionar, use commits semânticos:

```
feat: add new feature          # → minor version bump (1.0.0 → 1.1.0)
fix: resolve bug              # → patch version bump (1.0.0 → 1.0.1)
docs: update readme            # → sem bump (documentação)
refactor: reorganize code      # → sem bump
perf: improve performance      # → sem bump
test: add tests                # → sem bump
chore: update dependencies     # → sem bump
BREAKING CHANGE: description   # → major version bump (1.0.0 → 2.0.0)
```

---

## 🌿 Organização de Branches

```
main
  ↑ (sempre estável, pronto para produção)
  |
  +-- develop (próxima versão)
        ↑
        +-- feature/login
        +-- feature/auth
        +-- bugfix/parser
        +-- hotfix/cli
```

### Política de Branches:

**Main:**
- Apenas releases
- Sempre versão estável
- GitHub Actions publica no npm
- Cria tags automáticas

**Develop:**
- Integração de features
- Branch padrão para PRs
- Cria canais `next` no npm

**Feature branches:**
- Uma por feature
- Nomeada como `feature/xxx` ou `bugfix/xxx`

---

## 📋 Checklist para Release Manual

Se preferir fazer release manualmente:

```bash
# 1. Certificar que tudo está testado
npm run test

# 2. Atualizar versão (semântica)
npm version patch    # 1.0.0 → 1.0.1
npm version minor    # 1.0.0 → 1.1.0
npm version major    # 1.0.0 → 2.0.0

# 3. Isso atualiza package.json e cria tag
# 4. Publicar
npm publish

# 5. Fazer push com tags
git push origin main --tags
```

---

## 🔄 CI/CD Status

O repositório tem 3 workflows:

- **ci.yml**: Roda testes em toda PR e push
- **pages.yml**: Deploy docs no GitHub Pages
- **release.yml**: Publica no npm (com Changesets)

---

## 📚 Recursos

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Changesets Docs](https://github.com/changesets/changesets)
- [Semantic Release Docs](https://semantic-release.gitbook.io/)
