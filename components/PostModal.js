'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const CATEGORIES = ['Fraud','Non-Payment','No-Show','Misrepresentation','Theft','Breach of Contract','Other']

export default function PostModal({ onClose, onSaved, editPost = null }) {
  const { user } = useAuth()
  const [personName, setPersonName] = useState('')
  const [bizName, setBizName] = useState('')
  const [date, setDate] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (editPost) {
      setPersonName(editPost.person_name || '')
      setBizName(editPost.business_name || '')
      setDate(editPost.experience_date || '')
      setCategory(editPost.category || '')
      setDescription(editPost.description || '')
    }
  }, [editPost])

  async function handleSubmit() {
    if (!personName || !date || !category || !description) {
      setError('Please fill in all required fields.'); return
    }
    setError(''); setLoading(true)
    const payload = { person_name: personName, business_name: bizName, experience_date: date, category, description }

    let error
    if (editPost) {
      ;({ error } = await supabase.from('posts').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editPost.id))
    } else {
      ;({ error } = await supabase.from('posts').insert({ ...payload, user_id: user.id }))
    }

    setLoading(false)
    if (error) { setError(error.message); return }
    onSaved()
    onClose()
  }

  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>{editPost ? 'Edit Experience' : 'Share an Experience'}</h2>

        <div className="form-row">
          <div className="form-group">
            <label>Person's Name *</label>
            <input value={personName} onChange={e => setPersonName(e.target.value)} placeholder="First Last" />
          </div>
          <div className="form-group">
            <label>Business Name</label>
            <input value={bizName} onChange={e => setBizName(e.target.value)} placeholder="Optional" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Date of Experience *</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Category *</label>
            <select value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">Select…</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Description *</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe what happened. Be factual and specific." />
        </div>

        {error && <div className="msg error">{error}</div>}
        <button className="btn-submit" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Saving…' : editPost ? 'Save Changes' : 'Publish Experience'}
        </button>
      </div>
    </div>
  )
}
