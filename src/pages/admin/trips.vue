<script setup lang="ts">
import type { Trip, TripStatus } from '~/types/trips'
import AppSelectDropdown from '~/components/app/AppSelectDropdown.vue'
import WebPageShell from '~/components/app/WebPageShell.vue'
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

const statusFilter = computed({
  get: () => status.value,
  set: (value) => {
    status.value = value as TripStatus | ''
  },
})

definePage({
  meta: {
    authRedirect: '/login',
    requiresAuth: true,
    requiredRole: ['admin', 'superadmin'],
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
  <WebPageShell
    back-label="Админка"
    back-to="/admin"
    description="История заказов, статусы, стоимость и быстрый просмотр выбранной поездки."
    title="Поездки"
  >
    <template #actions>
      <AppSelectDropdown v-model="statusFilter" label="Статус" :options="statuses" />
    </template>

    <div class="mt-5 overflow-hidden border border-white/10 rounded-3xl bg-white/8 backdrop-blur">
      <div class="grid-cols-[minmax(180px,1fr)_130px_120px_120px] hidden gap-3 border-b border-white/8 px-4 py-3 text-xs text-white/42 font-900 uppercase md:grid">
        <span>Маршрут</span>
        <span>Статус</span>
        <span>Цена</span>
        <span class="text-right">ID</span>
      </div>

      <div v-if="admin.isLoadingTrips" class="px-4 py-6 text-sm text-white/50">
        Загружаем поездки...
      </div>

      <div v-else-if="!admin.trips.length" class="px-4 py-6 text-sm text-white/50">
        Поездок нет.
      </div>

      <button
        v-for="trip in admin.trips"
        v-else
        :key="trip.id"
        class="grid w-full gap-3 border-b border-white/6 px-4 py-4 text-left transition md:grid-cols-[minmax(180px,1fr)_130px_120px_120px] active:scale-[0.995] md:items-center last:border-b-0"
        type="button"
        @click="admin.loadTrip(trip.id)"
      >
        <span class="min-w-0">
          <span class="block truncate text-sm font-900">{{ trip.pickup_address }}</span>
          <span class="mt-0.5 block truncate text-xs text-white/42">{{ trip.dropoff_address }}</span>
        </span>

        <span class="text-sm text-white/62 font-800">{{ trip.status }}</span>
        <span class="text-sm font-900">{{ formatFare(trip) }}</span>
        <span class="truncate text-left text-xs text-white/38 md:text-right">{{ trip.id }}</span>
      </button>
    </div>

    <section v-if="admin.selectedTrip" class="mt-5 border border-white/10 rounded-3xl bg-white/8 p-4 backdrop-blur">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-xs text-white/42 font-900 uppercase">
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
          <span class="block text-xs text-white/42 font-900 uppercase">Откуда</span>
          <span class="mt-1 block">{{ admin.selectedTrip.pickup_address }}</span>
        </p>
        <p class="rounded-2xl bg-black/14 p-3 text-sm">
          <span class="block text-xs text-white/42 font-900 uppercase">Куда</span>
          <span class="mt-1 block">{{ admin.selectedTrip.dropoff_address }}</span>
        </p>
      </div>
    </section>

    <p class="mt-3 text-xs text-white/40">
      Всего: {{ admin.tripsTotal }}
    </p>
  </WebPageShell>
</template>
