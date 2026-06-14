import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { showErrorToast } from '~/api/errors'
import {
  closeSupportRoom,
  getSupportMessages,
  openSupportRoom,
  sendSupportMessage,
} from '~/api/support'
import { useSupportStore } from '~/stores/support'

vi.mock('~/api/errors', () => ({
  showErrorToast: vi.fn(() => 'Ошибка'),
}))

vi.mock('~/api/support', () => ({
  openSupportRoom: vi.fn(),
  getSupportMessages: vi.fn(),
  sendSupportMessage: vi.fn(),
  closeSupportRoom: vi.fn(),
}))

describe('support store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('has default values', () => {
    const store = useSupportStore()

    expect(store.room).toBeNull()
    expect(store.messages).toEqual([])
    expect(store.isLoading).toBe(false)
    expect(store.isSending).toBe(false)
    expect(store.errorMessage).toBe('')
  })

  it('opens support room', async () => {
    const room = {
      id: 1,
      status: 'open',
    }

    vi.mocked(openSupportRoom).mockResolvedValue(room as any)
    vi.mocked(getSupportMessages).mockResolvedValue({
      messages: [],
    } as any)

    const store = useSupportStore()

    const result = await store.ensureRoom()

    expect(openSupportRoom).toHaveBeenCalled()
    expect(store.room).toEqual(room)
    expect(result).toEqual(room)
    expect(store.isLoading).toBe(false)
  })

  it('does not open room again if room already exists', async () => {
    const store = useSupportStore()

    store.room = {
      id: 1,
      status: 'open',
    } as any

    const result = await store.ensureRoom()

    expect(openSupportRoom).not.toHaveBeenCalled()
    expect(result).toEqual({
      id: 1,
      status: 'open',
    })
  })

  it('loads messages', async () => {
    const store = useSupportStore()

    store.room = {
      id: 1,
      status: 'open',
    } as any

    const messages = [
      {
        id: 1,
        content: 'Hello',
      },
    ]

    vi.mocked(getSupportMessages).mockResolvedValue({
      messages,
    } as any)

    await store.loadMessages()

    expect(getSupportMessages).toHaveBeenCalledWith(1, 50, 0)
    expect(store.messages).toEqual(messages)
    expect(store.isLoading).toBe(false)
  })

  it('does not load messages without room', async () => {
    const store = useSupportStore()

    await store.loadMessages()

    expect(getSupportMessages).not.toHaveBeenCalled()
  })

  it('sends message', async () => {
    const store = useSupportStore()

    store.room = {
      id: 1,
      status: 'open',
    } as any

    const message = {
      id: 1,
      content: 'Hello',
    }

    vi.mocked(sendSupportMessage).mockResolvedValue(message as any)

    const result = await store.sendMessage('  Hello  ')

    expect(sendSupportMessage).toHaveBeenCalledWith(1, {
      content: 'Hello',
    })

    expect(store.messages).toEqual([message])
    expect(result).toEqual(message)
    expect(store.isSending).toBe(false)
  })

  it('does not send empty message', async () => {
    const store = useSupportStore()

    await store.sendMessage('   ')

    expect(sendSupportMessage).not.toHaveBeenCalled()
  })

  it('closes room', async () => {
    const store = useSupportStore()

    store.room = {
      id: 1,
      status: 'open',
    } as any

    vi.mocked(closeSupportRoom).mockResolvedValue(undefined as any)

    await store.closeRoom()

    expect(closeSupportRoom).toHaveBeenCalledWith(1)
    expect(store.room?.status).toBe('closed')
    expect(store.isLoading).toBe(false)
  })

  it('sets error message when opening room fails', async () => {
    const store = useSupportStore()

    const error = new Error('Server error')

    vi.mocked(openSupportRoom).mockRejectedValue(error)

    await expect(store.ensureRoom()).rejects.toThrow('Server error')

    expect(showErrorToast).toHaveBeenCalledWith(
      error,
      'Не удалось открыть чат поддержки.',
    )

    expect(store.errorMessage).toBe('Ошибка')
    expect(store.isLoading).toBe(false)
  })
})
