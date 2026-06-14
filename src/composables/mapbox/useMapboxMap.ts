import type { Map, Marker } from 'mapbox-gl'
import type { UserCoordinates } from '~/composables/mapbox/useUserLocation'
import type { GeoPlace } from '~/types/geocoding'
import type { PassengerDriverLocation } from '~/types/websocket'

export type MapboxModule = typeof import('mapbox-gl')
export const ALMATY_CENTER: [number, number] = [76.9286, 43.2389]

const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined

export function useMapboxMap(mapContainer: Ref<HTMLElement | null>) {
  const map = shallowRef<Map>()
  const mapboxglModule = shallowRef<MapboxModule>()
  const driverMarker = shallowRef<Marker>()
  const pickupMarker = shallowRef<Marker>()
  const userMarker = shallowRef<Marker>()
  const mapError = ref('')
  let resizeObserver: ResizeObserver | undefined
  let resizeFrame = 0

  function resizeMap() {
    if (resizeFrame)
      window.cancelAnimationFrame(resizeFrame)

    resizeFrame = window.requestAnimationFrame(() => {
      resizeFrame = 0
      map.value?.resize()
    })
  }

  function syncMapResize() {
    if (!mapContainer.value)
      return

    resizeObserver = new ResizeObserver(resizeMap)
    resizeObserver.observe(mapContainer.value)
    window.addEventListener('resize', resizeMap)
    window.addEventListener('orientationchange', resizeMap)
    window.visualViewport?.addEventListener('resize', resizeMap)
  }

  function stopMapResizeSync() {
    resizeObserver?.disconnect()
    resizeObserver = undefined
    window.removeEventListener('resize', resizeMap)
    window.removeEventListener('orientationchange', resizeMap)
    window.visualViewport?.removeEventListener('resize', resizeMap)

    if (resizeFrame)
      window.cancelAnimationFrame(resizeFrame)

    resizeFrame = 0
  }

  async function initializeMap(onLoad?: () => void) {
    if (!mapContainer.value)
      return

    if (!mapboxToken) {
      mapError.value = 'Добавь VITE_MAPBOX_TOKEN в .env'
      return
    }

    mapboxglModule.value = await import('mapbox-gl')
    mapboxglModule.value.default.accessToken = mapboxToken

    map.value = new mapboxglModule.value.default.Map({
      attributionControl: false,
      center: ALMATY_CENTER,
      container: mapContainer.value,
      pitch: 10,
      style: 'mapbox://styles/mapbox/streets-v12',
      zoom: 12,
    })

    map.value.once('load', () => {
      onLoad?.()
      resizeMap()
    })

    map.value.on('error', () => {
      mapError.value = 'Mapbox не смог загрузить карту'
    })

    syncMapResize()
    window.setTimeout(resizeMap, 100)
  }

  function showCurrentPosition(clearRoute?: () => void) {
    if (!map.value)
      return

    clearRoute?.()

    map.value.flyTo({
      center: ALMATY_CENTER,
      essential: true,
      zoom: 12,
    })
  }

  function hideCurrentMarker() {
    pickupMarker.value?.remove()
  }

  function hideDriverLocation() {
    driverMarker.value?.remove()
    driverMarker.value = undefined
  }

  function assignStyles(element: HTMLElement, styles: Partial<CSSStyleDeclaration>) {
    Object.assign(element.style, styles)
  }

  function createPickupMarkerElement() {
    const wrapper = document.createElement('div')
    const bubble = document.createElement('div')
    const stem = document.createElement('div')

    assignStyles(wrapper, {
      alignItems: 'center',
      display: 'flex',
      flexDirection: 'column',
      transform: 'translateY(2px)',
    })

    assignStyles(bubble, {
      alignItems: 'center',
      background: '#e6ad2e',
      border: '3px solid #fff',
      borderRadius: '999px',
      boxShadow: '0 10px 24px rgba(15,23,42,0.28)',
      color: '#fff',
      display: 'flex',
      fontSize: '14px',
      fontWeight: '900',
      height: '34px',
      justifyContent: 'center',
      lineHeight: '34px',
      width: '34px',
    })
    bubble.textContent = 'A'

    assignStyles(stem, {
      background: '#e6ad2e',
      height: '12px',
      marginTop: '-2px',
      width: '3px',
    })

    wrapper.append(bubble, stem)

    return wrapper
  }

  function createDestinationMarkerElement() {
    const wrapper = document.createElement('div')
    const bubble = document.createElement('div')
    const stem = document.createElement('div')

    assignStyles(wrapper, {
      alignItems: 'center',
      display: 'flex',
      flexDirection: 'column',
      transform: 'translateY(2px)',
    })

    assignStyles(bubble, {
      alignItems: 'center',
      background: '#ef4444',
      border: '3px solid #fff',
      borderRadius: '999px',
      boxShadow: '0 10px 24px rgba(15,23,42,0.28)',
      color: '#fff',
      display: 'flex',
      fontSize: '14px',
      fontWeight: '900',
      height: '34px',
      justifyContent: 'center',
      lineHeight: '34px',
      width: '34px',
    })
    bubble.textContent = 'B'

    assignStyles(stem, {
      background: '#ef4444',
      height: '12px',
      marginTop: '-2px',
      width: '3px',
    })

    wrapper.append(bubble, stem)

    return wrapper
  }

  function createUserMarkerElement() {
    const element = document.createElement('div')

    assignStyles(element, {
      background: '#e6ad2e',
      border: '4px solid #fff',
      borderRadius: '999px',
      boxShadow: '0 0 0 8px rgba(230,173,46,0.20), 0 10px 24px rgba(15,23,42,0.28)',
      height: '24px',
      width: '24px',
      zIndex: '5',
    })

    return element
  }

  function createDriverMarkerElement() {
    const element = document.createElement('div')

    assignStyles(element, {
      alignItems: 'center',
      background: '#111827',
      border: '3px solid #e6ad2e',
      borderRadius: '999px',
      boxShadow: '0 10px 24px rgba(15,23,42,0.35)',
      color: '#e6ad2e',
      display: 'flex',
      fontSize: '16px',
      fontWeight: '900',
      height: '34px',
      justifyContent: 'center',
      lineHeight: '34px',
      width: '34px',
      zIndex: '6',
    })
    element.textContent = 'T'

    return element
  }

  function showPickupLocation(place: GeoPlace, options: { focus?: boolean } = {}) {
    if (!map.value || !mapboxglModule.value)
      return

    pickupMarker.value?.remove()
    pickupMarker.value = new mapboxglModule.value.default.Marker({
      anchor: 'bottom',
      element: createPickupMarkerElement(),
    })
      .setLngLat([place.lng, place.lat])
      .addTo(map.value)

    if (options.focus) {
      map.value.flyTo({
        center: [place.lng, place.lat],
        essential: true,
        zoom: 16,
      })
    }
  }

  function showDestinationLocation(place: GeoPlace, options: { focus?: boolean } = {}) {
    if (!map.value || !mapboxglModule.value)
      return

    pickupMarker.value?.remove()
    pickupMarker.value = new mapboxglModule.value.default.Marker({
      anchor: 'bottom',
      element: createDestinationMarkerElement(),
    })
      .setLngLat([place.lng, place.lat])
      .addTo(map.value)

    if (options.focus) {
      map.value.flyTo({
        center: [place.lng, place.lat],
        essential: true,
        zoom: 16,
      })
    }
  }

  function showUserLocation(coordinates: UserCoordinates, options: { focus?: boolean } = {}) {
    if (!map.value || !mapboxglModule.value)
      return

    const lngLat: [number, number] = [coordinates.lng, coordinates.lat]

    if (userMarker.value) {
      userMarker.value.setLngLat(lngLat)
      if (options.focus) {
        map.value.flyTo({
          center: lngLat,
          essential: true,
          zoom: 16,
        })
      }
      return
    }

    userMarker.value = new mapboxglModule.value.default.Marker({
      anchor: 'center',
      element: createUserMarkerElement(),
    })
      .setLngLat(lngLat)
      .addTo(map.value)

    if (options.focus) {
      map.value.flyTo({
        center: lngLat,
        essential: true,
        zoom: 16,
      })
    }
  }

  function showDriverLocation(location: PassengerDriverLocation, options: { focus?: boolean } = {}) {
    if (!map.value || !mapboxglModule.value)
      return

    const lngLat: [number, number] = [location.lng, location.lat]

    if (driverMarker.value) {
      driverMarker.value.setLngLat(lngLat)
      driverMarker.value.setRotation(location.heading ?? 0)
      if (options.focus) {
        map.value.flyTo({
          center: lngLat,
          essential: true,
          zoom: 16,
        })
      }
      return
    }

    driverMarker.value = new mapboxglModule.value.default.Marker({
      anchor: 'center',
      element: createDriverMarkerElement(),
      rotation: location.heading ?? 0,
    })
      .setLngLat(lngLat)
      .addTo(map.value)

    if (options.focus) {
      map.value.flyTo({
        center: lngLat,
        essential: true,
        zoom: 16,
      })
    }
  }

  function destroyMap(cleanup?: () => void) {
    cleanup?.()
    stopMapResizeSync()
    driverMarker.value?.remove()
    pickupMarker.value?.remove()
    userMarker.value?.remove()
    map.value?.remove()
  }

  return {
    destroyMap,
    driverMarker,
    hideDriverLocation,
    hideCurrentMarker,
    initializeMap,
    map,
    mapboxglModule,
    mapError,
    pickupMarker,
    resizeMap,
    showDestinationLocation,
    showDriverLocation,
    showPickupLocation,
    showCurrentPosition,
    showUserLocation,
    userMarker,
  }
}
