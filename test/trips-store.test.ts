import type { Trip } from '~/types/trips'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cancelTrip, createTrip, getActiveTrip } from '~/api/trips'
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

const activeTrip: Trip = {
  category: 'economy',
  created_at: '2026-06-11T10:00:00Z',
  distance_km: 5.2,
  driver_id: 'driver-id',
  dropoff_address: 'Точка Б',
  dropoff_lat: 43.25,
  dropoff_lng: 76.95,
  duration_min: 14,
  estimated_fare: 1800,
  id: 'trip-id',
  passenger_id: 'passenger-id',
  pickup_address: 'Точка А',
  pickup_lat: 43.23,
  pickup_lng: 76.9,
  status: 'searching',
  surge_multiplier: 1,
}

function mockBrowserTimers() {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-06-11T10:00:10Z'))
  vi.stubGlobal('window', {
    clearInterval: globalThis.clearInterval,
    setInterval: globalThis.setInterval,
  })
}

describe('trips store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockBrowserTimers()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('restores searching trip with route draft, elapsed timer, and polling', async () => {
    vi.mocked(getActiveTrip).mockResolvedValue(activeTrip)

    const trips = useTripsStore()
    const restored = await trips.restoreActiveTrip()

    expect(restored?.id).toBe(activeTrip.id)
    expect(trips.pickup).toBe(activeTrip.pickup_address)
    expect(trips.destination).toBe(activeTrip.dropoff_address)
    expect(trips.searchElapsedSeconds).toBe(10)
    expect(trips.isPollingActiveTrip).toBe(true)
    expect(trips.tripFlowState).toBe('searching')
  })

  it('turns completed active trip into history and clears active ordering state', () => {
    const trips = useTripsStore()
    trips.activeTrip = activeTrip
    trips.tariffEstimates = [{
      category: 'economy',
      distance_km: 5.2,
      duration_min: 14,
      estimated_fare: 1800,
      surge_multiplier: 1,
    }]
    trips.setDriverLocation({ lat: 43.24, lng: 76.91 })

    trips.applyTripStatus(activeTrip.id, 'completed')

    expect(trips.activeTrip).toBeNull()
    expect(trips.driverLocation).toBeNull()
    expect(trips.tariffEstimates).toEqual([])
    expect(trips.history[0]?.status).toBe('completed')
    expect(trips.pickup).toBe(activeTrip.pickup_address)
    expect(trips.destination).toBe(activeTrip.dropoff_address)
    expect(trips.tripFlowState).toBe('idle')
  })

  it('clears active state after passenger cancellation so a new price quote is required', async () => {
    vi.mocked(cancelTrip).mockResolvedValue({ message: 'cancelled' })
    const trips = useTripsStore()
    trips.activeTrip = activeTrip
    trips.tariffEstimates = [{
      category: 'economy',
      distance_km: 5.2,
      duration_min: 14,
      estimated_fare: 1800,
      surge_multiplier: 1,
    }]

    await trips.cancelActiveTrip()

    expect(cancelTrip).toHaveBeenCalledWith(activeTrip.id)
    expect(trips.activeTrip).toBeNull()
    expect(trips.tariffEstimates).toEqual([])
    expect(trips.history[0]?.status).toBe('cancelled')
    expect(trips.tripFlowState).toBe('idle')
  })

  it('creates a trip and starts the searching lifecycle', async () => {
    vi.mocked(createTrip).mockResolvedValue(activeTrip)
    const trips = useTripsStore()

    const created = await trips.orderTrip({
      category: 'economy',
      distance_km: activeTrip.distance_km,
      dropoff_address: activeTrip.dropoff_address,
      dropoff_lat: activeTrip.dropoff_lat,
      dropoff_lng: activeTrip.dropoff_lng,
      duration_min: activeTrip.duration_min,
      pickup_address: activeTrip.pickup_address,
      pickup_lat: activeTrip.pickup_lat,
      pickup_lng: activeTrip.pickup_lng,
    })

    expect(created?.id).toBe(activeTrip.id)
    expect(trips.hasActiveTrip).toBe(true)
    expect(trips.isPollingActiveTrip).toBe(true)
    expect(trips.tripFlowState).toBe('searching')
  })
})
