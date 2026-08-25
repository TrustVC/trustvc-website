import clsx from 'clsx'

type ModeToggleProps<T extends string> = {
  value: T
  options: { id: T; label: string }[]
  onChange: (value: T) => void
  isDarkMode: boolean
}

const ModeToggle = <T extends string>({
  value,
  options,
  onChange,
  isDarkMode,
}: ModeToggleProps<T>) => (
  <div
    className={clsx(
      'inline-flex items-center gap-0.5 p-[5px] rounded-full border',
      isDarkMode
        ? 'bg-white/5 border-white/10'
        : 'bg-neutral-60 border-neutral-50'
    )}
    role="tablist"
  >
    {options.map(option => {
      const selected = option.id === value
      const inactiveText = isDarkMode ? 'text-neutral-50' : 'text-neutral-30'
      return (
        <button
          key={option.id}
          type="button"
          role="tab"
          aria-selected={selected}
          onClick={() => onChange(option.id)}
          className={clsx(
            'px-4 py-1.5 font-urbanist font-bold text-base leading-[18.75px] rounded-full',
            selected
              ? 'bg-gradient-to-r from-primary-60 to-secondary-60 text-white'
              : inactiveText
          )}
        >
          {option.label}
        </button>
      )
    })}
  </div>
)

export default ModeToggle
