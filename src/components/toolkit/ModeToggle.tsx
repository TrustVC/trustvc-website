import clsx from 'clsx'

type ModeToggleProps<T extends string> = {
  value: T
  options: { id: T; label: string }[]
  onChange: (value: T) => void
  isDarkMode: boolean
}

const ACTIVE_GRADIENT =
  'linear-gradient(113deg, #686AD2 16.86%, #167EB0 83.14%)'

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
        : 'bg-[#f3f4f6] border-[#e5e7eb]'
    )}
    role="tablist"
  >
    {options.map(option => {
      const selected = option.id === value
      return (
        <button
          key={option.id}
          type="button"
          role="tab"
          aria-selected={selected}
          onClick={() => onChange(option.id)}
          className={clsx(
            'px-4 py-1.5 font-urbanist font-bold text-base leading-[18.75px] rounded-[2097150rem]',
            selected
              ? 'text-white'
              : isDarkMode
                ? 'text-neutral-50'
                : 'text-neutral-30'
          )}
          style={selected ? { background: ACTIVE_GRADIENT } : undefined}
        >
          {option.label}
        </button>
      )
    })}
  </div>
)

export default ModeToggle
