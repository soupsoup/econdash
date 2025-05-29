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
  author: string;
  created_at: string;
  image_url?: string;
}

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [isImageExpanded, setIsImageExpanded] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching post:', error);
        return;
      }

      setPost(data);
    };

    fetchPost();
  }, [id]);

  if (!post) {
    return <div className="max-w-4xl mx-auto p-6">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded shadow">
      <button
        onClick={() => navigate('/')}
        className="mb-4 text-blue-600 hover:underline text-sm"
      >
        ← Back to Dashboard
      </button>
      {post?.image_url && (
        <div className="mb-4">
          <img
            src={post.image_url}
            alt={post.title}
            className="w-full h-auto rounded cursor-pointer transition-transform hover:scale-[1.02]"
            style={{ maxHeight: 400, objectFit: 'contain' }}
            onClick={() => setIsImageExpanded(true)}
          />
        </div>
      )}
      <h1 className="text-2xl font-bold mb-2">{post?.title}</h1>
      <div className="text-gray-500 text-sm mb-4">
        By {post?.author} • {post?.created_at && new Date(post.created_at).toLocaleString()}
      </div>
      <div
        className="prose max-w-none"
        dangerouslySetInnerHTML={{
          __html: (post?.content || '')
            .replace(/\n/g, '<br />')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/^• (.*?)$/gm, '<li>$1</li>')
            .replace(/(<li>.*?<\/li>)/g, '<ul>$1</ul>')
            .replace(/<\/ul><ul>/g, ''),
        }}
      />

      {/* Image Modal */}
      {isImageExpanded && post.image_url && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setIsImageExpanded(false)}
        >
          <img
            src={post.image_url}
            alt={post.title}
            className="max-w-full max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
} 