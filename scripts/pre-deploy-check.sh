#!/bin/bash

# Pre-deployment check script
# Runs TypeScript compilation and other checks to catch errors before Vercel deployment

set -e  # Exit on error

echo "🔍 Running pre-deployment checks..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# 1. TypeScript compilation check
echo "📝 Checking TypeScript compilation..."
if npx tsc --noEmit > /tmp/tsc-errors.txt 2>&1; then
    echo -e "${GREEN}✓ TypeScript compilation passed${NC}"
else
    echo -e "${RED}✗ TypeScript compilation failed${NC}"
    ERRORS=$((ERRORS + 1))
    
    # Show critical errors (exclude unused variable warnings)
    CRITICAL=$(grep -E "error TS[0-9]" /tmp/tsc-errors.txt | grep -v "TS6133\|TS6196\|TS6192" | wc -l | tr -d ' ')
    if [ "$CRITICAL" -gt 0 ]; then
        echo -e "${RED}Critical errors found:${NC}"
        grep -E "error TS[0-9]" /tmp/tsc-errors.txt | grep -v "TS6133\|TS6196\|TS6192" | head -20
        echo ""
    fi
    
    # Show warnings (unused variables, etc.)
    WARNINGS_COUNT=$(grep -E "TS6133|TS6196|TS6192" /tmp/tsc-errors.txt | wc -l | tr -d ' ')
    if [ "$WARNINGS_COUNT" -gt 0 ]; then
        echo -e "${YELLOW}Warnings (non-blocking): $WARNINGS_COUNT unused variables/imports${NC}"
        WARNINGS=$((WARNINGS + WARNINGS_COUNT))
    fi
fi
echo ""

# 2. ESLint check
echo "🔧 Running ESLint..."
if npm run lint > /tmp/eslint-errors.txt 2>&1; then
    echo -e "${GREEN}✓ ESLint passed${NC}"
else
    echo -e "${YELLOW}⚠ ESLint found issues (check /tmp/eslint-errors.txt)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# 3. Check for common issues
echo "🔎 Checking for common deployment issues..."

# Check for missing environment variables in code
MISSING_ENV=$(grep -r "process.env\." --include="*.ts" --include="*.tsx" app lib | grep -v "process.env.NODE_ENV" | grep -v "process.env.POSTGRES_URL" | grep -v "process.env.AWS" | grep -v "process.env.RESEND" | grep -v "process.env.OPENAI" | grep -v "process.env.JWT_SECRET" | grep -v "process.env.SENTRY" | grep -v "process.env.ENABLE" | wc -l | tr -d ' ')
if [ "$MISSING_ENV" -gt 0 ]; then
    echo -e "${YELLOW}⚠ Found $MISSING_ENV potential environment variable references${NC}"
fi

# Check for console.log in production code (should use logger)
CONSOLE_LOGS=$(grep -r "console\." --include="*.ts" --include="*.tsx" app lib | grep -v "console.error" | grep -v "logger" | wc -l | tr -d ' ')
if [ "$CONSOLE_LOGS" -gt 0 ]; then
    echo -e "${YELLOW}⚠ Found $CONSOLE_LOGS console.log statements (consider using logger)${NC}"
    WARNINGS=$((WARNINGS + CONSOLE_LOGS))
fi

# Check for TODO/FIXME comments
TODOS=$(grep -r "TODO\|FIXME" --include="*.ts" --include="*.tsx" app lib components | wc -l | tr -d ' ')
if [ "$TODOS" -gt 0 ]; then
    echo -e "${YELLOW}⚠ Found $TODOS TODO/FIXME comments${NC}"
fi

echo ""

# 4. Build check (dry run)
echo "🏗️  Testing production build..."
if npm run build > /tmp/build-errors.txt 2>&1; then
    echo -e "${GREEN}✓ Production build successful${NC}"
else
    echo -e "${RED}✗ Production build failed${NC}"
    ERRORS=$((ERRORS + 1))
    echo "Build errors:"
    tail -30 /tmp/build-errors.txt
    echo ""
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$ERRORS" -eq 0 ]; then
    echo -e "${GREEN}✅ All critical checks passed!${NC}"
    if [ "$WARNINGS" -gt 0 ]; then
        echo -e "${YELLOW}⚠ Found $WARNINGS warnings (non-blocking)${NC}"
    fi
    echo ""
    echo "Ready for deployment! 🚀"
    exit 0
else
    echo -e "${RED}❌ Found $ERRORS critical error(s)${NC}"
    if [ "$WARNINGS" -gt 0 ]; then
        echo -e "${YELLOW}⚠ Found $WARNINGS warnings${NC}"
    fi
    echo ""
    echo "Please fix errors before deploying."
    exit 1
fi
