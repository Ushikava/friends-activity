import { useState, useEffect } from 'react'
import type { DragEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { PencilSimple } from '@phosphor-icons/react'
import NavBar from '../../components/NavBar/NavBar'
import ToastContainer, { useToast } from '../../components/Toast/Toast'
import ItemIcon from '../../components/ItemIcon/ItemIcon'
import { fetchPet, feedPet, playWithPet, setPetEnvironment, renamePet } from '../../api/pet'
import { getRole } from '../../api/auth'
import { useLang } from '../../i18n/LangContext'
import type { PetState, PetSprite } from '../../types'
import '../page.css'
import './Pet.css'

const SPRITE_SRC: Record<PetSprite, string> = {
  hungry: '/pet/hungry.svg',
  normal: '/pet/normal.svg',
  full: '/pet/full.svg',
}

export default function Pet() {
  const { t, tRaw, lang } = useLang()
  const navigate = useNavigate()
  const { toasts, showToast } = useToast()

  // undefined = still loading, null = confirmed the user has no pet yet
  const [pet, setPet] = useState<PetState | null | undefined>(undefined)
  const [loadError, setLoadError] = useState(false)
  const [spriteError, setSpriteError] = useState(false)
  const [bgError, setBgError] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [busyItemId, setBusyItemId] = useState<string | null>(null)

  function loadPet() {
    setLoadError(false)
    fetchPet().then(setPet).catch(() => setLoadError(true))
  }

  useEffect(() => {
    loadPet()
  }, [])

  if (getRole() === 'observer') return <Navigate to="/" replace />

  async function handleFeed(itemId: string) {
    if (busyItemId === itemId) return
    setBusyItemId(itemId)
    try {
      setPet(await feedPet(itemId))
    } catch (err) {
      showToast(false, (err as Error).message)
    } finally {
      setBusyItemId(prev => prev === itemId ? null : prev)
      setDragOver(false)
    }
  }

  async function handlePlay(itemId: string) {
    if (busyItemId === itemId) return
    setBusyItemId(itemId)
    try {
      setPet(await playWithPet(itemId))
    } catch (err) {
      showToast(false, (err as Error).message)
    } finally {
      setBusyItemId(prev => prev === itemId ? null : prev)
    }
  }

  async function handleEnvironment(itemId: string) {
    try {
      setPet(await setPetEnvironment(pet?.active_environment_item_id === itemId ? null : itemId))
      setBgError(false)
    } catch (err) {
      showToast(false, (err as Error).message)
    }
  }

  async function commitRename() {
    setEditingName(false)
    const trimmed = nameDraft.trim()
    if (!pet || !trimmed || trimmed === pet.name) return
    try {
      setPet(await renamePet(trimmed))
    } catch (err) {
      showToast(false, (err as Error).message)
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    const itemId = e.dataTransfer.getData('text/plain')
    if (itemId) handleFeed(itemId)
  }

  const activeEnvironment = pet?.environments.find(env => env.id === pet.active_environment_item_id)

  return (
    <div className="page">
      <NavBar />
      <ToastContainer toasts={toasts} />

      <div className="pet-fullscreen">
        {loadError && (
          <div className="pet-fullscreen__center">
            <div className="pet-empty">
              <div className="pet-empty__icon">⚠️</div>
              <p className="pet-empty__text">{t('pet.loadError') as string}</p>
              <button className="pet-empty__cta" onClick={loadPet}>
                {t('pet.retry') as string}
              </button>
            </div>
          </div>
        )}

        {!loadError && pet === undefined && (
          <div className="pet-fullscreen__center">
            <div className="loading-spinner" />
          </div>
        )}

        {!loadError && pet === null && (
          <div className="pet-fullscreen__center">
            <div className="pet-empty">
              <div className="pet-empty__icon">🐱</div>
              <p className="pet-empty__text">{t('pet.noPet') as string}</p>
              <button className="pet-empty__cta" onClick={() => navigate('/shop')}>
                {t('pet.goToShop') as string}
              </button>
            </div>
          </div>
        )}

        {!loadError && pet && (
          <>
            <div
              className={`pet-stage${dragOver ? ' pet-stage--drag-over' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {activeEnvironment && (
                activeEnvironment.image && !bgError ? (
                  <img
                    key={activeEnvironment.id}
                    src={activeEnvironment.image}
                    alt={lang === 'ru' ? activeEnvironment.name_ru : activeEnvironment.name_en}
                    className="pet-stage__bg"
                    onError={() => setBgError(true)}
                  />
                ) : (
                  <div className="pet-stage__environment">
                    <span className="pet-stage__environment-icon">{activeEnvironment.icon}</span>
                  </div>
                )
              )}

              {pet.toys.length > 0 && (
                <div className="pet-stage__toys">
                  {pet.toys.slice(0, 3).map(toy => (
                    <button
                      key={toy.id}
                      className="pet-toy"
                      title={lang === 'ru' ? toy.name_ru : toy.name_en}
                      onClick={() => handlePlay(toy.id)}
                    >
                      <ItemIcon image={toy.image} fallback={toy.icon} className="pet-toy__icon" />
                    </button>
                  ))}
                </div>
              )}

              {spriteError ? (
                <div className="pet-stage__cat-fallback">🐱</div>
              ) : (
                <img
                  src={SPRITE_SRC[pet.sprite]}
                  alt={pet.name}
                  className="pet-stage__cat"
                  onError={() => setSpriteError(true)}
                />
              )}
            </div>

            <div className="pet-panel">
              <div className="pet-panel__header">
                <div className="pet-panel__name-row">
                  {editingName ? (
                    <input
                      className="pet-panel__name-input"
                      value={nameDraft}
                      autoFocus
                      maxLength={40}
                      onChange={e => setNameDraft(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                    />
                  ) : (
                    <>
                      <span className="pet-panel__name">{pet.name}</span>
                      <button
                        className="pet-panel__edit-btn"
                        onClick={() => { setNameDraft(pet.name); setEditingName(true) }}
                        title={t('common.edit') as string}
                        aria-label={t('common.edit') as string}
                      >
                        <PencilSimple size={14} />
                      </button>
                    </>
                  )}
                </div>
                <span className="pet-panel__age">
                  {t('pet.age') as string}: {(tRaw('pet.agePlural') as (n: number) => string)(pet.age_days)}
                </span>
              </div>

              <div className="pet-bar">
                <div className="pet-bar__label">{t('pet.satiety') as string}</div>
                <div className="pet-bar__track">
                  <div className="pet-bar__fill pet-bar__fill--satiety" style={{ width: `${pet.satiety}%` }} />
                </div>
              </div>

              <div className="pet-bar">
                <div className="pet-bar__label">{t('pet.happiness') as string}</div>
                <div className="pet-bar__track">
                  <div className="pet-bar__fill pet-bar__fill--happiness" style={{ width: `${pet.happiness}%` }} />
                </div>
              </div>

              <div className="pet-panel__foods">
                {pet.foods.length === 0 ? (
                  <button className="pet-panel__foods-empty" onClick={() => navigate('/shop')}>
                    {t('pet.noFood') as string}
                  </button>
                ) : (
                  pet.foods.map(food => (
                    <div
                      key={food.id}
                      className="pet-food-item"
                      draggable
                      onDragStart={e => e.dataTransfer.setData('text/plain', food.id)}
                      onClick={() => handleFeed(food.id)}
                      title={lang === 'ru' ? food.name_ru : food.name_en}
                    >
                      <span className="pet-food-item__circle">
                        <ItemIcon image={food.image} fallback={food.icon} className="pet-food-item__icon" />
                      </span>
                      <span className="pet-food-item__qty">{food.quantity}</span>
                    </div>
                  ))
                )}
              </div>

              {pet.environments.length > 0 && (
                <div className="pet-panel__environments">
                  {pet.environments.map(env => (
                    <button
                      key={env.id}
                      className={`pet-env-btn${pet.active_environment_item_id === env.id ? ' pet-env-btn--active' : ''}`}
                      onClick={() => handleEnvironment(env.id)}
                      title={lang === 'ru' ? env.name_ru : env.name_en}
                    >
                      <ItemIcon image={env.image} fallback={env.icon} className="pet-env-btn__icon" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
