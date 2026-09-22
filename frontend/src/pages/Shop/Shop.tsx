import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import NavBar from '../../components/NavBar/NavBar'
import ToastContainer, { useToast } from '../../components/Toast/Toast'
import { fetchShopCatalog, purchaseItem } from '../../api/shop'
import { getRole } from '../../api/auth'
import { useLang } from '../../i18n/LangContext'
import { useCoins } from '../../context/CoinsContext'
import type { ShopCatalog, ShopCategory, ShopItem } from '../../types'
import '../page.css'
import './Shop.css'

const CATEGORY_ORDER: ShopCategory[] = ['pet', 'toy', 'decoration', 'environment', 'food']

export default function Shop() {
  const { t, lang } = useLang()
  const { balance, setBalance } = useCoins()
  const { toasts, showToast } = useToast()

  const [catalog, setCatalog] = useState<ShopCatalog | null>(null)
  const [category, setCategory] = useState<ShopCategory>('pet')
  const [buyingId, setBuyingId] = useState<string | null>(null)

  useEffect(() => {
    fetchShopCatalog().then(setCatalog).catch(() => {})
  }, [])

  async function handleBuy(item: ShopItem) {
    if (buyingId) return
    setBuyingId(item.id)
    try {
      const result = await purchaseItem(item.id)
      setBalance(result.balance)
      setCatalog(prev => prev && {
        ...prev,
        items: prev.items.map(i => i.id === item.id ? { ...i, owned: true, quantity: result.quantity } : i),
      })
      showToast(true, `${t('shop.purchased') as string} ${item.icon} ${lang === 'ru' ? item.name_ru : item.name_en}`)
    } catch (err) {
      showToast(false, (err as Error).message)
    } finally {
      setBuyingId(null)
    }
  }

  if (getRole() === 'observer') return <Navigate to="/" replace />

  const categories = catalog?.categories ?? CATEGORY_ORDER
  const items = catalog?.items.filter(i => i.category === category) ?? []

  return (
    <div className="page">
      <NavBar />
      <ToastContainer toasts={toasts} />
      <main className="page__main">
        <div className="shop-statusbar">
          <span className="shop-statusbar__title">{t('shop.title') as string}</span>
          <span className="shop-statusbar__balance">🪙 {balance}</span>
        </div>

        <div className="shop-tabs">
          {categories.map(cat => (
            <button
              key={cat}
              className={`shop-tab${category === cat ? ' shop-tab--active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {t(`shop.category.${cat}`) as string}
            </button>
          ))}
        </div>

        <div className="shop-grid">
          {items.map(item => {
            const name = lang === 'ru' ? item.name_ru : item.name_en
            const stackable = item.category === 'food'
            const disabled = buyingId === item.id || (!stackable && item.owned) || balance < item.price
            return (
              <div key={item.id} className="shop-card">
                <div className="shop-card__icon">{item.icon}</div>
                <span className="shop-card__name">{name}</span>
                {stackable && item.quantity > 0 && (
                  <span className="shop-card__owned-qty">{t('shop.youHave') as string}: {item.quantity}</span>
                )}
                <button
                  className={`shop-card__buy${!stackable && item.owned ? ' shop-card__buy--owned' : ''}`}
                  onClick={() => handleBuy(item)}
                  disabled={disabled}
                >
                  {!stackable && item.owned
                    ? t('shop.owned') as string
                    : buyingId === item.id
                      ? t('shop.buying') as string
                      : `${t('shop.buy') as string} · 🪙 ${item.price}`
                  }
                </button>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
