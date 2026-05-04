# Release Instructions

Release process uses OpenID Connect (OIDC) Trusted Publisher for secure npm publishing without secrets.

## Setup (One-time)

Configure npm Trusted Publisher at https://www.npmjs.com/settings/{username}/trusted-publishers

Settings:
- Repository: dzhonragon/4less
- Repository owner: dzhonragon
- Workflow file: .github/workflows/release.yml
- Environment name: publish

This enables GitHub Actions to publish to npm without storing NPM_TOKEN as a secret.

## Commit Convention

Use conventional commits:

- `feat: description` - feature (minor bump)
- `fix: description` - bug fix (patch bump)
- `feat!: description` - breaking change (major bump)
- `docs:`, `test:`, `chore:` - no bump

## Release Process

1. Ensure main branch is clean and ready
2. Go to Actions tab > Publish workflow
3. Click "Run workflow"
4. Enter version: patch, minor, major, or specific version (2.1.1)
5. GitHub Actions will:
   - Run tests
   - Update package.json version
   - Publish to npm (with provenance)
   - Create git tag
   - Push changes

## Manual Release (local)

```bash
npm run test
npm run build
npm version patch
npm publish
git push --tags
```

## Verify Release

```bash
npm view @dzhonragon/4less@latest
npm info @dzhonragon/4less
```

## Rollback

```bash
npm unpublish @dzhonragon/4less@VERSION
git tag -d vVERSION
git push origin :refs/tags/vVERSION
```

## Documentation

Documentation versions are tagged with releases. Update docs/ files in same PR as code changes.
