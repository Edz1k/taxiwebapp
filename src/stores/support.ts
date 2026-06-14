import type { SupportListRoomsParams, SupportRoom } from '~/types/support'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { showErrorToast } from '~/api/errors'
import { assignAdminSupportRoom, closeAdminSupportRoom, listAdminSupportRooms } from '~/api/support'

export const useSupportStore = defineStore('support', () => {
  const rooms = ref<SupportRoom[]>([])
  const isLoading = ref(false)
  const isMutating = ref(false)
  const errorMessage = ref('')

  async function loadRooms(params: SupportListRoomsParams = {}) {
    isLoading.value = true
    errorMessage.value = ''

    try {
      const response = await listAdminSupportRooms(params)
      rooms.value = response.rooms
      return response
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось загрузить обращения поддержки.')
      throw error
    }
    finally {
      isLoading.value = false
    }
  }

  async function assignRoom(room: SupportRoom) {
    isMutating.value = true
    errorMessage.value = ''

    try {
      await assignAdminSupportRoom(room.id)
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось назначить обращение.')
      throw error
    }
    finally {
      isMutating.value = false
    }
  }

  async function closeRoom(room: SupportRoom) {
    isMutating.value = true
    errorMessage.value = ''

    try {
      await closeAdminSupportRoom(room.id)
      room.status = 'closed'
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось закрыть обращение.')
      throw error
    }
    finally {
      isMutating.value = false
    }
  }

  return {
    assignRoom,
    closeRoom,
    errorMessage,
    isLoading,
    isMutating,
    loadRooms,
    rooms,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useSupportStore as any, import.meta.hot))
