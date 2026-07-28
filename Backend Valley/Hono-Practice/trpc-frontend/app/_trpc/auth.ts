const TOKEN_KEY = "token"

export function getToken(): string | null {
  // Guard for server-side rendering — localStorage doesn't exist during SSR.
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

/**
 * Decodes a JWT's payload WITHOUT verifying the signature.
 * This is safe for display purposes only (e.g. showing "logged in as x@y.com")
 * because a JWT's payload is base64-encoded, not encrypted — anyone can read
 * it, tampered or not. The actual security check happens server-side via
 * jwt.verify() in verifyToken() — never trust this decoded value for any
 * access-control decision on the client.
 */
export function decodeEmailForDisplay(token: string): string | null {
  try {
    const payloadBase64 = token.split(".")[1]
    const payload = JSON.parse(atob(payloadBase64))
    return typeof payload.email === "string" ? payload.email : null
  } catch {
    return null
  }
}
