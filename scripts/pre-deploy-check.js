#!/usr/bin/env node

/**
 * Pre-deployment check script
 * Runs TypeScript compilation and other checks to catch errors before Vercel deployment
 * 
 * Usage: npm run pre-deploy-check
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const RESET = '\x1b[0m'

let errors = 0
let warnings = 0

function log(message, color = RESET) {
  console.log(`${color}${message}${RESET}`)
}

function runCommand(command, description) {
  try {
    execSync(command, { stdio: 'pipe' })
    log(`✓ ${description}`, GREEN)
    return { success: true }
  } catch (error) {
    const output = error.stdout?.toString() || error.stderr?.toString() || ''
    return { success: false, output }
  }
}

function countMatches(text, pattern) {
  const matches = text.match(new RegExp(pattern, 'g'))
  return matches ? matches.length : 0
}

console.log('🔍 Running pre-deployment checks...\n')

// 1. TypeScript compilation check
log('📝 Checking TypeScript compilation...')
const tscResult = runCommand('npx tsc --noEmit', 'TypeScript compilation')

if (!tscResult.success) {
  errors++
  log('✗ TypeScript compilation failed', RED)
  
  // Extract critical errors
  // Note: TS6196 (unused interfaces) and TS6192 (unused imports) are treated as errors by Next.js build
  // Only TS6133 (unused variables) can be safely ignored if prefixed with _
  const criticalErrors = tscResult.output
    .split('\n')
    .filter(line => {
      if (!/error TS[0-9]/.test(line)) return false
      // Allow TS6133 only if variable is prefixed with _ (intentionally unused)
      if (/TS6133/.test(line) && /'_[^']+'/.test(line)) return false
      // All other errors are critical, including TS6196 and TS6192
      return true
    })
  
  if (criticalErrors.length > 0) {
    log('\nCritical errors found:', RED)
    criticalErrors.slice(0, 20).forEach(err => console.log(err))
  }
  
  // Count warnings (only intentionally unused variables with _ prefix)
  const intentionallyUnused = (tscResult.output.match(/TS6133.*'_[^']+'/g) || []).length
  const otherWarnings = countMatches(tscResult.output, /TS6133|TS6196|TS6192/) - intentionallyUnused
  if (otherWarnings > 0) {
    warnings += otherWarnings
    log(`\n⚠ Warnings: ${otherWarnings} unused variables/interfaces/imports (should be fixed)`, YELLOW)
  }
} else {
  log('✓ TypeScript compilation passed', GREEN)
}
console.log()

// 2. ESLint check
log('🔧 Running ESLint...')
const eslintResult = runCommand('npm run lint', 'ESLint')
if (!eslintResult.success) {
  warnings++
  log('⚠ ESLint found issues', YELLOW)
}
console.log()

// 3. Check for common issues
log('🔎 Checking for common deployment issues...')

// Check for console.log in production code
try {
  const files = execSync('find app lib -name "*.ts" -o -name "*.tsx"', { encoding: 'utf-8' })
    .trim()
    .split('\n')
    .filter(Boolean)
  
  let consoleLogs = 0
  files.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf-8')
      const matches = content.match(/console\.(log|warn|info|debug)/g)
      if (matches && !content.includes('logger')) {
        consoleLogs += matches.length
      }
    } catch (e) {
      // Skip files that can't be read
    }
  })
  
  if (consoleLogs > 0) {
    warnings += consoleLogs
    log(`⚠ Found ${consoleLogs} console.log statements (consider using logger)`, YELLOW)
  }
} catch (e) {
  // Ignore file search errors
}

// 4. Build check
log('🏗️  Testing production build...')
const buildResult = runCommand('npm run build', 'Production build')

if (!buildResult.success) {
  errors++
  log('✗ Production build failed', RED)
  const buildOutput = buildResult.output || ''
  const errorLines = buildOutput.split('\n').filter(line => 
    line.includes('error') || line.includes('Error') || line.includes('Failed')
  )
  if (errorLines.length > 0) {
    console.log('\nBuild errors:')
    errorLines.slice(-30).forEach(line => console.log(line))
  }
} else {
  log('✓ Production build successful', GREEN)
}

// Summary
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
if (errors === 0) {
  log('✅ All critical checks passed!', GREEN)
  if (warnings > 0) {
    log(`⚠ Found ${warnings} warnings (non-blocking)`, YELLOW)
  }
  console.log('\nReady for deployment! 🚀')
  process.exit(0)
} else {
  log(`❌ Found ${errors} critical error(s)`, RED)
  if (warnings > 0) {
    log(`⚠ Found ${warnings} warnings`, YELLOW)
  }
  console.log('\nPlease fix errors before deploying.')
  process.exit(1)
}
