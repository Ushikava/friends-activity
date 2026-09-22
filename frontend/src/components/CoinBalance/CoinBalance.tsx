import { useNavigate } from 'react-router-dom'
import { Coins } from '@phosphor-icons/react'
import { useLang } from '../../i18n/LangContext'
import { useCoins } from '../../context/CoinsContext'
import './CoinBalance.css'

export default function CoinBalance() {
  const { t } = useLang()
  const { balance } = useCoins()
  const navigate = useNavigate()

  return (
    <button
      className="coin-balance__btn"
      onClick={() => navigate('/shop')}
      title={t('coins.title') as string}
    >
      <Coins size={24} weight="fill" className="coin-balance__icon" />
      <span className="coin-balance__amount">{balance}</span>
    </button>
  )
}
