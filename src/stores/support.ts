import type { SupportListRoomsParams, SupportMessage, SupportRoom } from '~/types/support'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { showErrorToast } from '~/api/errors'
import {
  assignTechSupportRoom,
  getTechSupportMessages,
  getTechSupportRoom,
  listTechSupportRooms,
  requestCloseTechSupportRoom,
  sendTechSupportMessage,
} from '~/api/support'

export const useSupportStore = defineStore('support', () => {
  const rooms = ref<SupportRoom[]>([])
  const currentRoom = ref<SupportRoom | null>(null)
  const messages = ref<SupportMessage[]>([])
  const isLoading = ref(false)
  const isLoadingMessages = ref(false)
  const isMutating = ref(false)
  const isSending = ref(false)
  const errorMessage = ref('')

  async function loadRooms(params: SupportListRoomsParams = {}) {
    isLoading.value = true
    errorMessage.value = ''

    try {
      const response = await listTechSupportRooms(params)
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

  async function loadRoom(id: string) {
    isLoading.value = true
    errorMessage.value = ''

    try {
      currentRoom.value = await getTechSupportRoom(id)
      return currentRoom.value
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось загрузить обращение.')
      throw error
    }
    finally {
      isLoading.value = false
    }
  }

  async function loadMessages(id: string) {
    isLoadingMessages.value = true
    errorMessage.value = ''

    try {
      const response = await getTechSupportMessages(id, { limit: 100 })
      messages.value = response.messages ?? []
      return response
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось загрузить сообщения.')
      throw error
    }
    finally {
      isLoadingMessages.value = false
    }
  }

  async function sendMessage(id: string, content: string) {
    isSending.value = true
    errorMessage.value = ''

    try {
      const msg = await sendTechSupportMessage(id, content)
      messages.value = [...messages.value, msg]
      return msg
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось отправить сообщение.')
      throw error
    }
    finally {
      isSending.value = false
    }
  }

  async function assignRoom(room: SupportRoom) {
    isMutating.value = true
    errorMessage.value = ''

    try {
      await assignTechSupportRoom(room.id)
      room.agent_id = room.agent_id ?? 'assigned'
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
      await requestCloseTechSupportRoom(room.id)
      room.status = 'pending_close'
      if (currentRoom.value?.id === room.id)
        currentRoom.value.status = 'pending_close'
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось закрыть обращение.')
      throw error
    }
    finally {
      isMutating.value = false
    }
  }

  function clearSupportState() {
    rooms.value = []
    currentRoom.value = null
    messages.value = []
    isLoading.value = false
    isLoadingMessages.value = false
    isMutating.value = false
    isSending.value = false
    errorMessage.value = ''
  }

  return {
    assignRoom,
    closeRoom,
    clearSupportState,
    currentRoom,
    errorMessage,
    isLoading,
    isLoadingMessages,
    isMutating,
    isSending,
    loadMessages,
    loadRoom,
    loadRooms,
    messages,
    rooms,
    sendMessage,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useSupportStore as any, import.meta.hot))
