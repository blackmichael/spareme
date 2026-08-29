import { createRequire } from 'node:module'
import { readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { Resvg } from '@resvg/resvg-js'

const require = createRequire(import.meta.url)
const fontkit = require('fontkit')
const root = fileURLToPath(new URL('..', import.meta.url))
const logo = JSON.parse(await readFile(path.join(root, 'src', 'brand', 'logo.json'), 'utf8'))
const font = fontkit.openSync(path.join(root, logo.typography.fontFile))
const checkOnly = process.argv.includes('--check')

function layoutText(text) {
  const run = font.layout(text)
  const tracking = logo.typography.trackingEm * font.unitsPerEm
  let cursor = 0

  const glyphs = run.glyphs.map((glyph, index) => {
    const position = run.positions[index]
    const result = {
      path: glyph.path.toSVG(),
      x: cursor + position.xOffset,
      yOffset: position.yOffset,
    }
    cursor += position.xAdvance + (index === run.glyphs.length - 1 ? 0 : tracking)
    return result
  })

  return { glyphs, width: cursor }
}

function createModel() {
  const units = font.unitsPerEm
  const lineHeight = logo.typography.lineHeightEm * units
  const height = logo.layout.pinHeightEm * units
  const textTop = (height - lineHeight) / 2
  const baseline = textTop + font.ascent + (lineHeight - font.ascent + font.descent) / 2
  const gap = logo.layout.gapEm * units
  const leading = layoutText(logo.text.leading)
  const trailing = layoutText(logo.text.trailing)
  const pin = {
    x: leading.width + gap,
    y: logo.layout.pinVerticalOffsetEm * units,
    width: logo.layout.pinWidthEm * units,
    height,
    rotationDeg: logo.layout.pinRotationDeg,
  }
  pin.centerX = pin.x + pin.width / 2
  pin.centerY = pin.y + pin.height / 2
  const trailingX = pin.x + pin.width + gap + logo.layout.trailingShiftEm * units
  const width = trailingX + trailing.width

  return {
    unitsPerEm: units,
    width,
    height,
    baseline,
    leading: { ...leading, x: 0 },
    trailing: { ...trailing, x: trailingX },
    pin,
  }
}

function renderGlyphs(part, model, fill) {
  return part.glyphs.map((glyph) =>
    `<path d="${glyph.path}" transform="translate(${part.x + glyph.x} ${model.baseline - glyph.yOffset}) scale(1 -1)" fill="${fill}" />`,
  ).join('\n    ')
}

function renderPin({ id, x, y, width, height, rotationDeg, centerX, centerY, colors, outlineWidth, stripeWidth }) {
  return `<g data-brand-pin="" transform="rotate(${rotationDeg} ${centerX} ${centerY})">
    <svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="${logo.pin.viewBox}" overflow="visible">
      <defs><clipPath id="${id}"><path d="${logo.pin.bodyPath}" /></clipPath></defs>
      <path fill="${colors.body}" d="${logo.pin.bodyPath}" />
      <g clip-path="url(#${id})"><path fill="none" stroke="${colors.stripe}" stroke-linecap="round" stroke-width="${stripeWidth}" d="${logo.pin.stripePath}" /></g>
      <path fill="none" stroke="${colors.outline}" stroke-linejoin="round" stroke-width="${outlineWidth}" d="${logo.pin.bodyPath}" />
    </svg>
  </g>`
}

function renderCanonicalWordmark(model, colors, id) {
  return `${renderGlyphs(model.leading, model, colors.text)}
    ${renderPin({ ...model.pin, id, colors, outlineWidth: logo.pin.outlineWidth, stripeWidth: logo.pin.stripeWidth })}
    ${renderGlyphs(model.trailing, model, colors.text)}`
}

function renderOg(model) {
  const scale = logo.og.wordmarkEm / model.unitsPerEm
  const x = (logo.og.width - model.width * scale) / 2
  const y = (logo.og.height - model.height * scale) / 2

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${logo.og.width}" height="${logo.og.height}" viewBox="0 0 ${logo.og.width} ${logo.og.height}">
  <rect width="${logo.og.width}" height="${logo.og.height}" fill="${logo.darkAsset.background}" />
  <g transform="translate(${x} ${y}) scale(${scale})">
    ${renderCanonicalWordmark(model, logo.darkAsset, 'og-pin-clip')}
  </g>
</svg>
`
}

function renderFavicon() {
  const size = logo.favicon.size
  const x = (size - logo.favicon.pinWidth) / 2
  const y = (size - logo.favicon.pinHeight) / 2

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${logo.favicon.cornerRadius}" fill="${logo.darkAsset.background}" />
  ${renderPin({
    id: 'favicon-pin-clip',
    x,
    y,
    width: logo.favicon.pinWidth,
    height: logo.favicon.pinHeight,
    rotationDeg: logo.layout.pinRotationDeg,
    centerX: size / 2,
    centerY: size / 2,
    colors: logo.darkAsset,
    outlineWidth: logo.favicon.outlineWidth,
    stripeWidth: logo.favicon.stripeWidth,
  })}
</svg>
`
}

const model = createModel()
const modelJson = `${JSON.stringify(model, null, 2)}\n`
const modelCss = `.wordmark {
  --brand-wordmark-text: ${logo.lightAsset.text};
  --brand-pin-body: ${logo.lightAsset.body};
  --brand-pin-outline: ${logo.lightAsset.outline};
  --brand-pin-stripe: ${logo.lightAsset.stripe};
}

[data-theme='dark'] .wordmark {
  --brand-wordmark-text: ${logo.darkAsset.text};
  --brand-pin-body: ${logo.darkAsset.body};
  --brand-pin-outline: ${logo.darkAsset.outline};
  --brand-pin-stripe: ${logo.darkAsset.stripe};
}
`
const ogSvg = renderOg(model)
const faviconSvg = renderFavicon()
const outputs = new Map([
  [path.join(root, 'src', 'brand', 'generated-logo.json'), modelJson],
  [path.join(root, 'src', 'brand', 'generated-logo.css'), modelCss],
  [path.join(root, 'public', 'og-image.svg'), ogSvg],
  [path.join(root, 'public', 'og-image.png'), new Resvg(ogSvg).render().asPng()],
  [path.join(root, 'public', 'favicon.svg'), faviconSvg],
  [path.join(root, 'public', 'favicon-32.png'), new Resvg(faviconSvg, { fitTo: { mode: 'width', value: 32 } }).render().asPng()],
  [path.join(root, 'public', 'apple-touch-icon.png'), new Resvg(faviconSvg, { fitTo: { mode: 'width', value: 180 } }).render().asPng()],
])

if (checkOnly) {
  const stale = []
  for (const [file, expected] of outputs) {
    try {
      const actual = await readFile(file)
      const expectedBuffer = Buffer.isBuffer(expected) ? expected : Buffer.from(expected)
      if (!actual.equals(expectedBuffer)) stale.push(path.relative(root, file))
    } catch {
      stale.push(path.relative(root, file))
    }
  }
  if (stale.length) throw new Error(`Brand assets are stale: ${stale.join(', ')}`)
} else {
  const temporaryFiles = []
  try {
    for (const [file, contents] of outputs) {
      const temporary = `${file}.tmp-${process.pid}`
      temporaryFiles.push(temporary)
      await writeFile(temporary, contents)
    }
    for (const [file] of outputs) await rename(`${file}.tmp-${process.pid}`, file)
  } finally {
    await Promise.all(temporaryFiles.map((file) => unlink(file).catch(() => {})))
  }
}
