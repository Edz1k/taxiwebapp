interface TelegramWebApp {
  expand?: () => void
  initData?: string
  ready?: () => void
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp
    }
  }
}

export function getTelegramInitData() {
  if (typeof window === 'undefined')
    return ''

  return window.Telegram?.WebApp?.initData ?? ''
}

export function isTelegramWebApp() {
  return Boolean(getTelegramInitData())
}

export function readyTelegramWebApp() {
  if (typeof window === 'undefined')
    return

  window.Telegram?.WebApp?.ready?.()
}
