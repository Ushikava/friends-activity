import { useLang } from '../../i18n/LangContext'
import './ConfirmModal.css'

interface Props {
  title?: string
  body?: string | null
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({ title, body, confirmLabel, danger = true, onConfirm, onCancel }: Props) {
  const { t } = useLang()

  return (
    <div
      className="confirm-backdrop"
      onClick={e => { e.stopPropagation(); if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="confirm-modal" onClick={e => e.stopPropagation()}>
        <h2 className="confirm-modal__title">{title ?? (t('confirm.title') as string)}</h2>
        {body !== null && <p className="confirm-modal__body">{body ?? (t('confirm.body') as string)}</p>}
        <div className="confirm-modal__actions">
          <button className="confirm-modal__btn confirm-modal__btn--cancel" onClick={onCancel}>
            {t('confirm.cancel') as string}
          </button>
          <button className={`confirm-modal__btn${danger ? ' confirm-modal__btn--delete' : ' confirm-modal__btn--confirm'}`} onClick={onConfirm}>
            {confirmLabel ?? (t('confirm.delete') as string)}
          </button>
        </div>
      </div>
    </div>
  )
}
