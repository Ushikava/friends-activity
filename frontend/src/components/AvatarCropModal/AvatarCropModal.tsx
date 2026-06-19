import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { getCroppedBlob } from '../../utils/cropImage'
import './AvatarCropModal.css'

interface Props {
  imageSrc: string
  onConfirm: (blob: Blob) => void
  onCancel: () => void
  confirmLabel?: string
  cancelLabel?: string
}

export default function AvatarCropModal({ imageSrc, onConfirm, onCancel, confirmLabel = 'Готово', cancelLabel = 'Отмена' }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [loading, setLoading] = useState(false)

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  async function handleConfirm() {
    if (!croppedAreaPixels) return
    setLoading(true)
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels)
      onConfirm(blob)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="acrop__overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="acrop__modal">
        <div className="acrop__canvas">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="acrop__controls">
          <input
            type="range"
            className="acrop__zoom"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
          />
        </div>

        <div className="acrop__actions">
          <button className="acrop__btn acrop__btn--cancel" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className="acrop__btn acrop__btn--confirm" onClick={handleConfirm} disabled={loading}>
            {loading ? '...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
