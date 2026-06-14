<script setup lang="ts">
import type { EstimateTripResponse, Trip, VehicleCategory } from '~/types/trips'
import { formatFare, TARIFF_META } from '~/constants/tariffs'

const props = defineProps<{
  activeTrip: null | Trip
  destination: string
  elapsedSeconds: number
  isPolling: boolean
  pickup: string
  selectedCategory: VehicleCategory
  selectedEstimate: EstimateTripResponse | null
}>()

const statusMeta = computed(() => {
  switch (props.activeTrip?.status) {
    case 'driver_assigned':
      return {
        description: 'Водитель принял заказ и едет к вам.',
        icon: 'i-mdi-car-clock',
        tone: 'text-main-300',
        title: 'Водитель найден',
      }
    case 'driver_arriving':
      return {
        description: 'Водитель прибыл к месту посадки.',
        icon: 'i-mdi-map-marker-check',
        tone: 'text-emerald-300',
        title: 'Водитель на месте',
      }
    case 'in_progress':
      return {
        description: 'Поездка началась. Хорошей дороги.',
        icon: 'i-mdi-navigation-variant',
        tone: 'text-main-300',
        title: 'Вы в пути',
      }
    case 'completed':
      return {
        description: 'Поездка завершена.',
        icon: 'i-mdi-check-circle',
        tone: 'text-emerald-300',
        title: 'Спасибо за поездку',
      }
    case 'cancelled':
      return {
        description: 'Поездка отменена.',
        icon: 'i-mdi-close-circle',
        tone: 'text-red-300',
        title: 'Заказ отменен',
      }
    default:
      return {
        description: `Поиск идет ${props.elapsedSeconds} сек.`,
        icon: 'i-mdi-radar animate-pulse',
        tone: 'text-main-300',
        title: 'Ищем водителя',
      }
  }
})

const fareText = computed(() => {
  if (props.activeTrip)
    return `${Math.round(props.activeTrip.estimated_fare).toLocaleString('ru-RU')} ₸`

  return props.selectedEstimate ? formatFare(props.selectedEstimate) : 'Цена рассчитана'
})

const category = computed(() => props.activeTrip?.category ?? props.selectedCategory)
</script>

<template>
  <div class="pb-4 text-center">
    <div class="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-main-500/18" :class="statusMeta.tone">
      <span class="text-8" :class="statusMeta.icon" />
    </div>

    <h2 class="mt-4 text-xl font-900">
      {{ statusMeta.title }}
    </h2>

    <p class="mt-1 text-sm text-slate-400 font-700">
      {{ statusMeta.description }}
    </p>

    <div class="mt-4 rounded-2xl bg-white/5 px-4 py-3 text-left">
      <p class="truncate text-sm font-800">
        {{ pickup }} → {{ destination }}
      </p>
      <p class="mt-1 text-xs text-slate-400 font-700">
        {{ TARIFF_META[category].label }} · {{ fareText }}
      </p>
    </div>

    <p v-if="isPolling" class="mt-3 text-xs text-slate-500 font-800">
      Обновляем статус поездки...
    </p>
  </div>
</template>
