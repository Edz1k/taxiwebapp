import type { AuthRole } from '~/types/auth'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { install } from '~/modules/authGuard'
import { useAuthStore } from '~/stores/auth'

vi.mock('~/stores/auth', () => ({
  useAuthStore: vi.fn(),
}))

interface AuthStub {
  homePath: string
  isAuthenticated: boolean
  loadSession: ReturnType<typeof vi.fn>
  pendingPhone: string
  restoreSession: ReturnType<typeof vi.fn>
  roles: AuthRole[]
}

function createAuthStub(overrides: Partial<AuthStub> = {}): AuthStub {
  return {
    homePath: '/',
    isAuthenticated: false,
    loadSession: vi.fn(),
    pendingPhone: '',
    restoreSession: vi.fn(),
    roles: [],
    ...overrides,
  }
}

function installGuard(auth: AuthStub) {
  let guard: ((to: { meta: Record<string, unknown> }) => Promise<string | undefined>) | undefined
  vi.mocked(useAuthStore).mockReturnValue(auth as any)

  install({
    router: {
      beforeEach(callback: typeof guard) {
        guard = callback
      },
    },
  } as any)

  if (!guard)
    throw new Error('Guard was not installed')

  return guard
}

describe('auth guard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects protected routes to web login when there is no authenticated session', async () => {
    const auth = createAuthStub()
    const guard = installGuard(auth)

    const redirect = await guard({
      meta: {
        requiresAuth: true,
      },
    })

    expect(auth.loadSession).toHaveBeenCalled()
    expect(auth.restoreSession).toHaveBeenCalled()
    expect(redirect).toBe('/login')
  })

  it('uses explicit auth redirect when protected routes define one', async () => {
    const auth = createAuthStub()
    const guard = installGuard(auth)

    const redirect = await guard({
      meta: {
        authRedirect: '/admin-login',
        requiresAuth: true,
      },
    })

    expect(redirect).toBe('/admin-login')
  })

  it('redirects authenticated users without required role to their web home', async () => {
    const auth = createAuthStub({
      homePath: '/park',
      isAuthenticated: true,
      roles: ['park'],
    })
    const guard = installGuard(auth)

    const redirect = await guard({
      meta: {
        requiredRole: ['admin', 'superadmin'],
      },
    })

    expect(redirect).toBe('/park')
  })

  it('allows any matching role into protected routes', async () => {
    const auth = createAuthStub({
      homePath: '/admin',
      isAuthenticated: true,
      roles: ['park', 'admin'],
    })
    const guard = installGuard(auth)

    const redirect = await guard({
      meta: {
        authRedirect: '/login',
        requiredRole: ['admin', 'superadmin'],
      },
    })

    expect(redirect).toBeUndefined()
  })

  it('allows superadmin into routes that explicitly include superadmin', async () => {
    const auth = createAuthStub({
      homePath: '/admin',
      isAuthenticated: true,
      roles: ['superadmin'],
    })
    const guard = installGuard(auth)

    const redirect = await guard({
      meta: {
        requiredRole: ['admin', 'superadmin'],
      },
    })

    expect(redirect).toBeUndefined()
  })

  it('redirects authenticated users away from guest routes to their role home', async () => {
    const auth = createAuthStub({
      homePath: '/admin',
      isAuthenticated: true,
      roles: ['admin'],
    })
    const guard = installGuard(auth)

    const redirect = await guard({
      meta: {
        guestOnly: true,
      },
    })

    expect(redirect).toBe('/admin')
  })

  it('keeps pending-phone verification behind the pending phone state', async () => {
    const auth = createAuthStub()
    const guard = installGuard(auth)

    const redirect = await guard({
      meta: {
        requiresPendingPhone: true,
      },
    })

    expect(auth.restoreSession).toHaveBeenCalled()
    expect(redirect).toBe('/login')
  })
})
