import { useLang } from '../../i18n/LangContext'

const UPLOADS = import.meta.env.VITE_UPLOADS_URL

function posterSrc(poster) {
  if (!poster) return null
  if (poster.startsWith('http')) return poster
  return `${UPLOADS}/${poster}`
}

export default function MediaCard({ item, checkedField, checkLabel, linkField, onToggle, onDelete, canEdit }) {
  const { t } = useLang()
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
          <label className={`media-card__check${!canEdit ? ' media-card__check--readonly' : ''}`} onClick={e => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => canEdit && onToggle(item.id)}
              readOnly={!canEdit}
            />
            <span className="media-card__check-pill">
              <span className="media-card__check-icon">✓</span>
              {checkLabel}
            </span>
          </label>
          {canEdit && (
            <button
              className="media-card__delete"
              onClick={e => { e.preventDefault(); onDelete(item.id) }}
              title={t('common.delete')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
            </button>
          )}
        </div>
      </Wrap>
      <p className="media-card__title">{item.title}</p>
    </div>
  )
}
