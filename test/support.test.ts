import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { showErrorToast } from '~/api/errors'
import {
  assignTechSupportRoom,
  listTechSupportRooms,
  requestCloseTechSupportRoom,
} from '~/api/support'
import { useSupportStore } from '~/stores/support'

vi.mock('~/api/errors', () => ({
  showErrorToast: vi.fn(() => 'Ошибка'),
}))

vi.mock('~/api/support', () => ({
  assignTechSupportRoom: vi.fn(),
  listTechSupportRooms: vi.fn(),
  requestCloseTechSupportRoom: vi.fn(),
}))

const openRoom = {
  agent_id: null,
  created_at: '2026-06-14T10:00:00Z',
  id: 'room-id',
  participant_type: 'passenger' as const,
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

  it('loads tech support rooms', async () => {
    vi.mocked(listTechSupportRooms).mockResolvedValue({
      rooms: [openRoom],
    })
    const store = useSupportStore()

    const result = await store.loadRooms({ status: 'open' })

    expect(listTechSupportRooms).toHaveBeenCalledWith({ status: 'open' })
    expect(store.rooms).toEqual([openRoom])
    expect(result).toEqual({ rooms: [openRoom] })
    expect(store.isLoading).toBe(false)
  })

  it('passes participant type when loading driver rooms', async () => {
    const driverRoom = {
      ...openRoom,
      id: 'driver-room-id',
      participant_type: 'driver' as const,
    }
    vi.mocked(listTechSupportRooms).mockResolvedValue({
      rooms: [driverRoom],
    })
    const store = useSupportStore()

    await store.loadRooms({ participant_type: 'driver', status: 'open' })

    expect(listTechSupportRooms).toHaveBeenCalledWith({ participant_type: 'driver', status: 'open' })
    expect(store.rooms).toEqual([driverRoom])
  })

  it('assigns support room', async () => {
    vi.mocked(assignTechSupportRoom).mockResolvedValue({ message: 'assigned' })
    const store = useSupportStore()

    await store.assignRoom(openRoom)

    expect(assignTechSupportRoom).toHaveBeenCalledWith('room-id')
    expect(store.isMutating).toBe(false)
  })

  it('marks support room as pending close after backend success', async () => {
    vi.mocked(requestCloseTechSupportRoom).mockResolvedValue({ message: 'close requested' })
    const store = useSupportStore()
    const room = { ...openRoom }

    await store.closeRoom(room)

    expect(requestCloseTechSupportRoom).toHaveBeenCalledWith('room-id')
    expect(room.status).toBe('pending_close')
    expect(store.isMutating).toBe(false)
  })

  it('marks current room as pending close too', async () => {
    vi.mocked(requestCloseTechSupportRoom).mockResolvedValue({ message: 'close requested' })
    const store = useSupportStore()
    const room = { ...openRoom }
    store.currentRoom = room

    await store.closeRoom(room)

    expect(store.currentRoom?.status).toBe('pending_close')
  })

  it('sets error message when loading rooms fails', async () => {
    const store = useSupportStore()
    const error = new Error('Server error')

    vi.mocked(listTechSupportRooms).mockRejectedValue(error)

    await expect(store.loadRooms()).rejects.toThrow('Server error')

    expect(showErrorToast).toHaveBeenCalledWith(
      error,
      'Не удалось загрузить обращения поддержки.',
    )
    expect(store.errorMessage).toBe('Ошибка')
    expect(store.isLoading).toBe(false)
  })
})
