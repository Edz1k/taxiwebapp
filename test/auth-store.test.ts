import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAuthSession, logout as logoutRequest, sendOtp, verifyOtp } from '~/api/auth'
import { ApiError } from '~/api/client'
import { useAdminStore } from '~/stores/admin'
import { useAuthStore } from '~/stores/auth'
import { useParkStore } from '~/stores/park'
import { useSupportStore } from '~/stores/support'

vi.mock('~/api/auth', () => ({
  getAuthSession: vi.fn(),
  logout: vi.fn(),
  sendOtp: vi.fn(),
  verifyOtp: vi.fn(),
}))

vi.mock('~/api/errors', () => ({
  showErrorToast: vi.fn((_error, fallback: string) => fallback),
}))

const adminSession = {
  avatar_url: null,
  first_name: 'Админ',
  id: 'user-id',
  last_name: null,
  phone: '+77771234567',
  roles: ['admin' as const, 'park' as const],
  telegram_user_id: null,
}

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    globalThis.localStorage?.clear()
    globalThis.sessionStorage?.clear()
  })

  it('restores roles-array session once and reuses cached status', async () => {
    vi.mocked(getAuthSession).mockResolvedValue(adminSession)
    const auth = useAuthStore()

    const first = await auth.restoreSession()
    const second = await auth.restoreSession()

    expect(first).toEqual(adminSession)
    expect(second).toEqual(adminSession)
    expect(auth.currentUser).toEqual(adminSession)
    expect(auth.roles).toEqual(['admin', 'park'])
    expect(auth.hasRole('admin')).toBe(true)
    expect(auth.hasAnyRole(['tech_support', 'park'])).toBe(true)
    expect(auth.homePath).toBe('/dashboard')
    expect(auth.isAuthenticated).toBe(true)
    expect(auth.sessionStatus).toBe('authenticated')
    expect(getAuthSession).toHaveBeenCalledTimes(1)
  })

  it('restores forced session without role normalization or preferred role switching', async () => {
    vi.mocked(getAuthSession).mockResolvedValue({
      ...adminSession,
      roles: ['passenger' as const, 'driver' as const],
    })
    const auth = useAuthStore()

    await auth.restoreSession({ force: true })

    expect(auth.currentUser?.roles).toEqual(['passenger', 'driver'])
    expect(auth.hasRole('driver')).toBe(true)
    expect(auth.hasRole('admin')).toBe(false)
    expect(auth.homePath).toBe('/dashboard')
  })

  it('treats 401 restore failures as guest state without throwing', async () => {
    vi.mocked(getAuthSession).mockRejectedValue(new ApiError(401, 'unauthorized', {}))
    const auth = useAuthStore()

    const session = await auth.restoreSession({ force: true })

    expect(session).toBeNull()
    expect(auth.currentUser).toBeNull()
    expect(auth.roles).toEqual([])
    expect(auth.isAuthenticated).toBe(false)
    expect(auth.sessionStatus).toBe('guest')
  })

  it('requests and confirms OTP through the web auth flow', async () => {
    vi.mocked(sendOtp).mockResolvedValue({ message: 'otp sent', phone: '+77771234567' })
    vi.mocked(verifyOtp).mockResolvedValue({ role: 'admin' })
    vi.mocked(getAuthSession).mockResolvedValue(adminSession)
    const auth = useAuthStore()

    await auth.requestOtp('+77771234567')
    await auth.confirmOtp('123456')

    expect(sendOtp).toHaveBeenCalledWith({ phone: '+77771234567' }, 'admin')
    expect(verifyOtp).toHaveBeenCalledWith(
      {
        code: '123456',
        deviceFingerprint: expect.any(String),
        phone: '+77771234567',
      },
      'admin',
    )
    expect(auth.currentUser).toEqual(adminSession)
    expect(auth.pendingPhone).toBe('')
    expect(auth.pendingFlow).toBe('admin')
  })

  it.each([
    ['park' as const, ['park' as const], '/park'],
    ['tech_support' as const, ['tech_support' as const], '/support'],
  ])('requests and confirms OTP through the %s auth flow', async (flow, roles, homePath) => {
    const session = {
      ...adminSession,
      roles,
    }
    vi.mocked(sendOtp).mockResolvedValue({ message: 'otp sent', phone: '+77771234567' })
    vi.mocked(verifyOtp).mockResolvedValue({ role: roles[0] })
    vi.mocked(getAuthSession).mockResolvedValue(session)
    const auth = useAuthStore()

    await auth.requestOtp('+77771234567', flow)

    expect(auth.pendingPhone).toBe('+77771234567')
    expect(auth.pendingFlow).toBe(flow)
    expect(sendOtp).toHaveBeenCalledWith({ phone: '+77771234567' }, flow)

    await auth.confirmOtp('123456')

    expect(verifyOtp).toHaveBeenCalledWith(
      {
        code: '123456',
        deviceFingerprint: expect.any(String),
        phone: '+77771234567',
      },
      flow,
    )
    expect(auth.currentUser).toEqual(session)
    expect(auth.pendingPhone).toBe('')
    expect(auth.pendingFlow).toBe('admin')
    expect(auth.homePath).toBe(homePath)
  })

  it('keeps pending login when OTP succeeds but the cookie session is missing', async () => {
    vi.mocked(verifyOtp).mockResolvedValue({ role: 'admin' })
    vi.mocked(getAuthSession).mockRejectedValue(new ApiError(401, 'missing token', {}))
    const auth = useAuthStore()
    auth.setPendingPhone('+77771234567', 'admin')

    await expect(auth.confirmOtp('123456')).rejects.toThrow('session restore failed after login')

    expect(auth.pendingPhone).toBe('+77771234567')
    expect(auth.pendingFlow).toBe('admin')
    expect(auth.currentUser).toBeNull()
    expect(auth.sessionStatus).toBe('guest')
  })

  it('clears local auth state even when server logout fails', async () => {
    vi.mocked(logoutRequest).mockRejectedValue(new Error('network down'))
    const admin = useAdminStore()
    const auth = useAuthStore()
    const park = useParkStore()
    const support = useSupportStore()
    auth.currentUser = adminSession
    auth.pendingPhone = '+77771234567'
    auth.errorMessage = 'old error'
    auth.sessionStatus = 'authenticated'
    admin.users = [{ id: 'user-id' }] as any
    admin.parks = [{ id: 'park-id' }] as any
    admin.trips = [{ id: 'trip-id' }] as any
    park.park = { id: 'park-id' } as any
    park.drivers = [{ id: 'driver-id' }] as any
    support.rooms = [{ id: 'room-id' }] as any
    support.messages = [{ id: 'message-id' }] as any

    await auth.logout()

    expect(auth.currentUser).toBeNull()
    expect(auth.pendingPhone).toBe('')
    expect(auth.roles).toEqual([])
    expect(auth.isAuthenticated).toBe(false)
    expect(auth.sessionStatus).toBe('guest')
    expect(auth.isLoading).toBe(false)
    expect(admin.users).toEqual([])
    expect(admin.parks).toEqual([])
    expect(admin.trips).toEqual([])
    expect(park.park).toBeNull()
    expect(park.drivers).toEqual([])
    expect(support.rooms).toEqual([])
    expect(support.messages).toEqual([])
  })
})
