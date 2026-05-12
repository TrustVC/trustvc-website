import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from './test-utils'

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

const renderHome = (isDarkMode: boolean) =>
  render(<Home isDarkMode={isDarkMode} />)

describe('Home page', () => {
  it('renders hero and verify sections', () => {
    renderHome(false)

    expect(screen.getByText(/Simple,/i)).toBeInTheDocument()
    expect(screen.getByText(/Trustworthy/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Drop TrustVC files here to verify/i)
    ).toBeInTheDocument()
  })

  it('wires the carousel data through the router', () => {
    renderHome(false)

    const firstItem = carouselData.items[0]
    const firstSlide = screen.getByLabelText('carousel-slide-0')

    expect(within(firstSlide).getByText(firstItem.subtitle)).toBeInTheDocument()
  })

  it('renders the Built for Developers section title', () => {
    renderHome(false)
    expect(screen.getByText(/Built for Developers,/i)).toBeInTheDocument()
  })

  describe('Partners section', () => {
    it('renders the Partners section heading', () => {
      renderHome(false)
      const heading = screen.getByRole('heading', {
        level: 2,
        name: /Our Partners/i,
      })
      expect(heading).toBeInTheDocument()
    })

    it('renders the Partners section tagline', () => {
      renderHome(false)
      expect(
        screen.getByText(/Building a foundation of trust for every industry/i)
      ).toBeInTheDocument()
    })

    it('renders the View All Partners button', () => {
      renderHome(false)
      expect(
        screen.getByRole('button', { name: /View All Partners/i })
      ).toBeInTheDocument()
    })

    it('renders at least one partner logo', () => {
      renderHome(false)
      expect(
        screen.getByRole('img', { name: 'Institute of Technical Education' })
      ).toBeInTheDocument()
    })
  })
})
