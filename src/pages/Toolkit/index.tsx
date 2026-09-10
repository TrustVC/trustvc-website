import { useSearchParams } from 'react-router-dom'
import ToolkitSection from '@/components/toolkit/ToolkitSection'
import { isToolkitTool, type ToolkitTool } from '@/utils/toolkit/types'

type ToolkitPageProps = {
  isDarkMode: boolean
}

const ToolkitPage = ({ isDarkMode }: ToolkitPageProps) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const toolParam = searchParams.get('tool')
  const active: ToolkitTool = isToolkitTool(toolParam) ? toolParam : 'wrap'

  const onChange = (tool: ToolkitTool) => {
    setSearchParams(tool === 'wrap' ? {} : { tool }, { replace: true })
  }

  return (
    <div className="w-full min-w-0 overflow-x-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-16 xl:px-24 pt-[112px] pb-16">
        <ToolkitSection
          active={active}
          onChange={onChange}
          isDarkMode={isDarkMode}
        />
      </div>
    </div>
  )
}

export default ToolkitPage
