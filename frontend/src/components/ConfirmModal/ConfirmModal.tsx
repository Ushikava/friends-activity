import { useLang } from '../../i18n/LangContext'
import './ConfirmModal.css'

interface Props {
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({ onConfirm, onCancel }: Props) {
  const { t } = useLang()

  return (
    <div
      className="confirm-backdrop"
      onClick={e => { e.stopPropagation(); if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="confirm-modal" onClick={e => e.stopPropagation()}>
        <h2 className="confirm-modal__title">{t('confirm.title') as string}</h2>
        <p className="confirm-modal__body">{t('confirm.body') as string}</p>
        <div className="confirm-modal__actions">
          <button className="confirm-modal__btn confirm-modal__btn--cancel" onClick={onCancel}>
            {t('confirm.cancel') as string}
          </button>
          <button className="confirm-modal__btn confirm-modal__btn--delete" onClick={onConfirm}>
            {t('confirm.delete') as string}
          </button>
        </div>
      </div>
    </div>
  )
}
