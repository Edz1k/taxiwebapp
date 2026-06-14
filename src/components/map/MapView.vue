<script setup lang="ts">
import type { PickerMode } from '~/composables/mapbox/useMapboxPicker'
import type { UserCoordinates } from '~/composables/mapbox/useUserLocation'
import type { GeoPlace, RouteCoordinate } from '~/types/geocoding'
import type { PassengerDriverLocation } from '~/types/websocket'
import { useMapboxMap } from '~/composables/mapbox/useMapboxMap'
import { useMapboxPicker } from '~/composables/mapbox/useMapboxPicker'
import { useMapboxRoute } from '~/composables/mapbox/useMapboxRoute'
import 'mapbox-gl/dist/mapbox-gl.css'

const props = withDefaults(defineProps<{
  destinationPlace?: GeoPlace | null
  driverLocation?: PassengerDriverLocation | null
  focusUserOnFirstFix?: boolean
  pickerAvoidSelector?: string
  pickerMode?: PickerMode | null
  pickupPlace?: GeoPlace | null
  routeCoordinates?: RouteCoordinate[]
  showRoute?: boolean
  userCoordinates?: UserCoordinates | null
}>(), {
  destinationPlace: null,
  driverLocation: null,
  focusUserOnFirstFix: false,
  pickerAvoidSelector: '',
  pickerMode: null,
  pickupPlace: null,
  routeCoordinates: () => [],
  showRoute: false,
  userCoordinates: null,
})

const emit = defineEmits<{
  cancelPicker: []
  confirmPicker: [place: GeoPlace, mode: PickerMode]
}>()

const mapContainer = ref<HTMLElement | null>(null)
const pickerPanel = ref<HTMLElement | null>(null)
const pickerScreenPoint = ref<[number, number] | null>(null)
const routeCoordinates = computed(() => props.routeCoordinates)
const hasRoute = computed(() => props.showRoute && routeCoordinates.value.length >= 2)
const pickerMode = computed(() => props.pickerMode)
let pickerLayoutObserver: ResizeObserver | undefined
let hasFocusedUser = false

const {
  destroyMap,
  hideCurrentMarker,
  hideDriverLocation,
  initializeMap,
  map,
  mapboxglModule,
  mapError,
  showDestinationLocation,
  showDriverLocation,
  showPickupLocation,
  showUserLocation,
} = useMapboxMap(mapContainer)

const {
  clearRoute,
  showTripRoute,
} = useMapboxRoute({
  destinationPlace: computed(() => props.destinationPlace),
  hasRoute,
  map,
  mapboxglModule,
  pickupPlace: computed(() => props.pickupPlace),
  routeCoordinates,
})

const {
  confirmPicker,
  isConfirmingPicker,
  isPickingLocation,
  pickerError,
  pickerTitle,
} = useMapboxPicker({
  clearRoute,
  getPickerScreenPoint: () => pickerScreenPoint.value,
  hasRoute,
  hideCurrentMarker,
  map,
  onConfirm: (place, mode) => emit('confirmPicker', place, mode),
  pickerMode,
  routeCoordinates,
  userCoordinates: computed(() => props.userCoordinates),
})

const pickerPinStyle = computed(() => {
  const [x, y] = pickerScreenPoint.value ?? [0, 0]

  return {
    left: `${x}px`,
    top: `${y}px`,
    transform: 'translate(-50%, -100%)',
  }
})

function getAvoidedTop(mapRect: DOMRect) {
  if (!props.pickerAvoidSelector)
    return 0

  const element = document.querySelector<HTMLElement>(props.pickerAvoidSelector)

  if (!element)
    return 0

  return element.getBoundingClientRect().bottom - mapRect.top + 16
}

function updatePickerScreenPoint() {
  if (!mapContainer.value)
    return

  const mapRect = mapContainer.value.getBoundingClientRect()
  const panelTop = pickerPanel.value
    ? pickerPanel.value.getBoundingClientRect().top - mapRect.top - 16
    : mapRect.height

  const topBoundary = Math.max(0, getAvoidedTop(mapRect))
  const bottomBoundary = Math.max(topBoundary + 160, panelTop)

  pickerScreenPoint.value = [
    mapRect.width / 2,
    topBoundary + (bottomBoundary - topBoundary) / 2,
  ]
}

function syncPickerLayout() {
  updatePickerScreenPoint()

  pickerLayoutObserver?.disconnect()
  pickerLayoutObserver = new ResizeObserver(updatePickerScreenPoint)

  if (mapContainer.value)
    pickerLayoutObserver.observe(mapContainer.value)

  if (pickerPanel.value)
    pickerLayoutObserver.observe(pickerPanel.value)

  window.addEventListener('resize', updatePickerScreenPoint)
  window.addEventListener('orientationchange', updatePickerScreenPoint)
  window.visualViewport?.addEventListener('resize', updatePickerScreenPoint)
}

function stopPickerLayoutSync() {
  pickerLayoutObserver?.disconnect()
  pickerLayoutObserver = undefined
  window.removeEventListener('resize', updatePickerScreenPoint)
  window.removeEventListener('orientationchange', updatePickerScreenPoint)
  window.visualViewport?.removeEventListener('resize', updatePickerScreenPoint)
}

watch(
  [() => props.showRoute, routeCoordinates],
  ([showRoute]) => {
    if (!map.value)
      return

    if (isPickingLocation.value)
      return

    if (showRoute && hasRoute.value) {
      hideCurrentMarker()
      showTripRoute()
      return
    }

    clearRoute()
  },
  { deep: true },
)

watch(isPickingLocation, async (isPicking) => {
  if (!isPicking) {
    stopPickerLayoutSync()
    pickerScreenPoint.value = null
    return
  }

  await nextTick()
  syncPickerLayout()
})

watch(
  () => props.pickupPlace,
  (place) => {
    if (!place || hasRoute.value)
      return

    showPickupLocation(place, {
      focus: !isPickingLocation.value,
    })
  },
)

watch(
  () => props.destinationPlace,
  (place) => {
    if (!place || hasRoute.value)
      return

    showDestinationLocation(place, {
      focus: !isPickingLocation.value,
    })
  },
)

watch(
  () => props.userCoordinates,
  (coordinates) => {
    if (!coordinates)
      return

    const shouldFocus = props.focusUserOnFirstFix && !hasFocusedUser
    showUserLocation(coordinates, {
      focus: shouldFocus,
    })
    hasFocusedUser = hasFocusedUser || shouldFocus
  },
)

watch(
  () => props.driverLocation,
  (location) => {
    if (!location) {
      hideDriverLocation()
      return
    }

    showDriverLocation(location)
  },
)

onMounted(async () => {
  await initializeMap(() => {
    if (props.userCoordinates) {
      showUserLocation(props.userCoordinates, {
        focus: props.focusUserOnFirstFix,
      })
    }

    if (props.userCoordinates && props.focusUserOnFirstFix) {
      hasFocusedUser = true
    }

    if (props.driverLocation)
      showDriverLocation(props.driverLocation)

    if (props.pickupPlace && !hasRoute.value) {
      showPickupLocation(props.pickupPlace, {
        focus: !isPickingLocation.value,
      })
    }

    if (hasRoute.value) {
      hideCurrentMarker()
      showTripRoute()
    }
  })
})

onBeforeUnmount(() => {
  stopPickerLayoutSync()
  destroyMap(clearRoute)
})
</script>

<template>
  <div class="absolute inset-0">
    <div ref="mapContainer" class="h-full w-full" />

    <div
      v-if="isPickingLocation"
      class="pointer-events-none absolute inset-0 z-10"
    >
      <div
        v-if="pickerScreenPoint"
        class="absolute flex flex-col items-center"
        :style="pickerPinStyle"
      >
        <div class="h-12 w-12 flex items-center justify-center rounded-full bg-main-500 text-white shadow-[0_14px_32px_rgba(230,173,46,0.38)]">
          <span class="i-mdi-map-marker text-8" />
        </div>
        <div class="h-4 w-px bg-main-500" />
      </div>
    </div>

    <div
      v-if="isPickingLocation"
      class="tg-safe-bottom tg-safe-x absolute inset-x-0 bottom-0 z-20"
    >
      <div ref="pickerPanel" class="max-h-[calc(var(--app-viewport-height)-var(--app-safe-area-top)-var(--app-safe-area-bottom)-9rem)] overflow-y-auto border border-white/10 rounded-3xl bg-secondary-900/90 p-4 text-white shadow-[0_-16px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <div class="flex items-center gap-3">
          <div class="h-11 w-11 flex shrink-0 items-center justify-center rounded-full bg-main-500/18 text-main-300">
            <span class="i-mdi-crosshairs-gps text-6" />
          </div>
          <div class="min-w-0 flex-1">
            <h2 class="truncate text-base font-900">
              {{ pickerTitle }}
            </h2>
            <p class="mt-0.5 truncate text-xs text-slate-400 font-700">
              Передвиньте карту, чтобы пин стоял на нужном месте
            </p>
          </div>
        </div>

        <p
          v-if="pickerError"
          class="mt-3 text-center text-xs text-red-300 font-700"
        >
          {{ pickerError }}
        </p>

        <div class="grid grid-cols-[1fr_2fr] mt-4 gap-2">
          <button
            class="h-13 rounded-2xl bg-white/8 text-sm text-slate-200 font-900 transition active:scale-[0.98]"
            type="button"
            @click="emit('cancelPicker')"
          >
            Отмена
          </button>

          <button
            :disabled="isConfirmingPicker"
            class="h-13 rounded-2xl bg-main-500 text-sm text-white font-900 shadow-[0_12px_30px_rgba(230,173,46,0.28)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-600 disabled:shadow-none"
            type="button"
            @click="confirmPicker"
          >
            {{ isConfirmingPicker ? 'Определяем...' : 'Подтвердить' }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="mapError"
      class="absolute inset-0 flex items-center justify-center bg-secondary-950 px-8 text-center text-sm text-slate-300 font-800"
    >
      {{ mapError }}
    </div>
  </div>
</template>
