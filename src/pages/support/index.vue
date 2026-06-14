<script setup lang="ts">
import type { SupportRoomStatus } from '~/types/support'
import { useSupportStore } from '~/stores/support'

const support = useSupportStore()
const status = ref<SupportRoomStatus | ''>('open')

const statuses: Array<{ label: string, value: SupportRoomStatus | '' }> = [
  { label: 'Все', value: '' },
  { label: 'Открытые', value: 'open' },
  { label: 'Закрытые', value: 'closed' },
]

definePage({
  meta: {
    authRedirect: '/login',
    requiresAuth: true,
    requiredRole: ['admin', 'superadmin', 'tech_support'],
  },
})

useHead({
  title: 'Поддержка | EdTaxi',
})

onMounted(() => {
  support.loadRooms({ status: status.value }).catch(() => {})
})

watch(status, () => {
  support.loadRooms({ status: status.value }).catch(() => {})
})

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  }).format(new Date(value))
}
</script>

<template>
  <main class="min-h-screen bg-secondary-900 px-4 py-6 text-white">
    <section class="mx-auto max-w-6xl">
      <header class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <RouterLink class="text-sm text-main-300 font-800" to="/">
            EdTaxi
          </RouterLink>
          <h1 class="mt-2 text-3xl font-950">
            Поддержка
          </h1>
        </div>

        <select v-model="status" class="h-11 border border-white/10 rounded-2xl bg-white/5 px-4 text-sm font-800 outline-none">
          <option v-for="item in statuses" :key="item.value" class="bg-secondary-900" :value="item.value">
            {{ item.label }}
          </option>
        </select>
      </header>

      <div class="mt-5 overflow-hidden rounded-2xl bg-white/5">
        <div class="grid grid-cols-[1fr_120px_150px_300px] gap-3 border-b border-white/8 px-4 py-3 text-xs text-slate-500 font-900 uppercase">
          <span>Обращение</span>
          <span>Статус</span>
          <span>Обновлено</span>
          <span class="text-right">Действия</span>
        </div>

        <div v-if="support.isLoading" class="px-4 py-6 text-sm text-slate-400">
          Загружаем обращения...
        </div>

        <div v-else-if="!support.rooms.length" class="px-4 py-6 text-sm text-slate-400">
          Обращений нет.
        </div>

        <div
          v-for="room in support.rooms"
          v-else
          :key="room.id"
          class="grid grid-cols-[1fr_120px_150px_300px] items-center gap-3 border-b border-white/6 px-4 py-3 last:border-b-0"
        >
          <div class="min-w-0">
            <p class="truncate text-sm font-900">
              {{ room.id }}
            </p>
            <p class="mt-0.5 truncate text-xs text-slate-400">
              {{ room.passenger_id }}
            </p>
          </div>

          <span class="text-sm font-800" :class="room.status === 'open' ? 'text-emerald-300' : 'text-slate-400'">
            {{ room.status === 'open' ? 'Открыто' : 'Закрыто' }}
          </span>
          <span class="text-sm text-slate-400 font-800">{{ formatDate(room.updated_at) }}</span>

          <div class="flex justify-end gap-2">
            <RouterLink
              :to="`/support/${room.id}`"
              class="h-10 flex items-center rounded-xl bg-main-500/15 px-3 text-sm text-main-300 font-900 transition active:scale-[0.98]"
            >
              Открыть
            </RouterLink>
            <button
              :disabled="support.isMutating || room.status === 'closed'"
              class="h-10 rounded-xl bg-white/8 px-3 text-sm font-900 transition active:scale-[0.98] disabled:opacity-50"
              type="button"
              @click="support.assignRoom(room)"
            >
              Назначить
            </button>
            <button
              :disabled="support.isMutating || room.status === 'closed'"
              class="h-10 rounded-xl bg-red-500/12 px-3 text-sm text-red-300 font-900 transition active:scale-[0.98] disabled:opacity-50"
              type="button"
              @click="support.closeRoom(room)"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
