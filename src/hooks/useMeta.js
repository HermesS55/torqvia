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

function setCanonical(href) {
  let el = document.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function injectLdJson(id, data) {
  document.getElementById(id)?.remove()
  const s = document.createElement('script')
  s.type = 'application/ld+json'
  s.id   = id
  s.textContent = JSON.stringify(data)
  document.head.appendChild(s)
}

export function useMeta(title, { description, image, robots, canonical, ldJson, ldJsonId } = {}) {
  useEffect(() => {
    const prevTitle     = document.title
    const prevCanonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || null
    const fullTitle     = title ? `${title} | Torqvia` : 'Torqvia'

    document.title = fullTitle
    setMeta('og:title',      fullTitle)
    setMeta('twitter:title', fullTitle)

    if (description) {
      setMeta('og:description',      description)
      setMeta('description',         description, true)
      setMeta('twitter:description', description, true)
    }

    if (image)    { setMeta('og:image', image); setMeta('twitter:image', image, true) }
    if (robots)     setMeta('robots', robots, true)
    if (canonical)  setCanonical(canonical)
    if (ldJson && ldJsonId) injectLdJson(ldJsonId, ldJson)

    return () => {
      document.title = prevTitle
      if (robots) {
        const el = document.querySelector('meta[name="robots"]')
        if (el) el.setAttribute('content', 'index, follow')
      }
      if (canonical && prevCanonical) setCanonical(prevCanonical)
      if (ldJsonId) document.getElementById(ldJsonId)?.remove()
    }
  }, [title, description, image, robots, canonical]) // ldJson/ldJsonId intentionally omitted — object refs change every render
}
