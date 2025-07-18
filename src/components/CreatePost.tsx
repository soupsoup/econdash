import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import FocalPointSelector from './FocalPointSelector';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function CreatePost() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [author, setAuthor] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focalPoint, setFocalPoint] = useState({ x: 50, y: 50 });
  const [imageDisplayHeight, setImageDisplayHeight] = useState(300);
  const [storyType, setStoryType] = useState<'lead' | 'minor'>('minor');

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      // Show preview
      const url = URL.createObjectURL(e.target.files[0]);
      setImageUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    let uploadedImageUrl = '';

    try {
      // Upload image if present
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

      const { data, error } = await supabase
        .from('posts')
        .insert([
          {
            title,
            content,
            summary,
            author,
            image_url: uploadedImageUrl,
            image_focal_x: focalPoint.x,
            image_focal_y: focalPoint.y,
            image_display_height: imageDisplayHeight,
            created_at: new Date().toISOString(),
            story_type: storyType,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      navigate(`/post/${data.id}`);
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Create New Post</h2>
      
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
          <label className="block mb-2 font-medium">Story Type</label>
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
          <label className="block mb-2 font-medium">Image (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full"
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300"
        >
          {isSubmitting ? 'Creating...' : 'Create Post'}
        </button>
      </form>
    </div>
  );
} 