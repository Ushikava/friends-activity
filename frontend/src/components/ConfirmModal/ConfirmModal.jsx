import { useLang } from '../../i18n/LangContext'
import './ConfirmModal.css'

export default function ConfirmModal({ onConfirm, onCancel }) {
  const { t } = useLang()

  return (
    <div
      className="confirm-backdrop"
      onClick={e => { e.stopPropagation(); if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="confirm-modal" onClick={e => e.stopPropagation()}>
        <h2 className="confirm-modal__title">{t('confirm.title')}</h2>
        <p className="confirm-modal__body">{t('confirm.body')}</p>
        <div className="confirm-modal__actions">
          <button className="confirm-modal__btn confirm-modal__btn--cancel" onClick={onCancel}>
            {t('confirm.cancel')}
          </button>
          <button className="confirm-modal__btn confirm-modal__btn--delete" onClick={onConfirm}>
            {t('confirm.delete')}
          </button>
        </div>
      </div>
    </div>
  )
}
