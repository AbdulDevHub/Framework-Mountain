import { z } from 'zod'

const envSchema = z.object({
  // DATABASE_URL and DIRECT_URL must be a valid URL string
  DATABASE_URL: z.url(),
  DIRECT_URL: z.url(),

  // JWT_SECRET must exist and be at least 32 characters
  // (short secrets are a security risk)
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),

  // NODE_ENV defaults to 'development' if not set
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // ALLOWED_ORIGINS is optional — falls back to empty string
  ALLOWED_ORIGINS: z.string().default(''),
})

// .safeParse() returns { success, data, error } instead of throwing
const result = envSchema.safeParse(process.env)

if (!result.success) {
  console.error('❌ Invalid environment variables:')
  console.error(z.flattenError(result.error).fieldErrors)
  process.exit(1)  // Crash intentionally — better than running with bad config
}

export const env = result.data