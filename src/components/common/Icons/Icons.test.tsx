import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import {
  CheckCircle,
  CrossCircle,
  QRCodeIcon,
  PrinterIcon,
  DownloadIcon,
  FileIcon,
} from './Icons'

describe('CheckCircle', () => {
  it('renders an SVG element', () => {
    const { container } = render(<CheckCircle />)
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
    expect(svg?.getAttribute('width')).toBe('20')
    expect(svg?.getAttribute('height')).toBe('20')
  })

  it('uses green stroke color', () => {
    const { container } = render(<CheckCircle />)
    const path = container.querySelector('path')
    expect(path?.getAttribute('stroke')).toBe('#3AAF86')
  })
})

describe('CrossCircle', () => {
  it('renders an SVG element', () => {
    const { container } = render(<CrossCircle />)
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
    expect(svg?.getAttribute('width')).toBe('20')
  })

  it('uses red stroke color', () => {
    const { container } = render(<CrossCircle />)
    const circle = container.querySelector('circle')
    expect(circle?.getAttribute('stroke')).toBe('#ef4444')
  })
})

describe('QRCodeIcon', () => {
  it('renders a 24x24 SVG', () => {
    const { container } = render(<QRCodeIcon />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('width')).toBe('24')
    expect(svg?.getAttribute('height')).toBe('24')
  })
})

describe('PrinterIcon', () => {
  it('renders a 24x24 SVG', () => {
    const { container } = render(<PrinterIcon />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('width')).toBe('24')
    expect(svg?.getAttribute('height')).toBe('24')
  })
})

describe('DownloadIcon', () => {
  it('renders a 24x24 SVG', () => {
    const { container } = render(<DownloadIcon />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('width')).toBe('24')
    expect(svg?.getAttribute('height')).toBe('24')
  })
})

describe('FileIcon', () => {
  it('renders an SVG element', () => {
    const { container } = render(
      <FileIcon filename="test.pdf" type="application/pdf" />
    )
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
    expect(svg?.getAttribute('width')).toBe('40')
    expect(svg?.getAttribute('height')).toBe('48')
  })

  it('shows PDF extension badge for PDF files', () => {
    const { container } = render(
      <FileIcon filename="test.pdf" type="application/pdf" />
    )
    const text = container.querySelector('text')
    expect(text?.textContent).toBe('PDF')
  })

  it('shows JSON extension badge for JSON files', () => {
    const { container } = render(
      <FileIcon filename="data.json" type="application/json" />
    )
    const text = container.querySelector('text')
    expect(text?.textContent).toBe('JSON')
  })

  it('uses red color for PDF badge', () => {
    const { container } = render(
      <FileIcon filename="test.pdf" type="application/pdf" />
    )
    const rect = container.querySelectorAll('rect')
    // The extension badge rect
    const badge = Array.from(rect).find(
      r => r.getAttribute('fill') === '#DC2626'
    )
    expect(badge).toBeTruthy()
  })

  it('uses blue color for PNG badge', () => {
    const { container } = render(
      <FileIcon filename="image.png" type="image/png" />
    )
    const rect = container.querySelectorAll('rect')
    const badge = Array.from(rect).find(
      r => r.getAttribute('fill') === '#2563EB'
    )
    expect(badge).toBeTruthy()
  })

  it('falls back to FILE for unknown types', () => {
    const { container } = render(
      <FileIcon filename="" type="application/octet-stream" />
    )
    const text = container.querySelector('text')
    expect(text?.textContent).toBe('FILE')
  })

  it('prefers filename extension over mime type', () => {
    const { container } = render(
      <FileIcon filename="data.csv" type="application/pdf" />
    )
    const text = container.querySelector('text')
    expect(text?.textContent).toBe('CSV')
  })
})
