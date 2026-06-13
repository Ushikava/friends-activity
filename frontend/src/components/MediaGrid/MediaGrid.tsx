import { useState } from 'react'
import { motion } from 'framer-motion'
import MediaCard from './MediaCard'
import AddModal from './AddModal'
import { useLang } from '../../i18n/LangContext'
import { containerVariants, cardVariants } from '../../utils/animations'
import type { Movie, Game } from '../../types'
import './mediaGrid.css'

type MediaItem = Movie | Game

interface ExtraField {
  name: string
  placeholder: string
}

interface Props {
  pageTitle: string
  modalTitle: string
  items: MediaItem[]
  checkedField: string
  checkLabel: string
  linkField?: string | null
  canEdit: boolean
  onToggle: (id: number) => void
  onDelete: (id: number) => void
  onAdd: (title: string, file: File | null, url: null, extras: Record<string, string>) => Promise<MediaItem>
  onItemAdded: (item: MediaItem) => void
  extraFields?: ExtraField[]
  loading?: boolean
}

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
}: Props) {
  const { t } = useLang()
  const [showModal, setShowModal] = useState(false)

  async function handleSubmit(title: string, file: File | null, url: null, extras: Record<string, string>) {
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
        ? <p className="media-empty">{t('common.empty') as string}</p>
        : (
          <motion.div
            className="media-grid"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {items.map(item => (
              <motion.div key={item.id} variants={cardVariants}>
                <MediaCard
                  item={item}
                  checkedField={checkedField}
                  checkLabel={checkLabel}
                  linkField={linkField}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  canEdit={canEdit}
                />
              </motion.div>
            ))}
          </motion.div>
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
