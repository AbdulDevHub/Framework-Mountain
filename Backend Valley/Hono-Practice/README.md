# Hono-Practice

![My Screenshot](./Screenshot.png)

A REST API built with [Hono](https://hono.dev/), [Prisma](https://www.prisma.io/), and [Supabase](https://supabase.com/) (PostgreSQL). Built as a learning project covering HTTP fundamentals, input validation, auth middleware, database integration, and testing.

---

## Stack

- **[Hono](https://hono.dev/)** — lightweight TypeScript web framework
- **[Prisma](https://www.prisma.io/)** — ORM for database access
- **[Supabase](https://supabase.com/)** — hosted PostgreSQL database
- **[Zod](https://zod.dev/)** — schema validation
- **[Vitest](https://vitest.dev/)** — unit testing

---

## Project Structure

```
hono-practice/
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── migrations/          # Migration history
├── src/
│   ├── __tests__/
│   │   └── tasks.test.ts    # Route tests
│   ├── lib/
│   │   └── prisma.ts        # Shared Prisma client
│   ├── middleware/
│   │   └── auth.ts          # API key auth middleware
│   ├── routes/
│   │   └── tasks.ts         # Tasks CRUD routes
│   ├── index.ts             # App setup and route mounting
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

# API key for auth middleware
API_KEY="secret123"
```

Get your connection strings from your Supabase project under **Settings → Database → Connection string**.

### 3. Run migrations

```bash
npx prisma migrate dev
```

### 4. Start the server

```bash
npx tsx src/server.ts
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

## API Reference

All `/tasks` routes require an `x-api-key` header.

### Authentication

| Header | Value |
|--------|-------|
| `x-api-key` | Your API key (set in `.env` as `API_KEY`) |

---

### GET /tasks

Returns all tasks ordered by creation date.

**Request**
```
GET /tasks
x-api-key: secret123
```

**Response `200`**
```json
[
  {
    "id": "uuid",
    "title": "Buy groceries",
    "done": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### POST /tasks

Creates a new task.

**Request**
```
POST /tasks
x-api-key: secret123
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
x-api-key: secret123
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
x-api-key: secret123
```

**Response `204`** — no body.

**Response `404`** — if task does not exist.

---

### Error responses

| Status | Meaning | When |
|--------|---------|------|
| `400` | Bad Request | Input is missing or invalid |
| `401` | Unauthorized | No `x-api-key` header provided |
| `403` | Forbidden | Wrong `x-api-key` value |
| `404` | Not Found | Resource does not exist |
| `500` | Internal Server Error | Unexpected server error |

---

## Running Tests

Tests use Vitest with a mocked Prisma client — no database connection required.

```bash
npm test
```

Tests cover all four routes including validation errors, auth rejections, and not-found cases.

---

## Deployment (Vercel + Supabase)

### 1. Push your code to GitHub

Make sure `.env` is in your `.gitignore` (it should be by default).

### 2. Import the project in Vercel

Go to [vercel.com](https://vercel.com), click **Add New Project**, and import your GitHub repo.

### 3. Add environment variables in Vercel

In your Vercel project under **Settings → Environment Variables**, add:

```
DATABASE_URL       → your Supabase pooler connection string
DIRECT_URL         → your Supabase direct connection string
API_KEY            → your chosen API key
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
- Auth middleware with `401` vs `403` distinction
- Global error handling and `notFound` fallback
- Prisma schema, migrations, and CRUD operations
- Supabase hosted PostgreSQL with connection pooling
- Unit testing with Vitest and mocked Prisma client