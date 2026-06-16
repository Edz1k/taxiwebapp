import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  addTechSupportNumber,
  listTechSupportNumbers,
  removeTechSupportNumber,
} from '~/api/admin'
import { showErrorToast } from '~/api/errors'
import { useAdminStore } from '~/stores/admin'

vi.mock('~/api/admin', () => ({
  addAdminUserRole: vi.fn(),
  addTechSupportNumber: vi.fn(),
  blockAdminUser: vi.fn(),
  createParkOwner: vi.fn(),
  getAdminTrip: vi.fn(),
  listAdminTrips: vi.fn(),
  listAdminUsers: vi.fn(),
  listTechSupportNumbers: vi.fn(),
  removeAdminUserRole: vi.fn(),
  removeTechSupportNumber: vi.fn(),
}))

vi.mock('~/api/park', () => ({
  listAdminParkChats: vi.fn(),
  listAdminParks: vi.fn(),
  rejectAdminPark: vi.fn(),
  verifyAdminPark: vi.fn(),
}))

vi.mock('~/api/errors', () => ({
  showErrorToast: vi.fn(() => 'Ошибка'),
}))

describe('admin store tech support numbers', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('loads tech support allowlist numbers', async () => {
    const numbers = [
      {
        added_by: 'admin-id',
        created_at: '2026-06-16T08:00:00Z',
        phone: '+77771234567',
      },
    ]
    vi.mocked(listTechSupportNumbers).mockResolvedValue({ numbers })
    const store = useAdminStore()

    const response = await store.loadTechSupportNumbers()

    expect(listTechSupportNumbers).toHaveBeenCalledTimes(1)
    expect(response).toEqual({ numbers })
    expect(store.techSupportNumbers).toEqual(numbers)
    expect(store.isLoadingTechSupportNumbers).toBe(false)
  })

  it('adds a new tech support number once', async () => {
    vi.mocked(addTechSupportNumber).mockResolvedValue({ phone: '+77770000001' })
    const store = useAdminStore()
    store.techSupportNumbers = [
      {
        added_by: 'admin-id',
        created_at: '2026-06-16T08:00:00Z',
        phone: '+77771234567',
      },
    ]

    await store.addTechSupportNumber('+77770000001')
    await store.addTechSupportNumber('+77770000001')

    expect(addTechSupportNumber).toHaveBeenCalledWith({ phone: '+77770000001' })
    expect(store.techSupportNumbers).toEqual([
      {
        added_by: null,
        created_at: expect.any(String),
        phone: '+77770000001',
      },
      {
        added_by: 'admin-id',
        created_at: '2026-06-16T08:00:00Z',
        phone: '+77771234567',
      },
    ])
    expect(store.isMutating).toBe(false)
  })

  it('removes a tech support number from local allowlist after backend success', async () => {
    vi.mocked(removeTechSupportNumber).mockResolvedValue({ message: 'number removed' })
    const store = useAdminStore()
    store.techSupportNumbers = [
      {
        added_by: null,
        created_at: '2026-06-16T08:00:00Z',
        phone: '+77770000001',
      },
      {
        added_by: null,
        created_at: '2026-06-16T08:10:00Z',
        phone: '+77770000002',
      },
    ]

    await store.removeTechSupportNumber('+77770000001')

    expect(removeTechSupportNumber).toHaveBeenCalledWith({ phone: '+77770000001' })
    expect(store.techSupportNumbers).toEqual([
      {
        added_by: null,
        created_at: '2026-06-16T08:10:00Z',
        phone: '+77770000002',
      },
    ])
    expect(store.isMutating).toBe(false)
  })

  it('keeps previous numbers and exposes error when loading allowlist fails', async () => {
    const error = new Error('Server error')
    vi.mocked(listTechSupportNumbers).mockRejectedValue(error)
    const store = useAdminStore()
    store.techSupportNumbers = [
      {
        added_by: null,
        created_at: '2026-06-16T08:00:00Z',
        phone: '+77770000001',
      },
    ]

    await expect(store.loadTechSupportNumbers()).rejects.toThrow('Server error')

    expect(showErrorToast).toHaveBeenCalledWith(
      error,
      'Не удалось загрузить номера техподдержки.',
    )
    expect(store.techSupportNumbers).toEqual([
      {
        added_by: null,
        created_at: '2026-06-16T08:00:00Z',
        phone: '+77770000001',
      },
    ])
    expect(store.errorMessage).toBe('Ошибка')
    expect(store.isLoadingTechSupportNumbers).toBe(false)
  })
})
