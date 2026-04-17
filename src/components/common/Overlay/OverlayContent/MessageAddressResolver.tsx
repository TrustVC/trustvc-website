// TODO: This will be updated by TrustVC identity resolver
// import { useIdentifierResolver } from '@tradetrust-tt/address-identity-resolver'
import React, { FunctionComponent } from 'react'

export const MessageAddressResolver: FunctionComponent<{ address: string }> = ({
  address,
}) => {
  // const { identityName } = useIdentifierResolver(address)
  const identityName = ''
  return (
    <p className="break-all whitespace-normal overflow-hidden text-ellipsis">
      {identityName || address}
    </p>
  )
}
