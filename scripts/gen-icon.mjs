import { Resvg } from '@resvg/resvg-js'
import { writeFileSync, readFileSync } from 'fs'

// Read the transparent logo and embed as base64 data URI
const logoPath = 'public/torqvia-logo.png'
const logoBase64 = readFileSync(logoPath).toString('base64')
const logoDataUri = `data:image/png;base64,${logoBase64}`

// 180x180 icon with dark background + centered logo
const PADDING = 20
const SIZE = 180
const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <!-- Dark background matching app theme -->
  <rect width="${SIZE}" height="${SIZE}" fill="#09090b"/>
  <!-- Logo centered with padding -->
  <image href="${logoDataUri}" x="${PADDING}" y="${PADDING}" width="${SIZE - PADDING * 2}" height="${SIZE - PADDING * 2}" preserveAspectRatio="xMidYMid meet"/>
</svg>`

const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: SIZE } })
const png = resvg.render().asPng()
writeFileSync('public/apple-touch-icon.png', png)
console.log(`Generated public/apple-touch-icon.png (${SIZE}x${SIZE}) with dark background`)
