import { useDocumentContext } from '../components/common/contexts/DocumentContext'

/** Whether the currently verified document is a BoE / Obligation Record. */
export const useIsObligation = (): boolean => {
  const { isObligation } = useDocumentContext()
  return isObligation
}
