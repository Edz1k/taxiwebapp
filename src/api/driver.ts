import type {
  DriverEarnings,
  DriverLocationPayload,
  DriverPhonePayload,
  DriverPhoneResponse,
  DriverProfile,
  DriverStatusPayload,
  DriverStatusResponse,
  DriverTripActionResponse,
  DriverVehicle,
  DriverVehiclePayload,
  DriverVerifyPhonePayload,
} from '~/types/driver'
import type { ActiveTripResponse, Trip } from '~/types/trips'
import { apiRequest } from '~/api/client'
import { acceptParkInvite } from '~/api/park'

export function createDriverProfile() {
  return apiRequest<DriverProfile>('/driver/profile', {
    method: 'POST',
  })
}

export function sendDriverPhoneOtp(payload: DriverPhonePayload) {
  return apiRequest<DriverPhoneResponse>('/driver/profile/phone/send', {
    method: 'POST',
    body: payload,
  })
}

export function verifyDriverPhone(payload: DriverVerifyPhonePayload) {
  return apiRequest<DriverPhoneResponse>('/driver/profile/phone/verify', {
    method: 'POST',
    body: payload,
  })
}

export function addDriverVehicle(payload: DriverVehiclePayload) {
  return apiRequest<DriverVehicle>('/driver/vehicles', {
    method: 'POST',
    body: payload,
  })
}

export function updateDriverStatus(payload: DriverStatusPayload) {
  return apiRequest<DriverStatusResponse>('/driver/status', {
    method: 'POST',
    body: payload,
  })
}

export function updateDriverLocation(payload: DriverLocationPayload) {
  return apiRequest<{ message: string }>('/driver/location', {
    method: 'POST',
    body: {
      lat: payload.lat,
      lng: payload.lng,
    },
  })
}

export function acceptDriverTrip(id: string) {
  return apiRequest<DriverTripActionResponse>(`/driver/trips/${id}/accept`, {
    method: 'POST',
  })
}

export function rejectDriverTrip(id: string) {
  return apiRequest<DriverTripActionResponse>(`/driver/trips/${id}/reject`, {
    method: 'POST',
  })
}

export function markDriverArrived(id: string) {
  return apiRequest<DriverTripActionResponse>(`/driver/trips/${id}/arrived`, {
    method: 'POST',
  })
}

export function startDriverTrip(id: string) {
  return apiRequest<DriverTripActionResponse>(`/driver/trips/${id}/start`, {
    method: 'POST',
  })
}

export function completeDriverTrip(id: string) {
  return apiRequest<DriverTripActionResponse>(`/driver/trips/${id}/complete`, {
    method: 'POST',
  })
}

export function cancelDriverTrip(id: string) {
  return apiRequest<DriverTripActionResponse>(`/driver/trips/${id}/cancel`, {
    method: 'POST',
  })
}

export async function getActiveDriverTrip(): Promise<null | Trip> {
  const response = await apiRequest<ActiveTripResponse>('/driver/trips/active')
  return response.trip
}

export function getDriverEarnings() {
  return apiRequest<DriverEarnings>('/driver/earnings')
}

export function acceptDriverParkInvite(token: string) {
  return acceptParkInvite({ token })
}
