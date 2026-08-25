import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../__tests__/test-utils'
import userEvent from '@testing-library/user-event'
import WrapUnwrapTool from './WrapUnwrapTool'
import { INVALID_JSON_MESSAGE } from '@/utils/toolkit/types'

vi.mock('@/utils/toolkit/wrap', async () => {
  const actual = await vi.importActual<typeof import('@/utils/toolkit/wrap')>(
    '@/utils/toolkit/wrap'
  )
  return actual
})

describe('WrapUnwrapTool', () => {
  it('shows a graceful error for non-JSON input', async () => {
    const user = userEvent.setup()
    render(<WrapUnwrapTool isDarkMode={false} />)
    await user.type(
      screen.getByPlaceholderText(/paste document json here/i),
      'not-json'
    )
    await user.click(screen.getByLabelText('Wrap document'))
    expect(await screen.findByText(INVALID_JSON_MESSAGE)).toBeInTheDocument()
  })

  it('swaps pane labels and placeholders when switching to unwrap', async () => {
    const user = userEvent.setup()
    render(<WrapUnwrapTool isDarkMode={false} />)
    expect(
      screen.getByRole('textbox', { name: 'RAW JSON' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('textbox', { name: 'WRAPPED DOCUMENT' })
    ).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: /^unwrap$/i }))
    expect(
      screen.getByPlaceholderText(/paste a wrapped document json here/i)
    ).toBeInTheDocument()
    expect(
      screen.getByRole('textbox', { name: 'WRAPPED DOCUMENT' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('textbox', { name: 'RAW JSON' })
    ).toBeInTheDocument()
  })
})
