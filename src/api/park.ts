import type {
  AdminParkChatsResponse,
  AdminParksResponse,
  ParkAnalytics,
  ParkDriversResponse,
  ParkInvite,
  ParkInvitesResponse,
  TaxiPark,
  TaxiParkRegisterPayload,
  TaxiParkUpdatePayload,
} from '~/types/park'
import { apiRequest } from '~/api/client'

export function registerPark(payload: TaxiParkRegisterPayload) {
  return apiRequest<TaxiPark>('/park/register', {
    method: 'POST',
    body: payload,
  })
}

export function getMyPark() {
  return apiRequest<TaxiPark>('/park/me')
}

export function updateMyPark(payload: TaxiParkUpdatePayload) {
  return apiRequest<TaxiPark>('/park/me', {
    method: 'PUT',
    body: payload,
  })
}

export function createParkInvite() {
  return apiRequest<ParkInvite>('/park/invites', {
    method: 'POST',
  })
}

export function listParkInvites() {
  return apiRequest<ParkInvitesResponse>('/park/invites')
}

export function listParkDrivers() {
  return apiRequest<ParkDriversResponse>('/park/drivers')
}

export function removeParkDriver(id: string) {
  return apiRequest<{ message: string }>(`/park/drivers/${id}`, {
    method: 'DELETE',
  })
}

export function getParkAnalytics() {
  return apiRequest<ParkAnalytics>('/park/analytics')
}

export function listAdminParks(limit = 20, offset = 0) {
  return apiRequest<AdminParksResponse>('/admin/parks', {
    params: { limit, offset },
  })
}

export function verifyAdminPark(id: string) {
  return apiRequest<{ message: string }>(`/admin/parks/${id}/verify`, {
    method: 'POST',
  })
}

export function rejectAdminPark(id: string) {
  return apiRequest<{ message: string }>(`/admin/parks/${id}/reject`, {
    method: 'POST',
  })
}

export function listAdminParkChats(params: { limit?: number, offset?: number, status?: string } = {}) {
  return apiRequest<AdminParkChatsResponse>('/admin/park-chats', {
    params,
  })
}
