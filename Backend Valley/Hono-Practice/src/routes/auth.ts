import { Hono } from "hono"
import { z } from "zod"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import prisma from "../lib/prisma"
import { env } from '../lib/env'

export const authRouter = new Hono()

// ─── Validation schemas ───────────────────────────────────────────────────────

const RegisterSchema = z.object({
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})

// ─── POST /auth/register ──────────────────────────────────────────────────────
//
// What happens here:
//  1. Validate the request body
//  2. Check the email isn't already taken
//  3. Hash the password with bcrypt (never store plaintext!)
//  4. Save the new user to the database
//  5. Sign a JWT containing the user's id and email
//  6. Return the token to the client

authRouter.post("/register", async (c) => {
  const result = RegisterSchema.safeParse(await c.req.json())

  if (!result.success) {
    return c.json({ error: z.treeifyError(result.error) }, 400)
  }

  const { email, password } = result.data

  // Step 2: Check for duplicate email
  // We look in the DB first — if someone already registered with this email,
  // we reject early. Prisma's @unique constraint would also throw, but checking
  // here gives us a cleaner error message.
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return c.json({ error: "Email already in use" }, 409) // 409 = Conflict
  }

  // Step 3: Hash the password
  // bcrypt.hash(plaintext, saltRounds)
  // saltRounds = 10 means bcrypt runs its internal loop 2^10 = 1024 times.
  // This makes it slow enough to resist brute-force attacks.
  // The salt is randomly generated and embedded IN the hash string itself —
  // you don't need to store it separately.
  const passwordHash = await bcrypt.hash(password, 10)

  // Step 4: Save to DB — note we store `passwordHash`, NOT `password`
  const user = await prisma.user.create({
    data: { email, passwordHash },
  })

  // Step 5: Sign a JWT
  // jwt.sign(payload, secret, options)
  // - payload: the data baked into the token (readable by anyone, not secret)
  // - secret: only the server knows this; used to sign + later verify
  // - expiresIn: after this time the token is invalid (forces re-login)
  const secret = env.JWT_SECRET
  if (!secret) throw new Error("JWT_SECRET is not set")

  const token = jwt.sign(
    { userId: user.id, email: user.email }, // payload
    secret,                                  // secret key
    { expiresIn: "7d" }                      // token expires in 7 days
  )

  // Step 6: Return the token
  // The client (browser/app) stores this and sends it with future requests
  return c.json({ token }, 201)
})

// ─── POST /auth/login ─────────────────────────────────────────────────────────
//
// What happens here:
//  1. Validate the request body
//  2. Find the user by email (if not found → reject)
//  3. Compare the provided password against the stored hash
//  4. If it matches → sign a new JWT and return it

authRouter.post("/login", async (c) => {
  const result = LoginSchema.safeParse(await c.req.json())

  if (!result.success) {
    return c.json({ error: z.treeifyError(result.error) }, 400)
  }

  const { email, password } = result.data

  // Step 2: Find user by email
  const user = await prisma.user.findUnique({ where: { email } })

  // IMPORTANT: we give the SAME error whether the email doesn't exist OR
  // the password is wrong. Never tell attackers which one failed —
  // "email not found" leaks that an email IS or ISN'T registered.
  if (!user) {
    return c.json({ error: "Invalid email or password" }, 401)
  }

  // Step 3: Compare passwords
  // bcrypt.compare(plaintext, storedHash)
  // bcrypt extracts the salt from the stored hash, re-hashes the plaintext,
  // then compares. Returns true if they match.
  const passwordMatches = await bcrypt.compare(password, user.passwordHash)

  if (!passwordMatches) {
    return c.json({ error: "Invalid email or password" }, 401)
  }

  // Step 4: Sign a fresh JWT and return it
  const secret = env.JWT_SECRET
  if (!secret) throw new Error("JWT_SECRET is not set")

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    secret,
    { expiresIn: "7d" }
  )

  return c.json({ token })
})