import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import NetworkTooltip from './NetworkTooltip'

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('NetworkTooltip', () => {
  const position = { top: 100, left: 200, width: 280 }

  // ── Visibility ─────────────────────────────────────────────────────────────

  describe('visibility', () => {
    it('renders nothing when isVisible is false', () => {
      const { container } = render(
        <NetworkTooltip isVisible={false} position={position} />
      )
      expect(container).toBeEmptyDOMElement()
    })

    it('renders the tooltip when isVisible is true', () => {
      render(<NetworkTooltip isVisible={true} position={position} />)
      expect(screen.getByText('Network Selector')).toBeInTheDocument()
    })
  })

  // ── Content ────────────────────────────────────────────────────────────────

  describe('content', () => {
    it('renders the title "Network Selector"', () => {
      render(<NetworkTooltip isVisible={true} position={position} />)
      expect(screen.getByText('Network Selector')).toBeInTheDocument()
    })

    it('renders the first body paragraph about same-network verification', () => {
      render(<NetworkTooltip isVisible={true} position={position} />)
      expect(
        screen.getByText(
          /A document can only be successfully verified on the same network/
        )
      ).toBeInTheDocument()
    })

    it('renders the second body paragraph about checking with the issuer', () => {
      render(<NetworkTooltip isVisible={true} position={position} />)
      expect(
        screen.getByText(/If unsure, do check with the document issuer/)
      ).toBeInTheDocument()
    })
  })

  // ── Positioning ────────────────────────────────────────────────────────────

  describe('positioning', () => {
    it('applies top, left, and width from the position prop', () => {
      const { container } = render(
        <NetworkTooltip
          isVisible={true}
          position={{ top: 50, left: 120, width: 300 }}
        />
      )
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.style.top).toBe('50px')
      expect(wrapper.style.left).toBe('120px')
      expect(wrapper.style.width).toBe('300px')
    })

    it('has the "fixed" positioning class on the outer wrapper', () => {
      const { container } = render(
        <NetworkTooltip isVisible={true} position={position} />
      )
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.className).toContain('fixed')
    })

    it('has the "pointer-events-none" class on the outer wrapper', () => {
      const { container } = render(
        <NetworkTooltip isVisible={true} position={position} />
      )
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.className).toContain('pointer-events-none')
    })

    it('renders the inner content with the nm-tooltip-inner class', () => {
      const { container } = render(
        <NetworkTooltip isVisible={true} position={position} />
      )
      expect(container.querySelector('.nm-tooltip-inner')).toBeInTheDocument()
    })
  })
})
