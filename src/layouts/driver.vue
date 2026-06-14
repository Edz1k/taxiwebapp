<script setup lang="ts">
import DriverBottomNav from '~/components/driver/DriverBottomNav.vue'
import DriverRouteHeader from '~/components/driver/DriverRouteHeader.vue'

const router = useRouter()
const route = useRoute()

const tabRoutes = new Set(['/driver', '/driver/menu', '/driver/earnings'])
const normalizedPath = computed(() => route.path.replace(/\/$/, '') || '/driver')
const isDriverTabRoute = computed(() => tabRoutes.has(normalizedPath.value))
const shouldShowBackHeader = computed(() => normalizedPath.value.startsWith('/driver/') && !isDriverTabRoute.value)
const backTitle = computed(() => typeof route.meta.screenTitle === 'string' ? route.meta.screenTitle : 'Водитель')
const backSubtitle = computed(() => typeof route.meta.screenSubtitle === 'string' ? route.meta.screenSubtitle : 'Назад в меню')

function goToDriverMenu() {
  router.push('/driver/menu')
}
</script>

<template>
  <div class="tg-viewport-screen relative overflow-hidden bg-secondary-900 text-white">
    <main class="relative z-0 h-full">
      <RouterView />
    </main>

    <DriverRouteHeader
      v-if="shouldShowBackHeader"
      :subtitle="backSubtitle"
      :title="backTitle"
      @back="goToDriverMenu"
    />

    <DriverBottomNav v-if="isDriverTabRoute" />
  </div>
</template>
