import './Pagination.css'

interface Props {
  page: number
  total: number
  limit: number
  onChange: (page: number) => void
}

export default function Pagination({ page, total, limit, onChange }: Props) {
  const totalPages = Math.ceil(total / limit)
  if (totalPages <= 1) return null

  return (
    <div className="pagination">
      <button
        className="pagination__btn"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        aria-label="Предыдущая страница"
      >
        ←
      </button>
      <span className="pagination__info">{page} / {totalPages}</span>
      <button
        className="pagination__btn"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        aria-label="Следующая страница"
      >
        →
      </button>
    </div>
  )
}
