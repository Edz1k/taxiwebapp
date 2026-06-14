import type {
  SupportListRoomsParams,
  SupportListRoomsResponse,
  SupportMessage,
  SupportMessagesResponse,
  SupportRoom,
} from '~/types/support'
import { apiRequest } from '~/api/client'

export function listAdminSupportRooms(params: SupportListRoomsParams = {}) {
  return apiRequest<SupportListRoomsResponse>('/admin/support/rooms', {
    params: {
      limit: params.limit,
      offset: params.offset,
      status: params.status || undefined,
    },
  })
}

export function getAdminSupportRoom(id: string) {
  return apiRequest<SupportRoom>(`/admin/support/rooms/${id}`)
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

export function getAdminSupportMessages(id: string, params: { limit?: number, offset?: number } = {}) {
  return apiRequest<SupportMessagesResponse>(`/admin/support/rooms/${id}/messages`, { params })
}

export function sendAdminSupportMessage(id: string, content: string) {
  return apiRequest<SupportMessage>(`/admin/support/rooms/${id}/messages`, {
    method: 'POST',
    body: { content },
  })
}
