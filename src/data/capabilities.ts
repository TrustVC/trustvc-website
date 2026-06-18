export interface Capability {
  icon: string
  tags: string[]
  title: string
  description: string
}

const capabilities: Capability[] = [
  {
    icon: '/images/about/single-source.svg',
    tags: ['Transferable Record'],
    title: 'Single Source of Truth',
    description:
      'TrustVC uses a public blockchain to maintain a single source of truth for ETRs.',
  },
  {
    icon: '/images/about/unified-foundation.svg',
    tags: ['Verifiable Document', 'Transferable Record'],
    title: 'Unified Foundation',
    description:
      'Single SDK powering multiple industry-specific verification solutions.',
  },
  {
    icon: '/images/about/global.svg',
    tags: ['Verifiable Document', 'Transferable Record'],
    title: 'Global Interoperability',
    description: 'Cross-border verification utilising international standards.',
  },
  {
    icon: '/images/about/privacy.svg',
    tags: ['Verifiable Document', 'Transferable Record'],
    title: 'Privacy First',
    description: 'Selective disclosure of data to protect user privacy.',
  },
  {
    icon: '/images/about/tamper.svg',
    tags: ['Verifiable Document', 'Transferable Record'],
    title: 'Tamper Evident',
    description: 'Any modification invalidates the document.',
  },
  {
    icon: '/images/about/ecosystem.svg',
    tags: ['Verifiable Document', 'Transferable Record'],
    title: 'Ecosystem Approach',
    description: 'Growing network of issuers, verifiers, and users worldwide.',
  },
]

export default capabilities
