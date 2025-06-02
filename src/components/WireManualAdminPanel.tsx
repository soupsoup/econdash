import React, { useEffect, useState } from 'react';

interface WirePost {
  id: string | number;
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
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editText, setEditText] = useState('');
  const [editUsername, setEditUsername] = useState('');

  useEffect(() => {
    fetch('/api/wire')
      .then(res => res.json())
      .then(data => setPosts(data.posts || []));
  }, []);

  const savePosts = async (newPosts: WirePost[]) => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/wire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posts: newPosts }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setPosts(newPosts);
      setText('');
      setEditingId(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addPost = () => {
    if (!text.trim()) return;
    const newPost: WirePost = {
      id: Date.now(),
      username,
      timestamp: new Date().toISOString(),
      text,
    };
    savePosts([newPost, ...posts]);
  };

  const deletePost = (id: string | number) => {
    const newPosts = posts.filter(p => p.id !== id);
    savePosts(newPosts);
  };

  const startEdit = (post: WirePost) => {
    setEditingId(post.id);
    setEditText(post.text);
    setEditUsername(post.username);
  };

  const saveEdit = (id: string | number) => {
    const newPosts = posts.map(p =>
      p.id === id ? { ...p, text: editText, username: editUsername } : p
    );
    savePosts(newPosts);
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