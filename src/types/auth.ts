export interface MessageResponse {
  message: string
}

export type AuthRole = 'admin' | 'driver' | 'park' | 'passenger' | 'superadmin' | 'tech_support'

export interface AuthLoginResponse {
  role: AuthRole
}

export interface AuthSession {
  avatar_url: null | string
  first_name: null | string
  id: string
  last_name: null | string
  phone: string
  role: AuthRole
  roles?: AuthRole[]
  telegram_user_id: null | number
}

export interface SendOtpPayload {
  phone: string
}

export interface SendOtpResponse extends MessageResponse {
  phone: string
}

export interface VerifyOtpPayload {
  phone: string
  code: string
  deviceFingerprint?: string
}

export interface RefreshTokenPayload {
  deviceFingerprint?: string
}

export interface TelegramAuthPayload {
  initData: string
  deviceFingerprint?: string
}

export interface DriverTelegramAuthResponse extends AuthLoginResponse {
  phone_verified: boolean
}

export type LogoutPayload = Record<string, never>

export type LogoutAllPayload = Record<string, never>
