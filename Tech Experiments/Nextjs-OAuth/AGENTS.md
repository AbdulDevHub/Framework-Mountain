<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# My Auth App

## Stack

- Next.js 16 with App Router
- TypeScript
- Auth.js (NextAuth v5)
- Tailwind CSS

## Conventions

- All pages are async server components
- Use auth() from @/auth to get sessions
- Protect routes with redirect() not middleware
- Never put secrets in code, use .env.local