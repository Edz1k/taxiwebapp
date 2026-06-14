import type { AdminAssignableRole, AdminListTripsParams, AdminListUsersParams, AdminUser } from '~/types/admin'
import type { TaxiPark } from '~/types/park'
import type { Trip } from '~/types/trips'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { addAdminUserRole, blockAdminUser, getAdminTrip, listAdminTrips, listAdminUsers, removeAdminUserRole } from '~/api/admin'
import { showErrorToast } from '~/api/errors'
import { listAdminParks, verifyAdminPark } from '~/api/park'

export const useAdminStore = defineStore('admin', () => {
  const users = ref<AdminUser[]>([])
  const trips = ref<Trip[]>([])
  const parks = ref<TaxiPark[]>([])
  const selectedTrip = ref<Trip | null>(null)
  const usersTotal = ref(0)
  const tripsTotal = ref(0)
  const isLoadingUsers = ref(false)
  const isLoadingTrips = ref(false)
  const isLoadingParks = ref(false)
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

  return {
    errorMessage,
    isLoadingTrips,
    isLoadingParks,
    isLoadingUsers,
    isMutating,
    grantUserRole,
    loadParks,
    loadTrip,
    loadTrips,
    loadUsers,
    parks,
    revokeUserRole,
    selectedTrip,
    setUserBlocked,
    trips,
    tripsTotal,
    users,
    usersTotal,
    verifyPark,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useAdminStore as any, import.meta.hot))
