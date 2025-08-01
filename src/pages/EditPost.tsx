import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { Bold, List } from 'lucide-react';
import FocalPointSelector from '../components/FocalPointSelector';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface Post {
  id: string;
  title: string;
  content: string;
  summary: string;
  author: string;
  created_at: string;
  image_url?: string;
  image_focal_x?: number;
  image_focal_y?: number;
  image_display_height?: number;
  story_type: string; // 'lead' or 'minor'
}

export default function EditPost() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [author, setAuthor] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [focalPoint, setFocalPoint] = useState({ x: 50, y: 50 });
  const [imageDisplayHeight, setImageDisplayHeight] = useState(300);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [storyType, setStoryType] = useState<'lead' | 'minor'>('minor');

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
      setSummary(data.summary || '');
      setAuthor(data.author);
      setImageUrl(data.image_url || '');
      setFocalPoint({
        x: data.image_focal_x !== undefined ? data.image_focal_x : 50,
        y: data.image_focal_y !== undefined ? data.image_focal_y : 50,
      });
      setImageDisplayHeight(data.image_display_height !== undefined ? data.image_display_height : 300);
      setStoryType(data.story_type || 'minor');
    } catch (error) {
      alert('Failed to load post.');
    } finally {
      setLoading(false);
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      const url = URL.createObjectURL(e.target.files[0]);
      setImageUrl(url);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      let uploadedImageUrl = imageUrl;
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const { data: storageData, error: storageError } = await supabase.storage
          .from('post-images')
          .upload(fileName, imageFile, { upsert: false });
        if (storageError) throw storageError;
        const { data: publicUrlData } = supabase.storage.from('post-images').getPublicUrl(fileName);
        uploadedImageUrl = publicUrlData.publicUrl;
      }

      // If setting as lead, update all other posts to minor
      if (storyType === 'lead') {
        await supabase.from('posts').update({ story_type: 'minor' }).eq('story_type', 'lead');
      }

      const postData = {
        title,
        content,
        summary,
        author,
        image_url: uploadedImageUrl || null,
        image_focal_x: focalPoint.x,
        image_focal_y: focalPoint.y,
        image_display_height: imageDisplayHeight,
        updated_at: new Date().toISOString(),
        story_type: storyType,
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
          <label className="block mb-2">Summary:</label>
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
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full mt-2"
          />
        </div>

        {/* Focal Point Selector */}
        {imageUrl && (
          <div className="mb-4">
            <FocalPointSelector
              imageUrl={imageUrl}
              focalPoint={focalPoint}
              setFocalPoint={setFocalPoint}
            />
          </div>
        )}

        {/* Image Height Slider */}
        {imageUrl && (
          <div className="mb-4">
            <label className="block mb-2 font-medium">Image Display Height (px)</label>
            <input
              type="range"
              min={100}
              max={600}
              value={imageDisplayHeight}
              onChange={e => setImageDisplayHeight(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-gray-500 mb-2">{imageDisplayHeight}px</div>
          </div>
        )}

        {/* Story Type Selector */}
        <div>
          <label className="block mb-2">Story Type:</label>
          <select
            value={storyType}
            onChange={e => setStoryType(e.target.value as 'lead' | 'minor')}
            className="w-full p-2 border rounded"
          >
            <option value="minor">Minor Story</option>
            <option value="lead">Lead Story</option>
          </select>
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