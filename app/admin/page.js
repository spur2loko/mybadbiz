'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import Navbar from '../../components/Navbar'
import PostModal from '../../components/PostModal'

export default function AdminPage() {
  const { user, profile } = useAuth()
  const [posts, setPosts] = useState([])
  const [users, setUsers] = useState([])
  const [tab, setTab] = useState('posts')
  const [postSearch, setPostSearch] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [editPost, setEditPost] = useState(null)

  useEffect(() => {
    if (profile?.is_admin) { loadPosts(); loadUsers() }
  }, [profile])

  async function loadPosts() {
    const { data } = await supabase.from('posts').select('*, profiles(username,email)').order('created_at', { ascending: false })
    setPosts(data || [])
  }

  async function loadUsers() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setUsers(data || [])
  }

  async function deletePost(id) {
    if (!confirm('Delete this post permanently?')) return
    await supabase.from('posts').delete().eq('id', id)
    loadPosts()
  }

  async function toggleAdmin(userId, makeAdmin) {
    if (!confirm(`${makeAdmin ? 'Grant' : 'Remove'} admin access?`)) return
    await supabase.from('profiles').update({ is_admin: makeAdmin }).eq('id', userId)
    loadUsers()
  }

  async function deleteUser(userId) {
    if (!confirm('Delete this user and all their posts?')) return
    await supabase.from('profiles').delete().eq('id', userId)
    loadPosts(); loadUsers()
  }

  if (!user || !profile) return <><Navbar /><div style={{textAlign:'center',padding:'4rem',color:'var(--muted)'}}>Loading…</div></>
  if (!profile.is_admin) return (
    <><Navbar />
    <div style={{textAlign:'center',padding:'4rem'}}>
      <h2 style={{fontFamily:'Playfair Display,serif',marginBottom:'0.5rem'}}>Access Denied</h2>
      <p style={{color:'var(--muted)'}}>You must be an admin to view this page.</p>
    </div></>
  )

  const filteredPosts = posts.filter(p => !postSearch || p.person_name.toLowerCase().includes(postSearch.toLowerCase()) || (p.business_name||'').toLowerCase().includes(postSearch.toLowerCase()))
  const filteredUsers = users.filter(u => !userSearch || u.email.toLowerCase().includes(userSearch.toLowerCase()) || (u.username||'').toLowerCase().includes(userSearch.toLowerCase()))

  return (
    <>
      <Navbar />
      <div className="page-wrap" style={{maxWidth:'1000px'}}>
        <h1 style={{fontFamily:'Playfair Display,serif',fontSize:'1.8rem',marginBottom:'0.25rem'}}>Admin Dashboard</h1>
        <p style={{color:'var(--muted)',fontSize:'0.85rem',marginBottom:'2rem'}}>{user.email}</p>

        {/* STATS */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:'1rem',marginBottom:'2rem'}}>
          {[['Total Posts',posts.length],['Total Users',users.length],['Admins',users.filter(u=>u.is_admin).length]].map(([label,val]) => (
            <div key={label} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'6px',padding:'1.25rem',textAlign:'center'}}>
              <div style={{fontFamily:'Playfair Display,serif',fontSize:'2rem',color:'var(--accent)'}}>{val}</div>
              <div style={{fontSize:'0.78rem',color:'var(--muted)',marginTop:'0.25rem',fontWeight:500,textTransform:'uppercase',letterSpacing:'0.04em'}}>{label}</div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={{display:'flex',borderBottom:'2px solid var(--border)',marginBottom:'2rem'}}>
          {['posts','users'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{padding:'0.7rem 1.4rem',background:'none',border:'none',fontFamily:'DM Sans,sans-serif',fontSize:'0.85rem',fontWeight:500,cursor:'pointer',color:tab===t?'var(--accent)':'var(--muted)',borderBottom:tab===t?'2px solid var(--accent)':'2px solid transparent',marginBottom:'-2px',transition:'all 0.15s',textTransform:'capitalize'}}>
              {t === 'posts' ? 'All Posts' : 'Users'}
            </button>
          ))}
        </div>

        {tab === 'posts' && (
          <>
            <input value={postSearch} onChange={e => setPostSearch(e.target.value)} placeholder="Search posts…" style={{width:'100%',padding:'0.7rem 1rem',border:'1.5px solid var(--border)',borderRadius:'4px',fontFamily:'DM Sans,sans-serif',fontSize:'0.88rem',outline:'none',marginBottom:'1rem'}} />
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'6px',overflow:'hidden'}}>
                <thead>
                  <tr>{['Person / Business','Category','Posted By','Date','Actions'].map(h => <th key={h} style={{background:'#f0ede8',padding:'0.7rem 1rem',textAlign:'left',fontSize:'0.75rem',fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.04em',borderBottom:'1px solid var(--border)'}}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {filteredPosts.length === 0
                    ? <tr><td colSpan={5} style={{textAlign:'center',padding:'2rem',color:'var(--muted)'}}>No posts found.</td></tr>
                    : filteredPosts.map(p => (
                      <tr key={p.id}>
                        <td style={{padding:'0.75rem 1rem',borderBottom:'1px solid var(--border)',verticalAlign:'top'}}>
                          <div style={{fontWeight:600,fontSize:'0.83rem'}}>{p.person_name}</div>
                          {p.business_name && <div style={{fontSize:'0.75rem',color:'var(--muted)'}}>{p.business_name}</div>}
                        </td>
                        <td style={{padding:'0.75rem 1rem',borderBottom:'1px solid var(--border)',fontSize:'0.83rem'}}>
                          {p.category && <span className="badge">{p.category}</span>}
                        </td>
                        <td style={{padding:'0.75rem 1rem',borderBottom:'1px solid var(--border)',fontSize:'0.83rem'}}>
                          {p.profiles?.username || p.profiles?.email?.split('@')[0]}
                        </td>
                        <td style={{padding:'0.75rem 1rem',borderBottom:'1px solid var(--border)',fontSize:'0.83rem',whiteSpace:'nowrap'}}>
                          {p.experience_date ? new Date(p.experience_date).toLocaleDateString() : '—'}
                        </td>
                        <td style={{padding:'0.75rem 1rem',borderBottom:'1px solid var(--border)'}}>
                          <div style={{display:'flex',gap:'0.4rem'}}>
                            <button onClick={() => setEditPost(p)} style={{padding:'0.28rem 0.65rem',borderRadius:'3px',fontSize:'0.72rem',fontWeight:600,cursor:'pointer',border:'1.5px solid var(--border)',color:'var(--muted)',background:'none',fontFamily:'DM Sans,sans-serif'}}>Edit</button>
                            <button onClick={() => deletePost(p.id)} style={{padding:'0.28rem 0.65rem',borderRadius:'3px',fontSize:'0.72rem',fontWeight:600,cursor:'pointer',border:'1.5px solid var(--accent)',color:'var(--accent)',background:'none',fontFamily:'DM Sans,sans-serif'}}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 'users' && (
          <>
            <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search users…" style={{width:'100%',padding:'0.7rem 1rem',border:'1.5px solid var(--border)',borderRadius:'4px',fontFamily:'DM Sans,sans-serif',fontSize:'0.88rem',outline:'none',marginBottom:'1rem'}} />
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'6px',overflow:'hidden'}}>
                <thead>
                  <tr>{['Username','Email','Role','Joined','Actions'].map(h => <th key={h} style={{background:'#f0ede8',padding:'0.7rem 1rem',textAlign:'left',fontSize:'0.75rem',fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.04em',borderBottom:'1px solid var(--border)'}}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0
                    ? <tr><td colSpan={5} style={{textAlign:'center',padding:'2rem',color:'var(--muted)'}}>No users found.</td></tr>
                    : filteredUsers.map(u => (
                      <tr key={u.id}>
                        <td style={{padding:'0.75rem 1rem',borderBottom:'1px solid var(--border)',fontSize:'0.83rem'}}>{u.username || '—'}</td>
                        <td style={{padding:'0.75rem 1rem',borderBottom:'1px solid var(--border)',fontSize:'0.83rem'}}>{u.email}</td>
                        <td style={{padding:'0.75rem 1rem',borderBottom:'1px solid var(--border)',fontSize:'0.83rem'}}>
                          {u.is_admin ? <span className="badge" style={{background:'#fef3c7',color:'#b45309'}}>Admin</span> : <span style={{color:'var(--muted)'}}>User</span>}
                        </td>
                        <td style={{padding:'0.75rem 1rem',borderBottom:'1px solid var(--border)',fontSize:'0.83rem',whiteSpace:'nowrap'}}>{new Date(u.created_at).toLocaleDateString()}</td>
                        <td style={{padding:'0.75rem 1rem',borderBottom:'1px solid var(--border)'}}>
                          <div style={{display:'flex',gap:'0.4rem'}}>
                            {u.is_admin
                              ? <button onClick={() => toggleAdmin(u.id, false)} style={{padding:'0.28rem 0.65rem',borderRadius:'3px',fontSize:'0.72rem',fontWeight:600,cursor:'pointer',border:'1.5px solid #b45309',color:'#b45309',background:'none',fontFamily:'DM Sans,sans-serif'}}>Remove Admin</button>
                              : <button onClick={() => toggleAdmin(u.id, true)} style={{padding:'0.28rem 0.65rem',borderRadius:'3px',fontSize:'0.72rem',fontWeight:600,cursor:'pointer',border:'1.5px solid #16a34a',color:'#16a34a',background:'none',fontFamily:'DM Sans,sans-serif'}}>Make Admin</button>
                            }
                            <button onClick={() => deleteUser(u.id)} style={{padding:'0.28rem 0.65rem',borderRadius:'3px',fontSize:'0.72rem',fontWeight:600,cursor:'pointer',border:'1.5px solid var(--accent)',color:'var(--accent)',background:'none',fontFamily:'DM Sans,sans-serif'}}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <footer style={{marginTop:'3rem'}}>&copy; 2025 MyBadBiz.com</footer>

      {editPost && (
        <PostModal editPost={editPost} onClose={() => setEditPost(null)} onSaved={loadPosts} />
      )}
    </>
  )
}
