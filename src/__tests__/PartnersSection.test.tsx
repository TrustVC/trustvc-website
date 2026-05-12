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
  'LaSalle | UAS',
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
    it('renders logos for all 5 home partners', () => {
      render(<PartnersSection isDarkMode={false} />)
      HOME_PARTNERS.forEach(name => {
        expect(screen.getByRole('img', { name })).toBeInTheDocument()
      })
    })

    it('renders logos with lazy loading', () => {
      render(<PartnersSection isDarkMode={false} />)
      const imgs = screen.getAllByRole('img')
      imgs.forEach(img => expect(img).toHaveAttribute('loading', 'lazy'))
    })

    it('applies hidden class to partners at index 2 and beyond for mobile', () => {
      render(<PartnersSection isDarkMode={false} />)
      const jslaImg = screen.getByRole('img', { name: 'JSLA' })
      const container = jslaImg.closest('div')
      expect(container?.className).toContain('hidden')
    })

    it('first two partners are always visible (no hidden class)', () => {
      render(<PartnersSection isDarkMode={false} />)
      const firstImg = screen.getByRole('img', { name: HOME_PARTNERS[0] })
      const container = firstImg.closest('div')
      expect(container?.className).not.toContain('hidden')
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
