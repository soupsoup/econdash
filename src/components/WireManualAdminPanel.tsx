import React, { useEffect, useState } from 'react';
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

export default function WireManualAdminPanel() {
  const [posts, setPosts] = useState<WirePost[]>([]);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [username, setUsername] = useState('admin');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editUsername, setEditUsername] = useState('');

  useEffect(() => {
    fetchWirePosts();
  }, []);

  async function fetchWirePosts() {
    try {
      const { data, error } = await supabase
        .from('wire_posts')
        .select('*')
        .order('timestamp', { ascending: false });
      if (error) throw error;
      setPosts(data || []);
    } catch (err: any) {
      setError(err.message);
    }
  }

  const addPost = async () => {
    if (!text.trim()) return;
    setSaving(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('wire_posts')
        .insert([{ username, text }])
        .select()
        .single();
      if (error) throw error;
      setPosts([data, ...posts]);
      setText('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deletePost = async (id: string) => {
    setSaving(true);
    setError('');
    try {
      const { error } = await supabase
        .from('wire_posts')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setPosts(posts.filter(p => p.id !== id));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (post: WirePost) => {
    setEditingId(post.id);
    setEditText(post.text);
    setEditUsername(post.username);
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('wire_posts')
        .update({ text: editText, username: editUsername })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      setPosts(posts.map(p => p.id === id ? data : p));
      setEditingId(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
    setEditUsername('');
  };

  return (
    <div className="p-4 border rounded bg-white max-w-md mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">Manual Wire Service Admin</h2>
      <div className="mb-4">
        <label className="block font-medium mb-1">Username</label>
        <input
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="border px-2 py-1 w-full mb-2"
        />
        <label className="block font-medium mb-1">New Post</label>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          className="border px-2 py-1 w-full mb-2"
          rows={3}
        />
        <button onClick={addPost} className="bg-blue-500 text-white px-4 py-2 rounded" disabled={saving}>
          {saving ? 'Saving...' : 'Add Post'}
        </button>
        {error && <div className="text-red-600 mt-2">{error}</div>}
      </div>
      <div>
        <h3 className="font-semibold mb-2">Existing Posts</h3>
        <ul className="space-y-2">
          {posts.map(post => (
            <li key={post.id} className="border p-2 rounded flex justify-between items-center">
              {editingId === post.id ? (
                <div className="flex-1 mr-2">
                  <input
                    type="text"
                    value={editUsername}
                    onChange={e => setEditUsername(e.target.value)}
                    className="border px-2 py-1 w-full mb-1"
                  />
                  <textarea
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    className="border px-2 py-1 w-full mb-1"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(post.id)} className="bg-green-500 text-white px-2 py-1 rounded" disabled={saving}>Save</button>
                    <button onClick={cancelEdit} className="bg-gray-400 text-white px-2 py-1 rounded">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 mr-2">
                  <div className="text-sm text-gray-500 mb-1">{post.username} • {new Date(post.timestamp).toLocaleString()}</div>
                  <div>{post.text}</div>
                </div>
              )}
              {editingId !== post.id && (
                <div className="flex flex-col gap-1">
                  <button onClick={() => startEdit(post)} className="text-blue-500">Edit</button>
                  <button onClick={() => deletePost(post.id)} className="text-red-500">Delete</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 