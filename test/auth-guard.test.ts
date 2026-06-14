import { beforeEach, describe, expect, it, vi } from 'vitest'
import { install } from '~/modules/authGuard'
import { useAuthStore } from '~/stores/auth'

vi.mock('~/stores/auth', () => ({
  useAuthStore: vi.fn(),
}))

interface AuthStub {
  currentUser: null | { role: string }
  isAuthenticated: boolean
  loadSession: ReturnType<typeof vi.fn>
  pendingPhone: string
  restoreSession: ReturnType<typeof vi.fn>
  role: null | string
}

function createAuthStub(overrides: Partial<AuthStub> = {}): AuthStub {
  return {
    currentUser: null,
    isAuthenticated: false,
    loadSession: vi.fn(),
    pendingPhone: '',
    restoreSession: vi.fn(),
    role: null,
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

  it('redirects protected routes when there is no authenticated session', async () => {
    const auth = createAuthStub()
    const guard = installGuard(auth)

    const redirect = await guard({
      meta: {
        authRedirect: '/driver/login',
        requiresAuth: true,
      },
    })

    expect(auth.loadSession).toHaveBeenCalled()
    expect(auth.restoreSession).toHaveBeenCalled()
    expect(redirect).toBe('/driver/login')
  })

  it('redirects authenticated users away from routes requiring another role', async () => {
    const auth = createAuthStub({
      currentUser: { role: 'passenger' },
      isAuthenticated: true,
      role: 'passenger',
    })
    const guard = installGuard(auth)

    const redirect = await guard({
      meta: {
        authRedirect: '/driver/login',
        requiredRole: 'driver',
      },
    })

    expect(redirect).toBe('/driver/login')
  })

  it('does not redirect a driver away from passenger guest pages', async () => {
    const auth = createAuthStub({
      currentUser: { role: 'driver' },
      isAuthenticated: true,
      role: 'driver',
    })
    const guard = installGuard(auth)

    const redirect = await guard({
      meta: {
        guestOnly: true,
        guestOnlyRole: 'passenger',
        guestRedirect: '/passenger',
      },
    })

    expect(redirect).toBeUndefined()
  })

  it('allows matching role into protected routes', async () => {
    const auth = createAuthStub({
      currentUser: { role: 'driver' },
      isAuthenticated: true,
      role: 'driver',
    })
    const guard = installGuard(auth)

    const redirect = await guard({
      meta: {
        authRedirect: '/driver/login',
        requiredRole: 'driver',
      },
    })

    expect(redirect).toBeUndefined()
  })

  it('allows superadmin into admin routes', async () => {
    const auth = createAuthStub({
      currentUser: { role: 'superadmin' },
      isAuthenticated: true,
      role: 'superadmin',
    })
    const guard = installGuard(auth)

    const redirect = await guard({
      meta: {
        authRedirect: '/passenger/login',
        requiredRole: 'admin',
      },
    })

    expect(redirect).toBeUndefined()
  })

  it('keeps pending-phone verification behind the pending phone state', async () => {
    const auth = createAuthStub()
    const guard = installGuard(auth)

    const redirect = await guard({
      meta: {
        authRedirect: '/login',
        requiresPendingPhone: true,
      },
    })

    expect(auth.restoreSession).toHaveBeenCalled()
    expect(redirect).toBe('/login')
  })
})
