# Hono-Practice

![My Screenshot](./Screenshot.png)

A REST API built with [Hono](https://hono.dev/), [Prisma](https://www.prisma.io/), and [Supabase](https://supabase.com/) (PostgreSQL). Built as a learning project covering HTTP fundamentals, input validation, JWT authentication, password hashing, database integration, and testing.

---

## Stack

- **[Hono](https://hono.dev/)** — lightweight TypeScript web framework
- **[Prisma](https://www.prisma.io/)** — ORM for database access
- **[Supabase](https://supabase.com/)** — hosted PostgreSQL database
- **[Zod](https://zod.dev/)** — schema validation
- **[jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)** — JWT signing and verification
- **[bcrypt](https://github.com/kelektiv/node.bcrypt.js)** — password hashing
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
│   │   └── prisma.ts        # Shared Prisma client
│   ├── middleware/
│   │   └── auth.ts          # JWT auth middleware
│   ├── routes/
│   │   ├── auth.ts          # /register and /login routes
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

# Secret key used to sign and verify JWTs — keep this private
JWT_SECRET="your-long-random-secret-here"
```

Get your connection strings from your Supabase project under **Settings → Database → Connection string**.

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

## Authentication

This API uses **JWT (JSON Web Token)** authentication.

### How it works

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

Returns all tasks ordered by creation date.

**Request**
```
GET /tasks
Authorization: Bearer <token>
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

## Running Tests

Tests use Vitest with mocked Prisma, `jsonwebtoken`, and `bcrypt` — no database connection or real cryptography required.

```bash
npm test
```

Covers all auth routes (register, login, duplicate email, wrong password) and all task routes including validation errors and token rejection cases.

---

## Deployment (Vercel + Supabase)

### 1. Push your code to GitHub

Make sure `.env` is in your `.gitignore` (it should be by default).

### 2. Import the project in Vercel

Go to [vercel.com](https://vercel.com), click **Add New Project**, and import your GitHub repo.

### 3. Add environment variables in Vercel

In your Vercel project under **Settings → Environment Variables**, add:

```
DATABASE_URL  → your Supabase pooler connection string
DIRECT_URL    → your Supabase direct connection string
JWT_SECRET    → your secret key for signing JWTs
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
- JWT authentication — signing, verifying, and embedding user identity
- Password hashing with bcrypt — salt rounds, one-way hashing, secure comparison
- Auth middleware that decodes JWTs and passes user identity to route handlers
- Global error handling and `notFound` fallback
- Prisma schema, migrations, and CRUD operations
- Supabase hosted PostgreSQL with connection pooling
- Unit testing with Vitest and mocked external dependencies