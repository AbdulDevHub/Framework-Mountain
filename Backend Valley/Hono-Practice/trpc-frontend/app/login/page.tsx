"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { setToken } from "../_trpc/auth"
import { API_BASE_URL } from "../_trpc/config"

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<"login" | "register">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const res = await fetch(`${API_BASE_URL}/auth/${mode === "login" ? "login" : "register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const body = await res.json()

      if (!res.ok) {
        // Backend returns { error: ... } on 400/401/409 — surface it directly.
        setError(typeof body.error === "string" ? body.error : "Something went wrong")
        return
      }

      setToken(body.token)
      router.push("/")
    } catch {
      setError("Could not reach the server — is the backend running on port 3000?")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0F1115] text-[#EDEBE6] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">
          {mode === "login" ? "Log in" : "Register"}
        </h1>
        <p className="mb-6 font-mono text-xs text-[#7B8291]">
          POST /auth/{mode === "login" ? "login" : "register"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            className="w-full rounded-lg border border-[#262B35] bg-[#171A21] px-3 py-2.5 text-sm outline-none placeholder:text-[#7B8291] focus:border-[#818CF8]"
          />
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password (min 8 characters)"
            className="w-full rounded-lg border border-[#262B35] bg-[#171A21] px-3 py-2.5 text-sm outline-none placeholder:text-[#7B8291] focus:border-[#818CF8]"
          />

          {error && (
            <p className="rounded-md border border-[#FB7185]/30 bg-[#FB7185]/10 px-3 py-2 font-mono text-xs text-[#FB7185]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-[#818CF8] px-3 py-2.5 text-sm font-medium text-[#0F1115] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? "Please wait…" : mode === "login" ? "Log in" : "Register"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "login" ? "register" : "login")
            setError(null)
          }}
          className="mt-4 font-mono text-xs text-[#7B8291] hover:text-[#818CF8]"
        >
          {mode === "login"
            ? "Need an account? Register instead"
            : "Already have an account? Log in instead"}
        </button>
      </div>
    </main>
  )
}
