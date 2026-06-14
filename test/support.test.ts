import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { showErrorToast } from '~/api/errors'
import {
  assignAdminSupportRoom,
  closeAdminSupportRoom,
  listAdminSupportRooms,
} from '~/api/support'
import { useSupportStore } from '~/stores/support'

vi.mock('~/api/errors', () => ({
  showErrorToast: vi.fn(() => 'Ошибка'),
}))

vi.mock('~/api/support', () => ({
  assignAdminSupportRoom: vi.fn(),
  closeAdminSupportRoom: vi.fn(),
  listAdminSupportRooms: vi.fn(),
}))

const openRoom = {
  agent_id: null,
  created_at: '2026-06-14T10:00:00Z',
  id: 'room-id',
  passenger_id: 'passenger-id',
  status: 'open' as const,
  updated_at: '2026-06-14T10:00:00Z',
}

describe('support store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('has default values', () => {
    const store = useSupportStore()

    expect(store.rooms).toEqual([])
    expect(store.isLoading).toBe(false)
    expect(store.isMutating).toBe(false)
    expect(store.errorMessage).toBe('')
  })

  it('loads admin support rooms', async () => {
    vi.mocked(listAdminSupportRooms).mockResolvedValue({
      rooms: [openRoom],
    })
    const store = useSupportStore()

    const result = await store.loadRooms({ status: 'open' })

    expect(listAdminSupportRooms).toHaveBeenCalledWith({ status: 'open' })
    expect(store.rooms).toEqual([openRoom])
    expect(result).toEqual({ rooms: [openRoom] })
    expect(store.isLoading).toBe(false)
  })

  it('assigns support room', async () => {
    vi.mocked(assignAdminSupportRoom).mockResolvedValue({ message: 'assigned' })
    const store = useSupportStore()

    await store.assignRoom(openRoom)

    expect(assignAdminSupportRoom).toHaveBeenCalledWith('room-id')
    expect(store.isMutating).toBe(false)
  })

  it('closes support room locally after backend success', async () => {
    vi.mocked(closeAdminSupportRoom).mockResolvedValue({ message: 'closed' })
    const store = useSupportStore()
    const room = { ...openRoom }

    await store.closeRoom(room)

    expect(closeAdminSupportRoom).toHaveBeenCalledWith('room-id')
    expect(room.status).toBe('closed')
    expect(store.isMutating).toBe(false)
  })

  it('sets error message when loading rooms fails', async () => {
    const store = useSupportStore()
    const error = new Error('Server error')

    vi.mocked(listAdminSupportRooms).mockRejectedValue(error)

    await expect(store.loadRooms()).rejects.toThrow('Server error')

    expect(showErrorToast).toHaveBeenCalledWith(
      error,
      'Не удалось загрузить обращения поддержки.',
    )
    expect(store.errorMessage).toBe('Ошибка')
    expect(store.isLoading).toBe(false)
  })
})
