import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from './test-utils'
import PartnersSection from '../components/home/PartnersSection'

const mockNavigate = vi.hoisted(() => vi.fn())

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...(actual as object),
    useNavigate: () => mockNavigate,
  }
})

const HOME_PARTNERS = [
  'Institute of Technical Education',
  'Jed',
  'JSLA',
  'JUPYTON',
  'LASALLE College of the Arts',
]

afterEach(() => {
  vi.clearAllMocks()
})

describe('PartnersSection', () => {
  describe('heading and tagline', () => {
    it('renders "Our Partners" heading', () => {
      render(<PartnersSection isDarkMode={false} />)
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveTextContent('Our Partners')
    })

    it('renders the tagline text', () => {
      render(<PartnersSection isDarkMode={false} />)
      expect(
        screen.getByText(/Building a foundation of trust for every industry/i)
      ).toBeInTheDocument()
    })
  })

  describe('partner logos', () => {
    it('renders logos for home partners in the marquee', () => {
      render(<PartnersSection isDarkMode={false} />)
      HOME_PARTNERS.forEach(name => {
        const imgs = screen.getAllByRole('img', { name })
        expect(imgs.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('renders logos with eager loading for marquee animation', () => {
      render(<PartnersSection isDarkMode={false} />)
      const imgs = screen.getAllByRole('img')
      imgs.forEach(img => expect(img).toHaveAttribute('loading', 'eager'))
    })

    it('duplicates partner logos for infinite marquee effect', () => {
      render(<PartnersSection isDarkMode={false} />)
      const firstPartnerImgs = screen.getAllByRole('img', {
        name: HOME_PARTNERS[0],
      })
      expect(firstPartnerImgs.length).toBe(2)
    })

    it('all partner logo containers are visible (no hidden class)', () => {
      render(<PartnersSection isDarkMode={false} />)
      const imgs = screen.getAllByRole('img', { name: HOME_PARTNERS[0] })
      imgs.forEach(img => {
        const container = img.closest('div')
        expect(container?.className).not.toContain('hidden')
      })
    })
  })

  describe('View All Partners CTA', () => {
    it('renders View All Partners button', () => {
      render(<PartnersSection isDarkMode={false} />)
      expect(
        screen.getByRole('button', { name: /View All Partners/i })
      ).toBeInTheDocument()
    })

    it('navigates to /partners when button is clicked', () => {
      render(<PartnersSection isDarkMode={false} />)
      fireEvent.click(
        screen.getByRole('button', { name: /View All Partners/i })
      )
      expect(mockNavigate).toHaveBeenCalledWith('/partners')
    })

    it('calls navigate exactly once per click', () => {
      render(<PartnersSection isDarkMode={false} />)
      fireEvent.click(
        screen.getByRole('button', { name: /View All Partners/i })
      )
      expect(mockNavigate).toHaveBeenCalledTimes(1)
    })
  })

  describe('dark/light mode', () => {
    it('applies dark mode text class to "Our" span in heading', () => {
      render(<PartnersSection isDarkMode={true} />)
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading.innerHTML).toContain('text-neutral-60')
    })

    it('applies light mode text class to "Our" span in heading', () => {
      render(<PartnersSection isDarkMode={false} />)
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading.innerHTML).toContain('text-[#1E2026]')
    })

    it('applies dark mode class to tagline paragraph', () => {
      render(<PartnersSection isDarkMode={true} />)
      const tagline = screen.getByText(/Building a foundation of trust/i)
      expect(tagline.className).toContain('text-neutral-50')
    })

    it('applies light mode class to tagline paragraph', () => {
      render(<PartnersSection isDarkMode={false} />)
      const tagline = screen.getByText(/Building a foundation of trust/i)
      expect(tagline.className).toContain('text-[#3D444D]')
    })
  })
})
