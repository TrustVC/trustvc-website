import { describe, expect, it } from 'vitest'
import { render, screen } from '../../__tests__/test-utils'
import userEvent from '@testing-library/user-event'
import ToolkitPage from './index'

describe('Toolkit page', () => {
  it('renders the hero and default wrap tool', () => {
    render(<ToolkitPage isDarkMode={false} />, {
      routerProps: { initialEntries: ['/toolkit'] },
    })
    expect(
      screen.getByRole('heading', { name: /the trustvc toolkit/i })
    ).toBeInTheDocument()
    expect(screen.getAllByText('Wrap / Unwrap').length).toBeGreaterThan(0)
    expect(screen.getByLabelText('Wrap document')).toBeInTheDocument()
  })

  it('switches tools from the query string', async () => {
    const user = userEvent.setup()
    render(<ToolkitPage isDarkMode={false} />, {
      routerProps: { initialEntries: ['/toolkit'] },
    })
    await user.click(screen.getByRole('tab', { name: /dns resolver/i }))
    expect(screen.getByLabelText('Domain:')).toBeInTheDocument()
  })
})
