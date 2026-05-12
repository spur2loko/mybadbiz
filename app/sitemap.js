import { supabase } from '../lib/supabase'

export default async function sitemap() {
  const baseUrl = 'https://mybadbiz.com'

  // Get all posts
  const { data: posts } = await supabase
    .from('posts')
    .select('id, person_name, updated_at, created_at')

  const postUrls = (posts || []).map(post => {
    const slug = post.person_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + post.id.slice(0, 8)
    return {
      url: `${baseUrl}/post/${slug}`,
      lastModified: new Date(post.updated_at || post.created_at),
      changeFrequency: 'weekly',
      priority: 0.8,
    }
  })

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...postUrls,
  ]
}
