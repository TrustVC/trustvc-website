import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import Home from '../pages/Home'
import carouselData from '../data/carouselData.json'

vi.mock('swiper/react', async () => {
  const { MockSwiper, MockSwiperSlide } = await import('./mocks/swiper')

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

describe('Home page', () => {
  it('renders carousel slide content from carouselData', () => {
    render(<Home isDarkMode={false} />)

    const firstItem = carouselData.items[0]
    const firstSlide = screen.getByLabelText('carousel-slide-0')

    expect(
      within(firstSlide).getByText(firstItem.content.title)
    ).toBeInTheDocument()

    expect(
      within(firstSlide).getByText(firstItem.content.subtitle)
    ).toBeInTheDocument()
  })

  it('shows the next carousel item when clicking the next navigation button', async () => {
    const user = userEvent.setup()
    render(<Home isDarkMode={false} />)

    await user.click(screen.getByLabelText('carousel-next-button'))

    const secondItem = carouselData.items[1]
    const secondSlide = screen.getByLabelText('carousel-slide-1')

    expect(
      within(secondSlide).getByText(secondItem.content.subtitle)
    ).toBeInTheDocument()
  })

  it('renders the Built for Developers section', () => {
    render(<Home isDarkMode={false} />)

    expect(screen.getByText(/Built for Developers/i)).toBeInTheDocument()

    expect(screen.getByText(/Trusted by Enterprises/i)).toBeInTheDocument()
  })
})
