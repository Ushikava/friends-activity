import { Routes, Route, Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { getUsername } from './api/auth'
import Login from './pages/Login/Login'
import Home from './pages/Home/Home'
import Gallery from './pages/Gallery/Gallery'
import Games from './pages/Games/Games'
import Places from './pages/Places/Places'
import Movies from './pages/Movies/Movies'
import Profile from './pages/Profile/Profile'
import Chat from './pages/Chat/Chat'
import FloatingWidget from './components/FloatingWidget/FloatingWidget'

function PrivateRoute({ children }: { children: ReactNode }) {
  return getUsername() ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/"        element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/gallery" element={<PrivateRoute><Gallery /></PrivateRoute>} />
        <Route path="/games"   element={<PrivateRoute><Games /></PrivateRoute>} />
        <Route path="/places"  element={<PrivateRoute><Places /></PrivateRoute>} />
        <Route path="/movies"  element={<PrivateRoute><Movies /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/chat"    element={<PrivateRoute><Chat /></PrivateRoute>} />
        <Route path="*"        element={<Navigate to="/" replace />} />
      </Routes>
      <FloatingWidget />
    </>
  )
}
