import type { AuthRole, AuthSession } from '~/types/auth'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { getAuthSession, logout as logoutRequest, sendOtp, telegramDriverAuth, telegramPassengerAuth, verifyOtp } from '~/api/auth'
import { ApiError } from '~/api/client'
import { showErrorToast } from '~/api/errors'
import {
  AUTH_SESSION_CHANGED_EVENT,
  clearPendingPhone,
  clearStoredAuthArtifacts,
  clearTokenPair,
  readDeviceFingerprint,
  readPendingPhone,
  saveDeviceFingerprint,
  savePendingPhone,
} from '~/composables/auth/session'

let isListeningSessionChanges = false
const ROLE_PRIORITY: AuthRole[] = ['passenger', 'driver', 'admin', 'superadmin', 'tech_support', 'park']

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<AuthSession | null>(null)
  const pendingPhone = ref('')
  const driverPhoneVerified = ref<boolean | null>(null)
  const isLoading = ref(false)
  const errorMessage = ref('')
  const sessionStatus = ref<'authenticated' | 'guest' | 'unknown'>('unknown')

  const isAuthenticated = computed(() => Boolean(currentUser.value))
  const role = computed<AuthRole | null>(() => currentUser.value?.role ?? null)

  function isAuthRole(role: string): role is AuthRole {
    return ROLE_PRIORITY.includes(role as AuthRole)
  }

  function pickSessionRole(sessionRoles: AuthRole[], preferredRole?: AuthRole | null) {
    if (preferredRole && sessionRoles.includes(preferredRole))
      return preferredRole

    return ROLE_PRIORITY.find(role => sessionRoles.includes(role)) ?? null
  }

  function normalizeSession(session: AuthSession, preferredRole?: AuthRole | null): AuthSession | null {
    const rawRoles = session.roles?.length
      ? session.roles
      : session.role
        ? [session.role]
        : []
    const sessionRoles = Array.from(new Set(rawRoles.filter(isAuthRole)))
    const nextRole = pickSessionRole(sessionRoles, preferredRole)

    if (!nextRole)
      return null

    return {
      ...session,
      role: nextRole,
      roles: sessionRoles,
    }
  }

  function syncSession() {
    pendingPhone.value = readPendingPhone()
  }

  function listenSessionChanges() {
    if (isListeningSessionChanges || typeof window === 'undefined')
      return

    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, () => {
      syncSession()
      currentUser.value = null
      sessionStatus.value = 'guest'
    })
    isListeningSessionChanges = true
  }

  function loadSession() {
    syncSession()
    listenSessionChanges()
  }

  function setPendingPhone(phone: string) {
    pendingPhone.value = phone
    savePendingPhone(phone)
  }

  function completeLogin() {
    clearStoredAuthArtifacts()
    clearPendingPhone()
    pendingPhone.value = ''
  }

  function clearSession() {
    currentUser.value = null
    pendingPhone.value = ''
    errorMessage.value = ''
    driverPhoneVerified.value = null
    sessionStatus.value = 'guest'
    clearTokenPair()
    clearPendingPhone()
  }

  async function restoreSession(options: { force?: boolean, preferredRole?: AuthRole } = {}) {
    syncSession()
    listenSessionChanges()

    if (!options.force && sessionStatus.value !== 'unknown')
      return currentUser.value

    try {
      const session = normalizeSession(await getAuthSession(), options.preferredRole)
      currentUser.value = session
      sessionStatus.value = session ? 'authenticated' : 'guest'
      return session
    }
    catch (error) {
      currentUser.value = null
      sessionStatus.value = 'guest'

      if (error instanceof ApiError && (error.status === 0 || error.status === 401))
        return null

      throw error
    }
  }

  function getDeviceFingerprint() {
    const existing = readDeviceFingerprint()

    if (existing)
      return existing

    const fingerprint = crypto.randomUUID()
    saveDeviceFingerprint(fingerprint)
    return fingerprint
  }

  async function requestPassengerOtp(phone: string) {
    isLoading.value = true
    errorMessage.value = ''

    try {
      await sendOtp({ phone })
      setPendingPhone(phone)
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось отправить код. Попробуйте еще раз.')
      throw error
    }
    finally {
      isLoading.value = false
    }
  }

  async function confirmPassengerOtp(code: string) {
    if (!pendingPhone.value)
      throw new Error('Missing pending phone')

    isLoading.value = true
    errorMessage.value = ''

    try {
      await verifyOtp({
        phone: pendingPhone.value,
        code,
        deviceFingerprint: getDeviceFingerprint(),
      })

      driverPhoneVerified.value = null
      completeLogin()
      await restoreSession({ force: true, preferredRole: 'passenger' })
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось подтвердить код. Попробуйте еще раз.')
      throw error
    }
    finally {
      isLoading.value = false
    }
  }

  async function signInPassengerWithTelegram(initData: string) {
    isLoading.value = true
    errorMessage.value = ''

    try {
      await telegramPassengerAuth({
        initData,
        deviceFingerprint: getDeviceFingerprint(),
      })

      driverPhoneVerified.value = null
      completeLogin()
      await restoreSession({ force: true, preferredRole: 'passenger' })
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось войти через Telegram.')
      throw error
    }
    finally {
      isLoading.value = false
    }
  }

  async function signInDriverWithTelegram(initData: string) {
    isLoading.value = true
    errorMessage.value = ''

    try {
      const response = await telegramDriverAuth({
        initData,
        deviceFingerprint: getDeviceFingerprint(),
      })

      driverPhoneVerified.value = response.phone_verified
      completeLogin()
      await restoreSession({ force: true, preferredRole: 'driver' })
      return response
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось войти как водитель через Telegram.')
      throw error
    }
    finally {
      isLoading.value = false
    }
  }

  async function logout() {
    isLoading.value = true
    errorMessage.value = ''

    try {
      await logoutRequest()
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось завершить сессию на сервере.')
    }
    finally {
      clearSession()
      isLoading.value = false
    }
  }

  return {
    clearSession,
    confirmPassengerOtp,
    currentUser,
    driverPhoneVerified,
    errorMessage,
    getDeviceFingerprint,
    isAuthenticated,
    isLoading,
    loadSession,
    logout,
    pendingPhone,
    requestPassengerOtp,
    restoreSession,
    role,
    setPendingPhone,
    sessionStatus,
    signInDriverWithTelegram,
    signInPassengerWithTelegram,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore as any, import.meta.hot))
