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

    expect(
      within(firstSlide).getByText(firstItem.content.title)
    ).toBeInTheDocument()
    expect(
      within(firstSlide).getByText(firstItem.content.subtitle)
    ).toBeInTheDocument()
  })

  it('moves to the next slide when clicking the next button', async () => {
    const user = userEvent.setup()
    render(<Carousel isDarkMode={false} />)

    await user.click(screen.getByLabelText('carousel-next-button'))

    const secondItem = carouselData.items[1]
    const secondSlide = screen.getByLabelText('carousel-slide-1')

    expect(
      within(secondSlide).getByText(secondItem.content.subtitle)
    ).toBeInTheDocument()
  })

  it('disables the CTA when a slide does not include a link', async () => {
    const user = userEvent.setup()
    render(<Carousel isDarkMode={false} />)

    // Move to the slide without a link (index 2)
    await user.click(screen.getByLabelText('carousel-next-button'))
    await user.click(screen.getByLabelText('carousel-next-button'))

    const thirdSlide = screen.getByLabelText('carousel-slide-2')
    const comingSoonSpans = within(thirdSlide).getAllByText(/Coming Soon/i)
    const ctaLink = comingSoonSpans
      .map(span => span.closest('a'))
      .find(anchor => anchor)

    expect(ctaLink).toBeTruthy()
    expect(ctaLink).not.toHaveAttribute('href')
    expect(ctaLink).toHaveAttribute('aria-disabled', 'true')
  })
})
