import { describe, expect, it } from 'vitest'
import {
  formatKazakhstanPhone,
  isKazakhstanPhoneComplete,
  normalizeKazakhstanPhone,
  toKazakhstanE164,
} from '~/composables/auth/phone'

describe('kazakhstan phone helpers', () => {
  it('normalizes phone digits', () => {
    expect(normalizeKazakhstanPhone('+7 777 123 45 67')).toBe('7771234567')
    expect(normalizeKazakhstanPhone('8 777 123 45 67')).toBe('7771234567')
    expect(normalizeKazakhstanPhone('777abc123')).toBe('777123')
  })

  it('formats phone for input', () => {
    expect(formatKazakhstanPhone('7771234567')).toBe('(777) 123-45-67')
    expect(formatKazakhstanPhone('777')).toBe('(777)')
    expect(formatKazakhstanPhone('7771')).toBe('(777) 1')
  })

  it('converts phone to E164', () => {
    expect(toKazakhstanE164('8 777 123 45 67')).toBe('+77771234567')
  })

  it('checks completed phone', () => {
    expect(isKazakhstanPhoneComplete('7771234567')).toBe(true)
    expect(isKazakhstanPhoneComplete('777123')).toBe(false)
  })
})
