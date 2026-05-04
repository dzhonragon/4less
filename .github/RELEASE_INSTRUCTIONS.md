# Release Instructions

Release process for 4less uses semantic versioning and conventional commits.

## Prerequisites

1. Node.js 20+ installed
2. NPM_TOKEN secret configured in GitHub (Settings > Secrets and variables > Actions)
3. Access to GitHub repository

## Commit Convention

Use conventional commit messages for automatic version bumping:

- `feat: description` - feature (minor version bump)
- `fix: description` - bug fix (patch version bump)
- `feat!: description` - breaking change (major version bump)
- `docs:`, `test:`, `chore:` - no version bump

## Automated Release Process

1. Create a feature branch
2. Make commits with conventional messages
3. Open PR against main
4. After approval, merge to main
5. GitHub Actions automatically:
   - Runs tests
   - Publishes to npm
   - Creates git tag
   - Creates release notes

## Manual Release (if needed)

```bash
# Update version in package.json
npm version patch  # or minor, major
npm run build
npm publish
git push --tags
```

## Testing Release Locally

```bash
npm install
npm run test
npm run build
npm pack  # Creates tarball to verify contents
```

## Rollback

If a release goes wrong:

```bash
npm unpublish @dzhonragon/4less@version
git tag -d vX.X.X
git push origin :refs/tags/vX.X.X
```

## Documentation Versioning

Documentation is versioned alongside code releases. Update docs/ files in the same PR as code changes.
