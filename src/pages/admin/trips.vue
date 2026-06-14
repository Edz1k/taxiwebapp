<script setup lang="ts">
import type { Trip, TripStatus } from '~/types/trips'
import { useAdminStore } from '~/stores/admin'

const admin = useAdminStore()
const status = ref<TripStatus | ''>('')

const statuses: Array<{ label: string, value: TripStatus | '' }> = [
  { label: 'Все', value: '' },
  { label: 'Поиск', value: 'searching' },
  { label: 'Назначен', value: 'driver_assigned' },
  { label: 'Прибыл', value: 'driver_arriving' },
  { label: 'В пути', value: 'in_progress' },
  { label: 'Завершён', value: 'completed' },
  { label: 'Отменён', value: 'cancelled' },
]

definePage({
  meta: {
    authRedirect: '/passenger/login',
    requiresAuth: true,
    requiredRole: 'admin',
  },
})

useHead({
  title: 'Поездки | Админка',
})

onMounted(() => {
  admin.loadTrips({ status: status.value }).catch(() => {})
})

watch(status, () => {
  admin.loadTrips({ status: status.value }).catch(() => {})
})

function formatFare(trip: Trip) {
  return `${Math.round(trip.final_fare ?? trip.estimated_fare).toLocaleString('ru-RU')} ₸`
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
            Поездки
          </h1>
        </div>

        <select v-model="status" class="h-11 border border-white/10 rounded-2xl bg-white/5 px-4 text-sm font-800 outline-none">
          <option v-for="item in statuses" :key="item.value" class="bg-secondary-900" :value="item.value">
            {{ item.label }}
          </option>
        </select>
      </header>

      <div class="mt-5 overflow-hidden rounded-2xl bg-white/5">
        <div class="grid grid-cols-[1fr_130px_120px_120px] gap-3 border-b border-white/8 px-4 py-3 text-xs text-slate-500 font-900 uppercase">
          <span>Маршрут</span>
          <span>Статус</span>
          <span>Цена</span>
          <span class="text-right">ID</span>
        </div>

        <div v-if="admin.isLoadingTrips" class="px-4 py-6 text-sm text-slate-400">
          Загружаем поездки...
        </div>

        <div v-else-if="!admin.trips.length" class="px-4 py-6 text-sm text-slate-400">
          Поездок нет.
        </div>

        <button
          v-for="trip in admin.trips"
          v-else
          :key="trip.id"
          class="grid grid-cols-[1fr_130px_120px_120px] w-full items-center gap-3 border-b border-white/6 px-4 py-3 text-left transition active:scale-[0.995] last:border-b-0"
          type="button"
          @click="admin.loadTrip(trip.id)"
        >
          <span class="min-w-0">
            <span class="block truncate text-sm font-900">{{ trip.pickup_address }}</span>
            <span class="mt-0.5 block truncate text-xs text-slate-400">{{ trip.dropoff_address }}</span>
          </span>

          <span class="text-sm text-slate-300 font-800">{{ trip.status }}</span>
          <span class="text-sm font-900">{{ formatFare(trip) }}</span>
          <span class="truncate text-right text-xs text-slate-500">{{ trip.id }}</span>
        </button>
      </div>

      <section v-if="admin.selectedTrip" class="mt-5 rounded-2xl bg-white/5 p-4">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-xs text-slate-500 font-900 uppercase">
              Детали поездки
            </p>
            <h2 class="mt-1 text-xl font-950">
              {{ formatFare(admin.selectedTrip) }}
            </h2>
          </div>
          <p class="rounded-xl bg-white/8 px-3 py-2 text-xs font-900">
            {{ admin.selectedTrip.status }}
          </p>
        </div>

        <div class="grid mt-4 gap-3 sm:grid-cols-2">
          <p class="rounded-2xl bg-black/14 p-3 text-sm">
            <span class="block text-xs text-slate-500 font-900 uppercase">Откуда</span>
            <span class="mt-1 block">{{ admin.selectedTrip.pickup_address }}</span>
          </p>
          <p class="rounded-2xl bg-black/14 p-3 text-sm">
            <span class="block text-xs text-slate-500 font-900 uppercase">Куда</span>
            <span class="mt-1 block">{{ admin.selectedTrip.dropoff_address }}</span>
          </p>
        </div>
      </section>

      <p class="mt-3 text-xs text-slate-500">
        Всего: {{ admin.tripsTotal }}
      </p>
    </section>
  </main>
</template>
