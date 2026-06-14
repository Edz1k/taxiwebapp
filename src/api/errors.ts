import { ApiError } from '~/api/client'
import { useToast } from '~/composables/useToast'

const ERROR_MESSAGES: Record<string, string> = {
  'account is blocked': 'Аккаунт заблокирован. Напишите в поддержку.',
  'already belongs to a park': 'Водитель уже состоит в таксопарке.',
  'balance topped up': 'Баланс пополнен.',
  'driver account not found or not authorized': 'Аккаунт водителя не найден. Обратитесь к администратору.',
  'driver profile not found': 'Профиль водителя не найден. Сначала завершите онбординг.',
  'driver profile not found — create it first via POST /api/v1/driver/profile': 'Профиль водителя не найден. Сначала создайте профиль водителя.',
  'failed to create driver profile': 'Не удалось создать профиль водителя. Попробуйте ещё раз.',
  'failed to create place': 'Не удалось сохранить адрес. Попробуйте ещё раз.',
  'failed to fetch history': 'Не удалось загрузить историю поездок.',
  'failed to fetch places': 'Не удалось загрузить избранные адреса.',
  'failed to list trips': 'Не удалось загрузить список поездок.',
  'failed to list users': 'Не удалось загрузить список пользователей.',
  'failed to open room': 'Не удалось открыть чат поддержки.',
  'failed to register park': 'Не удалось зарегистрировать таксопарк.',
  'failed to send otp': 'Не удалось отправить код. Проверьте номер и попробуйте ещё раз.',
  'failed to top-up': 'Не удалось пополнить баланс.',
  'failed to update park': 'Не удалось обновить данные таксопарка.',
  'forbidden': 'Недостаточно прав для этого действия.',
  'geocoding unavailable': 'Поиск адресов временно недоступен. Попробуйте позже.',
  'go offline before ordering a trip': 'Чтобы заказать поездку, сначала уйдите с линии как водитель.',
  'internal error': 'На сервере произошла ошибка. Попробуйте позже.',
  'invalid body': 'Проверьте заполненные данные.',
  'invalid or expired code': 'Код неверный или истёк. Запросите новый код.',
  'invalid or expired token': 'Сессия истекла. Войдите заново.',
  'invalid request body': 'Проверьте заполненные данные.',
  'invalid token': 'Сессия истекла. Войдите заново.',
  'invalid trip id': 'Поездка не найдена.',
  'invalid trip status transition': 'Это действие сейчас недоступно для текущего статуса поездки.',
  'invalid user': 'Сессия истекла. Войдите заново.',
  'invite not found or expired': 'Приглашение не найдено или истекло.',
  'joined park successfully': 'Вы присоединились к таксопарку.',
  'missing token': 'Сессия не найдена. Войдите заново.',
  'not your trip': 'У вас нет доступа к этой поездке.',
  'park not found': 'Таксопарк не найден. Сначала зарегистрируйте его.',
  'park verified': 'Таксопарк подтвержден.',
  'room is closed': 'Обращение закрыто. Откройте новое, если нужна помощь.',
  'reverse geocoding failed': 'Не удалось определить адрес по карте.',
  'routing unavailable': 'Построение маршрута временно недоступно.',
  'share link not found or expired': 'Ссылка на поездку устарела или недоступна.',
  'tariff not configured for this category': 'Тариф пока не настроен. Выберите другой класс авто.',
  'too many attempts, request a new code': 'Слишком много попыток. Запросите новый код позже.',
  'trip already taken by another driver': 'Этот заказ уже принял другой водитель.',
  'trip already rated': 'Вы уже оценили эту поездку.',
  'trip is not completed yet': 'Оценить можно только завершенную поездку.',
  'trip not found': 'Поездка не найдена.',
  'user not found': 'Пользователь не найден.',

  // park / invite / driver-park
  'access denied': 'Доступ запрещён.',
  'access denied or room closed': 'Доступ запрещён или чат закрыт.',
  'driver does not belong to a taxi park': 'Водитель не состоит в таксопарке.',
  'driver not in your park': 'Водитель не состоит в вашем парке.',
  'failed to accept invite': 'Не удалось принять приглашение.',
  'failed to create invite': 'Не удалось создать приглашение.',
  'failed to get drivers': 'Не удалось загрузить список водителей.',
  'failed to get invites': 'Не удалось загрузить приглашения.',
  'invalid driver id': 'Неверный идентификатор водителя.',

  // park chat
  'failed to close room': 'Не удалось закрыть обращение.',
  'failed to get messages': 'Не удалось загрузить сообщения.',
  'failed to list rooms': 'Не удалось загрузить чаты.',
  'failed to send message': 'Не удалось отправить сообщение.',
  'invalid room id': 'Неверный идентификатор чата.',
  'room not found': 'Чат не найден.',

  // places
  'failed to delete place': 'Не удалось удалить адрес.',
  'failed to update place': 'Не удалось обновить адрес.',
  'invalid place id': 'Неверный идентификатор адреса.',

  // wallet
  'insufficient wallet balance': 'Недостаточно средств на балансе.',
  'wallet not found': 'Кошелёк не найден.',

  // auth
  'invalid telegram data': 'Не удалось проверить Telegram-вход. Войдите заново.',
  'logout failed': 'Не удалось завершить сессию.',

  // admin — роли
  'commission rate must be between 0 and 0.03': 'Комиссия должна быть от 0% до 3%.',
  'failed to create park owner': 'Не удалось создать владельца парка.',
  'failed to load roles': 'Не удалось загрузить роли.',
  'failed to update role': 'Не удалось обновить роль.',
  'insufficient privilege to assign this role': 'Недостаточно привилегий для назначения этой роли.',
  'invalid role': 'Неверная роль.',
  'invalid user id': 'Неверный идентификатор пользователя.',
  'role not assignable via api': 'Эту роль нельзя назначить через API.',

  // admin — parks
  'failed to get analytics': 'Не удалось загрузить аналитику.',
  'failed to list parks': 'Не удалось загрузить список таксопарков.',
  'failed to reject park': 'Не удалось отклонить заявку таксопарка.',
  'failed to save park': 'Не удалось сохранить данные таксопарка.',
  'failed to verify park': 'Не удалось верифицировать таксопарк.',
  'taxi park already registered for this owner': 'Таксопарк уже зарегистрирован для этого владельца.',
}

function statusFallback(status: number, fallback: string) {
  switch (status) {
    case 0:
      return 'Нет соединения с сервером. Проверьте интернет.'
    case 400:
      return 'Проверьте введённые данные.'
    case 401:
      return 'Сессия истекла. Войдите заново.'
    case 403:
      return 'Недостаточно прав для этого действия.'
    case 404:
      return 'Данные не найдены.'
    case 409:
      return 'Действие конфликтует с текущим состоянием.'
    case 429:
      return 'Слишком много запросов. Попробуйте позже.'
    case 500:
      return 'На сервере произошла ошибка. Попробуйте позже.'
    default:
      return fallback
  }
}

function normalizeServerMessage(message: string) {
  const normalized = message.trim()
  const lower = normalized.toLowerCase()

  return ERROR_MESSAGES[lower] ?? ERROR_MESSAGES[normalized] ?? ''
}

export function getUserErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    const serverMessage = normalizeServerMessage(error.message)

    if (serverMessage)
      return serverMessage

    return statusFallback(error.status, fallback)
  }

  if (error instanceof Error && error.message)
    return error.message

  return fallback
}

export function showErrorToast(error: unknown, fallback: string, title = 'Что-то пошло не так') {
  const message = getUserErrorMessage(error, fallback)
  const toast = useToast()

  toast.error(title, message)

  return message
}
