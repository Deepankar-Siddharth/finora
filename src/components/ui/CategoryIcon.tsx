import { getCategoryMeta } from '../../constants/categories'

interface CategoryIconProps {
  category: string
  size?: 'sm' | 'md' | 'lg'
  /** When true the chip is tinted with the category color. */
  tinted?: boolean
}

const SIZES = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
  lg: 'h-11 w-11',
} as const

const ICON_SIZES = {
  sm: 'h-4 w-4',
  md: 'h-4.5 w-4.5',
  lg: 'h-5 w-5',
} as const

export function CategoryIcon({ category, size = 'md', tinted = true }: CategoryIconProps) {
  const meta = getCategoryMeta(category)
  const Icon = meta.icon
  const style = tinted ? { backgroundColor: `${meta.color}1f`, color: meta.color } : undefined

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-lg ${SIZES[size]} ${tinted ? '' : 'bg-surface-2 text-ink-muted'}`}
      style={style}
      aria-hidden="true"
    >
      <Icon className={ICON_SIZES[size]} />
    </span>
  )
}
