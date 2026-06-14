<script setup lang="ts">
import type { PickerMode } from '~/composables/mapbox/useMapboxPicker'
import type { UserCoordinates } from '~/composables/mapbox/useUserLocation'
import type { GeoPlace } from '~/types/geocoding'
import type { PassengerDriverLocation } from '~/types/websocket'
import { useTripsStore } from '~/stores/trips'

withDefaults(defineProps<{
  destinationPlace?: GeoPlace | null
  driverLocation?: PassengerDriverLocation | null
  pickerMode?: PickerMode | null
  pickupPlace?: GeoPlace | null
  showRoute?: boolean
  userCoordinates?: UserCoordinates | null
}>(), {
  destinationPlace: null,
  driverLocation: null,
  pickerMode: null,
  pickupPlace: null,
  showRoute: false,
  userCoordinates: null,
})

const emit = defineEmits<{
  cancelPicker: []
  confirmPicker: [place: GeoPlace, mode: PickerMode]
}>()

const trips = useTripsStore()

function handleConfirmPicker(place: GeoPlace, mode: PickerMode) {
  emit('confirmPicker', place, mode)
}
</script>

<template>
  <MapView
    :destination-place="destinationPlace"
    :driver-location="driverLocation"
    picker-avoid-selector="[data-passenger-tabbar]"
    :picker-mode="pickerMode"
    :pickup-place="pickupPlace"
    :route-coordinates="trips.routeCoordinates"
    :show-route="showRoute"
    :user-coordinates="userCoordinates"
    @cancel-picker="emit('cancelPicker')"
    @confirm-picker="handleConfirmPicker"
  />
</template>
