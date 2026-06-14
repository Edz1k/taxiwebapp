import type { Trip } from '~/types/trips'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getActiveDriverTrip } from '~/api/driver'
import { getActiveTrip } from '~/api/trips'
import { useDriverStore } from '~/stores/driver'
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

vi.mock('~/api/driver', () => ({
  acceptDriverParkInvite: vi.fn(),
  acceptDriverTrip: vi.fn(),
  addDriverVehicle: vi.fn(),
  cancelDriverTrip: vi.fn(),
  completeDriverTrip: vi.fn(),
  createDriverProfile: vi.fn(),
  getActiveDriverTrip: vi.fn(),
  getDriverEarnings: vi.fn(),
  markDriverArrived: vi.fn(),
  rejectDriverTrip: vi.fn(),
  sendDriverPhoneOtp: vi.fn(),
  startDriverTrip: vi.fn(),
  updateDriverStatus: vi.fn(),
  verifyDriverPhone: vi.fn(),
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
  status: 'driver_assigned',
  surge_multiplier: 1,
}

describe('active trip restore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('restores passenger active trip and route draft', async () => {
    vi.mocked(getActiveTrip).mockResolvedValue(activeTrip)

    const trips = useTripsStore()
    const restored = await trips.restoreActiveTrip()

    expect(restored).toEqual(activeTrip)
    expect(trips.activeTrip?.id).toBe(activeTrip.id)
    expect(trips.pickup).toBe(activeTrip.pickup_address)
    expect(trips.destination).toBe(activeTrip.dropoff_address)
    expect(trips.tripFlowState).toBe('driver_assigned')
  })

  it('restores driver active trip into step and map offer state', async () => {
    vi.mocked(getActiveDriverTrip).mockResolvedValue(activeTrip)

    const driver = useDriverStore()
    const restored = await driver.restoreActiveTrip()

    expect(restored).toEqual(activeTrip)
    expect(driver.currentTripId).toBe(activeTrip.id)
    expect(driver.activeTripStep).toBe('to_pickup')
    expect(driver.activeOffer?.pickup_address).toBe(activeTrip.pickup_address)
  })

  it('clears driver active trip on terminal status', () => {
    const driver = useDriverStore()

    driver.applyTripStatus(activeTrip.id, 'driver_assigned')
    driver.applyTripStatus(activeTrip.id, 'completed')

    expect(driver.currentTripId).toBe('')
    expect(driver.activeTrip).toBeNull()
    expect(driver.activeTripStep).toBeNull()
  })
})
