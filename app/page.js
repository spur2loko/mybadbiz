'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import Navbar from '../components/Navbar'
import PostCard from '../components/PostCard'
import PostModal from '../components/PostModal'
import AuthModal from '../components/AuthModal'

const CATEGORIES = ['All','Fraud','Non-Payment','No-Show','Misrepresentation','Theft','Breach of Contract','Other']

export default function Home() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [showPostModal, setShowPostModal] = useState(false)
  const [editPost, setEditPost] = useState(null)
  const [showAuthModal, setShowAuthModal] = useState(null)

  useEffect(() => { loadPosts() }, [])

  async function loadPosts() {
    const { data } = await supabase.from('posts').select('*, profiles(username, email)').order('created_at', { ascending: false })
    setPosts(data || [])
  }

  async function deletePost(id) {
    if (!confirm('Delete this post? This cannot be undone.')) return
    await supabase.from('posts').delete().eq('id', id)
    loadPosts()
  }

  function handleNewPost() {
    if (!user) { setShowAuthModal('login'); return }
    setEditPost(null)
    setShowPostModal(true)
  }

  const filtered = posts.filter(p => {
    const q = search.toLowerCase()
    const matchQ = !q || p.person_name.toLowerCase().includes(q) || (p.business_name || '').toLowerCase().includes(q)
    const matchCat = activeCategory === 'All' || p.category === activeCategory
    return matchQ && matchCat
  })

  return (
    <>
      <Navbar />

      <div className="hero">
        <h1>A Public Record of Bad Business Experiences</h1>
        <p>Search by name or business. Read real experiences from real people.</p>
        <div className="search-wrap">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or business…" />
        </div>
      </div>

      <div className="stats-bar">{posts.length} record{posts.length !== 1 ? 's' : ''} in the registry</div>

      <div className="page-wrap">
        <div className="toolbar">
          <div className="filters">
            {CATEGORIES.map(cat => (
              <button key={cat} className={`filter-btn ${activeCategory === cat ? 'active' : ''}`} onClick={() => setActiveCategory(cat)}>{cat}</button>
            ))}
          </div>
          <button className="new-post-btn" onClick={handleNewPost}>+ Share Experience</button>
        </div>

        <div className="results-info">
          Showing <strong>{filtered.length}</strong> of <strong>{posts.length}</strong> records
        </div>

        {filtered.length === 0
          ? <div className="empty"><h3>No records found</h3><p>No experiences match your search.</p></div>
          : filtered.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onEdit={p => { setEditPost(p); setShowPostModal(true) }}
                onDelete={deletePost}
              />
            ))
        }
      </div>

      <footer>&copy; 2025 MyBadBiz.com &nbsp;|&nbsp; All experiences are first-person accounts by registered users.</footer>

      {showPostModal && (
        <PostModal
          editPost={editPost}
          onClose={() => { setShowPostModal(false); setEditPost(null) }}
          onSaved={loadPosts}
        />
      )}

      {showAuthModal && (
        <AuthModal mode={showAuthModal} onClose={() => setShowAuthModal(null)} onSwitch={setShowAuthModal} />
      )}
    </>
  )
}
