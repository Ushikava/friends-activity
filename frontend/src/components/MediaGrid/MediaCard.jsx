const UPLOADS = import.meta.env.VITE_UPLOADS_URL

function posterSrc(poster) {
  if (!poster) return null
  if (poster.startsWith('http')) return poster
  return `${UPLOADS}/${poster}`
}

export default function MediaCard({ item, checkedField, checkLabel, linkField, onToggle, onDelete, canEdit }) {
  const src = posterSrc(item.poster)
  const isChecked = item[checkedField]
  const link = linkField ? item[linkField] : null
  const Wrap = link ? 'a' : 'div'
  const wrapProps = link
    ? { href: link, target: '_blank', rel: 'noopener noreferrer' }
    : {}

  return (
    <div className={`media-card${isChecked ? ' media-card--checked' : ''}`}>
      <Wrap className="media-card__img-wrap" {...wrapProps}>
        {src
          ? <img src={src} alt={item.title} className="media-card__img" />
          : <div className="media-card__no-poster">{item.title[0]}</div>
        }
        <div className="media-card__overlay">
          <label className="media-card__check" onClick={e => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => onToggle(item.id)}
            />
            <span>{checkLabel}</span>
          </label>
          {canEdit && (
            <button
              className="media-card__delete"
              onClick={e => { e.preventDefault(); onDelete(item.id) }}
              title="Удалить"
            >×</button>
          )}
        </div>
      </Wrap>
      <p className="media-card__title">{item.title}</p>
    </div>
  )
}
