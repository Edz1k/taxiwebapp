<script setup lang="ts">
import { useAdminStore } from '~/stores/admin'

const admin = useAdminStore()
const statusFilter = ref<'open' | 'closed' | ''>('')

definePage({
  meta: {
    authRedirect: '/login',
    requiresAuth: true,
    requiredRole: ['admin', 'superadmin'],
  },
})

useHead({
  title: 'Чаты парков | Админка',
})

onMounted(() => {
  loadChats()
})

watch(statusFilter, () => loadChats())

function loadChats() {
  admin.loadParkChats({ status: statusFilter.value || undefined }).catch(() => {})
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
</script>

<template>
  <main class="min-h-screen bg-secondary-900 px-4 py-6 text-white">
    <section class="mx-auto max-w-6xl">
      <header class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <RouterLink class="text-sm text-main-300 font-800" to="/admin">
            Админка
          </RouterLink>
          <h1 class="mt-2 text-3xl font-950">
            Чаты парков
          </h1>
        </div>

        <div class="flex items-center gap-3">
          <select v-model="statusFilter" class="h-11 border border-white/10 rounded-2xl bg-white/5 px-4 text-sm font-800 outline-none">
            <option class="bg-secondary-900" value="">
              Все
            </option>
            <option class="bg-secondary-900" value="open">
              Открытые
            </option>
            <option class="bg-secondary-900" value="closed">
              Закрытые
            </option>
          </select>
          <button
            :disabled="admin.isLoadingParkChats"
            class="h-11 rounded-2xl bg-white/8 px-4 text-sm font-900 disabled:opacity-60"
            type="button"
            @click="loadChats()"
          >
            {{ admin.isLoadingParkChats ? 'Загружаем...' : 'Обновить' }}
          </button>
        </div>
      </header>

      <div class="mt-5 overflow-hidden rounded-2xl bg-white/5">
        <div class="grid grid-cols-[1fr_1fr_100px_160px] gap-3 border-b border-white/8 px-4 py-3 text-xs text-slate-500 font-900 uppercase">
          <span>ID парка</span>
          <span>ID водителя</span>
          <span>Статус</span>
          <span>Обновлён</span>
        </div>

        <div v-if="admin.isLoadingParkChats" class="px-4 py-6 text-sm text-slate-400">
          Загружаем чаты...
        </div>

        <div v-else-if="!admin.parkChats.length" class="px-4 py-6 text-sm text-slate-400">
          Чатов нет.
        </div>

        <div
          v-for="room in admin.parkChats"
          v-else
          :key="room.id"
          class="grid grid-cols-[1fr_1fr_100px_160px] items-center gap-3 border-b border-white/6 px-4 py-3 last:border-b-0"
        >
          <span class="truncate font-mono text-xs text-slate-300">{{ room.park_id }}</span>
          <span class="truncate font-mono text-xs text-slate-300">{{ room.driver_id }}</span>
          <span class="text-sm font-800" :class="room.status === 'open' ? 'text-emerald-300' : 'text-slate-400'">
            {{ room.status === 'open' ? 'Открыт' : 'Закрыт' }}
          </span>
          <span class="text-xs text-slate-400">{{ formatDate(room.updated_at) }}</span>
        </div>
      </div>
    </section>
  </main>
</template>
