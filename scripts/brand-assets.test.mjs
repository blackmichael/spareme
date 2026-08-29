// @vitest-environment node
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { Resvg } from '@resvg/resvg-js'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))
const read = (file) => readFile(path.join(root, file))

function pngSize(buffer) {
  expect(buffer.subarray(1, 4).toString()).toBe('PNG')
  return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)]
}

function hexToRgb(hex) {
  return [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16))
}

function pinTilt(svg, bodyColor) {
  const image = new Resvg(svg, { fitTo: { mode: 'width', value: 256 } }).render()
  const target = hexToRgb(bodyColor)
  const points = []

  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const index = (y * image.width + x) * 4
      const distance = target.reduce((sum, channel, offset) => sum + (image.pixels[index + offset] - channel) ** 2, 0)
      if (distance < 225) points.push([x, y])
    }
  }

  const meanX = points.reduce((sum, point) => sum + point[0], 0) / points.length
  const meanY = points.reduce((sum, point) => sum + point[1], 0) / points.length
  let xx = 0
  let xy = 0
  let yy = 0

  for (const [x, y] of points) {
    const dx = x - meanX
    const dy = y - meanY
    xx += dx * dx
    xy += dx * dy
    yy += dy * dy
  }

  const axis = Math.atan2(2 * xy, xx - yy) * 90 / Math.PI
  return 90 - Math.abs(axis)
}

describe('brand assets', () => {
  it('matches the canonical brand source', () => {
    expect(() => execFileSync(process.execPath, ['scripts/generate-brand-assets.mjs', '--check'], {
      cwd: root,
      stdio: 'pipe',
    })).not.toThrow()
  })

  it('uses the canonical clipped pin in favicon output', async () => {
    const [source, favicon] = await Promise.all([
      read('src/brand/logo.json').then(JSON.parse),
      read('public/favicon.svg').then(String),
    ])

    expect(favicon).toContain(`viewBox="${source.pin.viewBox}"`)
    expect(favicon).toContain('<clipPath id="favicon-pin-clip">')
    expect(favicon).toContain('clip-path="url(#favicon-pin-clip)"')
    expect(favicon).toContain(`d="${source.pin.bodyPath}"`)
    expect(favicon.match(/data-brand-pin=/g)).toHaveLength(1)
    expect(favicon.match(/transform="rotate\(/g)).toHaveLength(1)
    expect(favicon).not.toMatch(/<svg\b[^>]*\btransform=/)
  })

  it('centers the canonical vector model in OG output', async () => {
    const [source, model, og] = await Promise.all([
      read('src/brand/logo.json').then(JSON.parse),
      read('src/brand/generated-logo.json').then(JSON.parse),
      read('public/og-image.svg').then(String),
    ])
    const scale = source.og.wordmarkEm / model.unitsPerEm
    const x = (source.og.width - model.width * scale) / 2
    const y = (source.og.height - model.height * scale) / 2

    expect(og).toContain(`transform="translate(${x} ${y}) scale(${scale})"`)
    expect(og).toContain('<clipPath id="og-pin-clip">')
    expect(og.match(/data-brand-pin=/g)).toHaveLength(1)
    expect(og.match(/transform="rotate\(/g)).toHaveLength(1)
    expect(og).not.toMatch(/<svg\b[^>]*\btransform=/)
    expect(og).not.toContain('<text')
  })

  it('rasterizes the pin at the canonical rightward angle exactly once', async () => {
    const [source, favicon] = await Promise.all([
      read('src/brand/logo.json').then(JSON.parse),
      read('public/favicon.svg'),
    ])
    const tilt = pinTilt(favicon, source.darkAsset.body)

    expect(tilt).toBeGreaterThan(source.layout.pinRotationDeg - 2)
    expect(tilt).toBeLessThan(source.layout.pinRotationDeg + 2)
  })

  it('generates all raster assets at their declared sizes', async () => {
    const [og, favicon, touchIcon] = await Promise.all([
      read('public/og-image.png'),
      read('public/favicon-32.png'),
      read('public/apple-touch-icon.png'),
    ])

    expect(pngSize(og)).toEqual([1200, 630])
    expect(pngSize(favicon)).toEqual([32, 32])
    expect(pngSize(touchIcon)).toEqual([180, 180])
  })
})
