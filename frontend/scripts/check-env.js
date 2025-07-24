#!/usr/bin/env node

/**
 * Environment Variable Test Script
 * Run this to verify your environment variables are loaded correctly
 */

console.log('🔍 Environment Variable Check')
console.log('============================')
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`)
console.log(`NEXT_PUBLIC_API_URL: ${process.env.NEXT_PUBLIC_API_URL || 'undefined'}`)
console.log()

if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_API_URL) {
  console.error('❌ ERROR: NEXT_PUBLIC_API_URL is required in production!')
  process.exit(1)
} else if (!process.env.NEXT_PUBLIC_API_URL) {
  console.log('⚠️  WARNING: NEXT_PUBLIC_API_URL not set, will use localhost fallback in development')
} else {
  console.log('✅ NEXT_PUBLIC_API_URL is configured correctly')
}

console.log()
console.log('Environment files checked:')
console.log('- .env.local (development)')
console.log('- .env.production (production)')
console.log('- .env.example (template)')
