<script setup lang="ts">
import { useAdminStore } from '~/stores/admin'

const admin = useAdminStore()

definePage({
  meta: {
    authRedirect: '/login',
    requiresAuth: true,
    requiredRole: ['admin', 'superadmin'],
  },
})

useHead({
  title: 'Таксопарки | Админка',
})

onMounted(() => {
  admin.loadParks().catch(() => {})
})

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
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
            Таксопарки
          </h1>
        </div>

        <button
          :disabled="admin.isLoadingParks"
          class="h-11 rounded-2xl bg-white/8 px-4 text-sm font-900 disabled:opacity-60"
          type="button"
          @click="admin.loadParks()"
        >
          {{ admin.isLoadingParks ? 'Обновляем...' : 'Обновить' }}
        </button>
      </header>

      <div class="mt-5 overflow-hidden rounded-2xl bg-white/5">
        <div class="grid grid-cols-[1fr_120px_120px_120px_200px] gap-3 border-b border-white/8 px-4 py-3 text-xs text-slate-500 font-900 uppercase">
          <span>Парк</span>
          <span>БИН</span>
          <span>Статус</span>
          <span>Создан</span>
          <span class="text-right">Действие</span>
        </div>

        <div v-if="admin.isLoadingParks" class="px-4 py-6 text-sm text-slate-400">
          Загружаем таксопарки...
        </div>

        <div v-else-if="!admin.parks.length" class="px-4 py-6 text-sm text-slate-400">
          Таксопарков нет.
        </div>

        <div
          v-for="park in admin.parks"
          v-else
          :key="park.id"
          class="grid grid-cols-[1fr_120px_120px_120px_200px] items-center gap-3 border-b border-white/6 px-4 py-3 last:border-b-0"
        >
          <div class="min-w-0">
            <p class="truncate text-sm font-900">
              {{ park.name }}
            </p>
            <p class="mt-0.5 truncate text-xs text-slate-400">
              {{ park.phone || park.owner_id }}
            </p>
          </div>

          <span class="truncate text-sm text-slate-300 font-800">{{ park.bin || '—' }}</span>
          <span class="text-sm font-800" :class="park.is_verified ? 'text-emerald-300' : 'text-amber-300'">
            {{ park.is_verified ? 'Проверен' : 'Ожидает' }}
          </span>
          <span class="text-sm text-slate-400 font-800">{{ formatDate(park.created_at) }}</span>

          <div class="flex items-center justify-end gap-2">
            <button
              :disabled="admin.isMutating || park.is_verified"
              class="h-10 flex-1 rounded-xl text-sm font-900 transition active:scale-[0.98] disabled:opacity-50"
              :class="park.is_verified ? 'bg-white/8 text-slate-400' : 'bg-main-500 text-white'"
              type="button"
              @click="admin.verifyPark(park)"
            >
              {{ park.is_verified ? 'Готово' : 'Подтвердить' }}
            </button>
            <button
              v-if="!park.is_verified"
              :disabled="admin.isMutating"
              class="h-10 rounded-xl bg-red-500/12 px-3 text-sm text-red-300 font-900 transition active:scale-[0.98] disabled:opacity-50"
              type="button"
              @click="admin.rejectPark(park)"
            >
              Отклонить
            </button>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
