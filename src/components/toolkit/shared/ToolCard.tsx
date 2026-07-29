import { ReactNode } from 'react'

interface ToolCardProps {
  icon: ReactNode
  title: string
  description: string
  children: ReactNode
}

const ToolCard = ({ icon, title, description, children }: ToolCardProps) => (
  <section className="w-full rounded-2xl bg-white shadow-sm">
    <header className="flex items-start gap-4 border-b border-neutral-60 px-6 py-5">
      <div className="rounded-xl bg-primary-100/40 p-3 text-primary-60">
        {icon}
      </div>
      <div>
        <h2 className="text-base font-bold text-neutral-10">{title}</h2>
        <p className="mt-1 text-sm text-neutral-30">{description}</p>
      </div>
    </header>
    <div className="px-6 py-6">{children}</div>
  </section>
)

export default ToolCard
