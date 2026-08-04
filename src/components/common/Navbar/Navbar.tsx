import { useState, useRef, useEffect, Dispatch, SetStateAction } from 'react'
import { useLocation, Link } from 'react-router-dom'
import Logo from '../Logo'

interface NavbarProps {
  isDarkMode: boolean
  setIsDarkMode: Dispatch<SetStateAction<boolean>>
}

const Navbar = ({ isDarkMode, setIsDarkMode: _setIsDarkMode }: NavbarProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [_isEcosystemOpen, setIsEcosystemOpen] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  const location = useLocation()
  const isSettingsActive = location.pathname.startsWith('/settings')
  const isNewsActive = location.pathname.startsWith('/news-updates')
  const isPartnersActive = location.pathname.startsWith('/partners')
  const isAboutActive = location.pathname.startsWith('/about')

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isMobileMenuOpen &&
        navRef.current &&
        !navRef.current.contains(e.target as Node)
      ) {
        setIsMobileMenuOpen(false)
        setIsEcosystemOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMobileMenuOpen])

  return (
    <nav
      ref={navRef}
      className={`navbar ${isDarkMode ? 'navbar-dark' : 'navbar-light'}`}
    >
      <div className="flex items-center justify-center h-full max-w-[1440px] mx-auto">
        {/* Tablet View - Centered Logo with Hamburger */}
        <div className="flex lg:hidden items-center justify-between w-full">
          {/* Hamburger Menu Button */}
          <div className="w-14 h-14 flex items-center justify-center">
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen)
                if (isMobileMenuOpen) {
                  setIsEcosystemOpen(false)
                }
              }}
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen}
              className="w-10 h-10 flex items-center justify-center rounded-lg transition-colors duration-200"
              style={{
                backgroundColor: 'transparent',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = isDarkMode
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.05)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20.1694 16.75C20.5835 16.7501 20.9194 17.0859 20.9194 17.5C20.9192 17.914 20.5834 18.2499 20.1694 18.25H3.83057C3.41649 18.25 3.08076 17.914 3.08057 17.5C3.08057 17.0858 3.41637 16.75 3.83057 16.75H20.1694ZM20.1694 11.25C20.5835 11.2501 20.9194 11.5859 20.9194 12C20.9192 12.414 20.5834 12.7499 20.1694 12.75H3.83057C3.41649 12.75 3.08076 12.414 3.08057 12C3.08057 11.5858 3.41637 11.25 3.83057 11.25H20.1694ZM20.1694 5.75C20.5835 5.75012 20.9194 6.08586 20.9194 6.5C20.9192 6.91397 20.5834 7.24988 20.1694 7.25H3.83057C3.41649 7.24998 3.08076 6.91404 3.08057 6.5C3.08057 6.0858 3.41637 5.75002 3.83057 5.75H20.1694Z"
                  fill="#5B6571"
                />
              </svg>
            </button>
          </div>

          {/* Centered Logo */}
          <Logo isDarkMode={isDarkMode} />

          {/* Spacer for balance */}
          <div className="w-14 h-14 opacity-0"></div>
        </div>

        {/* Desktop View - Full Navbar */}
        <div className="hidden lg:flex items-center justify-between w-full">
          {/* Logo */}
          <Logo isDarkMode={isDarkMode} />

          {/* Navigation Tabs */}
          <div className="flex items-center">
            <div className="p-2">
              <Link
                to="/about"
                className="min-w-[40px] min-h-[40px] flex items-center justify-center px-1 py-[5px] rounded-lg transition-colors duration-200"
                style={{ backgroundColor: 'transparent' }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = isDarkMode
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.05)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <div
                  className="px-1 py-1 text-center text-sm font-bold font-urbanist leading-snug"
                  style={{
                    color: isAboutActive
                      ? isDarkMode
                        ? '#7D80D7'
                        : '#5B5BB3'
                      : isDarkMode
                        ? '#808894'
                        : '#5B6571',
                  }}
                >
                  About
                </div>
              </Link>
            </div>

            <div className="p-2">
              <Link
                to="/partners"
                className="min-w-[40px] min-h-[40px] flex items-center justify-center px-1 py-[5px] rounded-lg transition-colors duration-200"
                style={{ backgroundColor: 'transparent' }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = isDarkMode
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.05)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <div
                  className="px-1 py-1 text-center text-sm font-bold font-urbanist leading-snug"
                  style={{
                    color: isPartnersActive
                      ? isDarkMode
                        ? '#7D80D7'
                        : '#5B5BB3'
                      : isDarkMode
                        ? '#808894'
                        : '#5B6571',
                  }}
                >
                  Partners
                </div>
              </Link>
            </div>

            {/* Ecosystem and Gallery temporarily removed - restore from git */}
            <div className="p-2">
              <Link
                to="/news-updates"
                className="min-w-[40px] min-h-[40px] flex items-center justify-center px-1 py-[5px] rounded-lg transition-colors duration-200"
                style={{ backgroundColor: 'transparent' }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = isDarkMode
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.05)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <div
                  className="px-1 py-1 text-center text-sm font-bold font-urbanist leading-snug"
                  style={{
                    color: isNewsActive
                      ? isDarkMode
                        ? '#7D80D7'
                        : '#5B5BB3'
                      : isDarkMode
                        ? '#808894'
                        : '#5B6571',
                  }}
                >
                  News &amp; Updates
                </div>
              </Link>
            </div>
          </div>

          {/* Right Side - Theme Toggle & CTA */}
          <div className="flex items-center">
            {/* Sun/Moon icons temporarily hidden */}
            {/* <div className="p-1 flex items-center">
              <div className="p-1">
                <button type="button" onClick={() => setIsDarkMode(false)} aria-label="Switch to light mode" aria-pressed={!isDarkMode} className="min-w-[40px] min-h-[40px] flex items-center justify-center p-[5px] rounded-lg overflow-hidden transition-colors duration-200" style={{ backgroundColor: 'transparent' }} onMouseEnter={e => { e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }} onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 19.3755C12.2761 19.3755 12.5 19.5993 12.5 19.8755V22.1255C12.4999 22.4015 12.2761 22.6255 12 22.6255C11.724 22.6255 11.5001 22.4015 11.5 22.1255V19.8755C11.5 19.5994 11.7239 19.3755 12 19.3755ZM17.0371 17.6968C17.2323 17.5017 17.5489 17.5017 17.7441 17.6968L19.335 19.2876C19.5302 19.4828 19.5301 19.7994 19.335 19.9946C19.1397 20.1899 18.8232 20.1899 18.6279 19.9946L17.0371 18.4038C16.842 18.2085 16.8419 17.892 17.0371 17.6968ZM6.07715 17.52C6.27241 17.3248 6.58892 17.3248 6.78418 17.52C6.9793 17.7153 6.97939 18.0318 6.78418 18.2271L5.19336 19.8179C4.99814 20.0131 4.6816 20.013 4.48633 19.8179C4.29109 19.6226 4.29109 19.3061 4.48633 19.1108L6.07715 17.52ZM12 6.25146C15.3137 6.25146 18 8.93776 18 12.2515C18 15.5652 15.3137 18.2515 12 18.2515C8.6863 18.2514 6 15.5652 6 12.2515C6 8.93777 8.6863 6.25148 12 6.25146ZM4.125 11.7515C4.40114 11.7515 4.625 11.9753 4.625 12.2515C4.625 12.5276 4.40114 12.7515 4.125 12.7515H1.875C1.59887 12.7514 1.375 12.5276 1.375 12.2515C1.375 11.9753 1.59887 11.7515 1.875 11.7515H4.125ZM22.125 11.7515C22.4011 11.7515 22.625 11.9753 22.625 12.2515C22.625 12.5276 22.4011 12.7515 22.125 12.7515H19.875C19.5989 12.7514 19.375 12.5276 19.375 12.2515C19.375 11.9753 19.5989 11.7515 19.875 11.7515H22.125ZM4.30859 4.96924C4.50385 4.77398 4.82134 4.77399 5.0166 4.96924L6.60742 6.56006C6.80243 6.75531 6.80251 7.07189 6.60742 7.26709C6.41223 7.46226 6.09567 7.46213 5.90039 7.26709L4.30859 5.67627C4.11358 5.48113 4.11377 5.1645 4.30859 4.96924ZM18.8057 4.7915C19.0009 4.59625 19.3174 4.59626 19.5127 4.7915C19.7079 4.98677 19.7079 5.30329 19.5127 5.49854L17.9219 7.08936C17.7266 7.28442 17.4101 7.2845 17.2148 7.08936C17.0197 6.89415 17.0198 6.5776 17.2148 6.38232L18.8057 4.7915ZM12 1.37451C12.2761 1.37451 12.5 1.59837 12.5 1.87451V4.12451C12.5 4.40065 12.2761 4.62451 12 4.62451C11.7239 4.6245 11.5 4.40064 11.5 4.12451V1.87451C11.5 1.59838 11.7239 1.37453 12 1.37451Z" fill={isDarkMode ? '#7D80D7' : '#5B5BB3'} /></svg>
                </button>
              </div>
              <div className="p-1">
                <button type="button" onClick={() => setIsDarkMode(true)} aria-label="Switch to dark mode" aria-pressed={isDarkMode} className="min-w-[40px] min-h-[40px] flex items-center justify-center p-[5px] rounded-lg overflow-hidden transition-colors duration-200" style={{ backgroundColor: 'transparent' }} onMouseEnter={e => { e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }} onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.0762 3.12256C10.548 3.01394 10.8224 3.62283 10.5254 4.00537C9.63836 5.1475 9.1095 6.58192 9.10938 8.14014C9.10938 11.8679 12.1317 14.8899 15.8594 14.8901C17.4179 14.89 18.8529 14.3615 19.9951 13.4741C20.3776 13.1771 20.9865 13.4515 20.8779 13.9233C19.9565 17.9146 16.3806 20.8899 12.1094 20.8901C7.13903 20.8899 3.10938 16.8605 3.10938 11.8901C3.10964 7.61922 6.08536 4.04415 10.0762 3.12256Z" fill={isDarkMode ? '#808894' : '#5B6571'} /></svg>
                </button>
              </div>
            </div> */}
            <div className="p-1">
              <Link
                to="/settings"
                aria-label="Settings"
                className="min-w-[40px] min-h-[40px] flex items-center justify-center p-[5px] rounded-lg overflow-hidden transition-colors duration-200"
                style={{ backgroundColor: 'transparent' }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = isDarkMode
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.05)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12.6533 2.25C13.5085 2.25022 14.2381 2.86844 14.3789 3.71191L14.5283 4.6084C14.5426 4.69337 14.6001 4.76487 14.6797 4.79785L15.1982 5.0127C15.2778 5.04556 15.3684 5.03524 15.4385 4.98535L16.1777 4.45703C16.8738 3.95986 17.8277 4.03886 18.4326 4.64355L19.3555 5.56738C19.9604 6.17229 20.0402 7.12614 19.543 7.82227L19.0146 8.56055C18.9645 8.63072 18.9543 8.72208 18.9873 8.80176L19.2021 9.32031C19.2351 9.39994 19.3066 9.45744 19.3916 9.47168L20.2881 9.62109C21.1316 9.76188 21.7498 10.4915 21.75 11.3467V12.6523C21.75 13.5077 21.1317 14.2381 20.2881 14.3789L19.3916 14.5283C19.3068 14.5426 19.2352 14.5994 19.2021 14.6787L18.9873 15.1982C18.9545 15.2778 18.9648 15.3684 19.0146 15.4385L19.543 16.1777C20.0401 16.8738 19.9612 17.8277 19.3564 18.4326L18.4326 19.3555C17.8277 19.9604 16.8739 20.0402 16.1777 19.543L15.4395 19.0146C15.3693 18.9645 15.2779 18.9543 15.1982 18.9873L14.6797 19.2021C14.6001 19.2351 14.5426 19.3066 14.5283 19.3916L14.3789 20.2881C14.2381 21.1316 13.5085 21.7498 12.6533 21.75H11.3467C10.4916 21.7498 9.76187 21.1316 9.62109 20.2881L9.47168 19.3916C9.45743 19.3066 9.39993 19.2351 9.32031 19.2021L8.80176 18.9873C8.72223 18.9544 8.63161 18.9648 8.56152 19.0146L7.82227 19.543C7.12623 20.0401 6.1723 19.9611 5.56738 19.3564L4.64453 18.4326C4.03964 17.8277 3.95982 16.8739 4.45703 16.1777L4.98535 15.4395C5.03548 15.3693 5.04567 15.2779 5.0127 15.1982L4.79785 14.6797C4.76486 14.6001 4.6934 14.5426 4.6084 14.5283L3.71191 14.3789C2.86843 14.2381 2.25017 13.5085 2.25 12.6533V11.3477C2.25 10.4923 2.8683 9.7619 3.71191 9.62109L4.6084 9.47168C4.69319 9.45744 4.76479 9.40065 4.79785 9.32129L5.0127 8.80176C5.04555 8.72223 5.03525 8.63161 4.98535 8.56152L4.45703 7.82227C3.95987 7.12623 4.03885 6.1723 4.64355 5.56738L5.56738 4.64453C6.17228 4.03963 7.12614 3.95982 7.82227 4.45703L8.56055 4.98535C8.63072 5.03548 8.72208 5.04567 8.80176 5.0127L9.32031 4.79785C9.39993 4.76487 9.45743 4.69338 9.47168 4.6084L9.62109 3.71191C9.76187 2.86845 10.4916 2.25023 11.3467 2.25H12.6533ZM11.3467 3.75C11.2247 3.75023 11.1207 3.83859 11.1006 3.95898L10.9512 4.85449C10.8519 5.45012 10.4524 5.95251 9.89453 6.18359L9.37598 6.39844C8.81821 6.62946 8.18078 6.55684 7.68945 6.20605L6.9502 5.67773C6.85075 5.60674 6.71433 5.61868 6.62793 5.70508L5.70508 6.62793C5.61869 6.71433 5.60675 6.85076 5.67773 6.9502L6.20605 7.68945C6.55689 8.18079 6.62947 8.81818 6.39844 9.37598L6.18359 9.89453C5.95251 10.4524 5.45012 10.8519 4.85449 10.9512L3.95898 11.1006C3.83845 11.1207 3.75 11.2255 3.75 11.3477V12.6533C3.75017 12.7754 3.83857 12.8793 3.95898 12.8994L4.85449 13.0488C5.45012 13.1481 5.95251 13.5476 6.18359 14.1055L6.39844 14.624C6.62948 15.1818 6.55686 15.8192 6.20605 16.3105L5.67773 17.0498C5.60675 17.1492 5.61869 17.2857 5.70508 17.3721L6.62793 18.2949C6.71432 18.3813 6.85076 18.3932 6.9502 18.3223L7.68945 17.7939C8.18079 17.4431 8.81819 17.3705 9.37598 17.6016L9.89453 17.8164C10.4524 18.0475 10.8519 18.5499 10.9512 19.1455L11.1006 20.041C11.1207 20.1614 11.2247 20.2498 11.3467 20.25H12.6533C12.7753 20.2498 12.8793 20.1614 12.8994 20.041L13.0488 19.1455C13.1481 18.5499 13.5476 18.0475 14.1055 17.8164L14.624 17.6016C15.1818 17.3705 15.8192 17.4432 16.3105 17.7939L17.0498 18.3223C17.1492 18.3933 17.2857 18.3813 17.3721 18.2949L18.2949 17.3721C18.3813 17.2857 18.3933 17.1492 18.3223 17.0498L17.7939 16.3105C17.4431 15.8192 17.3705 15.1818 17.6016 14.624L17.8164 14.1055C18.0475 13.5476 18.5499 13.1481 19.1455 13.0488L20.041 12.8994C20.1616 12.8793 20.25 12.7746 20.25 12.6523V11.3467C20.2498 11.2246 20.1614 11.1207 20.041 11.1006L19.1455 10.9512C18.5499 10.8519 18.0475 10.4524 17.8164 9.89453L17.6016 9.37598C17.3705 8.81821 17.4432 8.18078 17.7939 7.68945L18.3223 6.9502C18.3933 6.85075 18.3813 6.71433 18.2949 6.62793L17.3721 5.70508C17.2857 5.61869 17.1492 5.60675 17.0498 5.67773L16.3105 6.20605C15.8192 6.55688 15.1818 6.62948 14.624 6.39844L14.1055 6.18359C13.5476 5.95251 13.1481 5.45012 13.0488 4.85449L12.8994 3.95898C12.8793 3.83859 12.7753 3.75022 12.6533 3.75H11.3467ZM12 8.25C12.9945 8.25001 13.9481 8.64538 14.6514 9.34863C15.3546 10.0519 15.75 11.0055 15.75 12C15.75 12.9945 15.3546 13.9481 14.6514 14.6514C13.9481 15.3546 12.9945 15.75 12 15.75C11.0055 15.75 10.0519 15.3546 9.34863 14.6514C8.64538 13.9481 8.25001 12.9945 8.25 12C8.25 11.0055 8.64539 10.0519 9.34863 9.34863C10.0519 8.64538 11.0055 8.25001 12 8.25ZM12 9.75C11.4033 9.75001 10.8311 9.98729 10.4092 10.4092C9.98729 10.8311 9.75 11.4033 9.75 12C9.75001 12.5967 9.98729 13.1689 10.4092 13.5908C10.8311 14.0127 11.4033 14.25 12 14.25C12.5967 14.25 13.1689 14.0127 13.5908 13.5908C14.0127 13.1689 14.25 12.5967 14.25 12C14.25 11.4033 14.0127 10.8311 13.5908 10.4092C13.1689 9.98729 12.5967 9.75001 12 9.75Z"
                    fill={
                      isSettingsActive
                        ? isDarkMode
                          ? '#7D80D7'
                          : '#5B5BB3'
                        : isDarkMode
                          ? '#808894'
                          : '#5B6571'
                    }
                  />
                </svg>
              </Link>
            </div>
            <div className="w-[141px] p-1">
              <Link
                to="/contact"
                className="contact-button w-full min-h-[48px] px-2 py-2 rounded-full overflow-hidden flex items-center justify-center"
              >
                <div className="px-2 py-1 text-center text-white text-lg font-bold font-urbanist leading-normal">
                  Contact Us
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div
          role="navigation"
          aria-label="Mobile navigation menu"
          className="lg:hidden absolute top-[88px] left-0 right-0 border-t shadow-lg"
          style={{
            backgroundColor: isDarkMode
              ? 'rgba(30, 32, 38, 0.98)'
              : 'rgba(255, 255, 255, 0.98)',
            borderColor: isDarkMode
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="flex flex-col p-4 space-y-2">
            <Link
              to="/about"
              className="px-4 py-3 text-left text-sm font-bold font-urbanist rounded-lg transition-colors duration-200"
              style={{
                color: isAboutActive
                  ? isDarkMode
                    ? '#7D80D7'
                    : '#5B5BB3'
                  : isDarkMode
                    ? '#808894'
                    : '#5B6571',
                backgroundColor: 'transparent',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = isDarkMode
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.05)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              About
            </Link>
            <Link
              to="/partners"
              className="px-4 py-3 text-left text-sm font-bold font-urbanist rounded-lg transition-colors duration-200"
              style={{
                color: isPartnersActive
                  ? isDarkMode
                    ? '#7D80D7'
                    : '#5B5BB3'
                  : isDarkMode
                    ? '#808894'
                    : '#5B6571',
                backgroundColor: 'transparent',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = isDarkMode
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.05)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              Partners
            </Link>
            {/* Ecosystem and Gallery temporarily removed - restore from git */}
            <Link
              to="/news-updates"
              className="px-4 py-3 text-left text-sm font-bold font-urbanist rounded-lg transition-colors duration-200"
              style={{
                color: isNewsActive
                  ? isDarkMode
                    ? '#7D80D7'
                    : '#5B5BB3'
                  : isDarkMode
                    ? '#808894'
                    : '#5B6571',
                backgroundColor: 'transparent',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = isDarkMode
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.05)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              News &amp; Updates
            </Link>
            {/* Theme Toggle in Mobile - temporarily hidden */}
            {/* <div className="flex items-center gap-2 px-2 py-3">
              <button type="button" onClick={() => setIsDarkMode(false)} aria-label="Switch to light mode" aria-pressed={!isDarkMode} className="min-w-[40px] min-h-[40px] flex items-center justify-center p-[5px] rounded-lg overflow-hidden transition-colors duration-200" style={{ backgroundColor: 'transparent' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 19.3755C12.2761 19.3755 12.5 19.5993 12.5 19.8755V22.1255C12.4999 22.4015 12.2761 22.6255 12 22.6255C11.724 22.6255 11.5001 22.4015 11.5 22.1255V19.8755C11.5 19.5994 11.7239 19.3755 12 19.3755Z" fill={isDarkMode ? '#7D80D7' : '#5B5BB3'} /></svg>
              </button>
              <button type="button" onClick={() => setIsDarkMode(true)} aria-label="Switch to dark mode" aria-pressed={isDarkMode} className="min-w-[40px] min-h-[40px] flex items-center justify-center p-[5px] rounded-lg overflow-hidden transition-colors duration-200" style={{ backgroundColor: 'transparent' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.0762 3.12256C10.548 3.01394 10.8224 3.62283 10.5254 4.00537C9.63836 5.1475 9.1095 6.58192 9.10938 8.14014C9.10938 11.8679 12.1317 14.8899 15.8594 14.8901C17.4179 14.89 18.8529 14.3615 19.9951 13.4741C20.3776 13.1771 20.9865 13.4515 20.8779 13.9233C19.9565 17.9146 16.3806 20.8899 12.1094 20.8901C7.13903 20.8899 3.10938 16.8605 3.10938 11.8901C3.10964 7.61922 6.08536 4.04415 10.0762 3.12256Z" fill={isDarkMode ? '#808894' : '#5B6571'} /></svg>
              </button>
            </div> */}
            <div
              className="pt-4 border-t transition-colors duration-300"
              style={{
                borderColor: isDarkMode
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.1)',
              }}
            >
              <Link
                to="/settings"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-4 py-3 flex items-center gap-3 rounded-lg transition-colors duration-200"
                style={{ backgroundColor: 'transparent' }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = isDarkMode
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.05)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12.6533 2.25C13.5085 2.25022 14.2381 2.86844 14.3789 3.71191L14.5283 4.6084C14.5426 4.69337 14.6001 4.76487 14.6797 4.79785L15.1982 5.0127C15.2778 5.04556 15.3684 5.03524 15.4385 4.98535L16.1777 4.45703C16.8738 3.95986 17.8277 4.03886 18.4326 4.64355L19.3555 5.56738C19.9604 6.17229 20.0402 7.12614 19.543 7.82227L19.0146 8.56055C18.9645 8.63072 18.9543 8.72208 18.9873 8.80176L19.2021 9.32031C19.2351 9.39994 19.3066 9.45744 19.3916 9.47168L20.2881 9.62109C21.1316 9.76188 21.7498 10.4915 21.75 11.3467V12.6523C21.75 13.5077 21.1317 14.2381 20.2881 14.3789L19.3916 14.5283C19.3068 14.5426 19.2352 14.5994 19.2021 14.6787L18.9873 15.1982C18.9545 15.2778 18.9648 15.3684 19.0146 15.4385L19.543 16.1777C20.0401 16.8738 19.9612 17.8277 19.3564 18.4326L18.4326 19.3555C17.8277 19.9604 16.8739 20.0402 16.1777 19.543L15.4395 19.0146C15.3693 18.9645 15.2779 18.9543 15.1982 18.9873L14.6797 19.2021C14.6001 19.2351 14.5426 19.3066 14.5283 19.3916L14.3789 20.2881C14.2381 21.1316 13.5085 21.7498 12.6533 21.75H11.3467C10.4916 21.7498 9.76187 21.1316 9.62109 20.2881L9.47168 19.3916C9.45743 19.3066 9.39993 19.2351 9.32031 19.2021L8.80176 18.9873C8.72223 18.9544 8.63161 18.9648 8.56152 19.0146L7.82227 19.543C7.12623 20.0401 6.1723 19.9611 5.56738 19.3564L4.64453 18.4326C4.03964 17.8277 3.95982 16.8739 4.45703 16.1777L4.98535 15.4395C5.03548 15.3693 5.04567 15.2779 5.0127 15.1982L4.79785 14.6797C4.76486 14.6001 4.6934 14.5426 4.6084 14.5283L3.71191 14.3789C2.86843 14.2381 2.25017 13.5085 2.25 12.6533V11.3477C2.25 10.4923 2.8683 9.7619 3.71191 9.62109L4.6084 9.47168C4.69319 9.45744 4.76479 9.40065 4.79785 9.32129L5.0127 8.80176C5.04555 8.72223 5.03525 8.63161 4.98535 8.56152L4.45703 7.82227C3.95987 7.12623 4.03885 6.1723 4.64355 5.56738L5.56738 4.64453C6.17228 4.03963 7.12614 3.95982 7.82227 4.45703L8.56055 4.98535C8.63072 5.03548 8.72208 5.04567 8.80176 5.0127L9.32031 4.79785C9.39993 4.76487 9.45743 4.69338 9.47168 4.6084L9.62109 3.71191C9.76187 2.86845 10.4916 2.25023 11.3467 2.25H12.6533ZM11.3467 3.75C11.2247 3.75023 11.1207 3.83859 11.1006 3.95898L10.9512 4.85449C10.8519 5.45012 10.4524 5.95251 9.89453 6.18359L9.37598 6.39844C8.81821 6.62946 8.18078 6.55684 7.68945 6.20605L6.9502 5.67773C6.85075 5.60674 6.71433 5.61868 6.62793 5.70508L5.70508 6.62793C5.61869 6.71433 5.60675 6.85076 5.67773 6.9502L6.20605 7.68945C6.55689 8.18079 6.62947 8.81818 6.39844 9.37598L6.18359 9.89453C5.95251 10.4524 5.45012 10.8519 4.85449 10.9512L3.95898 11.1006C3.83845 11.1207 3.75 11.2255 3.75 11.3477V12.6533C3.75017 12.7754 3.83857 12.8793 3.95898 12.8994L4.85449 13.0488C5.45012 13.1481 5.95251 13.5476 6.18359 14.1055L6.39844 14.624C6.62948 15.1818 6.55686 15.8192 6.20605 16.3105L5.67773 17.0498C5.60675 17.1492 5.61869 17.2857 5.70508 17.3721L6.62793 18.2949C6.71432 18.3813 6.85076 18.3932 6.9502 18.3223L7.68945 17.7939C8.18079 17.4431 8.81819 17.3705 9.37598 17.6016L9.89453 17.8164C10.4524 18.0475 10.8519 18.5499 10.9512 19.1455L11.1006 20.041C11.1207 20.1614 11.2247 20.2498 11.3467 20.25H12.6533C12.7753 20.2498 12.8793 20.1614 12.8994 20.041L13.0488 19.1455C13.1481 18.5499 13.5476 18.0475 14.1055 17.8164L14.624 17.6016C15.1818 17.3705 15.8192 17.4432 16.3105 17.7939L17.0498 18.3223C17.1492 18.3933 17.2857 18.3813 17.3721 18.2949L18.2949 17.3721C18.3813 17.2857 18.3933 17.1492 18.3223 17.0498L17.7939 16.3105C17.4431 15.8192 17.3705 15.1818 17.6016 14.624L17.8164 14.1055C18.0475 13.5476 18.5499 13.1481 19.1455 13.0488L20.041 12.8994C20.1616 12.8793 20.25 12.7746 20.25 12.6523V11.3467C20.2498 11.2246 20.1614 11.1207 20.041 11.1006L19.1455 10.9512C18.5499 10.8519 18.0475 10.4524 17.8164 9.89453L17.6016 9.37598C17.3705 8.81821 17.4432 8.18078 17.7939 7.68945L18.3223 6.9502C18.3933 6.85075 18.3813 6.71433 18.2949 6.62793L17.3721 5.70508C17.2857 5.61869 17.1492 5.60675 17.0498 5.67773L16.3105 6.20605C15.8192 6.55688 15.1818 6.62948 14.624 6.39844L14.1055 6.18359C13.5476 5.95251 13.1481 5.45012 13.0488 4.85449L12.8994 3.95898C12.8793 3.83859 12.7753 3.75022 12.6533 3.75H11.3467ZM12 8.25C12.9945 8.25001 13.9481 8.64538 14.6514 9.34863C15.3546 10.0519 15.75 11.0055 15.75 12C15.75 12.9945 15.3546 13.9481 14.6514 14.6514C13.9481 15.3546 12.9945 15.75 12 15.75C11.0055 15.75 10.0519 15.3546 9.34863 14.6514C8.64538 13.9481 8.25001 12.9945 8.25 12C8.25 11.0055 8.64539 10.0519 9.34863 9.34863C10.0519 8.64538 11.0055 8.25001 12 8.25ZM12 9.75C11.4033 9.75001 10.8311 9.98729 10.4092 10.4092C9.98729 10.8311 9.75 11.4033 9.75 12C9.75001 12.5967 9.98729 13.1689 10.4092 13.5908C10.8311 14.0127 11.4033 14.25 12 14.25C12.5967 14.25 13.1689 14.0127 13.5908 13.5908C14.0127 13.1689 14.25 12.5967 14.25 12C14.25 11.4033 14.0127 10.8311 13.5908 10.4092C13.1689 9.98729 12.5967 9.75001 12 9.75Z"
                    fill={
                      isSettingsActive
                        ? isDarkMode
                          ? '#7D80D7'
                          : '#5B5BB3'
                        : isDarkMode
                          ? '#808894'
                          : '#5B6571'
                    }
                  />
                </svg>
                <span
                  className="text-sm font-bold font-urbanist"
                  style={{
                    color: isSettingsActive
                      ? isDarkMode
                        ? '#7D80D7'
                        : '#5B5BB3'
                      : isDarkMode
                        ? '#808894'
                        : '#5B6571',
                  }}
                >
                  Settings
                </span>
              </Link>
              <Link
                to="/contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="contact-button w-full px-6 py-3 rounded-full text-white text-lg font-bold font-urbanist block text-center mt-2"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
