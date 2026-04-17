import { useDocumentContext } from '../components/common/contexts/DocumentContext'

export const useTokenRegistryVersion = () => {
  const { tokenRegistryVersion } = useDocumentContext()
  return tokenRegistryVersion
}
