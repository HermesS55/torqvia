import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, X, ZoomIn } from 'lucide-react'

const CONTAINER = 320
const CROP_RADIUS = 140

export default function AvatarCropModal({ file, onConfirm, onCancel }) {
  const canvasRef = useRef(null)
  const imgRef = useRef(null)
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 })

  const [zoom, setZoom] = useState(1)
  const [minZoom, setMinZoom] = useState(0.1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      URL.revokeObjectURL(url)
      const shortSide = Math.min(img.width, img.height)
      const fz = (CROP_RADIUS * 2) / shortSide
      setMinZoom(fz)
      setZoom(fz)
      setOffset({ x: 0, y: 0 })
    }
    img.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img) return
    const ctx = canvas.getContext('2d')
    canvas.width = CONTAINER
    canvas.height = CONTAINER

    const dw = img.width * zoom
    const dh = img.height * zoom
    const dx = (CONTAINER - dw) / 2 + offset.x
    const dy = (CONTAINER - dh) / 2 + offset.y

    ctx.clearRect(0, 0, CONTAINER, CONTAINER)
    ctx.drawImage(img, dx, dy, dw, dh)

    // Dark overlay with circular cutout
    ctx.save()
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fillRect(0, 0, CONTAINER, CONTAINER)
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(CONTAINER / 2, CONTAINER / 2, CROP_RADIUS, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    // Border
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(CONTAINER / 2, CONTAINER / 2, CROP_RADIUS, 0, Math.PI * 2)
    ctx.stroke()
  }, [zoom, offset])

  useEffect(() => { draw() }, [draw])

  function startDrag(clientX, clientY) {
    setDragging(true)
    dragStart.current = { x: clientX, y: clientY, ox: offset.x, oy: offset.y }
  }

  function moveDrag(clientX, clientY) {
    if (!dragging) return
    const dx = clientX - dragStart.current.x
    const dy = clientY - dragStart.current.y
    setOffset({ x: dragStart.current.ox + dx, y: dragStart.current.oy + dy })
  }

  function handleConfirm() {
    const img = imgRef.current
    if (!img) return

    const dw = img.width * zoom
    const dh = img.height * zoom
    const dx = (CONTAINER - dw) / 2 + offset.x
    const dy = (CONTAINER - dh) / 2 + offset.y

    const cropLeft = CONTAINER / 2 - CROP_RADIUS
    const cropTop = CONTAINER / 2 - CROP_RADIUS
    const cropSize = CROP_RADIUS * 2

    const srcX = (cropLeft - dx) / zoom
    const srcY = (cropTop - dy) / zoom
    const srcSize = cropSize / zoom

    const out = document.createElement('canvas')
    out.width = 400
    out.height = 400
    const ctx = out.getContext('2d')
    ctx.beginPath()
    ctx.arc(200, 200, 200, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, 400, 400)

    out.toBlob(
      blob => onConfirm(new File([blob], 'avatar.jpg', { type: 'image/jpeg' })),
      'image/jpeg',
      0.92
    )
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 w-full max-w-xs shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white text-sm">Profil Fotoğrafını Düzenle</h3>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-500 mb-3 text-center">Sürükleyerek konumlandır, kaydırıcıyla yakınlaştır</p>

        <div className="flex justify-center mb-4">
          <canvas
            ref={canvasRef}
            style={{
              borderRadius: 12,
              cursor: dragging ? 'grabbing' : 'grab',
              width: CONTAINER,
              height: CONTAINER,
              touchAction: 'none',
              display: 'block',
            }}
            onMouseDown={e => startDrag(e.clientX, e.clientY)}
            onMouseMove={e => moveDrag(e.clientX, e.clientY)}
            onMouseUp={() => setDragging(false)}
            onMouseLeave={() => setDragging(false)}
            onTouchStart={e => { e.preventDefault(); startDrag(e.touches[0].clientX, e.touches[0].clientY) }}
            onTouchMove={e => { e.preventDefault(); moveDrag(e.touches[0].clientX, e.touches[0].clientY) }}
            onTouchEnd={() => setDragging(false)}
          />
        </div>

        <div className="flex items-center gap-3 mb-5">
          <ZoomIn className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
          <input
            type="range"
            min={minZoom}
            max={minZoom * 3}
            step={minZoom * 0.01}
            value={zoom}
            onChange={e => setZoom(parseFloat(e.target.value))}
            className="w-full accent-orange-500"
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1 text-sm py-2">İptal</button>
          <button onClick={handleConfirm} className="btn-primary flex-1 text-sm py-2 flex items-center justify-center gap-1.5">
            <Check className="h-3.5 w-3.5" /> Uygula
          </button>
        </div>
      </div>
    </div>
  )
}
