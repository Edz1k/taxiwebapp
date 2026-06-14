<script setup lang="ts">
import type { GeoPlace } from '~/types/geocoding'
import { useUserLocation } from '~/composables/mapbox/useUserLocation'
import { usePassengerTripSocket } from '~/composables/passenger/usePassengerTripSocket'
import { usePassengerStore } from '~/stores/passenger'
import { useTripsStore } from '~/stores/trips'

type PickerMode = 'destination' | 'pickup'

const pickerMode = ref<PickerMode | null>(null)

const passenger = usePassengerStore()
const trips = useTripsStore()
const activeTripId = computed(() => trips.hasActiveTrip ? trips.activeTrip?.id ?? '' : '')
usePassengerTripSocket(activeTripId)

const {
  isLocating,
  liveCoordinates,
  locateUser,
  startWatchingUserLocation,
} = useUserLocation()

definePage({
  meta: {
    authRedirect: '/passenger/login',
    layout: 'passenger',
    requiresAuth: true,
    requiredRole: 'passenger',
  },
})

onMounted(async () => {
  try {
    await passenger.loadProfile()
  }
  catch {}

  const restoredTrip = await trips.restoreActiveTrip().catch(() => null)

  if (!restoredTrip)
    await setPickupFromCurrentLocation()

  startWatchingUserLocation()
})

function startMapPicker(mode: PickerMode) {
  pickerMode.value = mode
}

function cancelMapPicker() {
  pickerMode.value = null
}

function confirmMapPicker(place: GeoPlace, mode: PickerMode) {
  trips.setPlaceFromPicker(place, mode)
  pickerMode.value = null
}

async function setPickupFromCurrentLocation() {
  try {
    const place = await locateUser()
    trips.setPickupPlace(place)
  }
  catch {}
}
</script>

<template>
  <div class="tg-viewport-screen relative overflow-hidden bg-secondary-900">
    <PassengerMap
      :destination-place="trips.destinationPlace"
      :driver-location="trips.driverLocation"
      :picker-mode="pickerMode"
      :pickup-place="trips.pickupPlace"
      :show-route="trips.routeCoordinates.length >= 2"
      :user-coordinates="liveCoordinates"
      @cancel-picker="cancelMapPicker"
      @confirm-picker="confirmMapPicker"
    />
    <Downbar
      v-if="!pickerMode"
      v-model:destination="trips.destination"
      v-model:destination-place="trips.destinationPlace"
      v-model:locating-user="isLocating"
      v-model:pickup="trips.pickup"
      v-model:pickup-place="trips.pickupPlace"
      @locate-user="setPickupFromCurrentLocation"
      @pick-from-map="startMapPicker"
    />
  </div>
</template>
