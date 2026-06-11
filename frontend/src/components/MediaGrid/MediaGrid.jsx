import { useState } from 'react'
import MediaCard from './MediaCard'
import AddModal from './AddModal'
import './mediaGrid.css'

export default function MediaGrid({
  pageTitle,
  modalTitle,
  items,
  checkedField,
  checkLabel,
  linkField = null,
  canEdit,
  onToggle,
  onDelete,
  onAdd,
  onItemAdded,
  extraFields = [],
  loading = false,
}) {
  const [showModal, setShowModal] = useState(false)

  async function handleSubmit(title, file, url, extras) {
    const item = await onAdd(title, file, url, extras)
    onItemAdded(item)
  }

  return (
    <>
      <div className="media-header">
        <h1 className="media-header__title">{pageTitle}</h1>
        {canEdit && (
          <button className="media-header__add" onClick={() => setShowModal(true)}>+</button>
        )}
      </div>

      {loading
        ? <div className="loading-spinner" />
        : items.length === 0
        ? <p className="media-empty">Пока ничего нет</p>
        : (
          <div className="media-grid">
            {items.map(item => (
              <MediaCard
                key={item.id}
                item={item}
                checkedField={checkedField}
                checkLabel={checkLabel}
                linkField={linkField}
                onToggle={onToggle}
                onDelete={onDelete}
                canEdit={canEdit}
              />
            ))}
          </div>
        )
      }

      {showModal && (
        <AddModal
          title={modalTitle}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
          extraFields={extraFields}
        />
      )}
    </>
  )
}
