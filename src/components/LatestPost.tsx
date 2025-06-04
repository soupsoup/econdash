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
  image_focal_x?: number;
  image_focal_y?: number;
  image_display_height?: number;
}

function timeAgo(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now.getTime() - date.getTime()) / 60000); // minutes
  if (diff < 1) return 'just now';
  if (diff < 60) return `${diff} min`;
  const hours = Math.floor(diff / 60);
  if (hours < 24) return `${hours} hr`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
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
    } catch (error) {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Loading updates...</div>;
  if (!posts.length) return <div>No updates found.</div>;

  const featured = posts[0];
  const latest = posts.slice(1, 8); // next 7 posts

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

  return (
    <div className="flex flex-col md:flex-row gap-8 bg-white rounded shadow p-6 min-h-[22rem]">
      {/* Featured Post */}
      <div className="flex-1 min-w-0 flex flex-col">
        {featured.image_url && (
          <div className="mb-4 h-auto">
            <img
              src={featured.image_url}
              alt={featured.title}
              className="w-full object-cover rounded"
              style={{ background: '#fff', objectPosition: getObjectPosition(featured), height: getImageHeight(featured), maxHeight: '600px' }}
            />
          </div>
        )}
        <div className="flex flex-col justify-end flex-none">
          <div className="mb-2 text-xs text-gray-500">
            {featured.author} • {new Date(featured.created_at).toLocaleDateString()}
          </div>
          <h2 className="text-2xl font-bold mb-2">{featured.title}</h2>
          <div className="mb-4 text-gray-700 text-lg">
            {featured.summary}
          </div>
          <a
            href={`/post/${featured.id}`}
            className="inline-block text-blue-600 hover:underline font-semibold"
          >
            Read more →
          </a>
        </div>
      </div>

      {/* Latest Sidebar */}
      <div className="w-full md:w-80 flex-shrink-0 border-t md:border-t-0 md:border-l border-gray-200 pl-0 md:pl-8 mt-8 md:mt-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-red-600">Latest</h3>
          <button className="text-xs border rounded px-2 py-1 text-gray-600">All categories</button>
        </div>
        <ul className="divide-y divide-gray-200">
          {latest.map((post) => (
            <li key={post.id} className="py-3 flex flex-col">
              <div className="text-xs text-gray-400 mb-1">{timeAgo(post.created_at)}</div>
              <a
                href={`/post/${post.id}`}
                className="text-base font-medium text-gray-900 hover:text-blue-600"
              >
                {post.title}
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-4 text-right">
          <a href="/posts" className="text-blue-600 hover:underline text-sm">See all latest &rarr;</a>
        </div>
      </div>
    </div>
  );
} 