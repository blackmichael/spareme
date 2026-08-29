import { useId } from 'react'
import logo from './logo.json'
import model from './generated-logo.json'
import './generated-logo.css'

type WordPart = typeof model.leading

function WordPaths({ part }: { part: WordPart }) {
  return part.glyphs.map((glyph, index) => (
    <path
      key={index}
      className="wordmark-text"
      d={glyph.path}
      transform={`translate(${part.x + glyph.x} ${model.baseline - glyph.yOffset}) scale(1 -1)`}
    />
  ))
}

export function Wordmark() {
  const clipId = `pin-body-clip-${useId().replaceAll(':', '')}`
  const pin = model.pin

  return (
    <svg
      className="wordmark"
      viewBox={`0 0 ${model.width} ${model.height}`}
      width={model.width}
      height={model.height}
      aria-hidden="true"
      focusable="false"
    >
      <WordPaths part={model.leading} />
      <g
        className="brand-pin"
        transform={`rotate(${pin.rotationDeg} ${pin.centerX} ${pin.centerY})`}
      >
        <svg
          x={pin.x}
          y={pin.y}
          width={pin.width}
          height={pin.height}
          viewBox={logo.pin.viewBox}
          overflow="visible"
        >
          <defs>
            <clipPath id={clipId}>
              <path d={logo.pin.bodyPath} />
            </clipPath>
          </defs>
          <path className="brand-pin-fill" d={logo.pin.bodyPath} />
          <g clipPath={`url(#${clipId})`}>
            <path className="brand-pin-stripe" strokeWidth={logo.pin.stripeWidth} d={logo.pin.stripePath} />
          </g>
          <path className="brand-pin-outline" strokeWidth={logo.pin.outlineWidth} d={logo.pin.bodyPath} />
        </svg>
      </g>
      <WordPaths part={model.trailing} />
    </svg>
  )
}
