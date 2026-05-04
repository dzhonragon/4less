# 🚀 Quick Start: Release & Deploy

Guia rápido para começar com automação de release.

---

## ⚡ 3 Passos Essenciais

### 1️⃣ Configurar NPM Token no GitHub

```bash
# Terminal local
npm login
cat ~/.npmrc | grep "//registry"  # Copiar token

# GitHub
1. Ir para repo → Settings → Secrets and variables → Actions
2. New repository secret
3. Name: NPM_TOKEN
4. Value: <cole o token>
```

### 2️⃣ Instalar Changesets (Opcional)

Para automação completa de versionamento:

```bash
npm install --save-dev @changesets/cli @changesets/changelog-github
npx changeset init
```

### 3️⃣ Usar Conventional Commits

Ao fazer commits:

```bash
git commit -m "feat: add new feature"      # → minor version
git commit -m "fix: resolve bug"           # → patch version
git commit -m "feat!: breaking change"     # → major version
```

---

## 📋 Seu Fluxo Padrão

### Para Features:

```bash
# 1. Feature branch
git checkout -b feature/meu-feature

# 2. Fazer commits semânticos
git commit -m "feat(parser): add support for X"
git commit -m "test: add tests"

# 3. Push e PR
git push origin feature/meu-feature
# Abrir PR para 'main'

# 4. Merge (CI faz release automático)
```

### Para Bugs Urgentes:

```bash
# 1. Hotfix branch
git checkout -b hotfix/bug-critico

# 2. Fix rápido
git commit -m "fix(cli): resolve Windows issue"

# 3. PR para main
git push origin hotfix/bug-critico
# Abrir PR para 'main'

# 4. Merge (automático: patch release)
```

---

## 🤖 O Que GitHub Actions Faz

### ✅ CI (ci.yml)
```
→ Roda testes em toda PR
→ Build deve passar
→ Testes devem passar
```

### ✅ Release (release.yml)
```
→ Merge em main → publica no npm
→ Cria tags (v2.0.1, v2.1.0, etc)
→ Cria release no GitHub
```

### ✅ Docs (pages.yml)
```
→ Deploy documentação no GitHub Pages
→ Atualiza site automaticamente
```

---

## 📊 Versão Automática

**Sem Changesets:**
Publica manualmente quando pronto

**Com Changesets:**
```bash
# Durante desenvolvimento
npx changeset

# Responder perguntas
# → patch/minor/major
# → descrição da mudança

# Isso cria arquivo em .changeset/
# Fazer commit normalmente

# Quando merge em main:
# CI cria PR "Version Packages"
# Merge desse PR = release automático
```

---

## 🔍 Verificar Status

```bash
# Ver workflows rodando
gh run list --branch main

# Ver logs de um workflow
gh run view <RUN_ID> --log

# Ver secrets configurados
gh secret list
```

---

## ❌ Troubleshooting

### NPM Publish falha

```
Erro: "401 Unauthorized"
→ Verificar NPM_TOKEN válido no GitHub Secrets
→ Token não expirou?
```

### Tag não criada

```
→ Verificar if Changesets está instalado
→ Ou criar tag manualmente: git tag v2.0.0
```

### Workflow não roda

```
→ Verificar push é para 'main' branch
→ Ver status em Actions tab
→ Verificar arquivo .yml está válido
```

---

## 📚 Próximos Passos

1. ✅ Setup NPM_TOKEN
2. ✅ Instalar Changesets: `npm install --save-dev @changesets/cli`
3. ✅ Fazer PR testando novo workflow
4. ✅ Verificar Release.md para detalhes

---

## 💡 Dica: Entender Semantic Versioning

```
v2.1.3
│  │  │
│  │  └─ PATCH (bug fixes)      → npm version patch
│  └────  MINOR (new features)  → npm version minor
└─────── MAJOR (breaking)       → npm version major
```

**Exemplo na prática:**
```
v1.0.0 → v1.0.1 (fix: xxx)
v1.0.1 → v1.1.0 (feat: xxx)
v1.1.0 → v2.0.0 (feat!: breaking change)
```

---

## 🎯 Meta Final

Depois desse setup:

✅ Todo commit em main publica no npm automaticamente
✅ Versão é bumped automaticamente
✅ Tags são criadas automaticamente
✅ Documentação é atualizada automaticamente
✅ Release notes geradas automaticamente

**Zero manual work! 🎉**
