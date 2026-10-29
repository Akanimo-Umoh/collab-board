import { Badge } from '@/components/ui/Badge'

interface TagListProps {
  tags: readonly string[]
}

export function TagList({ tags }: TagListProps) {
  return (
    <span className="flex flex-wrap gap-1">
      {tags.map((tag) => (
        <Badge key={tag}>{tag}</Badge>
      ))}
    </span>
  )
}
