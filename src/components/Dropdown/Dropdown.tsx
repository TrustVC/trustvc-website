import React, {
  FunctionComponent,
  ReactNode,
  useState,
  useRef,
  useEffect,
} from 'react'
import { ChevronDown } from 'react-feather'
import { createPortal } from 'react-dom'

export interface DropdownProps {
  dropdownButtonText: string | ReactNode
  children: React.ReactNode
  classNameRoot?: string
  className?: string
  classNameMenu?: string
  classNameShared?: string
  disabled?: boolean
  menuPortalTarget?: HTMLElement
}

export const Dropdown: FunctionComponent<DropdownProps> = ({
  dropdownButtonText,
  children,
  disabled,
  menuPortalTarget,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)

  const updateMenuPosition = () => {
    if (isOpen && buttonRef.current && menuPortalTarget) {
      const rect = buttonRef.current.getBoundingClientRect()
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const scrollLeft = window.scrollX || document.documentElement.scrollLeft

      setMenuPosition({
        top: rect.bottom + scrollTop,
        left: rect.left + scrollLeft,
      })
    }
  }

  // Add click event listener to detect clicks outside the dropdown
  const handleClickOutside = (event: MouseEvent) => {
    if (menuPortalTarget) {
      // For portal rendering: check if the click is outside both the button and the dropdown content
      const dropdownContent = menuPortalTarget.querySelector(
        '[data-dropdown-content="true"]'
      )

      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        dropdownContent &&
        !dropdownContent.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    } else {
      // For inline rendering: check if the click is outside the dropdown container
      const dropdownContainer = buttonRef.current?.closest('.btn-menu-frame')
      if (
        dropdownContainer &&
        !dropdownContainer.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
  }

  useEffect(() => {
    updateMenuPosition()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, menuPortalTarget])

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('resize', updateMenuPosition)
      document.addEventListener('mousedown', handleClickOutside)

      return () => {
        window.removeEventListener('resize', updateMenuPosition)
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, menuPortalTarget])

  const renderDropdownContent = () => {
    const content = (
      <div
        data-dropdown-content="true"
        onClick={e => {
          e.stopPropagation()
          setIsOpen(false)
        }}
        style={
          menuPortalTarget
            ? {
                top: menuPosition.top,
                left: menuPosition.left,
                maxWidth: buttonRef.current?.offsetWidth,
              }
            : undefined
        }
        className="dropdown-menu-frame"
      >
        {children}
      </div>
    )

    if (menuPortalTarget && typeof document !== 'undefined') {
      return createPortal(content, menuPortalTarget)
    }

    return content
  }

  return (
    <div className="btn-menu-frame">
      <button
        ref={buttonRef}
        {...props}
        disabled={disabled}
        onClick={event => {
          event.preventDefault()
          if (!disabled) {
            setIsOpen(!isOpen)
          }
        }}
        className="dropdown-btn solid"
      >
        <>
          <h5 className="text-center justify-center !text-white">
            {dropdownButtonText}
          </h5>
          <span>
            <ChevronDown className="text-white" />
          </span>
        </>
      </button>
      {isOpen && <>{renderDropdownContent()}</>}
    </div>
  )
}

export interface DropdownItemProps {
  children?: React.ReactNode
  onClick?: () => void
  className?: string
}

export const DropdownItem: FunctionComponent<DropdownItemProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={`truncate cursor-pointer ${className}`} {...props}>
      <div className="dropdown-item-frame">
        <div className="dropdown-item-text-frame">
          <h5>{children}</h5>
        </div>
      </div>
    </div>
  )
}
