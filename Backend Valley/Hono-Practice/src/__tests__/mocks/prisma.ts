import { vi } from 'vitest'

const prisma = {
  task: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  // Added for auth routes
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
}

export default prisma