"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "./_trpc/client"
import { getToken, clearToken, decodeEmailForDisplay } from "./_trpc/auth"

export default function Home() {
  const router = useRouter()
  const utils = trpc.useUtils()

  // Initialize state synchronously on client mount (avoids cascading renders)
  const [token] = useState<string | null>(() => {
    if (typeof window === "undefined") return null
    return getToken()
  })

  const [email] = useState<string | null>(() => {
    if (typeof window === "undefined") return null
    const tok = getToken()
    return tok ? decodeEmailForDisplay(tok) : null
  })

  const [title, setTitle] = useState("")

  // Effect only handles side-effect (redirecting)
  useEffect(() => {
    if (!token) {
      router.replace("/login")
    }
  }, [token, router])

  const checkedAuth = Boolean(token)

  const { data, isLoading, error } = trpc.tasks.list.useQuery(
    {},
    { enabled: checkedAuth },
  )

  const createTask = trpc.tasks.create.useMutation({
    async onMutate(newTask) {
      await utils.tasks.list.cancel()
      const previousTasks = utils.tasks.list.getData({})

      utils.tasks.list.setData({}, (old) => {
        if (!old) return old
        return {
          ...old,
          data: [
            ...old.data,
            {
              id: `optimistic-${Date.now()}`,
              title: newTask.title,
              done: false,
              createdAt: new Date().toISOString(),
              userId: "", // Added missing userId property required by your task type
            },
          ],
        }
      })
      return { previousTasks }
    },
    onError(_err, _newTask, context) {
      if (context?.previousTasks) {
        utils.tasks.list.setData({}, context.previousTasks)
      }
    },
    onSettled() {
      utils.tasks.list.invalidate()
    },
  })

  const toggleTask = trpc.tasks.update.useMutation({
    async onMutate(input) {
      await utils.tasks.list.cancel()
      const previousTasks = utils.tasks.list.getData({})
      utils.tasks.list.setData({}, (old) => {
        if (!old) return old
        return {
          ...old,
          data: old.data.map((t) =>
            t.id === input.id ? { ...t, done: input.done ?? t.done } : t,
          ),
        }
      })
      return { previousTasks }
    },
    onError(_err, _input, context) {
      if (context?.previousTasks) {
        utils.tasks.list.setData({}, context.previousTasks)
      }
    },
    onSettled() {
      utils.tasks.list.invalidate()
    },
  })

  const deleteTask = trpc.tasks.delete.useMutation({
    async onMutate(input) {
      await utils.tasks.list.cancel()
      const previousTasks = utils.tasks.list.getData({})
      utils.tasks.list.setData({}, (old) => {
        if (!old) return old
        return { ...old, data: old.data.filter((t) => t.id !== input.id) }
      })
      return { previousTasks }
    },
    onError(_err, _input, context) {
      if (context?.previousTasks) {
        utils.tasks.list.setData({}, context.previousTasks)
      }
    },
    onSettled() {
      utils.tasks.list.invalidate()
    },
  })

  function handleLogout() {
    clearToken()
    router.replace("/login")
  }

  // Nothing to render until we've confirmed there's a token — avoids a
  // flash of the empty task list before the /login redirect kicks in.
  if (!checkedAuth) return null

  return (
    <main className="min-h-screen bg-[#0F1115] text-[#EDEBE6] flex items-start justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
            <p className="mt-1 font-mono text-xs text-[#7B8291]">
              logged in as {email ?? "unknown"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="font-mono text-xs text-[#7B8291] hover:text-[#FB7185]"
          >
            log out
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!title.trim()) return
            createTask.mutate({ title: title.trim() })
            setTitle("")
          }}
          className="mb-6 flex items-center gap-2 rounded-lg border border-[#262B35] bg-[#171A21] px-3 py-2.5 transition-colors focus-within:border-[#818CF8]"
        >
          <span className="select-none font-mono text-sm text-[#818CF8]">
            {">"}
          </span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a task"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#7B8291]"
          />
          <button
            type="submit"
            disabled={!title.trim()}
            className="rounded-md bg-[#818CF8] px-2.5 py-1 text-xs font-medium text-[#0F1115] transition-opacity hover:opacity-90 disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#818CF8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1115]"
          >
            Add
          </button>
        </form>

        {isLoading && (
          <p className="font-mono text-xs text-[#7B8291]">Loading tasks…</p>
        )}

        {error && (
          <p className="rounded-md border border-[#FB7185]/30 bg-[#FB7185]/10 px-3 py-2 font-mono text-xs text-[#FB7185]">
            {error.message}
          </p>
        )}

        {data && data.data.length === 0 && (
          <p className="rounded-lg border border-dashed border-[#262B35] px-3 py-6 text-center text-sm text-[#7B8291]">
            No tasks yet — add your first one above.
          </p>
        )}

        <ul className="space-y-1">
          {data?.data.map((task) => (
            <li
              key={task.id}
              className="group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-colors hover:border-[#262B35] hover:bg-[#171A21]"
            >
              <button
                onClick={() =>
                  toggleTask.mutate({ id: task.id, done: !task.done })
                }
                aria-label={task.done ? "Mark as not done" : "Mark as done"}
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#818CF8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1115] ${
                  task.done
                    ? "border-[#34D399] bg-[#34D399]/15 text-[#34D399]"
                    : "border-[#7B8291]/50 text-transparent"
                }`}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M1.5 5L4 7.5L8.5 2"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <span
                className={`flex-1 text-sm ${
                  task.done ? "text-[#7B8291] line-through" : "text-[#EDEBE6]"
                }`}
              >
                {task.title}
              </span>

              <button
                onClick={() => deleteTask.mutate({ id: task.id })}
                aria-label="Delete task"
                className="font-mono text-xs text-[#7B8291] opacity-0 transition-opacity hover:text-[#FB7185] group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
