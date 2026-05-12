'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

function slugify(name, id) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + id.slice(0, 8)
}

export default function PostCard({ post, onEdit, onDelete }) {
  const { user, profile } = useAuth()
  const [votes, setVotes] = useState({ up: 0, down: 0, mine: null })
  const [comments, setComments] = useState([])
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [collapsed, setCollapsed] = useState(true)

  const canEdit = user && (user.id === post.user_id || profile?.is_admin)
  const poster = post.profiles?.username || post.profiles?.email?.split('@')[0] || 'Anonymous'
  const dateStr = post.experience_date ? new Date(post.experience_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''
  const slug = slugify(post.person_name, post.id)

  useEffect(() => {
    loadVotes()
    loadComments()
  }, [])

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

  async function deleteComment(commentId) {
    if (!confirm('Delete this comment?')) return
    await supabase.from('comments').delete().eq('id', commentId)
    loadComments()
  }

  return (
    <div className="post-card">
      <div className="post-body">
        <div className="post-top">
          <div className="post-names">
            <h2><Link href={`/post/${slug}`}>{post.person_name}</Link></h2>
            {post.business_name && <div className="biz">{post.business_name}</div>}
          </div>
          <div className="post-meta">
            {post.category && <span className="badge">{post.category}</span>}
            {dateStr && <span className="post-date">{dateStr}</span>}
          </div>
        </div>
        <div className={`post-desc ${collapsed ? 'collapsed' : ''}`}>{post.description}</div>
        <Link href={`/post/${slug}`} className="read-more-link">Read full account →</Link>
      </div>

      <div className="post-footer">
        <div className="post-footer-left">
          <button className={`vote-btn up ${votes.mine === 'up' ? 'active' : ''}`} onClick={() => castVote('up')}>👍 {votes.up}</button>
          <button className={`vote-btn down ${votes.mine === 'down' ? 'active' : ''}`} onClick={() => castVote('down')}>👎 {votes.down}</button>
          <button className="comment-toggle-btn" onClick={() => setShowComments(!showComments)}>
            💬 Comments ({comments.length})
          </button>
          <span className="poster-info">Posted by {poster}</span>
        </div>
        {canEdit && (
          <div className="post-footer-right">
            <button className="post-action-btn" onClick={() => onEdit(post)}>✏️ Edit</button>
            <button className="post-action-btn delete" onClick={() => onDelete(post.id)}>🗑 Delete</button>
          </div>
        )}
      </div>

      {showComments && (
        <div className="comments-section">
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
            ? <div className="comment-form">
                <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add your experience or comment…" onKeyDown={e => e.key === 'Enter' && submitComment()} />
                <button onClick={submitComment}>Post</button>
              </div>
            : <div className="login-prompt">Log in to add a comment.</div>
          }
        </div>
      )}
    </div>
  )
}
