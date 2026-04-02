import { useState, useRef, useEffect, Dispatch, SetStateAction } from 'react'
import { useLocation } from 'react-router-dom'
import Logo from '../Logo'

interface NavbarProps {
  isDarkMode: boolean
  setIsDarkMode: Dispatch<SetStateAction<boolean>>
}

const Navbar = ({ isDarkMode, setIsDarkMode }: NavbarProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isEcosystemOpen, setIsEcosystemOpen] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  const location = useLocation()
  const isNewsActive = location.pathname.startsWith('/news-updates')

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
              <a
                href="/"
                className="min-w-[40px] min-h-[40px] flex items-center justify-center px-1 py-[5px] rounded-lg transition-colors duration-200 hover:bg-opacity-10"
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
                <div
                  className="px-1 py-1 text-center text-sm font-bold font-['Gilroy'] leading-snug"
                  style={{
                    color: isNewsActive
                      ? isDarkMode
                        ? '#808894'
                        : '#5B6571'
                      : isDarkMode
                        ? '#7D80D7'
                        : '#5B5BB3',
                  }}
                >
                  Home
                </div>
              </a>
            </div>
            <div className="p-2 relative">
              <button
                type="button"
                onClick={() => setIsEcosystemOpen(!isEcosystemOpen)}
                aria-haspopup="true"
                aria-expanded={isEcosystemOpen}
                aria-controls="ecosystem-menu-desktop"
                className="min-w-[40px] min-h-[40px] flex items-center justify-center px-1 py-[5px] rounded-lg transition-colors duration-200"
                style={{
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={e => {
                  setIsEcosystemOpen(true)
                  e.currentTarget.style.backgroundColor = isDarkMode
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.05)'
                }}
                onMouseLeave={e => {
                  setIsEcosystemOpen(false)
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <div
                  className="px-1 py-1 text-sm font-bold font-['Gilroy'] leading-snug"
                  style={{ color: isDarkMode ? '#808894' : '#5B6571' }}
                >
                  Ecosystem
                </div>
                <div className="p-[3px]">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M18.6067 7.69946C18.8911 7.3986 19.3662 7.38487 19.6672 7.66919C19.9676 7.95344 19.9811 8.42776 19.6975 8.72876L12.5452 16.301C12.5432 16.3031 12.5403 16.3049 12.5383 16.3069C12.5307 16.3147 12.5239 16.3237 12.5159 16.3313C12.4636 16.3807 12.4039 16.418 12.343 16.4495C12.3224 16.4602 12.3019 16.4711 12.2805 16.4797C12.2594 16.4882 12.2377 16.4947 12.2161 16.5012C12.1912 16.5087 12.1663 16.5159 12.1409 16.5208C12.1189 16.5249 12.0967 16.5273 12.0745 16.5295C12.0498 16.532 12.0251 16.5344 12.0002 16.5344C11.9751 16.5344 11.9501 16.5321 11.925 16.5295C11.9028 16.5273 11.8806 16.525 11.8586 16.5208C11.8332 16.5159 11.8083 16.5087 11.7834 16.5012C11.7619 16.4947 11.74 16.4892 11.719 16.4807C11.6952 16.4711 11.6726 16.4587 11.6497 16.4465C11.627 16.4345 11.6039 16.423 11.5823 16.4084C11.5718 16.4014 11.5612 16.3946 11.551 16.387C11.5433 16.3812 11.5361 16.3745 11.5286 16.3684C11.5194 16.361 11.5101 16.3538 11.5012 16.3459C11.4959 16.3412 11.4908 16.3362 11.4856 16.3313L11.4553 16.301L4.30396 8.72876C4.01958 8.42762 4.0331 7.95359 4.33423 7.66919C4.63537 7.38508 5.10948 7.39845 5.3938 7.69946L11.927 14.6174C11.9665 14.6592 12.033 14.6592 12.0725 14.6174L18.6067 7.69946Z"
                      fill={isDarkMode ? '#808894' : '#5B6571'}
                    />
                  </svg>
                </div>
              </button>

              {/* Ecosystem Dropdown */}
              {isEcosystemOpen && (
                <div
                  id="ecosystem-menu-desktop"
                  role="menu"
                  className="absolute left-0 min-w-[200px] rounded-lg shadow-lg border transition-all duration-200 z-50 pt-2"
                  style={{
                    top: 'calc(100% - 8px)',
                    backgroundColor: isDarkMode
                      ? 'rgba(30, 32, 38, 0.95)'
                      : 'rgba(255, 255, 255, 0.95)',
                    borderColor: isDarkMode
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(0, 0, 0, 0.1)',
                    backdropFilter: 'blur(10px)',
                  }}
                  onMouseEnter={() => setIsEcosystemOpen(true)}
                  onMouseLeave={() => setIsEcosystemOpen(false)}
                >
                  <div className="py-2">
                    <a
                      href="/"
                      className="block px-4 py-2 text-sm font-medium font-['Gilroy'] transition-colors duration-200"
                      style={{
                        color: isDarkMode ? '#AAAEE6' : '#403D7D',
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
                      Placeholder
                    </a>
                    <a
                      href="/"
                      className="block px-4 py-2 text-sm font-medium font-['Gilroy'] transition-colors duration-200"
                      style={{
                        color: isDarkMode ? '#AAAEE6' : '#403D7D',
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
                      Placeholder
                    </a>
                    <a
                      href="/"
                      className="block px-4 py-2 text-sm font-medium font-['Gilroy'] transition-colors duration-200"
                      style={{
                        color: isDarkMode ? '#AAAEE6' : '#403D7D',
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
                      Placeholder
                    </a>
                  </div>
                </div>
              )}
            </div>
            <div className="p-2">
              <a
                href="/news-updates"
                className="min-w-[40px] min-h-[40px] flex items-center justify-center px-1 py-[5px] rounded-lg transition-colors duration-200"
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
                <div
                  className="px-1 py-1 text-center text-sm font-bold font-['Gilroy'] leading-snug"
                  style={{ color: isDarkMode ? '#808894' : '#5B6571' }}
                >
                  Gallery
                </div>
              </a>
            </div>
            <div className="p-2">
              <a
                href="/news-updates"
                className="min-w-[40px] min-h-[40px] flex items-center justify-center px-1 py-[5px] rounded-lg transition-colors duration-200"
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
                <div
                  className="px-1 py-1 text-center text-sm font-bold font-['Gilroy'] leading-snug"
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
              </a>
            </div>
          </div>

          {/* Right Side - Theme Toggle & CTA */}
          <div className="flex items-center">
            <div className="p-1 flex items-center">
              {/* Sun Icon - Primary Color */}
              <div className="p-1">
                <button
                  type="button"
                  onClick={() => setIsDarkMode(false)}
                  aria-label="Switch to light mode"
                  aria-pressed={!isDarkMode}
                  className="min-w-[40px] min-h-[40px] flex items-center justify-center p-[5px] rounded-lg overflow-hidden transition-colors duration-200"
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
                      d="M12 19.3755C12.2761 19.3755 12.5 19.5993 12.5 19.8755V22.1255C12.4999 22.4015 12.2761 22.6255 12 22.6255C11.724 22.6255 11.5001 22.4015 11.5 22.1255V19.8755C11.5 19.5994 11.7239 19.3755 12 19.3755ZM17.0371 17.6968C17.2323 17.5017 17.5489 17.5017 17.7441 17.6968L19.335 19.2876C19.5302 19.4828 19.5301 19.7994 19.335 19.9946C19.1397 20.1899 18.8232 20.1899 18.6279 19.9946L17.0371 18.4038C16.842 18.2085 16.8419 17.892 17.0371 17.6968ZM6.07715 17.52C6.27241 17.3248 6.58892 17.3248 6.78418 17.52C6.9793 17.7153 6.97939 18.0318 6.78418 18.2271L5.19336 19.8179C4.99814 20.0131 4.6816 20.013 4.48633 19.8179C4.29109 19.6226 4.29109 19.3061 4.48633 19.1108L6.07715 17.52ZM12 6.25146C15.3137 6.25146 18 8.93776 18 12.2515C18 15.5652 15.3137 18.2515 12 18.2515C8.6863 18.2514 6 15.5652 6 12.2515C6 8.93777 8.6863 6.25148 12 6.25146ZM4.125 11.7515C4.40114 11.7515 4.625 11.9753 4.625 12.2515C4.625 12.5276 4.40114 12.7515 4.125 12.7515H1.875C1.59887 12.7514 1.375 12.5276 1.375 12.2515C1.375 11.9753 1.59887 11.7515 1.875 11.7515H4.125ZM22.125 11.7515C22.4011 11.7515 22.625 11.9753 22.625 12.2515C22.625 12.5276 22.4011 12.7515 22.125 12.7515H19.875C19.5989 12.7514 19.375 12.5276 19.375 12.2515C19.375 11.9753 19.5989 11.7515 19.875 11.7515H22.125ZM4.30859 4.96924C4.50385 4.77398 4.82134 4.77399 5.0166 4.96924L6.60742 6.56006C6.80243 6.75531 6.80251 7.07189 6.60742 7.26709C6.41223 7.46226 6.09567 7.46213 5.90039 7.26709L4.30859 5.67627C4.11358 5.48113 4.11377 5.1645 4.30859 4.96924ZM18.8057 4.7915C19.0009 4.59625 19.3174 4.59626 19.5127 4.7915C19.7079 4.98677 19.7079 5.30329 19.5127 5.49854L17.9219 7.08936C17.7266 7.28442 17.4101 7.2845 17.2148 7.08936C17.0197 6.89415 17.0198 6.5776 17.2148 6.38232L18.8057 4.7915ZM12 1.37451C12.2761 1.37451 12.5 1.59837 12.5 1.87451V4.12451C12.5 4.40065 12.2761 4.62451 12 4.62451C11.7239 4.6245 11.5 4.40064 11.5 4.12451V1.87451C11.5 1.59838 11.7239 1.37453 12 1.37451Z"
                      fill={isDarkMode ? '#7D80D7' : '#5B5BB3'}
                    />
                  </svg>
                </button>
              </div>
              {/* Moon Icon - Neutral Color */}
              <div className="p-1">
                <button
                  type="button"
                  onClick={() => setIsDarkMode(true)}
                  aria-label="Switch to dark mode"
                  aria-pressed={isDarkMode}
                  className="min-w-[40px] min-h-[40px] flex items-center justify-center p-[5px] rounded-lg overflow-hidden transition-colors duration-200"
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
                      d="M10.0762 3.12256C10.548 3.01394 10.8224 3.62283 10.5254 4.00537C9.63836 5.1475 9.1095 6.58192 9.10938 8.14014C9.10938 11.8679 12.1317 14.8899 15.8594 14.8901C17.4179 14.89 18.8529 14.3615 19.9951 13.4741C20.3776 13.1771 20.9865 13.4515 20.8779 13.9233C19.9565 17.9146 16.3806 20.8899 12.1094 20.8901C7.13903 20.8899 3.10938 16.8605 3.10938 11.8901C3.10964 7.61922 6.08536 4.04415 10.0762 3.12256Z"
                      fill={isDarkMode ? '#808894' : '#5B6571'}
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="w-[141px] p-1">
              <a
                href="/"
                className="contact-button w-full min-h-[48px] px-2 py-2 rounded-full overflow-hidden flex items-center justify-center"
              >
                <div className="px-2 py-1 text-center text-white text-lg font-bold font-['Gilroy'] leading-normal">
                  Contact Us
                </div>
              </a>
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
            <a
              href="/"
              className="px-4 py-3 text-left text-sm font-bold font-['Gilroy'] rounded-lg transition-colors duration-200"
              style={{
                color: isNewsActive
                  ? isDarkMode
                    ? '#808894'
                    : '#5B6571'
                  : isDarkMode
                    ? '#7D80D7'
                    : '#5B5BB3',
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
              Home
            </a>
            <div>
              <button
                type="button"
                onClick={() => setIsEcosystemOpen(!isEcosystemOpen)}
                aria-haspopup="true"
                aria-expanded={isEcosystemOpen}
                aria-controls="ecosystem-menu-mobile"
                className="w-full px-4 py-3 text-left text-sm font-bold font-['Gilroy'] rounded-lg transition-colors duration-200 flex items-center justify-between"
                style={{
                  color: isDarkMode ? '#808894' : '#5B6571',
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
                <span>Ecosystem</span>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{
                    transform: isEcosystemOpen
                      ? 'rotate(180deg)'
                      : 'rotate(0deg)',
                    transition: 'transform 200ms',
                  }}
                >
                  <path
                    d="M18.6067 7.69946C18.8911 7.3986 19.3662 7.38487 19.6672 7.66919C19.9676 7.95344 19.9811 8.42776 19.6975 8.72876L12.5452 16.301C12.5432 16.3031 12.5403 16.3049 12.5383 16.3069C12.5307 16.3147 12.5239 16.3237 12.5159 16.3313C12.4636 16.3807 12.4039 16.418 12.343 16.4495C12.3224 16.4602 12.3019 16.4711 12.2805 16.4797C12.2594 16.4882 12.2377 16.4947 12.2161 16.5012C12.1912 16.5087 12.1663 16.5159 12.1409 16.5208C12.1189 16.5249 12.0967 16.5273 12.0745 16.5295C12.0498 16.532 12.0251 16.5344 12.0002 16.5344C11.9751 16.5344 11.9501 16.5321 11.925 16.5295C11.9028 16.5273 11.8806 16.525 11.8586 16.5208C11.8332 16.5159 11.8083 16.5087 11.7834 16.5012C11.7619 16.4947 11.74 16.4892 11.719 16.4807C11.6952 16.4711 11.6726 16.4587 11.6497 16.4465C11.627 16.4345 11.6039 16.423 11.5823 16.4084C11.5718 16.4014 11.5612 16.3946 11.551 16.387C11.5433 16.3812 11.5361 16.3745 11.5286 16.3684C11.5194 16.361 11.5101 16.3538 11.5012 16.3459C11.4959 16.3412 11.4908 16.3362 11.4856 16.3313L11.4553 16.301L4.30396 8.72876C4.01958 8.42762 4.0331 7.95359 4.33423 7.66919C4.63537 7.38508 5.10948 7.39845 5.3938 7.69946L11.927 14.6174C11.9665 14.6592 12.033 14.6592 12.0725 14.6174L18.6067 7.69946Z"
                    fill={isDarkMode ? '#808894' : '#5B6571'}
                  />
                </svg>
              </button>

              {/* Ecosystem Sub-items */}
              {isEcosystemOpen && (
                <div
                  id="ecosystem-menu-mobile"
                  role="menu"
                  className="ml-4 mt-2 space-y-1"
                >
                  <a
                    href="/"
                    className="block px-4 py-2 text-left text-sm font-medium font-['Gilroy'] rounded-lg transition-colors duration-200"
                    style={{
                      color: isDarkMode ? '#AAAEE6' : '#403D7D',
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
                    Placeholder
                  </a>
                  <a
                    href="/"
                    className="block px-4 py-2 text-left text-sm font-medium font-['Gilroy'] rounded-lg transition-colors duration-200"
                    style={{
                      color: isDarkMode ? '#AAAEE6' : '#403D7D',
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
                    Placeholder
                  </a>
                  <a
                    href="/"
                    className="block px-4 py-2 text-left text-sm font-medium font-['Gilroy'] rounded-lg transition-colors duration-200"
                    style={{
                      color: isDarkMode ? '#AAAEE6' : '#403D7D',
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
                    Placeholder
                  </a>
                </div>
              )}
            </div>
            <a
              href="/news-updates"
              className="px-4 py-3 text-left text-sm font-bold font-['Gilroy'] rounded-lg transition-colors duration-200"
              style={{
                color: isDarkMode ? '#808894' : '#5B6571',
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
              Gallery
            </a>
            <a
              href="/news-updates"
              className="px-4 py-3 text-left text-sm font-bold font-['Gilroy'] rounded-lg transition-colors duration-200"
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
            </a>
            {/* Theme Toggle in Mobile */}
            <div className="flex items-center gap-2 px-2 py-3">
              {/* Sun Icon */}
              <button
                type="button"
                onClick={() => setIsDarkMode(false)}
                aria-label="Switch to light mode"
                aria-pressed={!isDarkMode}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center p-[5px] rounded-lg overflow-hidden transition-colors duration-200"
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
                    d="M12 19.3755C12.2761 19.3755 12.5 19.5993 12.5 19.8755V22.1255C12.4999 22.4015 12.2761 22.6255 12 22.6255C11.724 22.6255 11.5001 22.4015 11.5 22.1255V19.8755C11.5 19.5994 11.7239 19.3755 12 19.3755ZM17.0371 17.6968C17.2323 17.5017 17.5489 17.5017 17.7441 17.6968L19.335 19.2876C19.5302 19.4828 19.5301 19.7994 19.335 19.9946C19.1397 20.1899 18.8232 20.1899 18.6279 19.9946L17.0371 18.4038C16.842 18.2085 16.8419 17.892 17.0371 17.6968ZM6.07715 17.52C6.27241 17.3248 6.58892 17.3248 6.78418 17.52C6.9793 17.7153 6.97939 18.0318 6.78418 18.2271L5.19336 19.8179C4.99814 20.0131 4.6816 20.013 4.48633 19.8179C4.29109 19.6226 4.29109 19.3061 4.48633 19.1108L6.07715 17.52ZM12 6.25146C15.3137 6.25146 18 8.93776 18 12.2515C18 15.5652 15.3137 18.2515 12 18.2515C8.6863 18.2514 6 15.5652 6 12.2515C6 8.93777 8.6863 6.25148 12 6.25146ZM4.125 11.7515C4.40114 11.7515 4.625 11.9753 4.625 12.2515C4.625 12.5276 4.40114 12.7515 4.125 12.7515H1.875C1.59887 12.7514 1.375 12.5276 1.375 12.2515C1.375 11.9753 1.59887 11.7515 1.875 11.7515H4.125ZM22.125 11.7515C22.4011 11.7515 22.625 11.9753 22.625 12.2515C22.625 12.5276 22.4011 12.7515 22.125 12.7515H19.875C19.5989 12.7514 19.375 12.5276 19.375 12.2515C19.375 11.9753 19.5989 11.7515 19.875 11.7515H22.125ZM4.30859 4.96924C4.50385 4.77398 4.82134 4.77399 5.0166 4.96924L6.60742 6.56006C6.80243 6.75531 6.80251 7.07189 6.60742 7.26709C6.41223 7.46226 6.09567 7.46213 5.90039 7.26709L4.30859 5.67627C4.11358 5.48113 4.11377 5.1645 4.30859 4.96924ZM18.8057 4.7915C19.0009 4.59625 19.3174 4.59626 19.5127 4.7915C19.7079 4.98677 19.7079 5.30329 19.5127 5.49854L17.9219 7.08936C17.7266 7.28442 17.4101 7.2845 17.2148 7.08936C17.0197 6.89415 17.0198 6.5776 17.2148 6.38232L18.8057 4.7915ZM12 1.37451C12.2761 1.37451 12.5 1.59837 12.5 1.87451V4.12451C12.5 4.40065 12.2761 4.62451 12 4.62451C11.7239 4.6245 11.5 4.40064 11.5 4.12451V1.87451C11.5 1.59838 11.7239 1.37453 12 1.37451Z"
                    fill={isDarkMode ? '#7D80D7' : '#5B5BB3'}
                  />
                </svg>
              </button>
              {/* Moon Icon */}
              <button
                type="button"
                onClick={() => setIsDarkMode(true)}
                aria-label="Switch to dark mode"
                aria-pressed={isDarkMode}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center p-[5px] rounded-lg overflow-hidden transition-colors duration-200"
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
                    d="M10.0762 3.12256C10.548 3.01394 10.8224 3.62283 10.5254 4.00537C9.63836 5.1475 9.1095 6.58192 9.10938 8.14014C9.10938 11.8679 12.1317 14.8899 15.8594 14.8901C17.4179 14.89 18.8529 14.3615 19.9951 13.4741C20.3776 13.1771 20.9865 13.4515 20.8779 13.9233C19.9565 17.9146 16.3806 20.8899 12.1094 20.8901C7.13903 20.8899 3.10938 16.8605 3.10938 11.8901C3.10964 7.61922 6.08536 4.04415 10.0762 3.12256Z"
                    fill={isDarkMode ? '#808894' : '#5B6571'}
                  />
                </svg>
              </button>
            </div>
            <div
              className="pt-4 border-t transition-colors duration-300"
              style={{
                borderColor: isDarkMode
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.1)',
              }}
            >
              <a
                href="/"
                className="contact-button w-full px-6 py-3 rounded-full text-white text-lg font-bold font-['Gilroy'] block text-center"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
