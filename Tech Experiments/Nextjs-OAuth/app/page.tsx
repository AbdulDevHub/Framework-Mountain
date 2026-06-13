import { auth, signIn, signOut } from "@/auth"

export default async function Home() {
  const session = await auth()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6">
      {session ? (
        // User IS logged in
        <div className="flex flex-col items-center gap-4">
          <img
            src={session.user?.image ?? ""}
            alt="Profile"
            className="w-20 h-20 rounded-full"
          />
          <h1 className="text-2xl font-bold">
            Welcome, {session.user?.name}!
          </h1>
          <p className="text-gray-500">{session.user?.email}</p>
          <a
            href="/dashboard"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Go to Dashboard
          </a>
          <form
            action={async () => {
              "use server"
              await signOut()
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
      ) : (
        // User is NOT logged in
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-2xl font-bold">Welcome to My App</h1>
          <p className="text-gray-500">Sign in to continue</p>
          <form
            action={async () => {
              "use server"
              await signIn("github")
            }}
          >
            <button
              type="submit"
              className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-700"
            >
              Sign in with GitHub
            </button>
          </form>
        </div>
      )}
    </main>
  )
}