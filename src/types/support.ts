export type SupportRoomStatus = 'closed' | 'open'

export interface SupportRoom {
  agent_id: null | string
  created_at: string
  id: string
  passenger_id: string
  status: SupportRoomStatus
  updated_at: string
}

export interface SupportMessage {
  content: string
  id: string
  sender_id: string
  sent_at: string
}

export interface SupportMessagesResponse {
  messages: SupportMessage[]
  room_id: string
}

export interface SupportSendMessagePayload {
  content: string
}

export interface SupportListRoomsParams {
  limit?: number
  offset?: number
  status?: SupportRoomStatus | ''
}

export interface SupportListRoomsResponse {
  rooms: SupportRoom[]
}
