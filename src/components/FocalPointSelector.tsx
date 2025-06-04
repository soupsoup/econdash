import React, { useRef } from 'react';

interface FocalPoint {
  x: number; // 0-100
  y: number; // 0-100
}

interface FocalPointSelectorProps {
  imageUrl: string;
  focalPoint: FocalPoint;
  setFocalPoint: (point: FocalPoint) => void;
}

const FocalPointSelector: React.FC<FocalPointSelectorProps> = ({ imageUrl, focalPoint, setFocalPoint }) => {
  const imgRef = useRef<HTMLImageElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLImageElement, MouseEvent>) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setFocalPoint({ x, y });
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
      <img
        ref={imgRef}
        src={imageUrl}
        alt="Preview"
        style={{ width: '100%', maxHeight: 300, objectFit: 'cover', objectPosition: `${focalPoint.x}% ${focalPoint.y}%`, borderRadius: 8, cursor: 'crosshair' }}
        onClick={handleClick}
      />
      {/* Marker */}
      <div
        style={{
          position: 'absolute',
          left: `${focalPoint.x}%`,
          top: `${focalPoint.y}%`,
          transform: 'translate(-50%, -50%)',
          width: 18,
          height: 18,
          background: 'rgba(59,130,246,0.8)',
          border: '2px solid #fff',
          borderRadius: '50%',
          pointerEvents: 'none',
          boxShadow: '0 0 6px rgba(0,0,0,0.2)',
        }}
      />
      <div className="text-xs text-gray-500 mt-2">Click the image to set the focal point.</div>
    </div>
  );
};

export default FocalPointSelector; 