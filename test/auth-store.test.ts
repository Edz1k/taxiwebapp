import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAuthSession, logout as logoutRequest } from '~/api/auth'
import { ApiError } from '~/api/client'
import { useAuthStore } from '~/stores/auth'

vi.mock('~/api/auth', () => ({
  getAuthSession: vi.fn(),
  logout: vi.fn(),
  sendOtp: vi.fn(),
  telegramDriverAuth: vi.fn(),
  telegramPassengerAuth: vi.fn(),
  verifyOtp: vi.fn(),
}))

vi.mock('~/api/errors', () => ({
  showErrorToast: vi.fn((_error, fallback: string) => fallback),
}))

const passengerSession = {
  avatar_url: null,
  first_name: 'Пассажир',
  id: 'user-id',
  last_name: null,
  phone: '+77771234567',
  role: 'passenger' as const,
  telegram_user_id: 123,
}

const backendRolesSession = {
  ...passengerSession,
  roles: ['passenger' as const, 'driver' as const],
}

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('restores current user session once and reuses cached status', async () => {
    vi.mocked(getAuthSession).mockResolvedValue(passengerSession)
    const auth = useAuthStore()

    const first = await auth.restoreSession()
    const second = await auth.restoreSession()
    const normalizedSession = {
      ...passengerSession,
      roles: ['passenger'],
    }

    expect(first).toEqual(normalizedSession)
    expect(second).toEqual(normalizedSession)
    expect(auth.currentUser).toEqual(normalizedSession)
    expect(auth.role).toBe('passenger')
    expect(auth.isAuthenticated).toBe(true)
    expect(auth.sessionStatus).toBe('authenticated')
    expect(getAuthSession).toHaveBeenCalledTimes(1)
  })

  it('collapses backend roles into one preferred app role', async () => {
    vi.mocked(getAuthSession).mockResolvedValue(backendRolesSession)
    const auth = useAuthStore()

    await auth.restoreSession({ force: true, preferredRole: 'driver' })

    expect(auth.currentUser?.role).toBe('driver')
    expect(auth.currentUser?.roles).toEqual(['passenger', 'driver'])
    expect(auth.role).toBe('driver')
  })

  it('normalizes legacy roles-only sessions into one role', async () => {
    vi.mocked(getAuthSession).mockResolvedValue({
      ...passengerSession,
      role: undefined as any,
      roles: ['passenger' as const],
    })
    const auth = useAuthStore()

    await auth.restoreSession({ force: true })

    expect(auth.currentUser?.role).toBe('passenger')
    expect(auth.role).toBe('passenger')
  })

  it('treats 401 restore failures as guest state without throwing', async () => {
    vi.mocked(getAuthSession).mockRejectedValue(new ApiError(401, 'unauthorized', {}))
    const auth = useAuthStore()

    const session = await auth.restoreSession({ force: true })

    expect(session).toBeNull()
    expect(auth.currentUser).toBeNull()
    expect(auth.isAuthenticated).toBe(false)
    expect(auth.sessionStatus).toBe('guest')
  })

  it('clears local auth state even when server logout fails', async () => {
    vi.mocked(logoutRequest).mockRejectedValue(new Error('network down'))
    const auth = useAuthStore()
    auth.currentUser = passengerSession
    auth.pendingPhone = '+77771234567'
    auth.driverPhoneVerified = true
    auth.errorMessage = 'old error'
    auth.sessionStatus = 'authenticated'

    await auth.logout()

    expect(auth.currentUser).toBeNull()
    expect(auth.pendingPhone).toBe('')
    expect(auth.driverPhoneVerified).toBeNull()
    expect(auth.isAuthenticated).toBe(false)
    expect(auth.sessionStatus).toBe('guest')
    expect(auth.isLoading).toBe(false)
  })
})
