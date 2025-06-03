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
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div>Loading wire posts...</div>
      </main>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="text-red-600">{error}</div>
      </main>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Wire Service Feed</h1>
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="p-4 border rounded bg-white">
              <div className="text-sm text-gray-500 mb-1">
                {post.username} • {new Date(post.timestamp).toLocaleString()}
              </div>
              <div>{post.text}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
} 