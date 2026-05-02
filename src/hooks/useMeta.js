import { useEffect } from 'react'

function setMeta(property, content, isName = false) {
  const attr = isName ? 'name' : 'property'
  let el = document.querySelector(`meta[${attr}="${property}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, property)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content || '')
}

export function useMeta(title, { description, image, robots } = {}) {
  useEffect(() => {
    const prevTitle = document.title
    const fullTitle = title ? `${title} — Torqvia` : 'Torqvia'

    document.title = fullTitle
    setMeta('og:title', fullTitle)
    setMeta('twitter:title', fullTitle)

    if (description) {
      setMeta('og:description', description, false)
      setMeta('description', description, true)
      setMeta('twitter:description', description, true)
    }

    if (image) {
      setMeta('og:image', image)
      setMeta('twitter:image', image, true)
    }

    if (robots) {
      setMeta('robots', robots, true)
    }

    return () => {
      document.title = prevTitle
      if (robots) {
        const el = document.querySelector('meta[name="robots"]')
        if (el) el.setAttribute('content', 'index, follow')
      }
    }
  }, [title, description, image, robots])
}
