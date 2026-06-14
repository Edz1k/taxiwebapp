<script setup lang="ts">
definePage({
  meta: {
    authRedirect: '/login',
    requiresAuth: true,
    requiredRole: ['admin', 'superadmin'],
  },
})

useHead({
  title: 'Админка | EdTaxi',
})
</script>

<template>
  <main class="min-h-screen bg-secondary-900 px-4 py-6 text-white">
    <section class="mx-auto max-w-5xl">
      <header class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="text-xs text-slate-500 font-900 uppercase">
            EdTaxi
          </p>
          <h1 class="mt-1 text-3xl font-950">
            Админка
          </h1>
        </div>
      </header>

      <div class="grid mt-8 gap-4 sm:grid-cols-3">
        <RouterLink class="rounded-2xl bg-white/5 p-5 transition active:scale-[0.98]" to="/admin/users">
          <span class="h-12 w-12 flex items-center justify-center rounded-2xl bg-main-500/18 text-main-200">
            <span class="i-mdi-account-group text-7" />
          </span>
          <h2 class="mt-5 text-xl font-950">
            Пользователи
          </h2>
          <p class="mt-1 text-sm text-slate-400">
            Роли, блокировка, список аккаунтов.
          </p>
        </RouterLink>

        <RouterLink class="rounded-2xl bg-white/5 p-5 transition active:scale-[0.98]" to="/admin/trips">
          <span class="h-12 w-12 flex items-center justify-center rounded-2xl bg-main-500/18 text-main-200">
            <span class="i-mdi-map-marker-path text-7" />
          </span>
          <h2 class="mt-5 text-xl font-950">
            Поездки
          </h2>
          <p class="mt-1 text-sm text-slate-400">
            История, статусы, детали заказов.
          </p>
        </RouterLink>

        <RouterLink class="rounded-2xl bg-white/5 p-5 transition active:scale-[0.98]" to="/admin/parks">
          <span class="h-12 w-12 flex items-center justify-center rounded-2xl bg-main-500/18 text-main-200">
            <span class="i-mdi-office-building text-7" />
          </span>
          <h2 class="mt-5 text-xl font-950">
            Таксопарки
          </h2>
          <p class="mt-1 text-sm text-slate-400">
            Проверка парков, владельцы, заявки.
          </p>
        </RouterLink>

        <RouterLink class="rounded-2xl bg-white/5 p-5 transition active:scale-[0.98]" to="/admin/park-chats">
          <span class="h-12 w-12 flex items-center justify-center rounded-2xl bg-main-500/18 text-main-200">
            <span class="i-mdi-chat-outline text-7" />
          </span>
          <h2 class="mt-5 text-xl font-950">
            Чаты парков
          </h2>
          <p class="mt-1 text-sm text-slate-400">
            Переписка таксопарков с водителями.
          </p>
        </RouterLink>
      </div>
    </section>
  </main>
</template>
