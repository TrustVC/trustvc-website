import { ResolutionResult } from '@govtechsg/address-identity-resolver'
import React, { FunctionComponent } from 'react'
interface AddressInfoProps extends ResolutionResult {
  className?: string
  title: string
  children: React.ReactNode
}

export const AddressInfo: FunctionComponent<AddressInfoProps> = ({
  className,
  title,
  name,
  resolvedBy,
  source,
  children,
}) => {
  return (
    <>
      {title && (
        <p className={`text-asset-title ${className}`}>
          {title ? `${title}:` : ''}
        </p>
      )}
      {name && (
        <div className="flex">
          <h5 className="text-cloud-800 mb-1">{name}</h5>
        </div>
      )}
      <div>{children}</div>
      {resolvedBy && (
        <div className="flex">
          <h6 className="text-cloud-300">
            (Resolved by: {resolvedBy}
            {source && `; Source: ${source}`})
          </h6>
        </div>
      )}
    </>
  )
}
