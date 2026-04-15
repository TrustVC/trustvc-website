import React, { FunctionComponent } from 'react'
import { useProviderContext } from '../contexts/providerContext'
import { makeEtherscanAddressURL } from '../../../utils/helper'
// import { makeEtherscanAddressURL } from "../../../utils";
// import { useProviderContext } from "../../../common/contexts/provider";

interface ExternalLinkProps {
  name: string
  href: string
  children?: React.ReactNode
}

interface ExternalLinkEtherscanAddressProps {
  name: string
  address: string
  className?: string
  componentName?: string
  children?: React.ReactNode
}

export const ExternalLink: FunctionComponent<ExternalLinkProps> = ({
  name,
  href,
  children,
  ...props
}) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="123"
      {...props}
    >
      {children ? children : <h5>{name}</h5>}
    </a>
  )
}

export const ExternalLinkEtherscanAddress: FunctionComponent<
  ExternalLinkEtherscanAddressProps
> = ({ name, address, children, componentName, ...props }) => {
  const { currentChainId } = useProviderContext()
  let href = '#'
  if (currentChainId) {
    if (componentName === 'FormTransferableRecordPanel') {
      try {
        href = makeEtherscanAddressURL(address, currentChainId)
      } catch {
        href = '#'
      }
    } else {
      href = makeEtherscanAddressURL(address, currentChainId)
    }
  }
  return (
    <ExternalLink name={name} href={href} {...props}>
      {children}
    </ExternalLink>
  )
}
