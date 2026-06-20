import axios, { isAxiosError } from 'axios'
import { clearTokenPair } from '~/composables/auth/session'

const API_URL = import.meta.env.VITE_API_URL ?? 'https://api.edtaxi.kz/api/v1'
const WS_URL = import.meta.env.VITE_WS_URL ?? API_URL.replace(/^http/, 'ws').replace(/\/api\/v1\/?$/, '')
const MEDIA_BASE = API_URL.replace(/\/api\/v1\/?$/, '')

// buildWsUrl собирает абсолютный ws(s)-URL к серверу (cookie-сессия едет
// автоматически, т.к. фронт и API — соседние поддомены).
export function buildWsUrl(path: string) {
  return `${WS_URL}${path}`
}

// mediaUrl превращает относительный путь файла из API (/uploads/...) в
// абсолютный URL. Пустые и уже абсолютные значения возвращает как есть.
export function mediaUrl(path?: null | string) {
  if (!path)
    return ''
  if (/^https?:\/\//.test(path))
    return path
  return `${MEDIA_BASE}${path.startsWith('/') ? '' : '/'}${path}`
}

const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
})

const refreshClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
})

export class ApiError extends Error {
  status: number
  data: unknown

  constructor(status: number, message: string, data: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  deviceFingerprint?: string
  params?: Record<string, number | string | boolean | undefined>
  skipAuth?: boolean
  skipAuthRefresh?: boolean
}

function buildHeaders(options: ApiRequestOptions) {
  const headers = new Headers(options.headers)

  if (options.body !== undefined)
    headers.set('Content-Type', 'application/json')

  if (options.deviceFingerprint)
    headers.set('X-Device-FP', options.deviceFingerprint)

  const requestHeaders: Record<string, string> = {}
  headers.forEach((value, key) => {
    requestHeaders[key] = value
  })

  return requestHeaders
}

async function refreshAuthToken(deviceFingerprint?: string) {
  try {
    await refreshClient.post(
      '/auth/token/refresh',
      {},
      {
        headers: deviceFingerprint
          ? { 'X-Device-FP': deviceFingerprint }
          : undefined,
      },
    )

    return true
  }
  catch {
    clearTokenPair()
    return false
  }
}

async function request<T>(path: string, options: ApiRequestOptions) {
  const requestHeaders = buildHeaders(options)

  const response = await apiClient.request({
    url: path,
    method: options.method,
    signal: options.signal ?? undefined,
    headers: requestHeaders,
    data: options.body,
    params: options.params,
  })

  return response.data as unknown as T
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  try {
    return await request<T>(path, options)
  }
  catch (error) {
    if (!isAxiosError(error))
      throw error

    if (error.response?.status === 401 && !options.skipAuthRefresh) {
      const refreshed = await refreshAuthToken(options.deviceFingerprint)

      if (refreshed)
        return request<T>(path, options)
    }

    const status = error.response?.status ?? 0
    const data = error.response?.data
    const message = typeof data === 'object' && data && 'error' in data
      ? String(data.error)
      : (error.response?.statusText || error.message)

    throw new ApiError(status, message, data)
  }
}
