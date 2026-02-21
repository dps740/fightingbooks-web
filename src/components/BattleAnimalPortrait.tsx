'use client';

import { useState } from 'react';

interface Props {
  src: string;
  alt: string;
  name: string;
}

export default function BattleAnimalPortrait({ src, alt, name }: Props) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="text-center flex-1" style={{ maxWidth: 200 }}>
      <div
        className="relative mx-auto overflow-hidden"
        style={{
          width: 'clamp(120px, 20vw, 192px)',
          height: 'clamp(120px, 20vw, 192px)',
          borderRadius: '50%',
          border: '4px solid var(--accent-gold)',
          background: 'var(--bg-card)',
        }}
      >
        {imgError ? (
          /* Fallback: emoji silhouette */
          <div
            className="w-full h-full flex items-center justify-center text-6xl"
            aria-label={alt}
          >
            🐾
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            onError={() => setImgError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}
      </div>
      <p
        className="mt-3 font-bold text-lg md:text-xl"
        style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
      >
        {name}
      </p>
    </div>
  );
}
