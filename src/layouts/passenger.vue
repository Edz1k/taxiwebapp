<script setup lang="ts">
import PassengerBottomNav from '~/components/passenger/PassengerBottomNav.vue'
import PassengerRouteHeader from '~/components/passenger/PassengerRouteHeader.vue'

const route = useRoute()
const router = useRouter()

const tabRoutes = new Set(['/passenger', '/passenger/menu', '/passenger/wallet'])
const normalizedPath = computed(() => route.path.replace(/\/$/, '') || '/passenger')
const isPassengerTabRoute = computed(() => tabRoutes.has(normalizedPath.value))
const shouldShowBackHeader = computed(() => normalizedPath.value.startsWith('/passenger/') && !isPassengerTabRoute.value)
const backTitle = computed(() => typeof route.meta.screenTitle === 'string' ? route.meta.screenTitle : 'Пассажир')
const backSubtitle = computed(() => typeof route.meta.screenSubtitle === 'string' ? route.meta.screenSubtitle : 'Назад в меню')

function goToPassengerMenu() {
  router.push('/passenger/menu')
}
</script>

<template>
  <div class="tg-viewport-screen relative overflow-hidden bg-secondary-900 text-white">
    <main class="relative z-0 h-full">
      <RouterView />
    </main>

    <PassengerRouteHeader
      v-if="shouldShowBackHeader"
      :subtitle="backSubtitle"
      :title="backTitle"
      @back="goToPassengerMenu"
    />

    <PassengerBottomNav v-if="isPassengerTabRoute" />
  </div>
</template>
