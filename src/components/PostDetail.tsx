import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface Post {
  id: string;
  title: string;
  content: string;
  created_at: string;
  author: string;
  summary: string;
  image_url?: string;
}

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPost(id);
    }
  }, [id]);

  async function fetchPost(postId: string) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (error) throw error;
      setPost(data);
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center p-4">Loading post...</div>;
  }

  if (!post) {
    return <div className="text-center p-4">Post not found</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow">
      <button
        onClick={() => navigate('/')}
        className="mb-4 text-blue-600 hover:underline text-sm"
      >
        ← Back to Dashboard
      </button>
      {post?.image_url && (
        <img
          src={post.image_url}
          alt={post.title}
          className="w-full h-auto rounded mb-4 bg-white"
          style={{ maxHeight: 400, maxWidth: '100%', objectFit: 'contain' }}
        />
      )}
      <h1 className="text-2xl font-bold mb-2">{post?.title}</h1>
      <div className="text-gray-500 text-sm mb-4">
        By {post?.author} • {post?.created_at && new Date(post.created_at).toLocaleString()}
      </div>
      <div
        className="prose max-w-none"
        dangerouslySetInnerHTML={{
          __html: (post?.content || '').replace(/\n/g, '<br />'),
        }}
      />
    </div>
  );
} 