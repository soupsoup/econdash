import React, { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

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

export default function WireServiceFeed() {
  const [posts, setPosts] = useState<WirePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [intervalSec, setIntervalSec] = useState(60);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
        console.error('Error fetching wire posts from Supabase:', err);
      }
    } else {
      fetch('/api/wire')
        .then(res => res.json())
        .then(data => {
          setPosts(data.posts || []);
        })
        .catch(err => {
          console.error('Error fetching wire posts from Nitter:', err);
        });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetch('/api/wire-settings')
      .then(res => res.json())
      .then(data => {
        setIntervalSec(data.interval || 60);
      });
  }, []);

  useEffect(() => {
    fetchPosts();
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(fetchPosts, intervalSec * 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [intervalSec]);

  if (loading) return <div>Loading wire service...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Wire Service</h2>
      <div className="space-y-4">
        {posts.slice(0, 5).map(post => (
          <div key={post.id} className="p-4 border rounded bg-white">
            <div className="text-sm text-gray-500 mb-1">
              {post.username} • {post.timestamp}
            </div>
            <div>{post.text}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-right">
        <a href="/wire" className="text-blue-600 hover:underline">Read more wire updates →</a>
      </div>
    </div>
  );
}