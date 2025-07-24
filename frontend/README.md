# Device Management Frontend

A Next.js application for managing devices and viewing device logs.

## Environment Setup

This application uses environment variables to configure API endpoints. Follow these steps:

### Development Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Update the `.env.local` file with your backend server URL:
   ```env
   NEXT_PUBLIC_API_URL=http://192.168.1.157:3000
   ```

### Production Setup

1. Create a `.env.production` file:
   ```bash
   cp .env.example .env.production
   ```

2. Update the `.env.production` file with your production API URL:
   ```env
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com
   ```

3. For production deployments, set the environment variable directly in your hosting platform.

## Getting Started

### Development
1. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Production Build
1. Build the application:
   ```bash
   npm run build
   # or
   pnpm build
   ```

2. Start the production server:
   ```bash
   npm start
   # or
   pnpm start
   ```

## Environment Variables

- `NEXT_PUBLIC_API_URL`: The base URL for your backend API server
  - **Required in production** - The app will throw an error if not set
  - **Optional in development** - Falls back to `http://localhost:3000`

## Development

The application includes mock data fallbacks for development when the backend is unavailable.

## Production Deployment

⚠️ **Important**: Make sure to set `NEXT_PUBLIC_API_URL` in your production environment. The application will fail to start in production mode without this variable.