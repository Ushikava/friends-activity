import { useState } from 'react'

interface ItemIconProps {
  image: string | null
  fallback: string
  alt?: string
  className?: string
}

// Renders an item's real artwork when the backend has one, falling back to
// its emoji placeholder otherwise — and also if the declared image 404s.
export default function ItemIcon({ image, fallback, alt, className }: ItemIconProps) {
  const [error, setError] = useState(false)

  if (!image || error) {
    return <span className={className}>{fallback}</span>
  }

  return (
    <img
      src={image}
      alt={alt ?? fallback}
      className={className}
      onError={() => setError(true)}
    />
  )
}
