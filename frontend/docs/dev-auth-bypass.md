# Development Authentication Bypass

This document explains how to use the development authentication bypass feature to work on the dashboard while the backend authentication API isn't ready.

## Quick Setup

### Enable Bypass (Development Mode)

1. In your `.env.local` file, add or set:
   ```bash
   NEXT_PUBLIC_AUTH_BYPASS=1
   ```

2. Restart your development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

3. Navigate to `http://localhost:3000` - you'll go directly to the dashboard without login.

### Disable Bypass (Production Ready)

When your backend authentication API is ready:

1. In your `.env.local` file, either:
   - Delete the line entirely, OR
   - Set it to `0`:
     ```bash
     NEXT_PUBLIC_AUTH_BYPASS=0
     ```

2. Restart your development server

3. Navigate to `http://localhost:3000` - you'll be redirected to `/login` as expected.

## How It Works

- **With bypass ON**: The `<Protected>` component skips all authentication checks and renders the dashboard immediately
- **With bypass OFF**: Normal authentication flow - checks for `accessToken`, redirects to login if missing
- **No code changes needed**: Just environment variable toggle

## What's Protected

The bypass only affects the `<Protected>` wrapper component. The following behavior is preserved:

- ✅ Login page still works normally
- ✅ API calls still attach `Authorization` headers (if tokens exist)
- ✅ 401 responses are handled gracefully (no unwanted redirects during bypass)
- ✅ All existing auth logic remains intact for production use

## Security Note

⚠️ **IMPORTANT**: This bypass is for development only. 

- The `.env.local` file is in `.gitignore` and won't be committed
- Never deploy with `NEXT_PUBLIC_AUTH_BYPASS=1` in production
- Always test with bypass disabled before deploying

## Development Workflow

```bash
# 1. Start development with bypass
echo "NEXT_PUBLIC_AUTH_BYPASS=1" >> .env.local

# 2. Develop features without auth friction
npm run dev

# 3. Test auth flow before deployment
# Edit .env.local: set NEXT_PUBLIC_AUTH_BYPASS=0
npm run dev

# 4. Deploy (bypass automatically disabled in production)
npm run build
```

## Troubleshooting

**Q: I set the bypass but still get redirected to login**
- Check that `.env.local` has `NEXT_PUBLIC_AUTH_BYPASS=1` (not `"1"` with quotes)
- Restart your dev server after changing environment variables
- Check browser console for "🚧 Auth bypass enabled" message

**Q: API calls fail with 401 errors**
- This is expected if your backend auth isn't ready yet
- The bypass only skips the login redirect, not API authentication
- Consider mocking API responses temporarily if needed
