# NPM Trusted Publisher Setup

Using OpenID Connect (OIDC) for secure npm publishing without storing secrets.

## What is Trusted Publisher?

Trusted Publisher allows GitHub Actions to publish to npm using temporary OIDC tokens instead of long-lived secrets.

Benefits:
- No NPM_TOKEN secret to manage
- Tokens are temporary and automatically rotated
- Better audit trail
- Industry standard practice

## Setup Steps

### 1. Configure npm Trusted Publisher

Login to npm.js with your account. Go to:
https://www.npmjs.com/settings/USERNAME/trusted-publishers

Or navigate via Settings > Token and Authentication > Trusted Publishers

Click "Add a trusted publisher" and select GitHub.

Fill in:
- Organization/User: dzhonragon
- Repository: 4less
- Workflow: .github/workflows/release.yml
- Environment name: publish

Confirm and save.

### 2. GitHub Actions Already Configured

The release.yml workflow is configured with:

```yaml
permissions:
  id-token: write

environment:
  name: publish
```

This enables OIDC token generation during workflow execution.

### 3. Verify Configuration

After setup, the Publish workflow will use OIDC instead of NPM_TOKEN.

To verify: Check npm settings > Trusted Publishers shows the GitHub repository.

## How It Works

When release workflow runs:

1. GitHub generates temporary OIDC token
2. Token is valid only for npm.js
3. Token is short-lived (minutes)
4. npm validates token with GitHub
5. Package is published
6. Token expires and is discarded

## Security

- No persistent secrets needed
- Tokens cannot be replayed
- Each publish creates audit trail
- GitHub and npm verify each other

## If Something Goes Wrong

Delete the trusted publisher from npm settings and reconfigure, or temporarily use NPM_TOKEN as fallback.

## Reference

- NPM Trusted Publishers: https://docs.npmjs.com/creating-and-viewing-access-tokens#trusted-publishers
- GitHub OIDC: https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect
