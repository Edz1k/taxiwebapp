import type { TripStatus, VehicleCategory } from '~/types/trips'

export interface DriverTripOffer {
  category?: VehicleCategory
  distance_km?: number
  dropoff_address: string
  dropoff_lat?: number
  dropoff_lng?: number
  estimated_fare: number
  pickup_address: string
  pickup_lat?: number
  pickup_lng?: number
  timeout_sec: number
  trip_id: string
}

export interface DriverLocationMessage {
  heading?: number
  lat: number
  lng: number
  speed?: number
}

export interface DriverTripOfferWireData {
  category?: VehicleCategory
  distance_km?: number
  dropoff_address: string
  dropoff_lat?: number
  dropoff_lng?: number
  estimated_fare?: number
  fare?: number
  pickup_address: string
  pickup_lat?: number
  pickup_lng?: number
  timeout_sec: number
  trip_id: string
}

export interface DriverTripOfferWireMessage {
  data: DriverTripOfferWireData
  type: 'trip_offer'
}

export interface TripStatusWireMessage {
  data: {
    status: TripStatus
    trip_id: string
  }
  type: 'trip_status'
}

export type DriverWebSocketMessage = DriverTripOfferWireMessage | TripStatusWireMessage

export interface PassengerDriverLocation {
  eta_sec?: number
  heading?: number
  lat: number
  lng: number
}

export interface PassengerDriverLocationWireMessage {
  data: PassengerDriverLocation
  type: 'driver_location'
}

export type PassengerWebSocketMessage = PassengerDriverLocationWireMessage | TripStatusWireMessage
