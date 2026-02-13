# Zombie Code Review - Code That Can Be Removed

## 🔴 High Priority - Remove These

### 1. **Sentry Monitoring Stub** (`lib/monitoring/sentry.ts`)
- **Status**: Stub implementation with no actual functionality
- **Issue**: Only contains console.log statements, no real Sentry integration
- **Used by**: `lib/logger.ts` (but logger works fine without it)
- **Action**: 
  - Option A: Remove entirely if not planning to use Sentry
  - Option B: Remove stub and add real Sentry integration when needed
- **Impact**: Low - logger has fallbacks

### 2. **Duplicate Pre-Deploy Script** (`scripts/pre-deploy-check.sh`)
- **Status**: Duplicate of `scripts/pre-deploy-check.js`
- **Issue**: Two scripts doing the same thing (JS and shell)
- **Action**: Remove `.sh` version, keep `.js` version
- **Impact**: None - only one is used

### 3. **Multiple Summary/Progress Files** (Root directory)
- **Files to consider removing**:
  - `OPTIMIZATION_COMPLETE.md`
  - `OPTIMIZATION_SUMMARY.md`
  - `PERFECT_10_COMPLETE.md`
  - `PERFECT_10_PROGRESS.md`
  - `QUICK_WINS_COMPLETE.md`
  - `FIXES_APPLIED.md`
  - `FINAL_SUMMARY.md`
- **Issue**: Historical progress files, likely outdated
- **Action**: Archive or remove if no longer needed
- **Impact**: None - documentation only

### 4. **Demo Page Placeholder** (`app/demo/page.tsx`)
- **Status**: Has `YOUTUBE_VIDEO_ID` placeholder
- **Issue**: Demo page exists but video not configured
- **Action**: 
  - Option A: Remove if not using demo page
  - Option B: Configure with actual video ID
- **Impact**: Low - page is linked from homepage but shows placeholder

## 🟡 Medium Priority - Review These

### 5. **Commented Code in Sentry File** ✅ DONE
- **Location**: `lib/monitoring/sentry.ts`
- **Status**: ✅ File removed entirely (handled in previous cleanup)
- **Action**: Complete

### 6. **Duplicate Documentation** ✅ DONE
- **Files**:
  - `PROJECT_OPTIMIZATION.md` (root) vs `docs/PROJECT_OPTIMIZATION.md` ✅ Removed duplicate
  - Multiple deployment checklists - Different files, kept both (different purposes)
- **Action**: ✅ Complete - Duplicate removed

### 7. **Unused Imports/Exports** ✅ VERIFIED
- **Check**: TypeScript compiler with `noUnusedLocals: true` (already enabled)
- **Result**: ✅ No unused imports found - TypeScript check passes cleanly
- **Action**: ✅ Complete - All imports are used

## 🟢 Low Priority - Keep But Note

### 8. **API Routes** - All appear to be used:
- `/api/analyze` - Used by `app/start/page.tsx` ✅
- `/api/admin/clear-accounts` - Newly added, used ✅
- All other routes appear active ✅

### 9. **Components** - All appear to be used:
- All components in `components/` are imported and used ✅

## 📋 Recommended Actions

### Immediate (High Priority):
1. ✅ Remove `lib/monitoring/sentry.ts` (or implement real Sentry)
2. ✅ Remove `scripts/pre-deploy-check.sh` (keep JS version)
3. ✅ Archive/remove old progress files (keep only current docs)

### Soon (Medium Priority):
4. ⚠️ Decide on demo page - configure or remove
5. ⚠️ Consolidate duplicate documentation

### Ongoing:
6. 🔄 Run `npm run type-check` regularly to catch unused code
7. 🔄 Use the pre-deploy-check script before commits

## 🧹 Cleanup Script

Run this to find more potential issues:
```bash
# Find unused exports
npm run type-check 2>&1 | grep "is declared but its value is never read"

# Find TODO/FIXME comments
grep -r "TODO\|FIXME" --include="*.ts" --include="*.tsx" app lib components

# Find commented code blocks
grep -r "^[[:space:]]*\/\/[[:space:]]*[A-Z]" --include="*.ts" --include="*.tsx" app lib
```
