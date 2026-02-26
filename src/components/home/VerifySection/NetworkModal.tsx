import React, { useState, useEffect } from 'react'
import NetworkTooltip from './NetworkTooltip'

interface NetworkOption {
  chainId: string
  label: string
  group: 'Mainnet' | 'Testnet'
  logo: string
}

const NETWORK_OPTIONS: NetworkOption[] = [
  {
    chainId: '1',
    label: 'Ethereum',
    group: 'Mainnet',
    logo: '/images/networks/ethereum.gif',
  },
  {
    chainId: '137',
    label: 'Polygon',
    group: 'Mainnet',
    logo: '/images/networks/polygon.gif',
  },
  {
    chainId: '50',
    label: 'XDC Network',
    group: 'Mainnet',
    logo: '/images/networks/xdc.png',
  },
  {
    chainId: '101010',
    label: 'Stability (Beta)',
    group: 'Mainnet',
    logo: '/images/networks/stability.png',
  },
  {
    chainId: '1338',
    label: 'Astron',
    group: 'Mainnet',
    logo: '/images/networks/astron.png',
  },
  {
    chainId: '11155111',
    label: 'Sepolia',
    group: 'Testnet',
    logo: '/images/networks/ethereum.gif',
  },
  {
    chainId: '80002',
    label: 'Polygon Amoy',
    group: 'Testnet',
    logo: '/images/networks/polygon.gif',
  },
  {
    chainId: '51',
    label: 'Apothem',
    group: 'Testnet',
    logo: '/images/networks/xdc.png',
  },
  {
    chainId: '20180427',
    label: 'Stability Testnet (Beta)',
    group: 'Testnet',
    logo: '/images/networks/stability.png',
  },
  {
    chainId: '21002',
    label: 'Astron Testnet',
    group: 'Testnet',
    logo: '/images/networks/astron.png',
  },
]

interface NetworkModalProps {
  isDarkMode: boolean
  fileName: string
  onConfirm: (_chainId: string) => void
  onCancel: () => void
  networkType?: 'mainnet' | 'testnet'
}

const NetworkModal: React.FC<NetworkModalProps> = ({
  fileName,
  onConfirm,
  onCancel,
  networkType: networkTypeProp,
}) => {
  const envNetworkType = (import.meta.env.VITE_NETWORK_TYPE || '').toLowerCase()
  const networkType =
    networkTypeProp || (envNetworkType === 'mainnet' ? 'mainnet' : 'testnet')
  const initialChainId = networkType === 'mainnet' ? '1' : '11155111'

  const [selectedChainId, setSelectedChainId] = useState(initialChainId)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isTooltipVisible, setIsTooltipVisible] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  })

  const handleInfoMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const tooltipWidth = 280
    const padding = 8

    // Calculate left position with boundary checking
    let left = rect.left - tooltipWidth + rect.width

    // If tooltip would go off left edge, add padding from left
    if (left < padding) {
      left = padding
    }

    // If tooltip would go off right edge, align to right with padding
    if (left + tooltipWidth > window.innerWidth - padding) {
      left = window.innerWidth - tooltipWidth - padding
    }

    setTooltipPosition({
      top: rect.bottom + 8,
      left,
      width: tooltipWidth,
    })
    setIsTooltipVisible(true)
  }

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const allowedGroups: ('Mainnet' | 'Testnet')[] =
    networkType === 'mainnet' ? ['Mainnet'] : ['Testnet']
  const visibleOptions = NETWORK_OPTIONS.filter(n =>
    allowedGroups.includes(n.group)
  )
  const selected =
    visibleOptions.find(n => n.chainId === selectedChainId) ?? visibleOptions[0]

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-3 sm:p-4"
      onClick={e => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      {/* Card */}
      <div className="nm-card">
        {/* Header */}
        <div className="nm-header">
          {/* Green check-circle icon */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0_5526_56231)">
                <path
                  d="M25.6668 12.9272V14.0005C25.6654 16.5163 24.8507 18.9643 23.3444 20.9793C21.838 22.9943 19.7207 24.4684 17.3081 25.1817C14.8955 25.895 12.317 25.8094 9.95704 24.9375C7.59712 24.0656 5.58226 22.4543 4.21295 20.3437C2.84364 18.2332 2.19325 15.7366 2.35879 13.2262C2.52432 10.7158 3.4969 8.32621 5.13149 6.41375C6.76607 4.50128 8.97508 3.16844 11.429 2.614C13.883 2.05955 16.4505 2.31322 18.7485 3.33716"
                  stroke="#3AAF86"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M25.6667 4.66699L14 16.3453L10.5 12.8453"
                  stroke="#3AAF86"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
              <defs>
                <clipPath id="clip0_5526_56231">
                  <rect width="28" height="28" fill="white" />
                </clipPath>
              </defs>
            </svg>
          </div>

          {/* Title + fileName */}
          <div className="nm-title-group">
            <div className="nm-title text-[18px] sm:text-[24px]">
              TrustVC Document Uploaded
            </div>
            {fileName && <div className="nm-filename">{fileName}</div>}
          </div>
        </div>

        {/* Content */}
        <div className="nm-content">
          {/* Description */}
          <div className="nm-desc-row">
            <div className="nm-desc text-[14px] sm:text-[18px]">
              Select network for document verification.
            </div>
          </div>

          {/* Network selector row */}
          <div className="nm-network-row">
            {/* Label */}
            <div className="nm-label-row">
              <span className="nm-label">Select Network:</span>
            </div>

            {/* Dropdown + Info */}
            <div className="nm-dropdown-info-row">
              {/* Dropdown */}
              <div className="nm-dropdown-wrap">
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    className="nm-dropdown-btn"
                    onClick={() => setDropdownOpen(v => !v)}
                  >
                    {selected && (
                      <img
                        src={selected.logo}
                        alt={selected.label}
                        className="nm-net-logo"
                      />
                    )}
                    <span className="nm-net-label">
                      {selected?.label ?? 'Select network'}
                    </span>
                    {/* Divider + chevron */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <svg
                        width="8"
                        height="32"
                        viewBox="0 0 8 32"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M4 4V28"
                          stroke="rgba(169,178,187,0.33)"
                          strokeWidth="1"
                        />
                      </svg>
                      <div
                        className="nm-chevron"
                        style={{ padding: '4px 8px' }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M11.5899 5.41489C11.883 5.12235 12.3578 5.12189 12.6504 5.41489C12.9427 5.70787 12.9421 6.1828 12.6495 6.47543L8.54107 10.5799C8.53846 10.5827 8.53593 10.586 8.53325 10.5887C8.47743 10.6446 8.41231 10.686 8.34575 10.7205C8.29448 10.7471 8.24155 10.7681 8.18657 10.7821C7.93925 10.8447 7.66661 10.7825 7.47271 10.5897L3.35064 6.47641C3.05784 6.18398 3.05769 5.70903 3.34966 5.41586C3.64227 5.12276 4.11802 5.12231 4.41118 5.41489L7.93169 8.92563C7.97072 8.96456 8.03329 8.96455 8.07232 8.92563L11.5899 5.41489Z"
                            fill="currentColor"
                          />
                        </svg>
                      </div>
                    </div>
                  </button>

                  {/* Dropdown overlay */}
                  {dropdownOpen && (
                    <div
                      className="fixed inset-0 z-[9]"
                      onClick={() => setDropdownOpen(false)}
                    />
                  )}

                  {/* Dropdown list */}
                  {dropdownOpen && (
                    <div className="nm-dropdown-list">
                      {allowedGroups.map(group => (
                        <div key={group}>
                          <div className="nm-group-header">{group}</div>
                          {visibleOptions
                            .filter(n => n.group === group)
                            .map(n => (
                              <button
                                key={n.chainId}
                                type="button"
                                className={`nm-item${n.chainId === selectedChainId ? ' nm-item--active' : ''}`}
                                onClick={() => {
                                  setSelectedChainId(n.chainId)
                                  setDropdownOpen(false)
                                }}
                                role="option"
                                aria-selected={n.chainId === selectedChainId}
                              >
                                <img
                                  src={n.logo}
                                  alt={n.label}
                                  className="nm-net-logo"
                                />
                                {n.label}
                              </button>
                            ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Info button */}
              <div className="nm-info-wrap">
                <button
                  type="button"
                  className="nm-info-btn"
                  onMouseEnter={handleInfoMouseEnter}
                  onMouseLeave={() => setIsTooltipVisible(false)}
                  aria-label="Network selector info"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 2.25C17.3848 2.25 21.75 6.61522 21.75 12C21.75 17.3848 17.3848 21.75 12 21.75C6.61524 21.75 2.25 17.3848 2.25 12C2.25 6.61523 6.61524 2.25002 12 2.25ZM12 3.75C7.44366 3.75002 3.75 7.44366 3.75 12C3.75 16.5563 7.44366 20.25 12 20.25C16.5563 20.25 20.25 16.5563 20.25 12C20.25 7.44365 16.5563 3.75 12 3.75ZM12.0078 16.25C12.56 16.2502 13.0078 16.6978 13.0078 17.25V17.2578C13.0076 17.8098 12.5598 18.2576 12.0078 18.2578H12C11.4478 18.2578 11.0002 17.8099 11 17.2578V17.25L11.0049 17.1475C11.0562 16.6433 11.4823 16.25 12 16.25H12.0078ZM9.2207 6.7666C10.7693 5.41159 13.2317 5.41159 14.7803 6.7666C16.4068 8.19008 16.4068 10.5599 14.7803 11.9834C14.506 12.2234 14.204 12.4197 13.8867 12.5732C13.6008 12.7116 13.3576 12.8882 13.1982 13.0703C13.0442 13.2465 13 13.3879 13 13.5V14.25C13 14.8023 12.5523 15.25 12 15.25C11.4478 15.2499 11 14.8022 11 14.25V13.5C11 12.0709 12.1774 11.1792 13.0156 10.7734C13.179 10.6944 13.3293 10.5954 13.4629 10.4785C14.1791 9.8518 14.1791 8.8982 13.4629 8.27148C12.6683 7.57632 11.3316 7.57628 10.5371 8.27148C10.1215 8.63495 9.4896 8.59326 9.12598 8.17773C8.76231 7.7621 8.80509 7.13028 9.2207 6.7666Z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tooltip */}
        <NetworkTooltip
          isVisible={isTooltipVisible}
          position={tooltipPosition}
        />

        {/* Footer */}
        <div className="nm-footer">
          <div className="nm-footer-btns">
            {/* Cancel */}
            <button
              type="button"
              className="nm-btn nm-cancel-btn"
              onClick={onCancel}
            >
              <span className="nm-btn-label">Cancel</span>
            </button>

            {/* Proceed */}
            <button
              type="button"
              className="nm-btn nm-proceed-btn"
              onClick={() => selected && onConfirm(selectedChainId)}
              disabled={!selected}
            >
              <span className="nm-btn-label">Proceed</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NetworkModal
