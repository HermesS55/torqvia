import { createContext, useContext, useState } from 'react'
import { translations } from '../lib/i18n'

const LangContext = createContext({ lang: 'tr', t: k => k, toggle: () => {} })

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('av_lang') || 'tr')

  function toggle() {
    const next = lang === 'tr' ? 'en' : 'tr'
    setLang(next)
    localStorage.setItem('av_lang', next)
  }

  function t(key) {
    return translations[lang]?.[key] ?? translations.tr?.[key] ?? key
  }

  return (
    <LangContext.Provider value={{ lang, t, toggle }}>
      {children}
    </LangContext.Provider>
  )
}

export function useT() {
  return useContext(LangContext).t
}

export function useLang() {
  return useContext(LangContext)
}
