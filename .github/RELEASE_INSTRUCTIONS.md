# Release Instructions

Release process uses OpenID Connect (OIDC) Trusted Publisher for secure npm publishing without secrets.

## Setup (One-time)

Configure npm Trusted Publisher at https://www.npmjs.com/settings/{username}/trusted-publishers

Settings:
- Repository: dzhonragon/4less
- Repository owner: dzhonragon
- Workflow filename: release.yml (filename only, not path)
- Environment name: publish

This enables GitHub Actions to publish to npm without storing NPM_TOKEN as a secret.

## Commit Convention

Use conventional commits:

- `feat: description` - feature (minor bump)
- `fix: description` - bug fix (patch bump)
- `feat!: description` - breaking change (major bump)
- `docs:`, `test:`, `chore:` - no bump

## Release Process

1. Update package.json version locally

```bash
npm version patch   # or minor, major
npm run build
npm test
git push origin main
```

2. GitHub Actions automatically:
   - Runs tests
   - Publishes to npm (with provenance)
   - Pushes git tag

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
