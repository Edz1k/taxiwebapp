import type { SupportListRoomsParams, SupportMessage, SupportRoom } from '~/types/support'
import { acceptHMRUpdate, defineStore } from 'pinia'
import {
  claimTechSupportRoom,
  closeTechSupportRoom,
  getTechSupportMessages,
  listTechSupportRooms,
  sendTechSupportMessage,
} from '~/api/support'
import { useStoreAction } from '~/composables/useStoreAction'

export const useSupportStore = defineStore('support', () => {
  const rooms = ref<SupportRoom[]>([])
  const currentRoom = ref<SupportRoom | null>(null)
  const messages = ref<SupportMessage[]>([])
  const isLoading = ref(false)
  const isLoadingMessages = ref(false)
  const isMutating = ref(false)
  const isSending = ref(false)
  const errorMessage = ref('')

  const { withLoading } = useStoreAction(errorMessage)

  async function loadRooms(params: SupportListRoomsParams = {}) {
    return withLoading(isLoading, async () => {
      const response = await listTechSupportRooms(params)
      rooms.value = response.rooms
      return response
    }, 'Не удалось загрузить обращения поддержки.')
  }

  async function loadRoom(id: string) {
    return withLoading(isLoading, async () => {
      currentRoom.value = await claimTechSupportRoom(id)
      return currentRoom.value
    }, 'Не удалось загрузить обращение.')
  }

  async function loadMessages(id: string) {
    return withLoading(isLoadingMessages, async () => {
      const response = await getTechSupportMessages(id, { limit: 100 })
      messages.value = response.messages ?? []
      return response
    }, 'Не удалось загрузить сообщения.')
  }

  async function sendMessage(id: string, content: string) {
    return withLoading(isSending, async () => {
      const msg = await sendTechSupportMessage(id, content)
      messages.value = [...messages.value, msg]
      return msg
    }, 'Не удалось отправить сообщение.')
  }

  async function closeRoom(room: SupportRoom) {
    return withLoading(isMutating, async () => {
      await closeTechSupportRoom(room.id)
      room.status = 'closed'
      if (currentRoom.value?.id === room.id)
        currentRoom.value.status = 'closed'
    }, 'Не удалось закрыть обращение.')
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
