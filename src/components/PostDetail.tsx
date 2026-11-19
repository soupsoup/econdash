import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import Header from './Header';

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
  image_focal_x?: number;
  image_focal_y?: number;
  image_display_height?: number;
  story_type: string; // 'lead' or 'minor'
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

  // Get focal point or default to 50%
  const getObjectPosition = (post: Post) => {
    const x = post.image_focal_x !== undefined ? post.image_focal_x : 50;
    const y = post.image_focal_y !== undefined ? post.image_focal_y : 50;
    return `${x}% ${y}%`;
  };

  // Get image height or default to 300px
  const getImageHeight = (post: Post) => {
    return post.image_display_height !== undefined ? `${post.image_display_height}px` : '300px';
  };

  if (!post) {
    return (
      <div className="min-h-screen bg-paper">
        <Header />
        <div className="container mx-auto px-4 max-w-4xl py-12 eyebrow">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <article className="container mx-auto px-4 max-w-4xl pt-10 pb-16">
        <button
          onClick={() => navigate('/')}
          className="eyebrow border-b border-ink pb-0.5 hover:text-accent"
        >
          ← Back to scoreboard
        </button>
        <h1 className="mt-6 font-display font-extrabold text-5xl sm:text-7xl leading-[0.95] tracking-tight">{post?.title}</h1>
        <div className="mt-4 eyebrow">
          By {post?.author} · {post?.created_at && new Date(post.created_at).toLocaleString()}
        </div>
        {post?.image_url && (
          <div className="mt-8">
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full cursor-pointer transition-transform hover:scale-[1.01]"
              style={{ objectFit: 'contain', objectPosition: getObjectPosition(post), height: getImageHeight(post), maxHeight: '600px' }}
              onClick={() => setIsImageExpanded(true)}
            />
          </div>
        )}
        <div
          className="mt-8 border-t-[3px] border-ink pt-6 text-xl leading-relaxed text-ink [&_ul]:list-disc [&_ul]:pl-6"
          dangerouslySetInnerHTML={{
            __html: (post?.content || '')
              .replace(/\n/g, '<br />')
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/^• (.*?)$/gm, '<li>$1</li>')
              .replace(/(<li>.*?<\/li>)/g, '<ul>$1</ul>')
              .replace(/<\/ul><ul>/g, ''),
          }}
        />
      </article>

      {/* Image Modal */}
      {isImageExpanded && post.image_url && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setIsImageExpanded(false)}
        >
          <img
            src={post.image_url}
            alt={post.title}
            className="max-w-full object-contain"
            style={{ objectPosition: getObjectPosition(post), height: getImageHeight(post), maxHeight: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
} 