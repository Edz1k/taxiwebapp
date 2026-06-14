<script setup lang="ts">
import type { AdminAssignableRole, AdminUser, AdminUserRole } from '~/types/admin'
import { useAdminStore } from '~/stores/admin'
import { useAuthStore } from '~/stores/auth'

const admin = useAdminStore()
const auth = useAuthStore()
const role = ref<AdminUserRole | ''>('')
const showCreateParkOwner = ref(false)
const parkOwnerForm = reactive({ phone: '', name: '' })
const parkOwnerSuccess = ref('')

const isSuperAdmin = computed(() => auth.roles.includes('superadmin'))

const roles: Array<{ label: string, value: AdminUserRole | '' }> = [
  { label: 'Все', value: '' },
  { label: 'Суперадмины', value: 'superadmin' },
  { label: 'Админы', value: 'admin' },
  { label: 'Поддержка', value: 'tech_support' },
  { label: 'Парки', value: 'park' },
  { label: 'Пассажиры', value: 'passenger' },
  { label: 'Водители', value: 'driver' },
]

// superadmin может выдавать admin, обычный admin — нет
const assignableRoles = computed<Array<{ label: string, value: AdminAssignableRole }>>(() => {
  const base: Array<{ label: string, value: AdminAssignableRole }> = [
    { label: 'Поддержка', value: 'tech_support' },
    { label: 'Парки', value: 'park' },
    { label: 'Пассажиры', value: 'passenger' },
    { label: 'Водители', value: 'driver' },
  ]
  if (isSuperAdmin.value)
    return [{ label: 'Админ', value: 'admin' }, ...base]
  return base
})

definePage({
  meta: {
    authRedirect: '/login',
    requiresAuth: true,
    requiredRole: ['admin', 'superadmin'],
  },
})

useHead({
  title: 'Пользователи | Админка',
})

onMounted(() => {
  admin.loadUsers({ role: role.value }).catch(() => {})
})

watch(role, () => {
  admin.loadUsers({ role: role.value }).catch(() => {})
})

function displayName(user: { first_name: null | string, last_name: null | string, telegram_username: null | string }) {
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ')

  return fullName || user.telegram_username || 'Без имени'
}

function userRoles(user: AdminUser): AdminUserRole[] {
  if (user.roles?.length)
    return user.roles
  return user.role ? [user.role] : []
}

function roleLabel(role: AdminUserRole) {
  return roles.find(item => item.value === role)?.label ?? role
}

function canGrantRole(user: AdminUser, role: AdminAssignableRole) {
  return !userRoles(user).includes(role)
}

function canRevokeRole(user: AdminUser, role: AdminAssignableRole) {
  const roles = userRoles(user)

  return roles.includes(role) && roles.length > 1
}

function toggleRole(user: AdminUser, role: AdminAssignableRole) {
  if (canGrantRole(user, role))
    return admin.grantUserRole(user, role)

  if (canRevokeRole(user, role))
    return admin.revokeUserRole(user, role)
}

async function submitCreateParkOwner() {
  parkOwnerSuccess.value = ''
  const result = await admin.createParkOwner({ phone: parkOwnerForm.phone, name: parkOwnerForm.name || undefined })
  parkOwnerSuccess.value = `Владелец парка создан: ${result.phone}`
  parkOwnerForm.phone = ''
  parkOwnerForm.name = ''
  showCreateParkOwner.value = false
}
</script>

<template>
  <main class="min-h-screen bg-secondary-900 px-4 py-6 text-white">
    <section class="mx-auto max-w-6xl">
      <header class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <RouterLink class="text-sm text-main-300 font-800" to="/admin">
            Админка
          </RouterLink>
          <h1 class="mt-2 text-3xl font-950">
            Пользователи
          </h1>
        </div>

        <select v-model="role" class="h-11 border border-white/10 rounded-2xl bg-white/5 px-4 text-sm font-800 outline-none">
          <option v-for="item in roles" :key="item.value" class="bg-secondary-900" :value="item.value">
            {{ item.label }}
          </option>
        </select>

        <button
          class="h-11 rounded-2xl bg-main-500 px-4 text-sm font-900"
          type="button"
          @click="showCreateParkOwner = !showCreateParkOwner"
        >
          + Владелец парка
        </button>
      </header>

      <form
        v-if="showCreateParkOwner"
        class="mt-4 max-w-md rounded-2xl bg-white/5 p-5"
        @submit.prevent="submitCreateParkOwner"
      >
        <h2 class="text-base font-950">
          Создать владельца парка
        </h2>
        <div class="grid mt-4 gap-3">
          <label class="grid gap-2 text-sm text-slate-300 font-800">
            Телефон *
            <input v-model="parkOwnerForm.phone" required placeholder="+77001234567" class="h-12 border border-white/10 rounded-2xl bg-white/5 px-4 text-white outline-none focus:border-main-400">
          </label>
          <label class="grid gap-2 text-sm text-slate-300 font-800">
            Имя
            <input v-model="parkOwnerForm.name" placeholder="Необязательно" class="h-12 border border-white/10 rounded-2xl bg-white/5 px-4 text-white outline-none focus:border-main-400">
          </label>
        </div>
        <p v-if="parkOwnerSuccess" class="mt-3 text-sm text-emerald-300">
          {{ parkOwnerSuccess }}
        </p>
        <button
          :disabled="admin.isMutating || !parkOwnerForm.phone"
          class="mt-4 h-11 rounded-2xl bg-main-500 px-5 text-sm font-900 disabled:opacity-60"
          type="submit"
        >
          {{ admin.isMutating ? 'Создаём...' : 'Создать' }}
        </button>
      </form>

      <div class="mt-5 overflow-hidden rounded-2xl bg-white/5">
        <div class="grid grid-cols-[minmax(180px,1fr)_minmax(240px,1.2fr)_100px_130px] gap-3 border-b border-white/8 px-4 py-3 text-xs text-slate-500 font-900 uppercase">
          <span>Пользователь</span>
          <span>Роли</span>
          <span>Статус</span>
          <span class="text-right">Действие</span>
        </div>

        <div v-if="admin.isLoadingUsers" class="px-4 py-6 text-sm text-slate-400">
          Загружаем пользователей...
        </div>

        <div v-else-if="!admin.users.length" class="px-4 py-6 text-sm text-slate-400">
          Пользователей нет.
        </div>

        <div
          v-for="user in admin.users"
          v-else
          :key="user.id"
          class="grid grid-cols-[minmax(180px,1fr)_minmax(240px,1.2fr)_100px_130px] items-center gap-3 border-b border-white/6 px-4 py-3 last:border-b-0"
        >
          <div class="min-w-0">
            <p class="truncate text-sm font-900">
              {{ displayName(user) }}
            </p>
            <p class="mt-0.5 truncate text-xs text-slate-400">
              {{ user.phone }}
            </p>
          </div>

          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="item in assignableRoles"
              :key="item.value"
              :disabled="admin.isMutating || (!canGrantRole(user, item.value) && !canRevokeRole(user, item.value))"
              class="h-8 rounded-lg px-2 text-xs font-900 transition active:scale-[0.98] disabled:opacity-50"
              :class="canGrantRole(user, item.value) ? 'bg-white/6 text-slate-400 hover:bg-white/10' : 'bg-main-500/18 text-main-200'"
              type="button"
              @click="toggleRole(user, item.value)"
            >
              {{ roleLabel(item.value) }}
            </button>
          </div>
          <span class="text-sm font-800" :class="user.is_blocked ? 'text-red-300' : 'text-emerald-300'">
            {{ user.is_blocked ? 'Блок' : 'Активен' }}
          </span>

          <button
            :disabled="admin.isMutating"
            class="h-10 rounded-xl text-sm font-900 transition active:scale-[0.98] disabled:opacity-60"
            :class="user.is_blocked ? 'bg-emerald-500/12 text-emerald-300' : 'bg-red-500/12 text-red-300'"
            type="button"
            @click="admin.setUserBlocked(user, !user.is_blocked)"
          >
            {{ user.is_blocked ? 'Разблок' : 'Блок' }}
          </button>
        </div>
      </div>

      <p class="mt-3 text-xs text-slate-500">
        Всего: {{ admin.usersTotal }}
      </p>
    </section>
  </main>
</template>
