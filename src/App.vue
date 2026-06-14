<script setup lang="ts">
import { useTelegramSafeArea } from '~/composables/useTelegramSafeArea'

useTelegramSafeArea()

useHead({
  title: 'TaxiApp',
  meta: [
    {
      name: 'description',
      content: 'Taxi booking app',
    },
  ],
  link: [
    {
      rel: 'icon',
      type: 'image/svg+xml',
      href: () => preferredDark.value ? '/favicon-dark.svg' : '/favicon.svg',
    },
  ],
})
</script>

<template>
  <main font-sans>
    <RouterView />
    <AppToaster />
  </main>
</template>
