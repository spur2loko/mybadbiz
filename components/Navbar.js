'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import AuthModal from './AuthModal'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const [modal, setModal] = useState(null)

  return (
    <>
      <nav>
        <Link href="/" className="logo">My<span>Bad</span>Biz</Link>
        <div className="nav-links">
          {user ? (
            <>
              <Link href="/profile" style={{color:'rgba(255,255,255,0.7)'}}>
                👤 {profile?.username || user.email.split('@')[0]}
              </Link>
              {profile?.is_admin && (
                <Link href="/admin" style={{color:'#fbbf24'}}>Admin</Link>
              )}
              <button onClick={signOut}>Log Out</button>
            </>
          ) : (
            <>
              <button onClick={() => setModal('login')}>Log In</button>
              <button className="btn-nav-cta" onClick={() => setModal('signup')}>Sign Up</button>
            </>
          )}
        </div>
      </nav>
      {modal && <AuthModal mode={modal} onClose={() => setModal(null)} onSwitch={setModal} />}
    </>
  )
}
