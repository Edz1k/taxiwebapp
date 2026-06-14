import type {
  AuthLoginResponse,
  AuthSession,
  DriverTelegramAuthResponse,
  LogoutAllPayload,
  LogoutPayload,
  MessageResponse,
  RefreshTokenPayload,
  SendOtpPayload,
  SendOtpResponse,
  TelegramAuthPayload,
  VerifyOtpPayload,
} from '~/types/auth'
import { apiRequest } from '~/api/client'

export function sendOtp(payload: SendOtpPayload) {
  return apiRequest<SendOtpResponse>('/auth/otp/send', {
    method: 'POST',
    skipAuth: true,
    skipAuthRefresh: true,
    body: {
      phone: payload.phone,
    },
  })
}

export function verifyOtp(payload: VerifyOtpPayload) {
  return apiRequest<AuthLoginResponse>('/auth/otp/verify', {
    method: 'POST',
    deviceFingerprint: payload.deviceFingerprint,
    skipAuth: true,
    skipAuthRefresh: true,
    body: {
      phone: payload.phone,
      code: payload.code,
    },
  })
}

export function refreshToken(payload: RefreshTokenPayload = {}) {
  return apiRequest<MessageResponse>('/auth/token/refresh', {
    method: 'POST',
    deviceFingerprint: payload.deviceFingerprint,
    skipAuth: true,
    skipAuthRefresh: true,
    body: {},
  })
}

export function getAuthSession() {
  return apiRequest<AuthSession>('/auth/session')
}

export function telegramPassengerAuth(payload: TelegramAuthPayload) {
  return apiRequest<AuthLoginResponse>('/auth/telegram/passenger', {
    method: 'POST',
    deviceFingerprint: payload.deviceFingerprint,
    skipAuth: true,
    skipAuthRefresh: true,
    body: {
      init_data: payload.initData,
    },
  })
}

export function telegramDriverAuth(payload: TelegramAuthPayload) {
  return apiRequest<DriverTelegramAuthResponse>('/auth/telegram/driver', {
    method: 'POST',
    deviceFingerprint: payload.deviceFingerprint,
    skipAuth: true,
    skipAuthRefresh: true,
    body: {
      init_data: payload.initData,
    },
  })
}

export function logout(_payload: LogoutPayload = {}) {
  return apiRequest<MessageResponse>('/auth/logout', {
    method: 'POST',
    skipAuthRefresh: true,
    body: {},
  })
}

export function logoutAll(_payload: LogoutAllPayload = {}) {
  return apiRequest<MessageResponse>('/auth/logout/all', {
    method: 'POST',
    body: {},
  })
}
