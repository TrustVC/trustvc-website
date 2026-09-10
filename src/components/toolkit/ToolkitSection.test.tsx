import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '../../__tests__/test-utils'
import userEvent from '@testing-library/user-event'
import ToolkitSection from './ToolkitSection'
import type { ToolkitTool } from '@/utils/toolkit/types'

const ToolkitSectionHarness = ({
  initial = 'encrypt',
}: {
  initial?: ToolkitTool
}) => {
  const [active, setActive] = useState<ToolkitTool>(initial)
  return (
    <ToolkitSection active={active} onChange={setActive} isDarkMode={false} />
  )
}

describe('ToolkitSection', () => {
  it('does not reload the encrypt sample after leaving and returning to the tool', async () => {
    const user = userEvent.setup()
    render(<ToolkitSectionHarness />)

    await user.click(
      screen.getByRole('button', { name: /load sample document/i })
    )
    expect(screen.getByLabelText('Document JSON')).toHaveDisplayValue(
      /Alice Lim/
    )

    await user.click(screen.getByRole('tab', { name: /wrap \/ unwrap/i }))
    await user.click(screen.getByRole('tab', { name: /encrypt \/ decrypt/i }))

    expect(screen.getByLabelText('Document JSON')).toHaveDisplayValue('')
  })

  it('still loads the sample while the encrypt tool stays active', async () => {
    const user = userEvent.setup()
    render(<ToolkitSectionHarness />)

    await user.click(
      screen.getByRole('button', { name: /load sample document/i })
    )
    expect(screen.getByLabelText('Document JSON')).toHaveDisplayValue(
      /Alice Lim/
    )
  })
})
