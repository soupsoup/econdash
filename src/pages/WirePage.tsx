import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Header from '../components/Header';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface WirePost {
  id: string;
  username: string;
  timestamp: string;
  text: string;
}

export default function WirePage() {
  const [posts, setPosts] = useState<WirePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    if (process.env.NODE_ENV === 'production') {
      try {
        const { data, error } = await supabase
          .from('wire_posts')
          .select('*')
          .order('timestamp', { ascending: false });
        if (error) throw error;
        setPosts(data || []);
      } catch (err) {
        console.error('Error fetching wire posts:', err);
        setError('Failed to load wire posts');
      }
    } else {
      try {
        const response = await fetch('/api/wire');
        const data = await response.json();
        setPosts(data.posts || []);
      } catch (err) {
        console.error('Error fetching wire posts:', err);
        setError('Failed to load wire posts');
      }
    }
    setLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main className="container mx-auto px-4 max-w-6xl pt-10 pb-16">
        <div className="eyebrow">Loading wire posts...</div>
      </main>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main className="container mx-auto px-4 max-w-6xl pt-10 pb-16">
        <div className="text-accent">{error}</div>
      </main>
    </div>
  );

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main className="container mx-auto px-4 max-w-6xl pt-10 pb-16">
        <h1 className="font-display font-extrabold text-6xl sm:text-8xl leading-[0.9] tracking-tight mb-8">Wire service feed</h1>
        <div className="border-t-[3px] border-ink">
          {posts.map(post => (
            <div key={post.id} className="py-5 border-b border-rule">
              <div className="eyebrow mb-1">
                {post.username} • {new Date(post.timestamp).toLocaleString()}
              </div>
              <div className="text-xl leading-snug">{post.text}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
} 