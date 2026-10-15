interface TagListProps {
  tags: readonly string[]
}

export function TagList({ tags }: TagListProps) {
  return (
    <span className="flex flex-wrap gap-1">
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full bg-brand-500/10 px-2 py-0.5 text-xs font-medium text-brand-600"
        >
          {tag}
        </span>
      ))}
    </span>
  )
}
