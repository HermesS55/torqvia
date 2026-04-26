import { useState } from 'react'
import { X, ZoomIn } from 'lucide-react'

export function useLightbox() {
  const [state, setState] = useState({ open: false, src: null, type: 'image' })

  function show(src, type = 'image') {
    setState({ open: true, src, type })
    document.body.style.overflow = 'hidden'
  }

  function hide() {
    setState(s => ({ ...s, open: false }))
    document.body.style.overflow = ''
  }

  function LightboxModal() {
    if (!state.open || !state.src) return null
    return (
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-sm"
        onClick={hide}
      >
        <button
          onClick={hide}
          className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="h-5 w-5 text-white" />
        </button>
        <div
          className="max-w-[95vw] max-h-[95vh] flex items-center justify-center p-4"
          onClick={e => e.stopPropagation()}
        >
          {state.type === 'video' ? (
            <video
              src={state.src}
              className="max-w-full max-h-[90vh] rounded-xl"
              controls
              autoPlay
            />
          ) : (
            <img
              src={state.src}
              alt=""
              className="max-w-full max-h-[90vh] rounded-xl object-contain select-none"
              draggable={false}
            />
          )}
        </div>
      </div>
    )
  }

  return { show, LightboxModal }
}

export function MediaThumb({ src, type = 'image', onOpen, className, children }) {
  return (
    <div
      className={`relative group cursor-zoom-in ${className || ''}`}
      onClick={e => { e.stopPropagation(); onOpen?.(src, type) }}
    >
      {children}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-xl pointer-events-none">
        <div className="bg-black/60 rounded-full p-2">
          <ZoomIn className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  )
}
