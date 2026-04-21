import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import Carousel from './Carousel'
import carouselData from '../../../data/carousel.json'

vi.mock('swiper/react', async () => {
  const { MockSwiper, MockSwiperSlide } =
    await import('../../../__tests__/__mocks__/swiper')

  return {
    Swiper: MockSwiper,
    SwiperSlide: MockSwiperSlide,
  }
})

vi.mock('swiper/modules', () => ({
  Navigation: {},
  Pagination: {},
  Autoplay: {},
}))

describe('Carousel', () => {
  it('renders the first slide content from carousel data', () => {
    render(<Carousel isDarkMode={false} />)

    const firstItem = carouselData.items[0]
    const firstSlide = screen.getByLabelText('carousel-slide-0')

    expect(within(firstSlide).getByText(firstItem.title)).toBeInTheDocument()
    expect(within(firstSlide).getByText(firstItem.subtitle)).toBeInTheDocument()
  })

  it('moves to the next slide when clicking the next button', async () => {
    const user = userEvent.setup()
    render(<Carousel isDarkMode={false} />)

    await user.click(screen.getByLabelText('carousel-next-button'))

    const secondItem = carouselData.items[1]
    const secondSlide = screen.getByLabelText('carousel-slide-1')

    expect(
      within(secondSlide).getByText(secondItem.subtitle)
    ).toBeInTheDocument()
  })

  it('renders Learn more button with correct link when slide has a link', async () => {
    const user = userEvent.setup()
    render(<Carousel isDarkMode={false} />)

    // Navigate to the second slide (index 1) which has a link
    await user.click(screen.getByLabelText('carousel-next-button'))

    const secondItem = carouselData.items[1]
    const secondSlide = screen.getByLabelText('carousel-slide-1')

    const learnMoreLink = within(secondSlide)
      .getByText(/Learn more/i)
      .closest('a')

    expect(learnMoreLink).toBeTruthy()
    expect(learnMoreLink).toHaveAttribute('href', secondItem.link)
    expect(learnMoreLink).toHaveAttribute('target', '_blank')
    expect(learnMoreLink).toHaveAttribute('rel', 'noopener noreferrer')
    expect(learnMoreLink).not.toHaveAttribute('aria-disabled', 'true')
  })

  it('does not render a CTA when a slide does not include a link', () => {
    render(<Carousel isDarkMode={false} />)

    // First slide (index 0) has no link
    const firstSlide = screen.getByLabelText('carousel-slide-0')

    expect(
      within(firstSlide).queryByText(/Learn more/i)
    ).not.toBeInTheDocument()
  })
})
