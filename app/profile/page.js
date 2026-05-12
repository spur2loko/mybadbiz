'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import Navbar from '../../components/Navbar'

export default function ProfilePage() {
  const { user, profile, signOut, refreshProfile } = useAuth()
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [profileMsg, setProfileMsg] = useState(null)
  const [passwordMsg, setPasswordMsg] = useState(null)

  useEffect(() => {
    if (!user && !profile) return
    if (profile) {
      setUsername(profile.username || '')
      setPhone(profile.phone || '')
      setBio(profile.bio || '')
    }
  }, [profile])

  async function saveProfile() {
    if (!username) { setProfileMsg({ type: 'error', text: 'Username is required.' }); return }
    const { error } = await supabase.from('profiles').update({ username, phone: phone || null, bio: bio || null }).eq('id', user.id)
    if (error) {
      setProfileMsg({ type: 'error', text: error.message.includes('unique') ? 'That username is taken.' : error.message })
      return
    }
    await refreshProfile()
    setProfileMsg({ type: 'success', text: 'Profile updated!' })
    setTimeout(() => setProfileMsg(null), 3000)
  }

  async function changePassword() {
    if (newPassword.length < 6) { setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters.' }); return }
    if (newPassword !== confirmPassword) { setPasswordMsg({ type: 'error', text: 'Passwords do not match.' }); return }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) { setPasswordMsg({ type: 'error', text: error.message }); return }
    setPasswordMsg({ type: 'success', text: 'Password updated!' })
    setNewPassword(''); setConfirmPassword('')
    setTimeout(() => setPasswordMsg(null), 3000)
  }

  async function handleSignOut() {
    await signOut()
    router.push('/')
  }

  if (!user) return (
    <>
      <Navbar />
      <div className="profile-wrap" style={{textAlign:'center', paddingTop:'5rem'}}>
        <h2 style={{fontFamily:'Playfair Display, serif', marginBottom:'0.5rem'}}>Not logged in</h2>
        <p style={{color:'var(--muted)', marginBottom:'1.5rem'}}>You need to be logged in to view your profile.</p>
        <Link href="/" style={{color:'var(--accent)', fontWeight:600}}>← Go back to the site</Link>
      </div>
    </>
  )

  const displayName = profile?.username || user.email.split('@')[0]

  return (
    <>
      <Navbar />
      <div className="profile-wrap">
        <div className="avatar-circle">{displayName[0].toUpperCase()}</div>
        <div className="profile-title">My Profile</div>
        <div className="profile-sub">{user.email}</div>

        <div className="card">
          <div className="card-title">Account Information</div>
          <div className="form-group">
            <label>Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Choose a username" style={{width:'100%',padding:'0.8rem 1rem',border:'1.5px solid var(--border)',borderRadius:'4px',fontFamily:'DM Sans, sans-serif',fontSize:'0.92rem',outline:'none'}} />
            <div className="field-note">This is how you appear on posts and comments.</div>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input value={user.email} disabled style={{width:'100%',padding:'0.8rem 1rem',border:'1.5px solid var(--border)',borderRadius:'4px',fontFamily:'DM Sans, sans-serif',fontSize:'0.92rem',background:'#f5f3f0',color:'var(--muted)',cursor:'not-allowed'}} />
          </div>
          <div className="form-group">
            <label>Phone Number <span className="optional-tag">Optional</span></label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. (813) 555-0100" style={{width:'100%',padding:'0.8rem 1rem',border:'1.5px solid var(--border)',borderRadius:'4px',fontFamily:'DM Sans, sans-serif',fontSize:'0.92rem',outline:'none'}} />
            <div className="field-note">Only visible to admins. Never shown publicly.</div>
          </div>
          <div className="form-group">
            <label>Bio <span className="optional-tag">Optional</span></label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="A short note about yourself…" style={{width:'100%',padding:'0.8rem 1rem',border:'1.5px solid var(--border)',borderRadius:'4px',fontFamily:'DM Sans, sans-serif',fontSize:'0.92rem',outline:'none',minHeight:'90px',resize:'vertical',lineHeight:'1.6'}} />
          </div>
          <button className="btn-primary" onClick={saveProfile}>Save Changes</button>
          {profileMsg && <div className={`save-msg ${profileMsg.type}`}>{profileMsg.text}</div>}
        </div>

        <div className="card">
          <div className="card-title">Change Password</div>
          <div className="form-group">
            <label>New Password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 characters" style={{width:'100%',padding:'0.8rem 1rem',border:'1.5px solid var(--border)',borderRadius:'4px',fontFamily:'DM Sans, sans-serif',fontSize:'0.92rem',outline:'none'}} />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat new password" style={{width:'100%',padding:'0.8rem 1rem',border:'1.5px solid var(--border)',borderRadius:'4px',fontFamily:'DM Sans, sans-serif',fontSize:'0.92rem',outline:'none'}} />
          </div>
          <button className="btn-primary" onClick={changePassword}>Update Password</button>
          {passwordMsg && <div className={`save-msg ${passwordMsg.type}`}>{passwordMsg.text}</div>}
        </div>

        <div className="card" style={{borderColor:'#fca5a5'}}>
          <div className="card-title" style={{color:'#dc2626'}}>Session</div>
          <button className="btn-danger" onClick={handleSignOut}>Log Out</button>
        </div>
      </div>
      <footer>&copy; 2025 MyBadBiz.com</footer>
    </>
  )
}
