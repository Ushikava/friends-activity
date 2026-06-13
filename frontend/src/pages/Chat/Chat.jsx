import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import NavBar from '../../components/NavBar/NavBar'
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal'
import {
  fetchRooms, createRoom, renameRoom, deleteRoom,
  fetchHistory, clearHistory, sendMessage,
} from '../../api/chat'
import { useLang } from '../../i18n/LangContext'
import '../page.css'
import '../../components/MediaGrid/mediaGrid.css'
import './Chat.css'

const MD_COMPONENTS = {
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="chat-md-link">
      {children}
    </a>
  ),
  code: ({ inline, children }) =>
    inline
      ? <code className="chat-md-code">{children}</code>
      : <pre className="chat-md-pre"><code>{children}</code></pre>,
  p: ({ children }) => <p className="chat-md-p">{children}</p>,
}

function AssistantAvatar() {
  return (
    <div className="chat-bubble__avatar">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l2.09 6.26L20 9.27l-4.91 4.78 1.18 6.68L12 17.77l-4.27 2.96 1.18-6.68L4 9.27l5.91-1.01L12 2z"/>
      </svg>
    </div>
  )
}

export default function Chat() {
  const { t } = useLang()

  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [rooms, setRooms] = useState([])
  const [activeRoom, setActiveRoom] = useState(null)
  const [isPendingRoom, setIsPendingRoom] = useState(false)
  const [editingRoomId, setEditingRoomId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [confirmDeleteRoom, setConfirmDeleteRoom] = useState(null)

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [chatErr, setChatErr] = useState('')

  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const editInputRef = useRef(null)

  function showChatErr(msg) {
    setChatErr(msg)
    setTimeout(() => setChatErr(''), 4000)
  }

  useEffect(() => {
    fetchRooms()
      .then(data => {
        setRooms(data)
        if (data.length > 0) selectRoom(data[data.length - 1])
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (editingRoomId !== null) editInputRef.current?.focus()
  }, [editingRoomId])

  async function selectRoom(room) {
    if (streaming) return
    setSidebarOpen(false)
    setIsPendingRoom(false)
    setActiveRoom(room)
    setMessages([])
    setLoadingMsgs(true)
    try {
      const history = await fetchHistory(room.id)
      setMessages(history)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingMsgs(false)
    }
    inputRef.current?.focus()
  }

  function handleCreateRoom() {
    if (streaming) return
    setSidebarOpen(false)
    setIsPendingRoom(true)
    setActiveRoom(null)
    setMessages([])
    inputRef.current?.focus()
  }

  function startRename(room, e) {
    e.stopPropagation()
    setEditingRoomId(room.id)
    setEditingName(room.name)
  }

  async function commitRename(roomId) {
    const name = editingName.trim()
    setEditingRoomId(null)
    if (!name) return
    try {
      const updated = await renameRoom(roomId, name)
      setRooms(prev => prev.map(r => r.id === roomId ? updated : r))
      if (activeRoom?.id === roomId) setActiveRoom(updated)
    } catch {
      showChatErr(t('chat.errRename'))
    }
  }

  async function handleDeleteRoom() {
    const room = confirmDeleteRoom
    setConfirmDeleteRoom(null)
    try {
      await deleteRoom(room.id)
      const remaining = rooms.filter(r => r.id !== room.id)
      setRooms(remaining)
      if (activeRoom?.id === room.id) {
        if (remaining.length > 0) selectRoom(remaining[remaining.length - 1])
        else { setActiveRoom(null); setMessages([]) }
      }
    } catch {
      showChatErr(t('chat.errDelete'))
    }
  }

  function autoResize() {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  function handleChange(e) {
    setInput(e.target.value)
    autoResize()
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || streaming || (!activeRoom && !isPendingRoom)) return

    let room = activeRoom

    if (isPendingRoom) {
      const name = text.split(/\s+/).slice(0, 5).join(' ').slice(0, 40)
      try {
        room = await createRoom(name)
      } catch {
        showChatErr(t('chat.errCreate'))
        return
      }
      setRooms(prev => [...prev, room])
      setActiveRoom(room)
      setIsPendingRoom(false)
    }

    const userMsgId = crypto.randomUUID()
    const assistantId = crypto.randomUUID()

    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', content: text }])
    setStreaming(true)
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }])

    await sendMessage(
      room.id,
      text,
      chunk => setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, content: m.content + chunk } : m
      )),
      () => setStreaming(false),
      () => {
        setStreaming(false)
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, content: t('chat.error'), error: true } : m
        ))
      }
    )

    inputRef.current?.focus()
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  async function handleClear() {
    if (!activeRoom) return
    await clearHistory(activeRoom.id)
    setMessages([])
    setConfirmClear(false)
  }

  return (
    <div className="page">
      <NavBar />
      <main className="page__main chat-page">

        {/* ── Page title (full width, like other pages) ── */}
        <div className="chat-page-header">
          <h1 className="media-header__title">{t('chat.title')}</h1>
          <button className="chat-sidebar-toggle" onClick={() => setSidebarOpen(o => !o)}>
            {sidebarOpen
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            }
          </button>
        </div>

        {chatErr && <p className="page-error">{chatErr}</p>}

        {/* ── Two-panel layout ── */}
        <div className="chat-panels">

          {/* ── Sidebar ── */}
          <aside className={`chat-sidebar${sidebarOpen ? ' chat-sidebar--open' : ''}`}>
            <button className="chat-new-btn" onClick={handleCreateRoom}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              {t('chat.newRoom')}
            </button>

            <div className="chat-rooms-list">
              {rooms.length === 0 && (
                <p className="chat-rooms-empty">{t('chat.noRooms')}</p>
              )}
              {rooms.map(room => (
                <div
                  key={room.id}
                  className={`chat-room-item${activeRoom?.id === room.id ? ' chat-room-item--active' : ''}`}
                  onClick={() => selectRoom(room)}
                >
                  {editingRoomId === room.id ? (
                    <input
                      ref={editInputRef}
                      className="chat-room-edit"
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      onBlur={() => commitRename(room.id)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') commitRename(room.id)
                        if (e.key === 'Escape') setEditingRoomId(null)
                      }}
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <span className="chat-room-name">{room.name}</span>
                      <div className="chat-room-actions">
                        <button
                          className="chat-room-action"
                          onClick={e => startRename(room, e)}
                          title={t('chat.renameHint')}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9"/>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                          </svg>
                        </button>
                        <button
                          className="chat-room-action"
                          onClick={e => { e.stopPropagation(); setConfirmDeleteRoom(room) }}
                          title={t('chat.deleteRoom')}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14H6L5 6"/>
                            <path d="M10 11v6M14 11v6"/>
                            <path d="M9 6V4h6v2"/>
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </aside>

          {/* ── Chat main ── */}
          <div className="chat-main">
            {!activeRoom && !isPendingRoom ? (
              <div className="chat-empty chat-empty--centered">
                <div className="chat-empty__icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <p className="chat-empty__text">{t('chat.selectOrCreate')}</p>
              </div>
            ) : (
              <>
                <div className="chat-toolbar">
                  <span className={`chat-status-dot${streaming ? ' chat-status-dot--active' : ''}`} />
                  {messages.length > 0 && (
                    <button className="chat-clear-btn" onClick={() => setConfirmClear(true)}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14H6L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                        <path d="M9 6V4h6v2"/>
                      </svg>
                    </button>
                  )}
                </div>

                <div className="chat-messages">
                  {loadingMsgs && <div className="loading-spinner" />}
                  {!loadingMsgs && messages.length === 0 && (
                    <div className="chat-empty">
                      <div className="chat-empty__icon">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                      </div>
                      <p className="chat-empty__text">{t('chat.empty')}</p>
                    </div>
                  )}
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`chat-bubble chat-bubble--${msg.role}${msg.error ? ' chat-bubble--error' : ''}`}
                    >
                      {msg.role === 'assistant' && <AssistantAvatar />}
                      <div className="chat-bubble__content">
                        {msg.role === 'assistant' && msg.content === '' && streaming
                          ? <div className="chat-thinking"><span/><span/><span/></div>
                          : msg.role === 'assistant'
                            ? <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
                                {msg.content}
                              </ReactMarkdown>
                            : msg.content
                        }
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                <div className="chat-input-row">
                  <textarea
                    ref={inputRef}
                    className="chat-input"
                    placeholder={t('chat.placeholder')}
                    value={input}
                    onChange={handleChange}
                    onKeyDown={handleKey}
                    rows={1}
                    disabled={streaming}
                  />
                  <button
                    className="chat-send-btn"
                    onClick={handleSend}
                    disabled={!input.trim() || streaming || (!activeRoom && !isPendingRoom)}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>

        </div>
      </main>

      {confirmClear && (
        <ConfirmModal onConfirm={handleClear} onCancel={() => setConfirmClear(false)} />
      )}
      {confirmDeleteRoom && (
        <ConfirmModal onConfirm={handleDeleteRoom} onCancel={() => setConfirmDeleteRoom(null)} />
      )}
    </div>
  )
}
