<script setup lang="ts">
definePage({
  meta: {
    authRedirect: '/passenger/login',
    layout: 'passenger',
    requiresAuth: true,
    requiredRole: 'passenger',
    screenSubtitle: 'Назад в меню',
    screenTitle: 'Поддержка',
  },
})

useHead({
  title: 'Поддержка | EdTaxi',
})
</script>

<template>
  <SupportChat />
</template>
