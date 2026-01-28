import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'

import Home from '../pages/Home'
import carouselData from '../data/carousel.json'

vi.mock('swiper/react', async () => {
  const { MockSwiper, MockSwiperSlide } = await import('./__mocks__/swiper')

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
  it('renders hero and verify sections', () => {
    render(<Home isDarkMode={false} />)

    expect(screen.getByText(/Simple,/i)).toBeInTheDocument()
    expect(screen.getByText(/Trustworthy/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Drop TrustVC files here to verify/i)
    ).toBeInTheDocument()
  })

  it('wires the carousel data through the router', () => {
    render(<Home isDarkMode={false} />)

    const firstItem = carouselData.items[0]
    const firstSlide = screen.getByLabelText('carousel-slide-0')

    expect(
      within(firstSlide).getByText(firstItem.content.subtitle)
    ).toBeInTheDocument()
  })

  it('renders the Built for Developers section title', () => {
    render(<Home isDarkMode={false} />)

    expect(screen.getByText(/Built for Developers,/i)).toBeInTheDocument()
  })
})
