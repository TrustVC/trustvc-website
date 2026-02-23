import React, { useState, useEffect } from 'react'
import clsx from 'clsx'

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
  networkType?: 'mainnet' | 'testnet' // Optional prop for testing
}

const NetworkModal: React.FC<NetworkModalProps> = ({
  isDarkMode,
  fileName,
  onConfirm,
  onCancel,
  networkType: networkTypeProp,
}) => {
  // Determine network type from prop or environment variable
  const envNetworkType = (import.meta.env.VITE_NETWORK_TYPE || '').toLowerCase()
  const networkType =
    networkTypeProp || (envNetworkType === 'mainnet' ? 'mainnet' : 'testnet')
  const initialChainId = networkType === 'mainnet' ? '1' : '11155111' // Ethereum mainnet or Sepolia testnet

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
    setTooltipPosition({
      top: rect.bottom + 8,
      left: rect.left - 260,
      width: 280,
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

  // Shared conditional class shorthands
  const borderCls = isDarkMode ? 'border-[#30363d]' : 'border-[#d0d7de]'
  const textCls = isDarkMode ? 'text-[#e6edf3]' : 'text-[#1f2328]'
  const mutedCls = isDarkMode ? 'text-[#8b949e]' : 'text-[#656d76]'
  const bgCls = isDarkMode ? 'bg-[#1c2128]' : 'bg-white'
  const hoverItemCls = isDarkMode ? 'hover:bg-[#21262d]' : 'hover:bg-[#f6f8fa]'

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4"
      onClick={e => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div
        className={clsx(
          'w-full max-w-[600px] rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.3)] font-gilroy border',
          bgCls,
          borderCls
        )}
      >
        {/* Header */}
        <div
          className={clsx(
            'flex items-center gap-3 px-6 pt-5 pb-4 border-b',
            borderCls
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#686ad2"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <div>
            <div className={clsx('text-base font-bold', textCls)}>
              TradeTrust Document Uploaded
            </div>
            <div className={clsx('text-xs mt-0.5', mutedCls)}>{fileName}</div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          <p
            className={clsx(
              'text-sm mb-4 leading-relaxed text-center',
              mutedCls
            )}
          >
            Select network for document verification.
          </p>

          {visibleOptions.length === 0 ? (
            <div
              className={clsx(
                'text-sm text-center py-8',
                'text-red-500 dark:text-red-400'
              )}
            >
              No networks available. Please configure VITE_NETWORK_TYPE
              environment variable.
            </div>
          ) : (
            <>
              {/* Network selector */}
              <div className={clsx('text-[13px] font-bold mb-2', textCls)}>
                Select Network:
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <button
                    onClick={() => setDropdownOpen(v => !v)}
                    className={clsx(
                      'w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg cursor-pointer text-sm font-medium font-gilroy border',
                      bgCls,
                      borderCls,
                      textCls
                    )}
                  >
                    <img
                      src={selected.logo}
                      alt={selected.label}
                      className="w-5 h-5 object-cover rounded-full mr-2 shrink-0"
                    />
                    <span>{selected.label}</span>
                    <span
                      className={clsx(
                        'text-[10px] ml-2 rounded px-1.5 py-0.5',
                        isDarkMode
                          ? 'bg-[#30363d] text-[#8b949e]'
                          : 'bg-[#f0f3f6] text-[#656d76]'
                      )}
                    >
                      {selected.group}
                    </span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={isDarkMode ? '#8b949e' : '#656d76'}
                      strokeWidth="2"
                      className="ml-auto shrink-0"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {dropdownOpen && (
                    <div
                      className="fixed inset-0 z-[9]"
                      onClick={() => setDropdownOpen(false)}
                    />
                  )}
                  {dropdownOpen && (
                    <div
                      className={clsx(
                        'absolute top-[calc(100%+4px)] left-0 right-0 rounded-lg z-10 overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.2)] border',
                        isDarkMode ? 'bg-[#161b22]' : 'bg-white',
                        borderCls
                      )}
                    >
                      {allowedGroups.map(group => (
                        <div key={group}>
                          <div
                            className={clsx(
                              'px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em]',
                              isDarkMode
                                ? 'bg-[#0d1117] text-[#8b949e]'
                                : 'bg-[#f6f8fa] text-[#656d76]'
                            )}
                          >
                            {group}
                          </div>
                          {visibleOptions
                            .filter(n => n.group === group)
                            .map(n => (
                              <div
                                key={n.chainId}
                                onClick={() => {
                                  setSelectedChainId(n.chainId)
                                  setDropdownOpen(false)
                                }}
                                className={clsx(
                                  'px-3.5 py-2.5 text-sm cursor-pointer flex items-center',
                                  hoverItemCls,
                                  textCls,
                                  n.chainId === selectedChainId
                                    ? clsx(
                                        'font-semibold',
                                        isDarkMode
                                          ? 'bg-[#21262d]'
                                          : 'bg-[#f0f3f6]'
                                      )
                                    : 'bg-transparent font-normal'
                                )}
                              >
                                <img
                                  src={n.logo}
                                  alt={n.label}
                                  className="w-5 h-5 object-cover rounded-full mr-2 shrink-0"
                                />
                                {n.label}
                              </div>
                            ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onMouseEnter={handleInfoMouseEnter}
                  onMouseLeave={() => setIsTooltipVisible(false)}
                  className="shrink-0 w-7 h-7 rounded-full border border-primary-60 bg-transparent cursor-pointer text-xs font-semibold text-primary-60 font-gilroy flex items-center justify-center"
                >
                  ?
                </button>
              </div>
            </>
          )}
        </div>

        {isTooltipVisible && (
          <div
            className="fixed z-[1001] pointer-events-none"
            style={{
              top: tooltipPosition.top,
              left: tooltipPosition.left,
              width: tooltipPosition.width,
            }}
          >
            <div
              className={clsx(
                'rounded-lg p-4 shadow-[0_4px_12px_rgba(0,0,0,0.2)] pointer-events-auto border',
                bgCls,
                borderCls
              )}
            >
              <p
                className={clsx(
                  'text-[13px] m-0 font-gilroy font-semibold',
                  textCls
                )}
              >
                Network Selector
              </p>
              <p
                className={clsx(
                  'text-[13px] mt-2 mb-0 font-gilroy leading-relaxed',
                  mutedCls
                )}
              >
                A document can only be successfully verified on the same network
                where the document was created in.
              </p>
              <p
                className={clsx(
                  'text-[13px] mt-2 mb-0 font-gilroy leading-relaxed',
                  mutedCls
                )}
              >
                If unsure, do check with the document issuer.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          className={clsx('flex gap-2.5 px-6 pt-4 pb-5 border-t', borderCls)}
        >
          <button
            onClick={onCancel}
            className={clsx(
              'flex-1 py-2.5 bg-transparent rounded-lg text-sm font-bold cursor-pointer font-gilroy border',
              borderCls,
              textCls
            )}
          >
            Cancel
          </button>
          <button
            onClick={() => selected && onConfirm(selectedChainId)}
            disabled={!selected}
            className={clsx(
              'flex-1 py-2.5 border rounded-lg text-sm font-bold font-gilroy',
              selected
                ? 'bg-primary-60 border-primary-60 text-white cursor-pointer'
                : 'bg-gray-300 border-gray-300 text-gray-500 cursor-not-allowed'
            )}
          >
            Verify
          </button>
        </div>
      </div>
    </div>
  )
}

export default NetworkModal
