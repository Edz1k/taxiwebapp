import type { Trip } from '~/types/trips'
import type { DriverTripOffer } from '~/types/websocket'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  acceptDriverTrip,
  completeDriverTrip,
  getActiveDriverTrip,
  markDriverArrived,
  startDriverTrip,
  updateDriverStatus,
} from '~/api/driver'
import { useDriverStore } from '~/stores/driver'

vi.mock('~/api/errors', () => ({
  showErrorToast: vi.fn((_error, fallback: string) => fallback),
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
  category: 'comfort',
  distance_km: 7.1,
  driver_id: 'driver-id',
  dropoff_address: 'Точка Б',
  dropoff_lat: 43.25,
  dropoff_lng: 76.95,
  duration_min: 18,
  estimated_fare: 2400,
  id: 'trip-id',
  passenger_id: 'passenger-id',
  pickup_address: 'Точка А',
  pickup_lat: 43.23,
  pickup_lng: 76.9,
  status: 'driver_assigned',
  surge_multiplier: 1,
}

const offer: DriverTripOffer = {
  category: activeTrip.category,
  distance_km: activeTrip.distance_km,
  dropoff_address: activeTrip.dropoff_address,
  dropoff_lat: activeTrip.dropoff_lat,
  dropoff_lng: activeTrip.dropoff_lng,
  estimated_fare: activeTrip.estimated_fare,
  pickup_address: activeTrip.pickup_address,
  pickup_lat: activeTrip.pickup_lat,
  pickup_lng: activeTrip.pickup_lng,
  timeout_sec: 20,
  trip_id: activeTrip.id,
}

describe('driver store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('accepts an offer and hydrates active trip from backend truth', async () => {
    vi.mocked(acceptDriverTrip).mockResolvedValue({ message: 'accepted' })
    vi.mocked(getActiveDriverTrip).mockResolvedValue(activeTrip)
    const driver = useDriverStore()

    driver.receiveOffer(offer)
    await driver.acceptOffer()

    expect(acceptDriverTrip).toHaveBeenCalledWith(activeTrip.id)
    expect(driver.pendingOffer).toBeNull()
    expect(driver.currentTripId).toBe(activeTrip.id)
    expect(driver.activeTrip?.id).toBe(activeTrip.id)
    expect(driver.activeTripStep).toBe('to_pickup')
    expect(driver.activeOffer?.dropoff_address).toBe(activeTrip.dropoff_address)
  })

  it('keeps driver trip action steps in sync with refreshed backend status', async () => {
    vi.mocked(markDriverArrived).mockResolvedValue({ message: 'arrived' })
    vi.mocked(startDriverTrip).mockResolvedValue({ message: 'started' })
    vi.mocked(getActiveDriverTrip)
      .mockResolvedValueOnce({ ...activeTrip, status: 'driver_arriving' })
      .mockResolvedValueOnce({ ...activeTrip, status: 'in_progress' })
    const driver = useDriverStore()

    driver.applyTripStatus(activeTrip.id, 'driver_assigned')

    await driver.markArrived()
    expect(markDriverArrived).toHaveBeenCalledWith(activeTrip.id)
    expect(driver.activeTripStep).toBe('arrived')

    await driver.startTrip()
    expect(startDriverTrip).toHaveBeenCalledWith(activeTrip.id)
    expect(driver.activeTripStep).toBe('in_progress')
  })

  it('ignores status updates for another trip and clears on terminal status', () => {
    const driver = useDriverStore()
    driver.applyTripStatus(activeTrip.id, 'driver_assigned')

    driver.applyTripStatus('another-trip-id', 'completed')
    expect(driver.currentTripId).toBe(activeTrip.id)
    expect(driver.activeTripStep).toBe('to_pickup')

    driver.applyTripStatus(activeTrip.id, 'completed')
    expect(driver.currentTripId).toBe('')
    expect(driver.activeTrip).toBeNull()
    expect(driver.activeTripStep).toBeNull()
  })

  it('clears active state after completing a trip action', async () => {
    vi.mocked(completeDriverTrip).mockResolvedValue({ message: 'completed' })
    const driver = useDriverStore()
    driver.applyTripStatus(activeTrip.id, 'in_progress')

    await driver.completeTrip()

    expect(completeDriverTrip).toHaveBeenCalledWith(activeTrip.id)
    expect(driver.currentTripId).toBe('')
    expect(driver.activeTrip).toBeNull()
    expect(driver.activeTripStep).toBeNull()
  })

  it('applies online status to both top-level flags and loaded profile', async () => {
    vi.mocked(updateDriverStatus).mockResolvedValue({
      is_available: true,
      is_online: true,
    })
    const driver = useDriverStore()
    driver.profile = {
      id: 'driver-profile-id',
      is_available: false,
      is_online: false,
      rating: 5,
      total_trips: 0,
      user_id: 'user-id',
    }

    await driver.setOnline(true)

    expect(driver.isOnline).toBe(true)
    expect(driver.isAvailable).toBe(true)
    expect(driver.profile?.is_online).toBe(true)
    expect(driver.profile?.is_available).toBe(true)
  })
})
