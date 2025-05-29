import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { Bold, List } from 'lucide-react';

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

export default function EditPost() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPost(id);
    }
  }, [id]);

  async function fetchPost(postId: string) {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();
      if (error) throw error;
      setPost(data);
      setTitle(data.title);
      setContent(data.content);
      setAuthor(data.author);
      setImageUrl(data.image_url || '');
    } catch (error) {
      alert('Failed to load post.');
    } finally {
      setLoading(false);
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const postData = {
        title,
        content,
        author,
        image_url: imageUrl || null,
        updated_at: new Date().toISOString(),
      };

      if (id) {
        // Update existing post
        const { error, data } = await supabase
          .from('posts')
          .update(postData)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('Error updating post:', error);
          throw new Error(`Failed to update post: ${error.message}`);
        }
        
        if (!data) {
          throw new Error('No data returned after update');
        }
      } else {
        // Create new post
        const { error, data } = await supabase
          .from('posts')
          .insert([{ ...postData, created_at: new Date().toISOString() }])
          .select()
          .single();

        if (error) {
          console.error('Error creating post:', error);
          throw new Error(`Failed to create post: ${error.message}`);
        }

        if (!data) {
          throw new Error('No data returned after insert');
        }
      }

      navigate('/admin');
    } catch (error) {
      console.error('Error saving post:', error);
      alert(error instanceof Error ? error.message : 'Failed to save post. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatText = (format: 'bold' | 'bullet') => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    let newText = content;

    if (format === 'bold') {
      newText = content.substring(0, start) + `**${selectedText}**` + content.substring(end);
    } else if (format === 'bullet') {
      const lines = selectedText.split('\n');
      const bulletedLines = lines.map(line => `• ${line}`).join('\n');
      newText = content.substring(0, start) + bulletedLines + content.substring(end);
    }

    setContent(newText);
    // Reset cursor position after a short delay to allow state update
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 2, end + 2);
    }, 0);
  };

  if (loading) return <div className="p-4">Loading post...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">{id ? 'Edit Post' : 'Create New Post'}</h1>
      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label className="block mb-2">Title:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block mb-2">Author:</label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block mb-2">Image URL:</label>
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label>Content:</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => formatText('bold')}
                className="p-2 hover:bg-gray-100 rounded"
                title="Bold"
              >
                <Bold size={16} />
              </button>
              <button
                type="button"
                onClick={() => formatText('bullet')}
                className="p-2 hover:bg-gray-100 rounded"
                title="Bullet List"
              >
                <List size={16} />
              </button>
            </div>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-64 p-2 border rounded"
            required
          />
          <div className="mt-2 text-sm text-gray-500">
            <p>Formatting tips:</p>
            <ul className="list-disc list-inside">
              <li>Use **text** for <strong>bold text</strong></li>
              <li>Use the bullet button to create bulleted lists</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
          >
            {isSaving ? 'Saving...' : 'Save Post'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="bg-gray-200 px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
} 