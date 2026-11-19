import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Link } from 'react-router-dom';
import Header from './Header';
import NewsFeed from './NewsFeed';

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
  story_type: string; // 'lead' or 'minor'
}

export default function PostFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-paper">
        <Header />
        <div className="container mx-auto px-4 max-w-6xl py-12 eyebrow">Loading posts...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main className="container mx-auto px-4 max-w-6xl pt-10 pb-16">
        <div className="eyebrow !text-accent !text-xl">The latest</div>
        <h1 className="mt-2 font-display font-extrabold text-7xl sm:text-9xl leading-[0.9] tracking-tight">
          Economic updates
        </h1>
        <div className="mt-10 border-t-[3px] border-ink">
          {posts.map((post) => (
            <Link
              to={`/post/${post.id}`}
              key={post.id}
              className="block py-6 border-b border-rule hover:bg-white/5 hover:text-inherit"
            >
              <div className="flex flex-wrap items-center gap-3">
                {post.story_type === 'lead' && (
                  <span className="bg-flag text-white px-2.5 py-0.5 font-display font-bold text-sm tracking-[0.1em] uppercase">Lead story</span>
                )}
                <span className="eyebrow">
                  {post.author} · {new Date(post.created_at).toLocaleDateString()}
                </span>
              </div>
              <h2 className="mt-2 font-display font-extrabold text-4xl sm:text-5xl leading-none tracking-tight">{post.title}</h2>
              {post.summary && <p className="mt-3 text-xl leading-snug text-ink-soft max-w-3xl">{post.summary}</p>}
            </Link>
          ))}
        </div>

        <NewsFeed />
      </main>
    </div>
  );
}
