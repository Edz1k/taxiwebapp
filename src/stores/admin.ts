import type { AdminAssignableRole, AdminListTripsParams, AdminListUsersParams, AdminTechSupportNumber, AdminUser, CreateParkOwnerPayload } from '~/types/admin'
import type { ParkChatRoom, TaxiPark } from '~/types/park'
import type { Trip } from '~/types/trips'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { addAdminUserRole, addTechSupportNumber as addTechSupportNumberApi, blockAdminUser, createParkOwner as createParkOwnerApi, getAdminTrip, listAdminTrips, listAdminUsers, listTechSupportNumbers, removeAdminUserRole, removeTechSupportNumber as removeTechSupportNumberApi } from '~/api/admin'
import { showErrorToast } from '~/api/errors'
import { listAdminParkChats, listAdminParks, rejectAdminPark, verifyAdminPark } from '~/api/park'

export const useAdminStore = defineStore('admin', () => {
  const users = ref<AdminUser[]>([])
  const trips = ref<Trip[]>([])
  const parks = ref<TaxiPark[]>([])
  const parkChats = ref<ParkChatRoom[]>([])
  const techSupportNumbers = ref<AdminTechSupportNumber[]>([])
  const selectedTrip = ref<Trip | null>(null)
  const usersTotal = ref(0)
  const tripsTotal = ref(0)
  const isLoadingUsers = ref(false)
  const isLoadingTrips = ref(false)
  const isLoadingParks = ref(false)
  const isLoadingParkChats = ref(false)
  const isLoadingTechSupportNumbers = ref(false)
  const isMutating = ref(false)
  const errorMessage = ref('')

  async function loadUsers(params: AdminListUsersParams = {}) {
    isLoadingUsers.value = true
    errorMessage.value = ''

    try {
      const response = await listAdminUsers(params)
      users.value = response.users
      usersTotal.value = response.total
      return response
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось загрузить пользователей.')
      throw error
    }
    finally {
      isLoadingUsers.value = false
    }
  }

  async function setUserBlocked(user: AdminUser, blocked: boolean) {
    isMutating.value = true
    errorMessage.value = ''

    try {
      const response = await blockAdminUser(user.id, { blocked })
      user.is_blocked = response.is_blocked
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось изменить статус пользователя.')
      throw error
    }
    finally {
      isMutating.value = false
    }
  }

  async function grantUserRole(user: AdminUser, role: AdminAssignableRole) {
    isMutating.value = true
    errorMessage.value = ''

    try {
      const response = await addAdminUserRole(user.id, { role })
      user.roles = response.roles
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось выдать роль пользователю.')
      throw error
    }
    finally {
      isMutating.value = false
    }
  }

  async function revokeUserRole(user: AdminUser, role: AdminAssignableRole) {
    isMutating.value = true
    errorMessage.value = ''

    try {
      const response = await removeAdminUserRole(user.id, role)
      user.roles = response.roles
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось отозвать роль пользователя.')
      throw error
    }
    finally {
      isMutating.value = false
    }
  }

  async function loadTrips(params: AdminListTripsParams = {}) {
    isLoadingTrips.value = true
    errorMessage.value = ''

    try {
      const response = await listAdminTrips(params)
      trips.value = response.trips
      tripsTotal.value = response.total
      return response
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось загрузить поездки.')
      throw error
    }
    finally {
      isLoadingTrips.value = false
    }
  }

  async function loadTrip(id: string) {
    isLoadingTrips.value = true
    errorMessage.value = ''

    try {
      selectedTrip.value = await getAdminTrip(id)
      return selectedTrip.value
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось загрузить поездку.')
      throw error
    }
    finally {
      isLoadingTrips.value = false
    }
  }

  async function loadParks(limit = 20, offset = 0) {
    isLoadingParks.value = true
    errorMessage.value = ''

    try {
      const response = await listAdminParks(limit, offset)
      parks.value = response.parks
      return response
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось загрузить таксопарки.')
      throw error
    }
    finally {
      isLoadingParks.value = false
    }
  }

  async function verifyPark(park: TaxiPark) {
    isMutating.value = true
    errorMessage.value = ''

    try {
      await verifyAdminPark(park.id)
      park.is_verified = true
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось подтвердить таксопарк.')
      throw error
    }
    finally {
      isMutating.value = false
    }
  }

  async function rejectPark(park: TaxiPark) {
    isMutating.value = true
    errorMessage.value = ''

    try {
      await rejectAdminPark(park.id)
      parks.value = parks.value.filter(p => p.id !== park.id)
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось отклонить таксопарк.')
      throw error
    }
    finally {
      isMutating.value = false
    }
  }

  async function createParkOwner(payload: CreateParkOwnerPayload) {
    isMutating.value = true
    errorMessage.value = ''

    try {
      return await createParkOwnerApi(payload)
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось создать владельца парка.')
      throw error
    }
    finally {
      isMutating.value = false
    }
  }

  async function loadParkChats(params: { status?: string, limit?: number, offset?: number } = {}) {
    isLoadingParkChats.value = true
    errorMessage.value = ''

    try {
      const response = await listAdminParkChats(params)
      parkChats.value = response.rooms
      return response
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось загрузить чаты парков.')
      throw error
    }
    finally {
      isLoadingParkChats.value = false
    }
  }

  async function loadTechSupportNumbers() {
    isLoadingTechSupportNumbers.value = true
    errorMessage.value = ''

    try {
      const response = await listTechSupportNumbers()
      techSupportNumbers.value = response.numbers
      return response
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось загрузить номера техподдержки.')
      throw error
    }
    finally {
      isLoadingTechSupportNumbers.value = false
    }
  }

  async function addTechSupportNumber(phone: string) {
    isMutating.value = true
    errorMessage.value = ''

    try {
      const response = await addTechSupportNumberApi({ phone })
      if (!techSupportNumbers.value.some(item => item.phone === response.phone)) {
        techSupportNumbers.value = [
          { added_by: null, created_at: new Date().toISOString(), phone: response.phone },
          ...techSupportNumbers.value,
        ]
      }
      return response
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось добавить номер техподдержки.')
      throw error
    }
    finally {
      isMutating.value = false
    }
  }

  async function removeTechSupportNumber(phone: string) {
    isMutating.value = true
    errorMessage.value = ''

    try {
      await removeTechSupportNumberApi({ phone })
      techSupportNumbers.value = techSupportNumbers.value.filter(item => item.phone !== phone)
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось удалить номер техподдержки.')
      throw error
    }
    finally {
      isMutating.value = false
    }
  }

  function clearAdminState() {
    users.value = []
    trips.value = []
    parks.value = []
    parkChats.value = []
    techSupportNumbers.value = []
    selectedTrip.value = null
    usersTotal.value = 0
    tripsTotal.value = 0
    isLoadingUsers.value = false
    isLoadingTrips.value = false
    isLoadingParks.value = false
    isLoadingParkChats.value = false
    isLoadingTechSupportNumbers.value = false
    isMutating.value = false
    errorMessage.value = ''
  }

  return {
    addTechSupportNumber,
    clearAdminState,
    errorMessage,
    isLoadingTrips,
    isLoadingParks,
    isLoadingParkChats,
    isLoadingTechSupportNumbers,
    isLoadingUsers,
    isMutating,
    createParkOwner,
    grantUserRole,
    loadParkChats,
    loadParks,
    loadTechSupportNumbers,
    loadTrip,
    loadTrips,
    loadUsers,
    parkChats,
    parks,
    rejectPark,
    removeTechSupportNumber,
    revokeUserRole,
    selectedTrip,
    setUserBlocked,
    trips,
    tripsTotal,
    techSupportNumbers,
    users,
    usersTotal,
    verifyPark,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useAdminStore as any, import.meta.hot))
