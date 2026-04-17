import type React from 'react'
import clsx from 'clsx'
import { getSanityImageUrl } from '../../../lib/sanity/client'
import type { PortableTextBlock, PortableTextSpan } from '../../../types/news'

interface NewsDetailBodyProps {
  isDarkMode: boolean
  blocks?: PortableTextBlock[]
}

const NewsDetailBody = ({ isDarkMode, blocks }: NewsDetailBodyProps) => {
  const articleBodyClass = clsx(
    'mt-8 max-w-3xl mx-auto space-y-6 text-[15px] leading-7',
    isDarkMode ? 'text-[#A9B2BB]' : 'text-[#3D444D]'
  )

  const renderPortableTextSpan = (
    span: PortableTextSpan,
    block: PortableTextBlock,
    index: number
  ) => {
    const text = span.text || ''
    const marks = span.marks || []
    const key = span._key || `span-${index}`

    const linkMarkKey = marks.find(mark =>
      block.markDefs?.some(def => def._key === mark && def._type === 'link')
    )
    const linkDef = linkMarkKey
      ? block.markDefs?.find(
          def => def._key === linkMarkKey && def._type === 'link'
        )
      : null

    let content: React.ReactNode = text
    if (marks.includes('strong')) content = <strong>{content}</strong>
    if (marks.includes('em')) content = <em>{content}</em>
    if (marks.includes('code')) {
      content = (
        <code
          className={`rounded px-1 font-mono text-sm ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`}
        >
          {content}
        </code>
      )
    }

    if (linkDef?.href) {
      const isExternal = /^https?:\/\//.test(linkDef.href)
      return (
        <a
          key={key}
          href={linkDef.href}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className="underline text-[#5B5BB3] hover:opacity-80"
        >
          {content}
        </a>
      )
    }

    return <span key={key}>{content}</span>
  }

  const renderPortableTextBlock = (
    block: PortableTextBlock,
    blockIndex: number
  ) => {
    const key = block._key || `block-${blockIndex}`
    const spans = (block.children || []).map((span, i) =>
      renderPortableTextSpan(span, block, i)
    )

    if (block._type === 'image') {
      const imageBlock = block as unknown as {
        asset?: { _ref?: string }
        alt?: string
      }
      const assetRef = imageBlock.asset?._ref
      if (!assetRef) return null
      const src = getSanityImageUrl({ asset: { _ref: assetRef } })
        ?.width(900)
        .url()
      if (!src) return null
      return (
        <img
          key={key}
          src={src}
          alt={imageBlock.alt || ''}
          className="w-full rounded-xl"
        />
      )
    }

    if (block.listItem) {
      return <li key={key}>{spans}</li>
    }

    switch (block.style) {
      case 'h2':
        return (
          <h2
            key={key}
            className={clsx(
              'text-2xl font-bold mt-6',
              isDarkMode ? 'text-[#DEE4E9]' : 'text-[#1E2026]'
            )}
          >
            {spans}
          </h2>
        )
      case 'h3':
        return (
          <h3
            key={key}
            className={clsx(
              'text-xl font-bold mt-5',
              isDarkMode ? 'text-[#DEE4E9]' : 'text-[#1E2026]'
            )}
          >
            {spans}
          </h3>
        )
      case 'blockquote':
        return (
          <blockquote
            key={key}
            className={clsx(
              'border-l-4 border-[#686AD2] pl-4 italic',
              isDarkMode ? 'text-[#A9B2BB]' : 'text-[#3D444D]'
            )}
          >
            {spans}
          </blockquote>
        )
      default:
        return <p key={key}>{spans}</p>
    }
  }

  const renderBlocks = (portableBlocks: PortableTextBlock[]) => {
    const output: React.ReactNode[] = []
    let i = 0
    while (i < portableBlocks.length) {
      const block = portableBlocks[i]
      if (block.listItem) {
        const listType = block.listItem
        const groupKey = block._key || `list-${i}`
        const items: React.ReactNode[] = []
        while (
          i < portableBlocks.length &&
          portableBlocks[i].listItem === listType
        ) {
          items.push(renderPortableTextBlock(portableBlocks[i], i))
          i++
        }
        const Tag = listType === 'number' ? 'ol' : 'ul'
        output.push(
          <Tag
            key={groupKey}
            className={`${listType === 'number' ? 'list-decimal' : 'list-disc'} list-inside space-y-1`}
          >
            {items}
          </Tag>
        )
      } else {
        output.push(renderPortableTextBlock(block, i))
        i++
      }
    }
    return output
  }

  return (
    <div className={articleBodyClass}>
      {blocks?.length ? renderBlocks(blocks) : <p>No content available yet.</p>}
    </div>
  )
}

export default NewsDetailBody
