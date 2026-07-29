import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import StatusAlert from './StatusAlert'
import CopyButton from './CopyButton'
import JsonTextarea from './JsonTextarea'
import ToolCard from './ToolCard'

describe('StatusAlert', () => {
  it('renders children with variant styling', () => {
    render(<StatusAlert variant="error">Something failed</StatusAlert>)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Something failed')
    expect(alert.className).toContain('alert')
  })
})

describe('CopyButton', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
  })
  it('copies text and shows feedback', async () => {
    render(<CopyButton getText={() => 'hello'} />)
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('hello')
    )
    expect(await screen.findByText(/copied/i)).toBeInTheDocument()
  })
})

describe('JsonTextarea', () => {
  it('renders label, value and forwards changes', () => {
    const onChange = vi.fn()
    render(
      <JsonTextarea id="raw" label="Raw JSON" value="{}" onChange={onChange} />
    )
    const box = screen.getByLabelText('Raw JSON')
    fireEvent.change(box, { target: { value: '{"a":1}' } })
    expect(onChange).toHaveBeenCalledWith('{"a":1}')
  })
})

describe('ToolCard', () => {
  it('renders title, description and children', () => {
    render(
      <ToolCard icon={<span>i</span>} title="Wrap / Unwrap" description="desc">
        <p>body</p>
      </ToolCard>
    )
    expect(screen.getByText('Wrap / Unwrap')).toBeInTheDocument()
    expect(screen.getByText('desc')).toBeInTheDocument()
    expect(screen.getByText('body')).toBeInTheDocument()
  })
})
