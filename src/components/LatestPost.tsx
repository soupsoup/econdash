import React, { useEffect, useState } from 'react';
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
  image_url: string | null;
}

export default function LatestPost() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPosts(data || []);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }

  function handlePrev() {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }

  function handleNext() {
    setCurrentIndex((prev) => Math.min(prev + 1, posts.length - 1));
  }

  if (loading) {
    return <div className="p-4 bg-white rounded-lg shadow">Loading latest post...</div>;
  }

  if (!posts.length) {
    return <div className="p-4 bg-white rounded-lg shadow">No posts available.</div>;
  }

  const post = posts[currentIndex];

  return (
    <div className="p-4 bg-white rounded-lg shadow max-w-xl mx-auto mb-8">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">Latest Update</h3>
        <div className="space-x-2">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex === posts.length - 1}
            className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
      <div>
        {post.image_url && (
          <div className="mb-4">
            <img 
              src={post.image_url} 
              alt={post.title}
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>
        )}
        <h4 className="text-xl font-bold mb-1">{post.title}</h4>
        <div className="text-gray-600 text-sm mb-2">
          {post.author} • {new Date(post.created_at).toLocaleDateString()}
        </div>
        <p className="mb-2">{post.summary}</p>
        <a
          href={`/post/${post.id}`}
          className="text-blue-600 hover:underline text-sm"
        >
          Read more
        </a>
      </div>
      <div className="text-xs text-gray-400 mt-2 text-right">
        {currentIndex + 1} of {posts.length}
      </div>
    </div>
  );
} 