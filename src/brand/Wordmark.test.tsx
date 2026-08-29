import { render } from '@testing-library/react'
import { Wordmark } from './Wordmark'
import logo from './logo.json'
import model from './generated-logo.json'

describe('Wordmark', () => {
  it('renders the canonical glyph paths and pin geometry', () => {
    const { container } = render(<Wordmark />)
    const wordmark = container.querySelector('.wordmark')
    const pinWrapper = wordmark?.querySelector('.brand-pin')
    const pin = pinWrapper?.querySelector('svg')
    const glyphs = wordmark?.querySelectorAll('.wordmark-text')

    expect(wordmark).toHaveAttribute('viewBox', `0 0 ${model.width} ${model.height}`)
    expect(glyphs).toHaveLength(model.leading.glyphs.length + model.trailing.glyphs.length)
    expect(glyphs?.[0]).toHaveAttribute('d', model.leading.glyphs[0].path)
    expect(pin).toHaveAttribute('viewBox', logo.pin.viewBox)
    expect(pinWrapper).toHaveAttribute('transform', `rotate(${model.pin.rotationDeg} ${model.pin.centerX} ${model.pin.centerY})`)
    expect(pin).not.toHaveAttribute('transform')
  })

  it('clips pin stripes and paints the outline last', () => {
    const { container } = render(<Wordmark />)
    const pin = container.querySelector('.brand-pin > svg')
    const layers = pin ? Array.from(pin.children) : []

    expect(pin?.querySelector('.brand-pin-stripe')?.closest('g')).toHaveAttribute('clip-path')
    expect(layers.at(-1)).toHaveClass('brand-pin-outline')
  })
})
