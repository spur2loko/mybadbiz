import { supabase } from '../../../lib/supabase'
import PostPageClient from './PostPageClient'

// This generates SEO metadata for each post's page
export async function generateMetadata({ params }) {
  const { slug } = await params
  const id = slug.split('-').pop()

  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('id', await getFullId(id))
    .single()

  if (!post) return { title: 'Post Not Found | MyBadBiz' }

  return {
    title: `${post.person_name}${post.business_name ? ' — ' + post.business_name : ''} | Bad Business Experience | MyBadBiz`,
    description: `Read a bad business experience about ${post.person_name}${post.business_name ? ' at ' + post.business_name : ''}. Category: ${post.category || 'General'}. ${post.description.slice(0, 150)}…`,
    openGraph: {
      title: `${post.person_name} — Bad Business Experience`,
      description: post.description.slice(0, 200),
      url: `https://mybadbiz.com/post/${params.slug}`,
    }
  }
}

async function getFullId(shortId) {
  const { data } = await supabase.from('posts').select('id')
  if (!data) return shortId
  const match = data.find(p => p.id.slice(0, 8) === shortId)
  return match?.id || shortId
}

export default async function PostPage({ params }) {
  const { slug } = await params
  const parts = slug.split('-')
  const shortId = parts[parts.length - 1]
  const fullId = await getFullId(shortId)

  const { data: post } = await supabase
    .from('posts')
    .select('*, profiles(username, email)')
    .eq('id', fullId)
    .single()

  return <PostPageClient post={post} slug={slug} />
}
