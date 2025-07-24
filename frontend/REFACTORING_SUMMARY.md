# API URL Refactoring Summary

## Changes Made

### 1. Environment Variables Setup
- Created `.env.local` with `NEXT_PUBLIC_API_URL=http://192.168.1.157:3000`
- Created `.env.example` as a template for other developers
- Added environment variable documentation to README.md

### 2. API Library Updates (`src/lib/api.ts`)
- Added helper functions:
  - `getApiBaseUrl()`: Gets API base URL from environment with fallback
  - `buildApiUrl(endpoint)`: Consistently builds API URLs
- Updated all API functions to use environment variables:
  - `fetchDevices()`: Uses env var with fallback to relative path for Next.js rewrites
  - `uploadApk()`: Uses env var with fallback to localhost
  - `fetchDeviceLogs()`: Uses env var with fallback to localhost

### 3. Next.js Configuration Updates (`next.config.ts`)
- Updated rewrites to use `process.env.NEXT_PUBLIC_API_URL`
- Added fallback to `http://localhost:3000`
- Added comments explaining the proxy behavior

### 4. Documentation Updates
- Updated README.md with environment setup instructions
- Added development and deployment guidance

## Before/After Examples

### Before:
```javascript
fetch('http://192.168.1.157:3000/api/upload-apk')
fetch("http://192.168.1.157:3000/api/deviceLog/getListDeviceLog")
```

### After:
```javascript
fetch(buildApiUrl('/api/upload-apk'))
fetch(buildApiUrl('/api/deviceLog/getListDeviceLog'))
```

## Environment Variable Usage

The application now uses `NEXT_PUBLIC_API_URL` for all API calls:
- **Development**: Set in `.env.local` 
- **Production**: Should be set in deployment environment
- **Fallback**: Defaults to `http://localhost:3000` if not set

## Notes

1. The `fetchDevices()` function has special logic to use relative paths when the environment variable is not set, allowing Next.js rewrites to work properly.

2. All URLs now have proper fallback logic to ensure the application continues to work even if environment variables are not configured.

3. The `.env.local` file is already excluded from version control via `.gitignore`.

## Testing

To test the changes:
1. Update `.env.local` with your backend URL
2. Run `npm run dev` or `pnpm dev`
3. Verify all API calls work correctly
4. Test with different environment variable values
