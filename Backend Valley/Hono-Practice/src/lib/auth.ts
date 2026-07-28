import jwt from "jsonwebtoken"
import { env } from "./env"

export interface JwtPayload {
  userId: string
  email: string
}

export class InvalidTokenError extends Error {
  constructor() {
    super("Invalid or expired token")
    this.name = "InvalidTokenError"
  }
}

/**
 * Verifies a raw JWT string and returns its decoded payload.
 * Throws InvalidTokenError if the signature is bad or the token expired.
 *
 * This is the ONLY place jwt.verify() should be called — both the REST
 * auth middleware and the tRPC context call this instead of duplicating
 * the verify + shape logic themselves.
 */
export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload
  } catch {
    // JsonWebTokenError (bad signature/malformed) and TokenExpiredError
    // both collapse to the same outcome for callers: not authorized.
    throw new InvalidTokenError()
  }
}

/**
 * Pulls the bearer token out of an Authorization header value.
 * Returns null if the header is missing or malformed.
 */
export function extractBearerToken(
  authHeader: string | null | undefined,
): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null
  const token = authHeader.split(" ")[1]
  return token || null
}
