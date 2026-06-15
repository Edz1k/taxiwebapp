import type { AuthRole, AuthSession } from '~/types/auth'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { getAuthSession, logout as logoutRequest, sendOtp, verifyOtp } from '~/api/auth'
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

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<AuthSession | null>(null)
  const pendingPhone = ref('')
  const isLoading = ref(false)
  const errorMessage = ref('')
  const sessionStatus = ref<'authenticated' | 'guest' | 'unknown'>('unknown')

  const isAuthenticated = computed(() => Boolean(currentUser.value))
  const roles = computed<AuthRole[]>(() => currentUser.value?.roles ?? [])
  const homePath = computed(() => isAuthenticated.value ? '/dashboard' : '/')

  function hasRole(role: AuthRole) {
    return roles.value.includes(role)
  }

  function hasAnyRole(requiredRoles: AuthRole[]) {
    return requiredRoles.some(role => hasRole(role))
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
    sessionStatus.value = 'guest'
    clearTokenPair()
    clearPendingPhone()
  }

  async function restoreSession(options: { force?: boolean } = {}) {
    syncSession()
    listenSessionChanges()

    if (!options.force && sessionStatus.value !== 'unknown')
      return currentUser.value

    try {
      currentUser.value = await getAuthSession()
      sessionStatus.value = 'authenticated'
      return currentUser.value
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

  async function requestOtp(phone: string) {
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

  async function confirmOtp(code: string) {
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

      completeLogin()
      await restoreSession({ force: true })
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось подтвердить код. Попробуйте еще раз.')
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
    confirmOtp,
    currentUser,
    errorMessage,
    getDeviceFingerprint,
    hasAnyRole,
    hasRole,
    homePath,
    isAuthenticated,
    isLoading,
    loadSession,
    logout,
    pendingPhone,
    requestOtp,
    restoreSession,
    roles,
    setPendingPhone,
    sessionStatus,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore as any, import.meta.hot))
