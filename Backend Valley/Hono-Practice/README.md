# Hono-Practice

![My Screenshot](./Screenshot.png)

A REST API built with [Hono](https://hono.dev/), [Prisma](https://www.prisma.io/), and [Supabase](https://supabase.com/) (PostgreSQL). Built as a learning project covering HTTP fundamentals, input validation, JWT authentication, password hashing, database integration, security hardening, and testing.

---

## Stack

- **[Hono](https://hono.dev/)** — lightweight TypeScript web framework
- **[Prisma](https://www.prisma.io/)** — ORM for database access
- **[Supabase](https://supabase.com/)** — hosted PostgreSQL database
- **[Zod](https://zod.dev/)** — schema validation (including environment variable validation at startup)
- **[jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)** — JWT signing and verification
- **[bcrypt](https://github.com/kelektiv/node.bcrypt.js)** — password hashing
- **[hono/secure-headers](https://hono.dev/docs/middleware/builtin/secure-headers)** — HTTP security headers
- **[Vitest](https://vitest.dev/)** — unit testing

---

## Project Structure

```
hono-practice/
├── prisma/
│   ├── schema.prisma        # Database schema (Task + User models)
│   └── migrations/          # Migration history
├── src/
│   ├── __tests__/
│   │   ├── mocks/
│   │   │   └── prisma.ts    # Shared Prisma mock
│   │   └── tasks.test.ts    # Route tests (auth + tasks)
│   ├── lib/
│   │   ├── prisma.ts        # Shared Prisma client
│   │   └── env.ts           # Zod-validated environment config (fails fast at startup)
│   ├── middleware/
│   │   └── auth.ts          # JWT auth middleware
│   ├── routes/
│   │   ├── auth.ts          # /register and /login routes
│   │   └── tasks.ts         # Tasks CRUD routes (with pagination)
│   ├── index.ts             # App setup, middleware, and route mounting
│   └── server.ts            # Server entrypoint
├── prisma.config.ts         # Prisma configuration
├── vitest.config.ts         # Vitest configuration
└── .env                     # Environment variables (never commit this)
```

---

## Local Setup

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd hono-practice
npm install
```

### 2. Set up environment variables

Create a `.env` file in the root:

```env
# Used by your application for connection pooling
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Used strictly by Prisma migrations (direct connection, no pooler)
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Secret key used to sign and verify JWTs — keep this private, minimum 32 characters
JWT_SECRET="your-long-random-secret-here"

# Comma-separated list of allowed frontend origins for CORS
ALLOWED_ORIGINS=http://localhost:5173,https://yourfrontend.com
```

Get your connection strings from your Supabase project under **Settings → Database → Connection string**.

> **Note:** All environment variables are validated at startup using Zod (`src/lib/env.ts`). If a required variable is missing or malformed, the app exits immediately with a clear error message rather than failing silently at runtime.

### 3. Run migrations

```bash
npx prisma migrate dev
```

### 4. Start the server

```bash
npm run dev
```

Server runs at `http://localhost:3000`.

---

## Docker (Local PostgreSQL — Reference)

If you prefer a local database instead of Supabase, you can spin one up with Docker.

### docker-compose.yml

```yaml
version: '3.8'
services:
  db:
    image: postgres:15
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: hono_practice
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Start the database

```bash
docker compose up -d
```

### Update your .env for local Docker

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hono_practice"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/hono_practice"
```

Then run migrations as normal:

```bash
npx prisma migrate dev
```

---

## Security

### CORS

This API uses Hono's built-in CORS middleware configured with an explicit origin allowlist. The `ALLOWED_ORIGINS` environment variable controls which frontend URLs are permitted to make cross-origin requests.

```
ALLOWED_ORIGINS=http://localhost:5173,https://yourfrontend.com
```

`credentials: true` is set so the browser can send `Authorization` headers cross-origin. This requires a specific origin to be echoed back — `*` is intentionally not used, as browsers reject credentialed requests to wildcard origins.

CORS is a browser-enforced mechanism. Tools like `curl` and Postman bypass it entirely — it protects users in browsers, not the API itself.

### HTTP Security Headers

Security headers are set via `hono/secure-headers`. You can inspect them by running:

```bash
curl -I http://localhost:3000/
```

Key headers and what they do:

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Frame-Options` | `SAMEORIGIN` | Prevents clickjacking via iframes |
| `X-Content-Type-Options` | `nosniff` | Stops browsers from guessing content types |
| `Strict-Transport-Security` | `max-age=15552000` | Forces HTTPS (production only) |
| `Referrer-Policy` | `no-referrer` | Prevents leaking internal URLs to external sites |
| `Content-Security-Policy` | `default-src 'self'` | Restricts which resources the browser can load |
| `X-XSS-Protection` | `0` | Disables a broken legacy browser feature |
| `Cross-Origin-Opener-Policy` | `same-origin` | Isolates browsing context from other tabs |

`Strict-Transport-Security` is only applied in production (`NODE_ENV=production`) to avoid forcing HTTPS in local development.

### Authentication

This API uses **JWT (JSON Web Token)** authentication.

1. Register or log in via `/auth/register` or `/auth/login` — both return a token
2. Include that token as a `Bearer` header on all `/tasks` requests

```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

Passwords are never stored in plaintext. They are hashed with **bcrypt** before being saved to the database, and compared using bcrypt on login — the original password is never recoverable from the stored hash.

JWTs are signed with `JWT_SECRET` and expire after **7 days**. The server verifies the signature on every request — a tampered or expired token is rejected with `401`.

---

## API Reference

### POST /auth/register

Creates a new user account and returns a JWT.

**Request**
```
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response `201`**
```json
{ "token": "eyJhbGciOiJIUzI1NiJ9..." }
```

**Response `400`** — email is invalid or password is under 8 characters.

**Response `409`** — email is already registered.

---

### POST /auth/login

Logs in an existing user and returns a JWT.

**Request**
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response `200`**
```json
{ "token": "eyJhbGciOiJIUzI1NiJ9..." }
```

**Response `401`** — email not found or password is wrong. Both cases return the same message intentionally — revealing which one failed would let an attacker enumerate registered emails.

---

### GET /tasks

Returns tasks with pagination. Supports two modes:

**Cursor pagination** (preferred — pass a cursor from a previous response):
```
GET /tasks?limit=10&cursor=<id>
Authorization: Bearer <token>
```

**Offset pagination** (fallback — pass a page number):
```
GET /tasks?limit=10&page=2
Authorization: Bearer <token>
```

`limit` defaults to `10` and is capped at `100`.

**Cursor response `200`**
```json
{
  "data": [
    { "id": "uuid", "title": "Buy groceries", "done": false, "createdAt": "..." }
  ],
  "nextCursor": "uuid-of-last-item"
}
```

`nextCursor` is `null` when you've reached the last page. Pass it as `?cursor=` on the next request to fetch the next page.

**Offset response `200`**
```json
{
  "data": [...],
  "total": 83,
  "page": 2,
  "totalPages": 9,
  "nextCursor": null
}
```

---

### POST /tasks

Creates a new task.

**Request**
```
POST /tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Buy groceries"
}
```

**Response `201`**
```json
{
  "id": "uuid",
  "title": "Buy groceries",
  "done": false,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Response `400`** — if `title` is missing or empty.

---

### PUT /tasks/:id

Updates a task's title and/or done status. Both fields are optional.

**Request**
```
PUT /tasks/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Buy groceries and cook",
  "done": true
}
```

**Response `200`** — returns the updated task.

**Response `400`** — if body fails validation.

**Response `404`** — if task does not exist.

---

### DELETE /tasks/:id

Deletes a task.

**Request**
```
DELETE /tasks/:id
Authorization: Bearer <token>
```

**Response `204`** — no body.

**Response `404`** — if task does not exist.

---

### Error responses

| Status | Meaning | When |
|--------|---------|------|
| `400` | Bad Request | Input is missing or invalid |
| `401` | Unauthorized | Missing, invalid, or expired token |
| `409` | Conflict | Email already registered |
| `404` | Not Found | Resource does not exist |
| `500` | Internal Server Error | Unexpected server error |

---

## Pagination

`GET /tasks` supports two pagination strategies.

**Cursor-based** is what production APIs use. Instead of skipping N rows, the client passes the `id` of the last item it received. The database finds that row by index and returns everything after it — unaffected by new inserts and fast at any depth.

**Offset-based** is simpler but has two problems: new inserts during pagination cause rows to shift (duplicates or skipped items), and `OFFSET 10000` forces the database to scan and discard 10,000 rows before returning your results.

Use cursor pagination for feeds and infinite scroll. Use offset when you need numbered pages (admin tables, search results).

---

## Running Tests

Tests use Vitest with mocked Prisma, `jsonwebtoken`, and `bcrypt` — no database connection or real cryptography required.

```bash
npm test
```

Covers all auth routes (register, login, duplicate email, wrong password) and all task routes including pagination behaviour, limit capping, validation errors, and token rejection cases.

---

## Deployment (Vercel + Supabase)

### 1. Push your code to GitHub

Make sure `.env` is in your `.gitignore` (it should be by default).

### 2. Import the project in Vercel

Go to [vercel.com](https://vercel.com), click **Add New Project**, and import your GitHub repo.

### 3. Add environment variables in Vercel

In your Vercel project under **Settings → Environment Variables**, add:

```
DATABASE_URL      → your Supabase pooler connection string
DIRECT_URL        → your Supabase direct connection string
JWT_SECRET        → your secret key for signing JWTs (min 32 characters)
ALLOWED_ORIGINS   → comma-separated list of your frontend URLs
NODE_ENV          → production
```

### 4. Configure Vercel for Hono

Create a `vercel.json` in the project root:

```json
{
  "builds": [
    {
      "src": "src/server.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/server.ts"
    }
  ]
}
```

Install the Vercel Node runtime:

```bash
npm install -D @vercel/node
```

### 5. Deploy

```bash
npx vercel --prod
```

Or push to your main branch if you have auto-deploy enabled.

---

## What This Project Covers

- REST API design with correct HTTP methods and status codes
- Sub-router pattern with Hono (`app.route()`)
- Request body validation with Zod (`safeParse`)
- Environment variable validation with Zod at startup — fails fast with a clear error if config is missing
- CORS configuration with an explicit origin allowlist — understands why `*` breaks credentialed requests
- HTTP security headers via `hono/secure-headers` — CSP, HSTS, clickjacking protection, and more
- JWT authentication — signing, verifying, and embedding user identity
- Password hashing with bcrypt — salt rounds, one-way hashing, secure comparison
- Auth middleware that decodes JWTs and passes user identity to route handlers
- Cursor-based and offset-based pagination — knows the tradeoffs of each
- Global error handling and `notFound` fallback
- Prisma schema, migrations, and CRUD operations
- Supabase hosted PostgreSQL with connection pooling
- Unit testing with Vitest and mocked external dependencies