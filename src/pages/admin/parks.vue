<script setup lang="ts">
import WebPageShell from '~/components/app/WebPageShell.vue'
import { useAdminStore } from '~/stores/admin'
import { formatDate } from '~/utils/format'

const admin = useAdminStore()

definePage({
  meta: {
    authRedirect: '/login',
    requiresAuth: true,
    requiredRole: ['admin', 'superadmin'],
  },
})

useHead({
  title: 'Таксопарки | Админка',
})

onMounted(() => {
  admin.loadParks().catch(() => {})
})

</script>

<template>
  <WebPageShell
    back-label="Админка"
    back-to="/admin"
    description="Здесь менеджеры видят созданные таксопарки, подтверждают готовые карточки и отклоняют лишние заявки."
    title="Таксопарки"
  >
    <template #actions>
      <button
        :disabled="admin.isLoadingParks"
        class="h-11 inline-flex items-center gap-2 border border-white/12 rounded-full bg-white/8 px-4 text-sm font-900 transition hover:bg-white/12 disabled:opacity-60"
        type="button"
        @click="admin.loadParks()"
      >
        <span class="i-mdi-refresh text-5 text-cyan-200" :class="{ 'animate-spin': admin.isLoadingParks }" />
        {{ admin.isLoadingParks ? 'Обновляем...' : 'Обновить' }}
      </button>
    </template>

    <div class="mt-5 overflow-hidden border border-white/10 rounded-3xl bg-white/8 backdrop-blur">
      <div class="grid-cols-[minmax(180px,1fr)_130px_130px_130px_220px] hidden gap-3 border-b border-white/8 px-4 py-3 text-xs text-white/42 font-900 uppercase md:grid">
        <span>Парк</span>
        <span>БИН</span>
        <span>Статус</span>
        <span>Создан</span>
        <span class="text-right">Действие</span>
      </div>

      <div v-if="admin.isLoadingParks" class="px-4 py-6 text-sm text-white/50">
        Загружаем таксопарки...
      </div>

      <div v-else-if="!admin.parks.length" class="px-4 py-6 text-sm text-white/50">
        Таксопарков нет.
      </div>

      <div
        v-for="park in admin.parks"
        v-else
        :key="park.id"
        class="grid gap-3 border-b border-white/6 px-4 py-4 md:grid-cols-[minmax(180px,1fr)_130px_130px_130px_220px] md:items-center last:border-b-0"
      >
        <div class="min-w-0">
          <p class="truncate text-sm font-900">
            {{ park.name }}
          </p>
          <p class="mt-0.5 truncate text-xs text-white/42">
            {{ park.phone || park.owner_id }}
          </p>
        </div>

        <span class="truncate text-sm text-white/62 font-800">{{ park.bin || '—' }}</span>
        <span
          class="w-fit rounded-full px-3 py-1.5 text-xs font-900 md:w-auto md:rounded-none md:px-0 md:py-0 md:text-sm"
          :class="park.is_verified ? 'bg-emerald-500/12 text-emerald-300 md:bg-transparent' : 'bg-amber-500/12 text-amber-300 md:bg-transparent'"
        >
          {{ park.is_verified ? 'Проверен' : 'Ожидает' }}
        </span>
        <span class="text-sm text-white/50 font-800">{{ formatDate(park.created_at, { day: 'numeric', month: 'short', year: 'numeric' }) }}</span>

        <div class="flex flex-wrap items-center justify-start gap-2 md:justify-end">
          <button
            :disabled="admin.isMutating || park.is_verified"
            class="h-10 rounded-xl px-4 text-sm font-900 transition active:scale-[0.98] disabled:opacity-50"
            :class="park.is_verified ? 'bg-white/8 text-white/45' : 'bg-cyan-300 text-#06142f'"
            type="button"
            @click="admin.verifyPark(park)"
          >
            {{ park.is_verified ? 'Готово' : 'Подтвердить' }}
          </button>
          <button
            v-if="!park.is_verified"
            :disabled="admin.isMutating"
            class="h-10 rounded-xl bg-red-500/12 px-3 text-sm text-red-300 font-900 transition active:scale-[0.98] disabled:opacity-50"
            type="button"
            @click="admin.rejectPark(park)"
          >
            Отклонить
          </button>
        </div>
      </div>
    </div>
  </WebPageShell>
</template>
