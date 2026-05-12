'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthModal({ mode, onClose, onSwitch }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setError(''); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError(error.message); return }
    onClose()
  }

  async function handleSignup() {
    setError(''); setSuccess(''); setLoading(true)
    if (!username) { setError('Please choose a username.'); setLoading(false); return }
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('profiles').update({ username, phone: phone || null }).eq('id', data.user.id)
    }
    setLoading(false)
    setSuccess('Account created! Check your email to confirm, then log in.')
  }

  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>{mode === 'login' ? 'Log In' : 'Create Account'}</h2>

        {mode === 'signup' && (
          <div className="form-group">
            <label>Username *</label>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Choose a username" />
          </div>
        )}

        <div className="form-group">
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === 'signup' ? 'Min 6 characters' : 'Your password'} />
        </div>

        {mode === 'signup' && (
          <div className="form-group">
            <label>Phone Number <span style={{fontSize:'0.68rem',background:'var(--bg)',color:'var(--muted)',border:'1px solid var(--border)',borderRadius:'999px',padding:'0.1rem 0.5rem',marginLeft:'0.3rem'}}>Optional</span></label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. (813) 555-0100" />
          </div>
        )}

        {error && <div className="msg error">{error}</div>}
        {success && <div className="msg success">{success}</div>}

        <button className="btn-submit" onClick={mode === 'login' ? handleLogin : handleSignup} disabled={loading}>
          {loading ? 'Please wait…' : mode === 'login' ? 'Log In' : 'Create Account'}
        </button>

        <div className="modal-alt">
          {mode === 'login'
            ? <>Don't have an account? <a onClick={() => onSwitch('signup')}>Sign up free</a></>
            : <>Already have an account? <a onClick={() => onSwitch('login')}>Log in</a></>
          }
        </div>
      </div>
    </div>
  )
}
