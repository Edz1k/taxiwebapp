import type { DriverProfile } from '~/types/driver'

export interface TaxiPark {
  bin: string
  commission_rate: number
  created_at: string
  id: string
  is_active: boolean
  is_verified: boolean
  name: string
  owner_id: string
  phone: string
}

export interface TaxiParkRegisterPayload {
  bin?: string
  name: string
  phone?: string
}

export interface TaxiParkUpdatePayload {
  bin?: string
  commission_rate?: number
  name?: string
  phone?: string
}

export interface ParkInvite {
  expires_at: string
  id?: string
  token: string
  used_by?: null | string
}

export interface ParkInvitesResponse {
  invites: ParkInvite[]
}

export interface ParkDriversResponse {
  drivers: Pick<DriverProfile, 'id' | 'is_online' | 'rating' | 'total_trips' | 'user_id'>[]
}

export interface ParkAnalytics {
  driver_count: number
  total_revenue: number
  trip_count: number
}

export interface DriverAcceptInvitePayload {
  token: string
}

export interface AdminParksResponse {
  parks: TaxiPark[]
}
