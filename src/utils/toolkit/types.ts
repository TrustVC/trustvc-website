export const INVALID_JSON_MESSAGE =
  'This isn\u2019t valid JSON - check for a missing comma or bracket.'

export type ToolkitTool = 'wrap' | 'dns' | 'encrypt' | 'revoke'

export const TOOLKIT_TOOLS: ToolkitTool[] = ['wrap', 'dns', 'encrypt', 'revoke']

export const isToolkitTool = (value: string | null): value is ToolkitTool =>
  value === 'wrap' ||
  value === 'dns' ||
  value === 'encrypt' ||
  value === 'revoke'

export type DocVersion = '2.0' | '3.0' | '4.0'

export type StatusKind = 'idle' | 'success' | 'error' | 'empty'

export const SAMPLE_RAW_V2_DOCUMENT = {
  issuers: [
    {
      name: 'Demo Issuer',
      documentStore: '0x8bA63EAB43342AAc3AdBB4B5516A32c0aBc1d394',
      identityProof: {
        type: 'DNS-TXT',
        location: 'example.openattestation.com',
      },
    },
  ],
  $template: {
    name: 'main',
    type: 'EMBEDDED_RENDERER',
    url: 'https://generic-templates.tradetrust.io',
  },
  recipient: {
    name: 'Alice Lim',
  },
  name: 'Alice Lim',
  degree: 'BSc Computer Science',
}

export const SAMPLE_RAW_V4_DOCUMENT = {
  '@context': [
    'https://www.w3.org/ns/credentials/v2',
    'https://schemata.openattestation.com/com/openattestation/4.0/alpha-context.json',
  ],
  type: ['VerifiableCredential', 'OpenAttestationCredential'],
  validFrom: '2021-03-08T12:00:00+08:00',
  name: 'Republic of Singapore Driving Licence',
  issuer: {
    id: 'did:ethr:0xE712878f6E8d5d4F9e87E10DA604F9cB564C9a89',
    type: 'OpenAttestationIssuer',
    name: 'Government Technology Agency of Singapore (GovTech)',
    identityProof: {
      identityProofType: 'DNS-DID',
      identifier: 'example.openattestation.com',
    },
  },
  credentialSubject: {
    id: 'urn:uuid:a013fb9d-bb03-4056-b696-05575eceaf42',
    name: 'John Doe',
  },
}

export const DNS_SAMPLE_DOMAINS = [
  'example.opencerts.io',
  'example.tradetrust.io',
] as const
