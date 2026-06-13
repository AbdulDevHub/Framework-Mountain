import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"

export default async function Dashboard() {
  const session = await auth()

  // If no session exists, kick them to the home page
  if (!session) {
    redirect("/")
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6">
      <div className="flex flex-col items-center gap-4 max-w-md text-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500">
          This is a protected page. Only logged-in users can see this.
        </p>

        {/* The session object — let's inspect it */}
        <div className="bg-gray-100 rounded-lg p-4 text-left w-full">
          <p className="text-sm font-semibold text-gray-600 mb-2">
            Your session object:
          </p>
          <pre className="text-xs text-gray-800 overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>

        <form
          action={async () => {
            "use server"
            await signOut({ redirectTo: "/" })
          }}
        >
          <button
            type="submit"
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Sign Out
          </button>
        </form>
      </div>
    </main>
  )
}