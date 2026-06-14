import type {
  SupportListRoomsParams,
  SupportListRoomsResponse,
  SupportMessagesResponse,
  SupportRoom,
  SupportSendMessagePayload,
} from '~/types/support'
import { apiRequest } from '~/api/client'

export function openSupportRoom() {
  return apiRequest<SupportRoom>('/support/rooms', {
    method: 'POST',
  })
}

export function getSupportRoom(id: string) {
  return apiRequest<SupportRoom>(`/support/rooms/${id}`)
}

export function sendSupportMessage(id: string, payload: SupportSendMessagePayload) {
  return apiRequest<SupportMessagesResponse['messages'][number]>(`/support/rooms/${id}/messages`, {
    method: 'POST',
    body: payload,
  })
}

export function getSupportMessages(id: string, limit = 50, offset = 0) {
  return apiRequest<SupportMessagesResponse>(`/support/rooms/${id}/messages`, {
    params: { limit, offset },
  })
}

export function closeSupportRoom(id: string) {
  return apiRequest<{ message: string }>(`/support/rooms/${id}/close`, {
    method: 'POST',
  })
}

export function listAdminSupportRooms(params: SupportListRoomsParams = {}) {
  return apiRequest<SupportListRoomsResponse>('/admin/support/rooms', {
    params: {
      limit: params.limit,
      offset: params.offset,
      status: params.status || undefined,
    },
  })
}

export function assignAdminSupportRoom(id: string) {
  return apiRequest<{ message: string }>(`/admin/support/rooms/${id}/assign`, {
    method: 'POST',
  })
}

export function closeAdminSupportRoom(id: string) {
  return apiRequest<{ message: string }>(`/admin/support/rooms/${id}/close`, {
    method: 'POST',
  })
}
