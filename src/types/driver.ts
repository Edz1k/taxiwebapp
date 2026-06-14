import type { VehicleCategory } from '~/types/trips'

export interface DriverProfile {
  id: string
  is_available: boolean
  is_online: boolean
  rating: number
  total_trips: number
  user_id: string
}

export interface DriverStatusResponse {
  is_available: boolean
  is_online: boolean
}

export interface DriverStatusPayload {
  is_online: boolean
}

export interface DriverPhonePayload {
  phone: string
}

export interface DriverVerifyPhonePayload extends DriverPhonePayload {
  code: string
}

export interface DriverPhoneResponse {
  message: string
  phone: string
}

export interface DriverVehiclePayload {
  category: VehicleCategory
  color: string
  make: string
  model: string
  plate_number: string
  year: number
}

export interface DriverVehicle extends DriverVehiclePayload {
  driver_id: string
  id: string
}

export interface DriverLocationPayload {
  heading?: number
  lat: number
  lng: number
  speed?: number
}

export interface DriverTripActionResponse {
  message: string
}

export interface DriverEarnings {
  total_earned: number
  trip_count: number
}
