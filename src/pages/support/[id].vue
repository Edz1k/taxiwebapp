<script setup lang="ts">
import { useRoute as useVueRoute } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useSupportStore } from '~/stores/support'

const route = useVueRoute()
const router = useRouter()
const support = useSupportStore()
const auth = useAuthStore()
const roomId = computed(() => (route.params as Record<string, string>).id)
const draft = ref('')
const messagesEl = ref<HTMLElement | null>(null)

const isAssigned = computed(() => {
  const room = support.currentRoom
  if (!room)
    return false
  return room.agent_id === auth.currentUser?.id
})

definePage({
  meta: {
    authRedirect: '/login',
    requiresAuth: true,
    requiredRole: ['admin', 'superadmin', 'tech_support'],
  },
})

useHead({
  title: 'Чат поддержки | EdTaxi',
})

onMounted(async () => {
  await Promise.all([
    support.loadRoom(roomId.value).catch(() => router.push('/support')),
    support.loadMessages(roomId.value).catch(() => {}),
  ])
  scrollToBottom()
})

function scrollToBottom() {
  nextTick(() => {
    if (messagesEl.value)
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  })
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function isMyMessage(senderId: string) {
  return auth.currentUser?.id === senderId
}

async function assign() {
  if (!support.currentRoom)
    return
  await support.assignRoom(support.currentRoom)
  await support.loadRoom(roomId.value)
}

async function send() {
  const content = draft.value.trim()
  if (!content || support.isSending)
    return
  // Автоназначение при первом ответе
  if (!isAssigned.value) {
    await assign().catch(() => {})
    if (!isAssigned.value)
      return
  }
  draft.value = ''
  await support.sendMessage(roomId.value, content)
  scrollToBottom()
}

const isClosed = computed(() => support.currentRoom?.status === 'closed')
</script>

<template>
  <main class="h-screen flex flex-col bg-secondary-900 text-white">
    <!-- Header bar -->
    <header class="shrink-0 border-b border-white/8 bg-secondary-900/95 px-4 py-3 backdrop-blur">
      <div class="mx-auto max-w-2xl flex items-center gap-3">
        <RouterLink
          class="h-9 w-9 flex items-center justify-center rounded-xl bg-white/6 text-slate-300 transition hover:bg-white/10"
          to="/support"
        >
          <span class="i-mdi-arrow-left text-5" />
        </RouterLink>

        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <div class="h-8 w-8 flex shrink-0 items-center justify-center rounded-full bg-main-500/20">
              <span class="i-mdi-account text-4 text-main-300" />
            </div>
            <div class="min-w-0">
              <p class="truncate text-sm font-900">
                Пользователь
              </p>
              <p class="truncate text-[11px] text-slate-500 font-700">
                {{ support.currentRoom?.passenger_id ?? roomId }}
              </p>
            </div>
          </div>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <span
            class="rounded-xl px-2.5 py-1 text-xs font-900"
            :class="isClosed ? 'bg-white/8 text-slate-400' : 'bg-emerald-500/15 text-emerald-300'"
          >
            {{ isClosed ? 'Закрыто' : 'Открыто' }}
          </span>

          <button
            v-if="!isAssigned && !isClosed"
            :disabled="support.isMutating"
            class="h-9 rounded-xl bg-main-500/20 px-3 text-sm text-main-300 font-900 transition active:scale-[0.98] hover:bg-main-500/30 disabled:opacity-50"
            type="button"
            @click="assign"
          >
            Взять в работу
          </button>
          <button
            v-else-if="isAssigned && !isClosed"
            :disabled="support.isMutating"
            class="h-9 rounded-xl bg-red-500/15 px-3 text-sm text-red-300 font-900 transition active:scale-[0.98] hover:bg-red-500/25 disabled:opacity-50"
            type="button"
            @click="support.currentRoom && support.closeRoom(support.currentRoom)"
          >
            Закрыть чат
          </button>
        </div>
      </div>

      <!-- CTA: take in work -->
      <div
        v-if="!support.currentRoom?.agent_id && !isClosed"
        class="mx-auto mt-2 max-w-2xl rounded-xl bg-main-500/10 px-3 py-2 text-xs text-main-200 font-700"
      >
        Напишите сообщение — вы автоматически возьмёте обращение в работу.
      </div>
      <!-- Warning: assigned to someone else -->
      <div
        v-else-if="support.currentRoom?.agent_id && !isAssigned && !isClosed"
        class="mx-auto mt-2 max-w-2xl rounded-xl bg-amber-500/12 px-3 py-2 text-xs text-amber-300 font-700"
      >
        Обращение уже взял другой агент. Только он может отвечать.
      </div>
    </header>

    <!-- Messages area -->
    <div
      ref="messagesEl"
      class="min-h-0 flex-1 overflow-y-auto px-4 py-4"
    >
      <div class="mx-auto max-w-2xl">
        <!-- Loading skeleton -->
        <div v-if="support.isLoadingMessages" class="space-y-3">
          <div v-for="i in 6" :key="i" class="flex" :class="i % 2 === 0 ? 'justify-end' : 'justify-start'">
            <div class="h-12 w-48 animate-pulse rounded-2xl bg-white/6" :class="i % 2 === 0 ? 'rounded-br-sm' : 'rounded-bl-sm'" />
          </div>
        </div>

        <!-- Empty state -->
        <div
          v-else-if="!support.messages.length"
          class="min-h-60 flex flex-col items-center justify-center gap-2 text-center"
        >
          <span class="i-mdi-chat-outline text-12 text-white/15" />
          <p class="text-sm text-slate-500">
            Сообщений пока нет
          </p>
        </div>

        <!-- Messages -->
        <div v-else class="space-y-2">
          <div
            v-for="msg in support.messages"
            :key="msg.id"
            class="flex"
            :class="isMyMessage(msg.sender_id) ? 'justify-end' : 'justify-start'"
          >
            <article
              class="max-w-[72%] rounded-3xl px-4 py-2.5"
              :class="isMyMessage(msg.sender_id)
                ? 'rounded-br-lg bg-main-500 text-white'
                : 'rounded-bl-lg bg-white/10 text-white'"
            >
              <p class="text-sm leading-[1.55]">
                {{ msg.content }}
              </p>
              <p
                class="mt-1 text-[11px] font-700"
                :class="isMyMessage(msg.sender_id) ? 'text-right text-main-100/60' : 'text-slate-500'"
              >
                {{ formatTime(msg.sent_at) }}
              </p>
            </article>
          </div>
        </div>
      </div>
    </div>

    <!-- Input bar -->
    <div class="shrink-0 border-t border-white/8 bg-secondary-900/95 px-4 py-3 backdrop-blur">
      <form class="mx-auto max-w-2xl flex items-end gap-2" @submit.prevent="send">
        <input
          v-model="draft"
          :disabled="isClosed || (!!support.currentRoom?.agent_id && !isAssigned)"
          class="h-12 min-w-0 flex-1 border border-white/10 rounded-2xl bg-white/6 px-4 text-sm outline-none transition focus:border-main-400/60 focus:bg-white/8 disabled:opacity-40"
          maxlength="2000"
          :placeholder="isClosed ? 'Чат закрыт' : support.currentRoom?.agent_id && !isAssigned ? 'Взято другим агентом' : 'Написать ответ...'"
          @keydown.enter.exact.prevent="send"
        >
        <button
          :disabled="!draft.trim() || !isAssigned || isClosed || support.isSending"
          class="h-12 w-12 flex shrink-0 items-center justify-center rounded-2xl bg-main-500 text-white transition active:scale-[0.97] hover:bg-main-400 disabled:opacity-40"
          type="submit"
        >
          <span class="i-mdi-send text-5" />
        </button>
      </form>
    </div>
  </main>
</template>
