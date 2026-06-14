import type { GeoPlace, RouteCoordinate } from '~/types/geocoding'
import type { CreateTripPayload, EstimateTripPayload, EstimateTripResponse, Trip, TripFlowState, VehicleCategory } from '~/types/trips'
import type { PassengerDriverLocation } from '~/types/websocket'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { getUserErrorMessage, showErrorToast } from '~/api/errors'
import { cancelTrip, createTrip, estimateTrip, getActiveTrip, getTrip, getTripHistory, rateTrip } from '~/api/trips'

const TARIFF_CATEGORIES: VehicleCategory[] = ['economy', 'comfort', 'business', 'minivan']
const TERMINAL_TRIP_STATUSES = ['cancelled', 'completed'] as const

export const useTripsStore = defineStore('trips', () => {
  const estimate = ref<EstimateTripResponse | null>(null)
  const tariffEstimates = ref<EstimateTripResponse[]>([])
  const selectedCategory = ref<VehicleCategory>('economy')
  const history = ref<Trip[]>([])
  const historyHasMore = ref(true)
  const historyOffset = ref(0)
  const activeTrip = ref<Trip | null>(null)
  const driverLocation = ref<PassengerDriverLocation | null>(null)
  const routeCoordinates = ref<RouteCoordinate[]>([])
  const isEstimating = ref(false)
  const isCreating = ref(false)
  const isCancelling = ref(false)
  const isRating = ref(false)
  const isLoadingHistory = ref(false)
  const isRestoringActiveTrip = ref(false)
  const isPollingActiveTrip = ref(false)
  const searchStartedAt = ref<number | null>(null)
  const searchElapsedSeconds = ref(0)
  const errorMessage = ref('')

  const pickup = ref('')
  const destination = ref('')
  const pickupPlace = ref<GeoPlace | null>(null)
  const destinationPlace = ref<GeoPlace | null>(null)

  let searchTimer: number | undefined
  let activeTripPollingTimer: number | undefined

  const hasActiveTrip = computed(() => Boolean(activeTrip.value && !isTerminalTripStatus(activeTrip.value.status)))
  const tripFlowState = computed<TripFlowState>(() => {
    if (activeTrip.value) {
      if (activeTrip.value.status === 'cancelled' || activeTrip.value.status === 'completed')
        return 'finished'

      return activeTrip.value.status
    }

    if (tariffEstimates.value.length)
      return 'tariffs'

    if (routeCoordinates.value.length >= 2 && pickup.value && destination.value)
      return 'route_ready'

    return 'idle'
  })

  function isTerminalTripStatus(status: Trip['status']) {
    return TERMINAL_TRIP_STATUSES.includes(status as typeof TERMINAL_TRIP_STATUSES[number])
  }

  function stopSearchTimer() {
    if (!searchTimer)
      return

    window.clearInterval(searchTimer)
    searchTimer = undefined
  }

  function stopActiveTripPolling() {
    if (!activeTripPollingTimer)
      return

    window.clearInterval(activeTripPollingTimer)
    activeTripPollingTimer = undefined
    isPollingActiveTrip.value = false
  }

  function tripPlace(trip: Trip, type: 'destination' | 'pickup'): GeoPlace {
    const lat = type === 'pickup' ? trip.pickup_lat : trip.dropoff_lat
    const lng = type === 'pickup' ? trip.pickup_lng : trip.dropoff_lng
    const address = type === 'pickup' ? trip.pickup_address : trip.dropoff_address

    return {
      address,
      id: `${type}:${trip.id}`,
      lat,
      lng,
      name: address,
    }
  }

  function syncRouteDraftFromTrip(trip: Trip) {
    pickupPlace.value = tripPlace(trip, 'pickup')
    destinationPlace.value = tripPlace(trip, 'destination')
    pickup.value = trip.pickup_address
    destination.value = trip.dropoff_address
  }

  function finishActiveTrip(trip: Trip) {
    history.value = [trip, ...history.value.filter(item => item.id !== trip.id)]
    syncRouteDraftFromTrip(trip)
    clearEstimate()
    resetActiveTrip()
  }

  function syncActiveTrip(trip: Trip) {
    if (isTerminalTripStatus(trip.status)) {
      finishActiveTrip(trip)
      return
    }

    activeTrip.value = trip
    history.value = [trip, ...history.value.filter(item => item.id !== trip.id)]
    syncRouteDraftFromTrip(trip)

    if (trip.status !== 'searching')
      stopSearchTimer()
  }

  function applyTripStatus(tripId: string, status: Trip['status']) {
    if (!activeTrip.value || activeTrip.value.id !== tripId)
      return

    const nextTrip = {
      ...activeTrip.value,
      status,
    }

    if (isTerminalTripStatus(status)) {
      finishActiveTrip(nextTrip)
      return
    }

    activeTrip.value = nextTrip

    if (status !== 'searching')
      stopSearchTimer()
  }

  function setDriverLocation(location: PassengerDriverLocation) {
    driverLocation.value = location
  }

  async function refreshActiveTrip() {
    if (!activeTrip.value)
      return null

    try {
      const trip = await getTrip(activeTrip.value.id)
      syncActiveTrip(trip)
      return trip
    }
    catch (error) {
      errorMessage.value = getUserErrorMessage(error, 'Не удалось обновить статус поездки.')
      throw error
    }
  }

  function startActiveTripPolling() {
    if (typeof window === 'undefined' || !activeTrip.value || activeTripPollingTimer)
      return

    isPollingActiveTrip.value = true
    activeTripPollingTimer = window.setInterval(() => {
      if (!activeTrip.value || isTerminalTripStatus(activeTrip.value.status)) {
        stopActiveTripPolling()
        return
      }

      refreshActiveTrip().catch(() => {})
    }, 3_000)
  }

  function startSearchTimer(startedAt = Date.now()) {
    if (typeof window === 'undefined')
      return

    stopSearchTimer()
    searchStartedAt.value = startedAt
    searchElapsedSeconds.value = Math.max(0, Math.floor((Date.now() - startedAt) / 1000))

    searchTimer = window.setInterval(() => {
      if (!searchStartedAt.value)
        return

      searchElapsedSeconds.value = Math.floor((Date.now() - searchStartedAt.value) / 1000)
    }, 1000)
  }

  function resumeActiveTripEffects(trip: Trip) {
    if (isTerminalTripStatus(trip.status)) {
      stopSearchTimer()
      stopActiveTripPolling()
      return
    }

    if (trip.status === 'searching') {
      const startedAt = trip.created_at ? new Date(trip.created_at).getTime() : Date.now()
      startSearchTimer(Number.isFinite(startedAt) ? startedAt : Date.now())
    }
    else {
      stopSearchTimer()
    }

    startActiveTripPolling()
  }

  async function restoreActiveTrip() {
    isRestoringActiveTrip.value = true
    errorMessage.value = ''

    try {
      const trip = await getActiveTrip()

      if (!trip) {
        resetActiveTrip()
        return null
      }

      syncActiveTrip(trip)
      resumeActiveTripEffects(trip)
      return trip
    }
    catch (error) {
      errorMessage.value = getUserErrorMessage(error, 'Не удалось восстановить активную поездку.')
      throw error
    }
    finally {
      isRestoringActiveTrip.value = false
    }
  }

  async function estimatePrice(payload: EstimateTripPayload) {
    isEstimating.value = true
    errorMessage.value = ''

    try {
      estimate.value = await estimateTrip(payload)
      return estimate.value
    }
    catch (error) {
      estimate.value = null
      errorMessage.value = showErrorToast(error, 'Не удалось рассчитать стоимость.')
      throw error
    }
    finally {
      isEstimating.value = false
    }
  }

  async function estimateTariffs(payload: Omit<EstimateTripPayload, 'category'>) {
    isEstimating.value = true
    errorMessage.value = ''

    try {
      const estimates = await Promise.all(
        TARIFF_CATEGORIES.map(category => estimateTrip({
          ...payload,
          category,
        })),
      )

      tariffEstimates.value = estimates
      estimate.value = estimates.find(item => item.category === selectedCategory.value) ?? estimates[0] ?? null

      if (estimate.value)
        selectedCategory.value = estimate.value.category

      return estimates
    }
    catch (error) {
      estimate.value = null
      tariffEstimates.value = []
      errorMessage.value = showErrorToast(error, 'Не удалось рассчитать тарифы.')
      throw error
    }
    finally {
      isEstimating.value = false
    }
  }

  function selectCategory(category: VehicleCategory) {
    selectedCategory.value = category
    estimate.value = tariffEstimates.value.find(item => item.category === category) ?? null
  }

  function setRouteCoordinates(coordinates: RouteCoordinate[]) {
    routeCoordinates.value = coordinates
  }

  function setPickupPlace(place: GeoPlace | null) {
    pickupPlace.value = place

    pickup.value = place?.address ?? ''

    clearEstimate()
  }

  function setDestinationPlace(place: GeoPlace | null) {
    destinationPlace.value = place

    destination.value = place?.address ?? ''

    clearEstimate()
  }

  function setPickup(value: string) {
    pickup.value = value

    if (!value)
      pickupPlace.value = null
  }

  function setDestination(value: string) {
    destination.value = value

    if (!value)
      destinationPlace.value = null
  }

  function setPlaceFromPicker(place: GeoPlace, mode: 'pickup' | 'destination') {
    if (mode === 'pickup') {
      setPickupPlace(place)
    }
    else {
      setDestinationPlace(place)
    }
  }

  async function orderTrip(payload: CreateTripPayload) {
    isCreating.value = true
    errorMessage.value = ''

    try {
      syncActiveTrip(await createTrip(payload))
      startSearchTimer()
      startActiveTripPolling()
      return activeTrip.value
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось создать поездку.')
      throw error
    }
    finally {
      isCreating.value = false
    }
  }

  async function cancelActiveTrip() {
    if (!activeTrip.value)
      return

    isCancelling.value = true
    errorMessage.value = ''

    try {
      await cancelTrip(activeTrip.value.id)
      finishActiveTrip({
        ...activeTrip.value,
        status: 'cancelled',
      })
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось отменить поездку.')
      throw error
    }
    finally {
      isCancelling.value = false
    }
  }

  async function loadHistory(limit = 20, offset = 0, options: { append?: boolean } = {}) {
    if (isLoadingHistory.value)
      return

    isLoadingHistory.value = true
    errorMessage.value = ''

    try {
      const response = await getTripHistory(limit, offset)
      const trips = options.append
        ? [
            ...history.value,
            ...response.trips.filter(trip => !history.value.some(existingTrip => existingTrip.id === trip.id)),
          ]
        : response.trips

      history.value = trips
      historyOffset.value = response.offset + response.trips.length
      historyHasMore.value = response.trips.length >= response.limit

      return response
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось загрузить историю поездок.')
      throw error
    }
    finally {
      isLoadingHistory.value = false
    }
  }

  async function loadMoreHistory(limit = 20) {
    if (!historyHasMore.value || isLoadingHistory.value)
      return

    return loadHistory(limit, historyOffset.value, {
      append: true,
    })
  }

  async function submitRating(tripId: string, score: number, comment = '') {
    isRating.value = true
    errorMessage.value = ''

    try {
      const response = await rateTrip(tripId, { comment, score })
      return response
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось отправить оценку.')
      throw error
    }
    finally {
      isRating.value = false
    }
  }

  function resetHistory() {
    history.value = []
    historyHasMore.value = true
    historyOffset.value = 0
  }

  function clearEstimate() {
    estimate.value = null
    tariffEstimates.value = []
    selectedCategory.value = 'economy'
    routeCoordinates.value = []
  }

  function resetActiveTrip() {
    activeTrip.value = null
    driverLocation.value = null
    searchStartedAt.value = null
    searchElapsedSeconds.value = 0
    stopSearchTimer()
    stopActiveTripPolling()
  }

  return {
    activeTrip,
    applyTripStatus,
    cancelActiveTrip,
    clearEstimate,
    errorMessage,
    estimate,
    estimatePrice,
    estimateTariffs,
    hasActiveTrip,
    history,
    historyHasMore,
    historyOffset,
    isCancelling,
    isCreating,
    isEstimating,
    isLoadingHistory,
    isPollingActiveTrip,
    isRating,
    isRestoringActiveTrip,
    loadHistory,
    loadMoreHistory,
    orderTrip,
    refreshActiveTrip,
    restoreActiveTrip,
    resetActiveTrip,
    resetHistory,
    routeCoordinates,
    searchElapsedSeconds,
    searchStartedAt,
    selectCategory,
    selectedCategory,
    setRouteCoordinates,
    tariffEstimates,
    tripFlowState,
    pickup,
    destination,
    driverLocation,
    pickupPlace,
    destinationPlace,
    setPickup,
    setDestination,
    setPickupPlace,
    setDestinationPlace,
    setDriverLocation,
    setPlaceFromPicker,
    startActiveTripPolling,
    stopActiveTripPolling,
    submitRating,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useTripsStore as any, import.meta.hot))
