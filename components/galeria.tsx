"use client";

import React, { useState, useEffect, useCallback } from 'react';

const photos = [
  { id: 1, url: '/img/uige_nzenzu.jpg', title: 'Maravilha da Natureza-Grutas do nzenzo', category: 'Natureza' },
  { id: 2, url: '/img/namibe.jpg', title: 'Beleza da Namibia', category: 'Natureza' },
  { id: 3, url: '/img/benguela-praia.jpg', title: 'Beleza da cidade', category: 'Benguela' },
  { id: 4, url: '/img/Namibe1.jpg', title: 'Cidade de Namibe', category: 'Namibe' },
  { id: 5, url: '/img/Cunene0.jpg', title: 'Paisagem de Cunene', category: 'Cunene' },
  { id: 6, url: '/img/Zaire.jpg', title: 'Beleza de Zaire', category: 'Zaire' },
  { id: 7, url: '/img/Cunene1.jpg', title: 'Vale das Montanhas', category: 'Natureza' },
  { id: 8, url: '/img/Benguela0.jpg', title: 'Estrada Infinita', category: 'Viagem' },
  { id: 9, url: '/img/Benguela1.jpg', title: 'Lagos Cristalinos', category: 'Natureza' },
  { id: 10, url: '/img/muxico.jpg', title: 'Pôr do Sol nas Montanhas', category: 'Natureza' },
  { id: 11, url: '/img/lubango-cristo-rei.jpg', title: 'Aurora Boreal', category: 'Natureza' },
  { id: 12, url: '/img/cabinda.jpg', title: 'Surfista na Onda', category: 'Viagem' },
  { id: 13, url: '/img/Huila1.jpg', title: 'Picos Nevados', category: 'Natureza' },
  { id: 14, url: '/img/Huila0.jpg', title: 'Viagem de Trem', category: 'Viagem' },
  { id: 15, url: '/img/Luanda0.jpg', title: 'Edifício Icônico', category: 'Urbano' },
  { id: 16, url: '/img/Luanda1.jpg', title: 'Escada Espiral', category: 'Urbano' },
];

const styles = `
  .gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; padding: 1rem 0; }
  @media (max-width: 480px) {
    .gallery-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
  }
  @media (min-width: 481px) and (max-width: 768px) {
    .gallery-grid { grid-template-columns: repeat(3, 1fr); gap: 10px; }
  }
  @media (min-width: 769px) and (max-width: 1024px) {
    .gallery-grid { grid-template-columns: repeat(4, 1fr); gap: 12px; }
  }
  @media (min-width: 1025px) {
    .gallery-grid { grid-template-columns: repeat(4, 1fr); gap: 12px; }
  }
  .photo-card { position: relative; aspect-ratio: 1; overflow: hidden; border-radius: 12px; cursor: pointer; border: 0.5px solid rgba(148, 163, 184, 0.2); }
  .photo-card img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease; display: block; }
  .photo-card:hover img { transform: scale(1.08); }
  .photo-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 50%, transparent 100%); opacity: 0; transition: opacity 0.3s ease; display: flex; align-items: flex-end; padding: 12px; }
  .photo-card:hover .photo-overlay { opacity: 1; }
  .overlay-title { color: #fff; font-size: 13px; font-weight: 500; margin: 0 0 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .overlay-badge { font-size: 11px; color: rgba(255,255,255,0.85); background: rgba(59, 130, 246, 0.3); padding: 2px 8px; border-radius: 99px; display: inline-block; }
  .lightbox { position: fixed; inset: 0; background: rgba(0,0,0,0.95); display: flex; align-items: center; justify-content: center; z-index: 999; padding: 1rem; }
  .lb-inner { position: relative; max-width: 90vw; max-height: 90vh; display: flex; flex-direction: column; align-items: center; }
  .lb-inner img { max-height: 75vh; max-width: 85vw; object-fit: contain; border-radius: 8px; }
  .lb-close { position: absolute; top: 0; right: 0; background: rgba(255,255,255,0.15); border: none; color: #fff; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; }
  .lb-close:hover { background: rgba(255,255,255,0.25); }
  .lb-nav { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.15); border: none; color: #fff; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 20px; display: flex; align-items: center; justify-content: center; }
  .lb-nav:hover { background: rgba(255,255,255,0.25); }
  .lb-prev { left: 16px; }
  .lb-next { right: 16px; }
  @media (max-width: 640px) {
    .lb-prev { left: 8px; }
    .lb-next { right: 8px; }
  }
  .lb-info { margin-top: 14px; text-align: center; }
  .lb-info h2 { color: #fff; font-size: 16px; font-weight: 500; margin: 0 0 6px; }
  .lb-badge { font-size: 12px; color: rgba(255,255,255,0.75); background: rgba(59, 130, 246, 0.3); padding: 3px 10px; border-radius: 99px; }
  .page-header { margin-bottom: 2rem; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .page-header h1 { font-size: 32px; font-weight: 700; color: #fff; margin: 0 0 8px; background: linear-gradient(to right, #60a5fa, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .page-header p { font-size: 16px; color: #cbd5e1; margin: 0; }
  @media (max-width: 640px) {
    .page-header h1 { font-size: 24px; }
    .page-header p { font-size: 14px; }
  }
`;

const PhotoGallery = () => {
  const [selected, setSelected] = useState<typeof photos[0] | null>(null);

  const navigate = useCallback((dir: 'next' | 'prev') => {
    if (!selected) return;
    const idx = photos.findIndex(p => p.id === selected!.id);
    const next = dir === 'next'
      ? (idx + 1) % photos.length
      : (idx - 1 + photos.length) % photos.length;
    setSelected(photos[next]);
  }, [selected]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selected) return;
      if (e.key === 'Escape') setSelected(null);
      if (e.key === 'ArrowRight') navigate('next');
      if (e.key === 'ArrowLeft') navigate('prev');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, navigate]);

  return (
    <div style={{ minHeight: '100vh', padding: '2rem' }}>
      <style>{styles}</style>
      <div className="container mx-auto max-w-7xl">
        <div className="page-header">
          <h1>Galeria de Fotos</h1>
        </div>

        <div className="gallery-grid">
          {photos.map(photo => (
            <div key={photo.id} className="photo-card" onClick={() => setSelected(photo)}>
              <img src={photo.url} alt={photo.title} loading="lazy" />
              <div className="photo-overlay">
                <div>
                  <p className="overlay-title">{photo.title}</p>
                  <span className="overlay-badge">{photo.category}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selected && (
          <div className="lightbox" onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}>
            <div className="lb-inner">
              <button className="lb-close" onClick={() => setSelected(null)}>×</button>
              <button className="lb-nav lb-prev" onClick={() => navigate('prev')}>‹</button>
              <button className="lb-nav lb-next" onClick={() => navigate('next')}>›</button>
              <img src={selected.url} alt={selected.title} />
              <div className="lb-info">
                <h2>{selected.title}</h2>
                <span className="lb-badge">{selected.category}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoGallery;