# Production Deployment Guide

## Environment Variable Setup

### 1. Local Production Testing

Test your production build locally:

```bash
# Create production environment file
cp .env.example .env.production

# Edit .env.production with your production API URL
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Build and test locally
pnpm build
pnpm start
```

### 2. Deployment Platforms

#### Vercel
Set environment variables in your Vercel dashboard:
- `NEXT_PUBLIC_API_URL=https://api.yourdomain.com`

#### Netlify
Set environment variables in your Netlify dashboard:
- `NEXT_PUBLIC_API_URL=https://api.yourdomain.com`

#### Docker
```dockerfile
ENV NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

#### Other Platforms
Set the environment variable according to your platform's documentation.

## Important Notes

⚠️ **Production Safety**: The application will fail to start in production if `NEXT_PUBLIC_API_URL` is not set. This prevents accidental deployment with development URLs.

✅ **Environment Priority**: Next.js loads environment variables in this order:
1. `.env.production.local` (highest priority, git-ignored)
2. `.env.local` (local development, git-ignored)
3. `.env.production` (production defaults)
4. `.env` (global defaults)

## Testing Production Build

```bash
# Build the application
pnpm build

# Start production server
pnpm start

# Verify API calls are using correct URLs
# Check browser network tab or console for any errors
```

## Troubleshooting

- **"API URL configuration missing in production"**: Set `NEXT_PUBLIC_API_URL` environment variable
- **CORS errors**: Ensure your production API allows requests from your frontend domain
- **404 on API calls**: Verify the API URL is correct and accessible from your deployment environment
