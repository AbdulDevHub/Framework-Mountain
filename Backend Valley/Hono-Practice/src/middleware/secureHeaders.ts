import { MiddlewareHandler } from 'hono'
import { env } from '../lib/env'

export const secureHeaders: MiddlewareHandler = async (c, next) => {
  await next() // Run the route handler first, then add headers to the response

  // Prevent clickjacking — don't allow this app in an iframe
  c.header('X-Frame-Options', 'DENY')

  // Prevent MIME sniffing
  c.header('X-Content-Type-Options', 'nosniff')

  // Only send origin (not full URL) as referrer to external sites
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Force HTTPS for 1 year (only enable this in production)
  if (env.NODE_ENV === 'production') {
    c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  // CSP: only load resources from same origin, no inline scripts
  // Note: you'd loosen this if your API also serves a frontend
  c.header(
    'Content-Security-Policy',
    "default-src 'self'; frame-ancestors 'none'"
  )

  // Remove the header that advertises which server software you're running
  // Attackers use this to look up known vulnerabilities for that version
  c.header('X-Powered-By', '') // Hono doesn't set this, but good habit
}