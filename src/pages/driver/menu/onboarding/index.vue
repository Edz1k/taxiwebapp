<script setup lang="ts">
const items = ref([
  { label: 'Паспорт', description: 'Загрузите фото паспорта', icon: 'i-mdi-passport', to: '/driver/menu/onboarding/passport' },
  { label: 'Водительское удостоверение', description: 'Загрузите фото водительского удостоверения', icon: 'i-mdi-card-account-details-outline', to: '/driver/menu/onboarding/license' },
  { label: 'Фото с собой', description: 'Сделайте селфи с паспортом в руках', icon: 'i-mdi-camera-account', to: '/driver/menu/onboarding/selfie' },
  { label: 'Фото автомобиля', description: 'Загрузите фото автомобиля', icon: 'i-mdi-car', to: '/driver/menu/onboarding/car' },
  { label: 'Фото документов автомобиля', description: 'Загрузите фото документов автомобиля', icon: 'i-mdi-file-document-outline', to: '/driver/menu/onboarding/car-docs' },
  { label: 'Номер телефона', description: 'Введите ваш номер телефона', icon: 'i-mdi-phone', to: '/driver/menu/onboarding/phone' },
])

definePage({
  meta: {
    authRedirect: '/driver/login',
    layout: 'driver',
    requiresAuth: true,
    requiredRole: 'driver',
    screenSubtitle: 'Назад в меню',
    screenTitle: 'Верификация',
  },
})
</script>

<template>
  <main class="p h-full overflow-y-auto bg-secondary-900 text-white">
    <section class="mx-auto max-w-sm">
      <header>
        <p class="text-xs text-main-300 font-900 uppercase">
          Водитель
        </p>
        <h1 class="mt-1 text-3xl font-950">
          Верификация
        </h1>
      </header>

      <nav class="mt-8 space-y-3">
        <RouterLink
          v-for="item in items"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-4 rounded-3xl bg-white/5 px-4 py-4 text-white transition active:scale-[0.98]"
        >
          <span class="h-12 w-12 flex shrink-0 items-center justify-center rounded-2xl bg-white/8 text-main-200">
            <span :class="item.icon" class="text-7" />
          </span>

          <span class="min-w-0 flex-1">
            <span class="block text-lg font-900">
              {{ item.label }}
            </span>
            <span class="mt-0.5 block truncate text-xs text-slate-400 font-600">
              {{ item.description }}
            </span>
          </span>

          <span class="i-mdi-chevron-right text-7 text-slate-500" />
        </RouterLink>
      </nav>
    </section>
  </main>
</template>
