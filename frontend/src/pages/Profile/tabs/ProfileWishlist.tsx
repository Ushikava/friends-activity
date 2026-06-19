import { useState, useEffect } from 'react'
import { TrashIcon, ArrowTopRightOnSquareIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useLang } from '../../../i18n/LangContext'
import { fetchWishlist, addWishlistItem, deleteWishlistItem } from '../../../api/wishlist'
import { fetchMyProfile, fetchUsers, avatarSrc } from '../../../api/profile'
import type { WishlistItem, WishlistCurrency, UserProfile } from '../../../types'

const AVATAR_COLORS = ['#e57373', '#81c784', '#64b5f6', '#ffb74d', '#ba68c8', '#4db6ac', '#f06292', '#aed581']
function userColor(name: string) {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xfffff
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

function MiniAvatar({ user }: { user: UserProfile }) {
  const src = avatarSrc(user.avatar_url)
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
      background: src ? 'transparent' : userColor(user.username),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 700, color: '#fff', overflow: 'hidden',
    }}>
      {src ? <img src={src} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : user.username.slice(0, 2).toUpperCase()}
    </div>
  )
}

const CURRENCY_SYMBOLS: Record<WishlistCurrency, string> = {
  EUR: '€',
  RUB: '₽',
  USD: '$',
}

const CURRENCIES: WishlistCurrency[] = ['EUR', 'RUB', 'USD']

interface Props {
  showToast: (ok: boolean, msg: string) => void
}

export default function ProfileWishlist({ showToast }: Props) {
  const { t } = useLang()
  const [myProfile, setMyProfile] = useState<UserProfile | null>(null)
  const [users, setUsers] = useState<UserProfile[]>([])
  const [viewUser, setViewUser] = useState<UserProfile | null>(null)

  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [formOpen, setFormOpen] = useState(false)

  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [price, setPrice] = useState('')
  const [currency, setCurrency] = useState<WishlistCurrency>('EUR')

  useEffect(() => {
    fetchMyProfile().then(p => {
      setMyProfile(p)
      return fetchUsers().then(all => setUsers(all.filter(u => u.id !== p.id)))
    }).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchWishlist(viewUser?.id)
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [viewUser])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)
    try {
      const item = await addWishlistItem({
        title,
        url,
        price: price ? parseFloat(price) : null,
        currency,
      })
      setItems(prev => [item, ...prev])
      setTitle(''); setUrl(''); setPrice('')
      setFormOpen(false)
    } catch (err) {
      showToast(false, (err as Error).message)
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteWishlistItem(id)
      setItems(prev => prev.filter(i => i.id !== id))
    } catch (err) {
      showToast(false, (err as Error).message)
    }
  }

  const isOwn = viewUser === null

  return (
    <div className="pwish">
      <div className="pwish__header">
        <span className="pwish__title">{t('profile.wishlist.title') as string}</span>
        {isOwn && (
          <button
            className={`pwish__toggle-btn${formOpen ? ' pwish__toggle-btn--open' : ''}`}
            onClick={() => setFormOpen(v => !v)}
          >
            {formOpen
              ? <XMarkIcon style={{ width: 18, height: 18 }} />
              : <PlusIcon style={{ width: 18, height: 18 }} />
            }
            {formOpen ? t('common.cancel') as string : t('profile.wishlist.add') as string}
          </button>
        )}
      </div>

      {/* ── User selector ── */}
      {myProfile && (
        <div className="pwish__users">
          <button
            className={`pwish__user-pill${isOwn ? ' pwish__user-pill--active' : ''}`}
            onClick={() => { setViewUser(null); setFormOpen(false) }}
          >
            <MiniAvatar user={myProfile} />
            <span>{t('profile.wishlist.me') as string}</span>
          </button>
          {users.map(u => (
            <button
              key={u.id}
              className={`pwish__user-pill${viewUser?.id === u.id ? ' pwish__user-pill--active' : ''}`}
              onClick={() => { setViewUser(u); setFormOpen(false) }}
            >
              <MiniAvatar user={u} />
              <span>{u.username}</span>
            </button>
          ))}
        </div>
      )}


      {formOpen && (
        <form className="pwish__form" onSubmit={handleAdd} autoComplete="off">
          <input
            type="text"
            className="pwish__input"
            placeholder={t('profile.wishlist.itemTitle') as string}
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
          <input
            type="url"
            className="pwish__input"
            placeholder={t('profile.wishlist.itemUrl') as string}
            value={url}
            onChange={e => setUrl(e.target.value)}
            required
          />
          <div className="pwish__price-row">
            <input
              type="number"
              className="pwish__input pwish__input--price"
              placeholder={t('profile.wishlist.itemPrice') as string}
              value={price}
              onChange={e => setPrice(e.target.value)}
              min="0"
              step="0.01"
            />
            <div className="pwish__currency-group">
              {CURRENCIES.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`pwish__currency-btn${currency === c ? ' pwish__currency-btn--active' : ''}`}
                  onClick={() => setCurrency(c)}
                >
                  {c}
                </button>
              ))}
            </div>
            <button type="submit" className="pwish__add-btn" disabled={adding || !title || !url}>
              {adding ? '...' : t('profile.wishlist.add') as string}
            </button>
          </div>
        </form>
      )}

      {/* ── List ── */}
      {loading && <div className="loading-spinner" style={{ margin: '40px auto' }} />}

      {!loading && items.length === 0 && (
        <p className="pwish__empty">{t('profile.wishlist.empty') as string}</p>
      )}

      {!loading && items.length > 0 && (
        <ul className="pwish__list">
          {items.map(item => (
            <li key={item.id} className="pwish__item">
              <div className="pwish__item-main">
                <span className="pwish__item-title">{item.title}</span>
                {item.price != null && (
                  <span className="pwish__item-price">
                    {CURRENCY_SYMBOLS[item.currency]}{item.price.toFixed(2)}
                  </span>
                )}
              </div>
              <div className="pwish__item-actions">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pwish__item-link"
                  title={item.url}
                >
                  <ArrowTopRightOnSquareIcon style={{ width: 16, height: 16 }} />
                </a>
                {isOwn && (
                  <button
                    className="pwish__item-delete"
                    onClick={() => handleDelete(item.id)}
                    title={t('profile.wishlist.deleteItem') as string}
                  >
                    <TrashIcon style={{ width: 16, height: 16 }} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
