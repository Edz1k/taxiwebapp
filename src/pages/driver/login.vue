<script setup lang="ts">
import AuthButton from '~/components/auth/AuthButton.vue'
import AuthScreen from '~/components/auth/AuthScreen.vue'
import { getTelegramInitData, readyTelegramWebApp } from '~/composables/auth/telegram'
import { useToast } from '~/composables/useToast'
import { useAuthStore } from '~/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const toast = useToast()

definePage({
  meta: {
    guestOnly: true,
    guestOnlyRole: 'driver',
    guestRedirect: '/driver',
  },
})

useHead({
  title: 'Вход водителя | EdTaxi',
})

onMounted(() => {
  readyTelegramWebApp()
})

async function submitTelegram() {
  const initData = getTelegramInitData()

  if (!initData) {
    auth.errorMessage = 'Вход водителя доступен только внутри Telegram.'
    toast.warning('Откройте в Telegram', auth.errorMessage)
    return
  }

  try {
    const response = await auth.signInDriverWithTelegram(initData)
    await router.replace(response.phone_verified ? '/driver' : '/driver/menu/onboarding/phone')
  }
  catch {}
}
</script>

<template>
  <AuthScreen
    description="Войдите через водительский Telegram Mini App, чтобы выйти на линию и принимать заказы."
    icon="i-mdi-steering"
    title="EdTaxi Driver"
  >
    <form class="mt-8 space-y-5" @submit.prevent="submitTelegram">
      <AuthButton
        :disabled="auth.isLoading"
        icon="i-mdi-telegram"
        :loading="auth.isLoading"
        loading-text="Входим..."
        text="Войти через Telegram"
      />
    </form>

    <template #footer>
      Доступ к водительскому приложению выдаёт администратор
    </template>
  </AuthScreen>
</template>
