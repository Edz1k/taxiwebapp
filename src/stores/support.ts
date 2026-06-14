import type { SupportMessage, SupportRoom } from '~/types/support'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { showErrorToast } from '~/api/errors'
import { closeSupportRoom, getSupportMessages, openSupportRoom, sendSupportMessage } from '~/api/support'

export const useSupportStore = defineStore('support', () => {
  const room = ref<SupportRoom | null>(null)
  const messages = ref<SupportMessage[]>([])
  const isLoading = ref(false)
  const isSending = ref(false)
  const errorMessage = ref('')

  async function ensureRoom() {
    if (room.value)
      return room.value

    isLoading.value = true
    errorMessage.value = ''

    try {
      room.value = await openSupportRoom()
      await loadMessages().catch(() => {})
      return room.value
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось открыть чат поддержки.')
      throw error
    }
    finally {
      isLoading.value = false
    }
  }

  async function loadMessages() {
    if (!room.value)
      return

    isLoading.value = true
    errorMessage.value = ''

    try {
      const response = await getSupportMessages(room.value.id, 50, 0)
      messages.value = response.messages
      return response
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось загрузить сообщения.')
      throw error
    }
    finally {
      isLoading.value = false
    }
  }

  async function sendMessage(content: string) {
    const trimmed = content.trim()

    if (!trimmed)
      return

    const activeRoom = await ensureRoom()
    isSending.value = true
    errorMessage.value = ''

    try {
      const message = await sendSupportMessage(activeRoom.id, { content: trimmed })
      messages.value = [...messages.value, message]
      return message
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось отправить сообщение.')
      throw error
    }
    finally {
      isSending.value = false
    }
  }

  async function closeRoom() {
    if (!room.value)
      return

    isLoading.value = true
    errorMessage.value = ''

    try {
      await closeSupportRoom(room.value.id)
      room.value = {
        ...room.value,
        status: 'closed',
      }
    }
    catch (error) {
      errorMessage.value = showErrorToast(error, 'Не удалось закрыть обращение.')
      throw error
    }
    finally {
      isLoading.value = false
    }
  }

  return {
    closeRoom,
    ensureRoom,
    errorMessage,
    isLoading,
    isSending,
    loadMessages,
    messages,
    room,
    sendMessage,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useSupportStore as any, import.meta.hot))
