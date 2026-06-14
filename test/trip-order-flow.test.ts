import type { EstimateTripPayload } from '~/types/trips'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { createTrip, estimateTrip } from '~/api/trips'
import { useTripOrderFlow } from '~/composables/passenger/useTripOrderFlow'
import { useTripsStore } from '~/stores/trips'

vi.mock('~/api/errors', () => ({
  getUserErrorMessage: vi.fn((_error, fallback: string) => fallback),
  showErrorToast: vi.fn((_error, fallback: string) => fallback),
}))

vi.mock('~/api/trips', () => ({
  cancelTrip: vi.fn(),
  createTrip: vi.fn(),
  estimateTrip: vi.fn(),
  getActiveTrip: vi.fn(),
  getTrip: vi.fn(),
  getTripHistory: vi.fn(),
  rateTrip: vi.fn(),
}))

vi.mock('~/composables/passenger/useRoutePlanner', () => ({
  useRoutePlanner: (options: any) => ({
    isResolvingRoute: { value: false },
    resolveRoute: vi.fn(async () => {
      const pickup = {
        address: 'Уточненная точка А',
        id: 'pickup',
        lat: 43.23,
        lng: 76.9,
        name: 'Уточненная точка А',
      }
      const destination = {
        address: 'Уточненная точка Б',
        id: 'destination',
        lat: 43.25,
        lng: 76.95,
        name: 'Уточненная точка Б',
      }
      const route = {
        distance_km: 5.2,
        duration_min: 14,
        geometry: [[76.9, 43.23], [76.95, 43.25]],
      }

      options.pickup.value = pickup.address
      options.destination.value = destination.address
      options.pickupPlace.value = pickup
      options.destinationPlace.value = destination
      options.onRouteGeometry(route.geometry)

      return { destination, pickup, route }
    }),
  }),
}))

describe('trip order flow', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.mocked(estimateTrip).mockImplementation(async (payload: EstimateTripPayload) => ({
      category: payload.category,
      distance_km: payload.distance_km,
      duration_min: payload.duration_min,
      estimated_fare: 1800,
      surge_multiplier: 1,
    }))
    vi.mocked(createTrip).mockResolvedValue({
      category: 'economy',
      distance_km: 5.2,
      dropoff_address: 'Уточненная точка Б',
      dropoff_lat: 43.25,
      dropoff_lng: 76.95,
      duration_min: 14,
      estimated_fare: 1800,
      id: 'new-trip-id',
      pickup_address: 'Уточненная точка А',
      pickup_lat: 43.23,
      pickup_lng: 76.9,
      status: 'searching',
      surge_multiplier: 1,
    })
  })

  it('keeps tariffs visible when route resolution normalizes address fields', async () => {
    const pickup = ref('Точка А')
    const destination = ref('Точка Б')
    const pickupPlace = ref(null)
    const destinationPlace = ref(null)
    const trips = useTripsStore()

    const flow = useTripOrderFlow({
      clearDestinationSuggestions: vi.fn(),
      clearPickupSuggestions: vi.fn(),
      destination,
      destinationPlace,
      pickup,
      pickupPlace,
    })

    await flow.submitTrip()
    await nextTick()

    expect(estimateTrip).toHaveBeenCalledTimes(4)
    expect(trips.tariffEstimates).toHaveLength(4)
    expect(flow.isTariffsVisible.value).toBe(true)
    expect(trips.tripFlowState).toBe('tariffs')
  })

  it('requires fresh tariffs before ordering after the previous trip finished', async () => {
    const pickup = ref('Точка А')
    const destination = ref('Точка Б')
    const pickupPlace = ref(null)
    const destinationPlace = ref(null)
    const trips = useTripsStore()
    trips.activeTrip = {
      category: 'economy',
      distance_km: 5.2,
      dropoff_address: 'Точка Б',
      dropoff_lat: 43.25,
      dropoff_lng: 76.95,
      duration_min: 14,
      estimated_fare: 1800,
      id: 'finished-trip-id',
      pickup_address: 'Точка А',
      pickup_lat: 43.23,
      pickup_lng: 76.9,
      status: 'in_progress',
      surge_multiplier: 1,
    }
    trips.tariffEstimates = [{
      category: 'economy',
      distance_km: 5.2,
      duration_min: 14,
      estimated_fare: 1800,
      surge_multiplier: 1,
    }]

    const flow = useTripOrderFlow({
      clearDestinationSuggestions: vi.fn(),
      clearPickupSuggestions: vi.fn(),
      destination,
      destinationPlace,
      pickup,
      pickupPlace,
    })

    trips.applyTripStatus('finished-trip-id', 'completed')

    expect(trips.activeTrip).toBeNull()
    expect(trips.tariffEstimates).toEqual([])
    expect(flow.primaryText.value).toBe('Показать цены')

    await flow.submitTrip()
    await nextTick()

    expect(estimateTrip).toHaveBeenCalledTimes(4)
    expect(createTrip).not.toHaveBeenCalled()
    expect(flow.isTariffsVisible.value).toBe(true)

    await flow.submitTrip()

    expect(createTrip).toHaveBeenCalledTimes(1)
  })
})
