# How to Clear All Accounts

If you're having issues with old accounts still existing, use one of these methods:

## Method 1: Admin API Endpoint (Recommended)

### Clear All Accounts
```bash
curl -X DELETE https://your-domain.vercel.app/api/admin/clear-accounts \
  -H "Authorization: Bearer YOUR_ADMIN_PASSWORD"
```

Or in development (no auth needed):
```bash
curl -X DELETE http://localhost:3000/api/admin/clear-accounts
```

### Delete Specific Account by Email
```bash
curl -X POST https://your-domain.vercel.app/api/admin/clear-accounts \
  -H "Authorization: Bearer YOUR_ADMIN_PASSWORD" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

## Method 2: Direct Database (Neon)

1. Go to your Neon dashboard
2. Open SQL Editor
3. Run:
```sql
-- Delete all accounts (this will cascade delete related submissions and tokens)
DELETE FROM accounts;
```

## Method 3: Check What Accounts Exist

You can check what accounts exist by looking at the admin dashboard or querying the database:

```sql
SELECT id, email, slug, company_name, created_at FROM accounts ORDER BY created_at DESC;
```

## Troubleshooting

### "Email already registered" but account doesn't exist
- The account might exist in the filesystem fallback (`data/accounts/accounts.json`)
- Use Method 1 to clear both DB and filesystem
- Or manually delete `data/accounts/accounts.json` and recreate as empty array `[]`

### "Slug not available" but you never created it
- An old account might still exist with that slug
- Check the database with the SQL query above
- Delete the account or use a different slug

### After clearing, still seeing issues
1. Clear browser cache/localStorage
2. Wait a few seconds for database to sync
3. Try again
