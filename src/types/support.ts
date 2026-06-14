export type SupportRoomStatus = 'closed' | 'open'

export interface SupportRoom {
  agent_id: null | string
  created_at: string
  id: string
  passenger_id: string
  status: SupportRoomStatus
  updated_at: string
}

export interface SupportListRoomsParams {
  limit?: number
  offset?: number
  status?: SupportRoomStatus | ''
}

export interface SupportListRoomsResponse {
  rooms: SupportRoom[]
}

export interface SupportMessage {
  id: string
  sender_id: string
  content: string
  sent_at: string
}

export interface SupportMessagesResponse {
  messages: SupportMessage[]
  room_id: string
}
