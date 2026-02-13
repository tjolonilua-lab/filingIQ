# Pre-Deployment Check Process

This document describes the automated pre-deployment check process to catch errors before Vercel deployment.

## Quick Start

After making code changes, run:

```bash
npm run pre-deploy-check
```

This will:
1. ✅ Check TypeScript compilation
2. ✅ Run ESLint
3. ✅ Check for common issues (console.log, missing env vars, etc.)
4. ✅ Test production build

## What It Checks

### 1. TypeScript Compilation
- Runs `tsc --noEmit` to check for type errors
- Separates critical errors from warnings (unused variables)
- Critical errors will block deployment
- Warnings are informational only

### 2. ESLint
- Runs Next.js ESLint configuration
- Catches code quality issues
- Non-blocking (warnings only)

### 3. Common Issues
- **Console.log statements**: Warns if found (should use `logger` instead)
- **TODO/FIXME comments**: Lists for review
- **Environment variables**: Checks for potential missing env vars

### 4. Production Build
- Runs `npm run build` to simulate Vercel's build process
- Catches build-time errors that TypeScript might miss
- **This is the most important check** - if this passes, Vercel should too

## Usage

### Before Committing
```bash
npm run pre-deploy-check
```

If it passes, you're safe to commit and push.

### Before Major Changes
```bash
npm run pre-deploy-check
```

Run this before:
- Large refactoring
- Adding new features
- Updating dependencies
- Making structural changes

### CI/CD Integration

You can also add this to your git hooks:

```bash
# .git/hooks/pre-push
#!/bin/bash
npm run pre-deploy-check
```

## Exit Codes

- **0**: All checks passed ✅
- **1**: Critical errors found ❌

## Common Issues and Fixes

### TypeScript Errors

**Unused imports/variables:**
```typescript
// ❌ Bad
import { unused } from './module'
const unusedVar = 123

// ✅ Good
// Remove unused imports
// Or prefix with _ if intentionally unused
const _unusedVar = 123
```

**Missing type definitions:**
```typescript
// ❌ Bad
function getData() { return data }

// ✅ Good
function getData(): DataType { return data }
```

### Build Errors

**Module resolution:**
- Check import paths use `@/` alias
- Verify all dependencies are in `package.json`

**Missing exports:**
- Ensure all exports are properly declared
- Check for circular dependencies

## Manual Checks

The script doesn't catch everything. Also check:

- [ ] Environment variables are set in Vercel
- [ ] Database migrations are applied
- [ ] S3 bucket is configured
- [ ] API keys are valid
- [ ] No hardcoded secrets in code

## Troubleshooting

### Script fails but Vercel succeeds
- Check if warnings are being treated as errors
- Verify Next.js version matches Vercel's

### Script passes but Vercel fails
- Check Vercel build logs for specific errors
- Verify environment variables are set
- Check for platform-specific issues (Node version, etc.)

## Best Practices

1. **Run checks frequently**: Don't wait until deployment
2. **Fix warnings**: Even if non-blocking, clean code is better
3. **Check build output**: Review the full build log if issues occur
4. **Test locally**: Run `npm run build` locally before pushing

## Integration with Workflow

Recommended workflow:

```bash
# 1. Make changes
git checkout -b feature/new-feature

# 2. Run checks
npm run pre-deploy-check

# 3. Fix any errors
# ... make fixes ...

# 4. Commit and push
git add .
git commit -m "Add new feature"
git push

# 5. Vercel will auto-deploy
```

---

**Remember**: This script catches most issues, but always review Vercel build logs after deployment!
