import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function EditPost() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [author, setAuthor] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) fetchPost(id);
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
      setTitle(data.title);
      setContent(data.content);
      setSummary(data.summary);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    let newImageUrl = imageUrl;
    try {
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const { data: storageData, error: storageError } = await supabase.storage
          .from('post-images')
          .upload(fileName, imageFile, { upsert: true });
        if (storageError) {
          console.error('Supabase Storage upload error:', storageError);
          alert('Failed to upload image: ' + storageError.message);
          setIsSubmitting(false);
          return;
        }
        const { data: publicUrlData } = supabase.storage.from('post-images').getPublicUrl(fileName);
        newImageUrl = publicUrlData.publicUrl;
      }
      const { error } = await supabase
        .from('posts')
        .update({
          title,
          content,
          summary,
          author,
          image_url: newImageUrl,
        })
        .eq('id', id);
      if (error) {
        console.error('Supabase update error:', error);
        alert('Failed to update post: ' + error.message);
      } else {
        navigate('/admin/dashboard');
      }
    } catch (error: any) {
      alert('Failed to update post. ' + (error?.message || error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-4">Loading post...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Edit Post</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2 font-medium">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-2 font-medium">Summary</label>
          <input
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full p-2 border rounded"
            required
            maxLength={200}
          />
        </div>
        <div>
          <label className="block mb-2 font-medium">Author</label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-2 font-medium">Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-2 border rounded h-64"
            required
          />
        </div>
        <div>
          <label className="block mb-2 font-medium">Image (optional)</label>
          {imageUrl && (
            <div className="mb-2">
              <img src={imageUrl} alt="Current" className="h-32 rounded" />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300"
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
} 