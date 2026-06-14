import type {
  DriverEarnings,
  DriverPhoneResponse,
  DriverProfile,
  DriverStatusResponse,
  DriverVehicle,
  DriverVehiclePayload,
} from '~/types/driver'
import type { Trip } from '~/types/trips'
import type { DriverTripOffer } from '~/types/websocket'
import { acceptHMRUpdate, defineStore } from 'pinia'
import {
  acceptDriverParkInvite,
  acceptDriverTrip,
  addDriverVehicle,
  cancelDriverTrip,
  completeDriverTrip,
  createDriverProfile,
  getActiveDriverTrip,
  getDriverEarnings,
  markDriverArrived,
  rejectDriverTrip,
  sendDriverPhoneOtp,
  startDriverTrip,
  updateDriverStatus,
  verifyDriverPhone,
} from '~/api/driver'
import { showErrorToast } from '~/api/errors'

type DriverTripStep = 'arrived' | 'in_progress' | 'to_pickup'
const TERMINAL_TRIP_STATUSES = ['cancelled', 'completed'] as const

export const useDriverStore = defineStore('driver', () => {
  const profile = ref<DriverProfile | null>(null)
  const vehicle = ref<DriverVehicle | null>(null)
  const pendingOffer = ref<DriverTripOffer | null>(null)
  const activeTrip = ref<Trip | null>(null)
  const activeOffer = ref<DriverTripOffer | null>(null)
  const activeTripStep = ref<DriverTripStep | null>(null)
  const currentTripId = ref('')
  const earnings = ref<DriverEarnings | null>(null)
  const isOnline = ref(false)
  const isAvailable = ref(false)
  const pendingPhone = ref('')
  const isLoading = ref(false)
  const isLoadingEarnings = ref(false)
  const isRestoringActiveTrip = ref(false)
  const isChangingStatus = ref(false)
  const errorMessage = ref('')

  const hasVehicle = computed(() => Boolean(vehicle.value))
  const hasActiveTrip = computed(() => Boolean(currentTripId.value))

  function isTerminalTripStatus(status: Trip['status']) {
    return TERMINAL_TRIP_STATUSES.includes(status as typeof TERMINAL_TRIP_STATUSES[number])
  }

  function tripStatusToStep(status: Trip['status']): DriverTripStep | null {
    if (status === 'driver_assigned')
      return 'to_pickup'

    if (status === 'driver_arriving')
      return 'arrived'

    if (status === 'in_progress')
      return 'in_progress'

    return null
  }

  function tripToOffer(trip: Trip): DriverTripOffer {
    return {
      category: trip.category,
      distance_km: trip.distance_km,
      dropoff_address: trip.dropoff_address,
      dropoff_lat: trip.dropoff_lat,
      dropoff_lng: trip.dropoff_lng,
      estimated_fare: trip.final_fare ?? trip.estimated_fare,
      pickup_address: trip.pickup_address,
      pickup_lat: trip.pickup_lat,
      pickup_lng: trip.pickup_lng,
      timeout_sec: 0,
      trip_id: trip.id,
    }
  }

  function clearActiveTripState() {
    activeTrip.value = null
    activeOffer.value = null
    activeTripStep.value = null
    currentTripId.value = ''
  }

  function syncActiveTrip(trip: Trip) {
    activeTrip.value = trip
    activeOffer.value = tripToOffer(trip)
    activeTripStep.value = tripStatusToStep(trip.status)
    currentTripId.value = trip.id

    if (pendingOffer.value?.trip_id === trip.id)
      clearOffer()
  }

  function applyStatus(status: DriverStatusResponse) {
    isOnline.value = status.is_online
    isAvailable.value = status.is_available

    if (profile.value) {
      profile.value = {
        ...profile.value,
        is_available: status.is_available,
        is_online: status.is_online,
      }
    }
  }

  async function ensureProfile() {
    if (profile.value)
      return profile.value

    isLoading.value = true
    errorMessage.value = ''

    try {
      profile.value = await createDriverProfile()
      isOnline.value = profile.value.is_online
      isAvailable.value = profile.value.is_available
      return profile.value
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось создать профиль водителя.')
      throw error
    }
    finally {
      isLoading.value = false
    }
  }

  async function requestPhoneOtp(phone: string) {
    isLoading.value = true
    errorMessage.value = ''

    try {
      const response = await sendDriverPhoneOtp({ phone })
      pendingPhone.value = response.phone
      return response
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось отправить код.')
      throw error
    }
    finally {
      isLoading.value = false
    }
  }

  async function confirmPhone(code: string): Promise<DriverPhoneResponse> {
    if (!pendingPhone.value)
      throw new Error('Missing pending driver phone')

    isLoading.value = true
    errorMessage.value = ''

    try {
      return await verifyDriverPhone({
        code,
        phone: pendingPhone.value,
      })
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось подтвердить телефон.')
      throw error
    }
    finally {
      isLoading.value = false
    }
  }

  async function saveVehicle(payload: DriverVehiclePayload) {
    isLoading.value = true
    errorMessage.value = ''

    try {
      vehicle.value = await addDriverVehicle(payload)
      return vehicle.value
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось добавить автомобиль.')
      throw error
    }
    finally {
      isLoading.value = false
    }
  }

  async function setOnline(nextOnline: boolean) {
    isChangingStatus.value = true
    errorMessage.value = ''

    try {
      const status = await updateDriverStatus({ is_online: nextOnline })
      applyStatus(status)
      return status
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось изменить статус.')
      throw error
    }
    finally {
      isChangingStatus.value = false
    }
  }

  function receiveOffer(offer: DriverTripOffer) {
    pendingOffer.value = offer
  }

  function clearOffer() {
    pendingOffer.value = null
  }

  async function acceptOffer() {
    if (!pendingOffer.value)
      return

    isLoading.value = true
    errorMessage.value = ''

    try {
      await acceptDriverTrip(pendingOffer.value.trip_id)
      activeOffer.value = pendingOffer.value
      activeTripStep.value = 'to_pickup'
      currentTripId.value = pendingOffer.value.trip_id
      clearOffer()
      await refreshActiveTrip().catch(() => {})
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось принять заказ.')
      throw error
    }
    finally {
      isLoading.value = false
    }
  }

  async function rejectOffer() {
    if (!pendingOffer.value)
      return

    isLoading.value = true
    errorMessage.value = ''

    try {
      await rejectDriverTrip(pendingOffer.value.trip_id)
      clearOffer()
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось отклонить заказ.')
      throw error
    }
    finally {
      isLoading.value = false
    }
  }

  async function markArrived() {
    if (!currentTripId.value)
      return

    try {
      await markDriverArrived(currentTripId.value)
      applyTripStatus(currentTripId.value, 'driver_arriving')
      await refreshActiveTrip().catch(() => {})
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось отметить прибытие.')
      throw error
    }
  }

  async function startTrip() {
    if (!currentTripId.value)
      return

    try {
      await startDriverTrip(currentTripId.value)
      applyTripStatus(currentTripId.value, 'in_progress')
      await refreshActiveTrip().catch(() => {})
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось начать поездку.')
      throw error
    }
  }

  async function completeTrip() {
    if (!currentTripId.value)
      return

    try {
      await completeDriverTrip(currentTripId.value)
      clearActiveTripState()
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось завершить поездку.')
      throw error
    }
  }

  async function cancelTrip() {
    if (!currentTripId.value)
      return

    try {
      await cancelDriverTrip(currentTripId.value)
      clearActiveTripState()
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось отменить поездку.')
      throw error
    }
  }

  async function loadEarnings() {
    isLoadingEarnings.value = true
    errorMessage.value = ''

    try {
      earnings.value = await getDriverEarnings()
      return earnings.value
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось загрузить заработок.')
      throw error
    }
    finally {
      isLoadingEarnings.value = false
    }
  }

  function applyTripStatus(tripId: string, status: Trip['status']) {
    if (currentTripId.value && currentTripId.value !== tripId)
      return

    if (isTerminalTripStatus(status)) {
      clearActiveTripState()
      return
    }

    currentTripId.value = tripId
    activeTripStep.value = tripStatusToStep(status)

    if (activeTrip.value && activeTrip.value.id === tripId) {
      activeTrip.value = {
        ...activeTrip.value,
        status,
      }
      activeOffer.value = tripToOffer(activeTrip.value)
    }
  }

  async function refreshActiveTrip() {
    if (!currentTripId.value)
      return null

    try {
      const trip = await getActiveDriverTrip()

      if (!trip) {
        clearActiveTripState()
        return null
      }

      syncActiveTrip(trip)
      return trip
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось обновить активную поездку.')
      throw error
    }
  }

  async function restoreActiveTrip() {
    isRestoringActiveTrip.value = true
    errorMessage.value = ''

    try {
      const trip = await getActiveDriverTrip()

      if (!trip) {
        clearActiveTripState()
        return null
      }

      syncActiveTrip(trip)
      return trip
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось восстановить активную поездку.')
      throw error
    }
    finally {
      isRestoringActiveTrip.value = false
    }
  }

  async function acceptParkInvite(token: string) {
    isLoading.value = true
    errorMessage.value = ''

    try {
      return await acceptDriverParkInvite(token)
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось принять приглашение таксопарка.')
      throw error
    }
    finally {
      isLoading.value = false
    }
  }

  function clearDriverState() {
    profile.value = null
    vehicle.value = null
    pendingOffer.value = null
    clearActiveTripState()
    earnings.value = null
    isOnline.value = false
    isAvailable.value = false
    pendingPhone.value = ''
    errorMessage.value = ''
  }

  return {
    activeOffer,
    activeTrip,
    activeTripStep,
    acceptParkInvite,
    acceptOffer,
    applyTripStatus,
    cancelTrip,
    clearDriverState,
    clearOffer,
    completeTrip,
    confirmPhone,
    currentTripId,
    ensureProfile,
    errorMessage,
    earnings,
    hasActiveTrip,
    hasVehicle,
    isAvailable,
    isChangingStatus,
    isLoading,
    isLoadingEarnings,
    isRestoringActiveTrip,
    isOnline,
    loadEarnings,
    markArrived,
    pendingOffer,
    pendingPhone,
    profile,
    receiveOffer,
    rejectOffer,
    refreshActiveTrip,
    requestPhoneOtp,
    restoreActiveTrip,
    saveVehicle,
    setOnline,
    startTrip,
    vehicle,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useDriverStore as any, import.meta.hot))
