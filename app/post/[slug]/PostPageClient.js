'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../lib/AuthContext'
import Navbar from '../../../components/Navbar'
import PostModal from '../../../components/PostModal'
import { useRouter } from 'next/navigation'

export default function PostPageClient({ post, slug }) {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [votes, setVotes] = useState({ up: 0, down: 0, mine: null })
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [showEdit, setShowEdit] = useState(false)
  const [currentPost, setCurrentPost] = useState(post)

  const canEdit = user && (user.id === post?.user_id || profile?.is_admin)
  const poster = post?.profiles?.username || post?.profiles?.email?.split('@')[0] || 'Anonymous'
  const dateStr = post?.experience_date ? new Date(post.experience_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''

  useEffect(() => {
    if (post) { loadVotes(); loadComments() }
  }, [user])

  async function loadVotes() {
    const { data } = await supabase.from('votes').select('vote_type, user_id').eq('post_id', post.id)
    if (!data) return
    setVotes({
      up: data.filter(v => v.vote_type === 'up').length,
      down: data.filter(v => v.vote_type === 'down').length,
      mine: user ? data.find(v => v.user_id === user.id)?.vote_type || null : null
    })
  }

  async function castVote(type) {
    if (!user) return
    const { data: existing } = await supabase.from('votes').select('*').eq('post_id', post.id).eq('user_id', user.id).single().catch(() => ({ data: null }))
    if (existing) {
      if (existing.vote_type === type) await supabase.from('votes').delete().eq('id', existing.id)
      else await supabase.from('votes').update({ vote_type: type }).eq('id', existing.id)
    } else {
      await supabase.from('votes').insert({ post_id: post.id, user_id: user.id, vote_type: type })
    }
    loadVotes()
  }

  async function loadComments() {
    const { data } = await supabase.from('comments').select('*, profiles(username, email)').eq('post_id', post.id).order('created_at', { ascending: true })
    setComments(data || [])
  }

  async function submitComment() {
    if (!user || !commentText.trim()) return
    await supabase.from('comments').insert({ post_id: post.id, user_id: user.id, content: commentText.trim() })
    setCommentText('')
    loadComments()
  }

  async function deleteComment(id) {
    if (!confirm('Delete this comment?')) return
    await supabase.from('comments').delete().eq('id', id)
    loadComments()
  }

  async function deletePost() {
    if (!confirm('Delete this post permanently?')) return
    await supabase.from('posts').delete().eq('id', post.id)
    router.push('/')
  }

  async function refreshPost() {
    const { data } = await supabase.from('posts').select('*, profiles(username, email)').eq('id', post.id).single()
    setCurrentPost(data)
  }

  if (!post) return (
    <>
      <Navbar />
      <div className="post-page-wrap">
        <Link href="/" className="post-page-back">← Back to registry</Link>
        <div className="empty"><h3>Post not found</h3><p>This post may have been removed.</p></div>
      </div>
    </>
  )

  return (
    <>
      <Navbar />
      <div className="post-page-wrap">
        <Link href="/" className="post-page-back">← Back to registry</Link>

        <div className="post-page-header">
          <h1>{currentPost.person_name}</h1>
          {currentPost.business_name && <div className="post-page-biz">{currentPost.business_name}</div>}
          <div className="post-page-badges">
            {currentPost.category && <span className="badge">{currentPost.category}</span>}
            {dateStr && <span className="post-date" style={{fontSize:'0.82rem'}}>{dateStr}</span>}
          </div>
        </div>

        <div className="post-page-meta">
          Posted by <strong>{poster}</strong>
          {canEdit && (
            <span style={{marginLeft:'1rem'}}>
              <button className="post-action-btn" onClick={() => setShowEdit(true)}>✏️ Edit</button>
              <button className="post-action-btn delete" onClick={deletePost}>🗑 Delete</button>
            </span>
          )}
        </div>

        <div className="post-page-body">{currentPost.description}</div>

        {/* VOTES */}
        <div style={{display:'flex', gap:'0.75rem', marginBottom:'2rem'}}>
          <button className={`vote-btn up ${votes.mine === 'up' ? 'active' : ''}`} onClick={() => castVote('up')}>👍 {votes.up}</button>
          <button className={`vote-btn down ${votes.mine === 'down' ? 'active' : ''}`} onClick={() => castVote('down')}>👎 {votes.down}</button>
        </div>

        {/* COMMENTS */}
        <div style={{borderTop:'1px solid var(--border)', paddingTop:'1.5rem'}}>
          <h3 style={{fontFamily:'Playfair Display, serif', fontSize:'1.1rem', marginBottom:'1.25rem'}}>
            Comments ({comments.length})
          </h3>

          {comments.map(c => {
            const author = c.profiles?.username || c.profiles?.email?.split('@')[0] || 'User'
            const canDel = user && (user.id === c.user_id || profile?.is_admin)
            return (
              <div key={c.id} className="comment">
                <div className="comment-avatar">{author[0].toUpperCase()}</div>
                <div className="comment-bubble">
                  <div className="comment-author">
                    {author}
                    {canDel && <button className="comment-delete" onClick={() => deleteComment(c.id)}>✕</button>}
                  </div>
                  <div className="comment-text">{c.content}</div>
                  <div className="comment-date">{new Date(c.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            )
          })}

          {user
            ? <div className="comment-form" style={{marginTop:'1rem'}}>
                <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add your experience or comment…" onKeyDown={e => e.key === 'Enter' && submitComment()} />
                <button onClick={submitComment}>Post</button>
              </div>
            : <div className="login-prompt" style={{marginTop:'1rem'}}>Log in to add a comment.</div>
          }
        </div>
      </div>

      <footer>&copy; 2025 MyBadBiz.com &nbsp;|&nbsp; All experiences are first-person accounts.</footer>

      {showEdit && (
        <PostModal
          editPost={currentPost}
          onClose={() => setShowEdit(false)}
          onSaved={refreshPost}
        />
      )}
    </>
  )
}
