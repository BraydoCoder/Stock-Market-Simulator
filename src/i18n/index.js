import { getState, updateSettings } from '../state/store.js'
import { TRANSLATIONS } from './translations.js'

export function t(key) {
  const lang = getState().settings.language ?? 'en'
  const base = lang.split('-')[0]
  return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS[base]?.[key] ?? TRANSLATIONS['en']?.[key] ?? key
}

export function setLanguage(lang) {
  updateSettings({ language: lang })
}
