import type {
  SupportListRoomsParams,
  SupportListRoomsResponse,
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
