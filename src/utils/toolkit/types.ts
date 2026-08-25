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

export const DNS_SAMPLE_DOMAINS = [
  'example.opencerts.io',
  'example.tradetrust.io',
] as const
