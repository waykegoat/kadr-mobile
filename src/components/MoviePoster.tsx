import React, { useState } from 'react';
import bitvaPoster from '../assets/bitva_motorov_poster.jpg';
import sumerkiPoster from '../assets/sumerki_poster.jpg';
import kolobokPoster from '../assets/kolobok_poster.jpg';
import dunePoster from '../assets/dune2_poster.jpg';
import { Film } from 'lucide-react';

interface MoviePosterProps {
  movieId?: string;
  posterImage?: string;
  title?: string;
  className?: string;
}

export const POSTER_PRESETS: Record<string, string> = {
  'bitva-motorov': bitvaPoster,
  'sumerki': sumerkiPoster,
  'kolobok': kolobokPoster,
  'dune-2': dunePoster,
};

export const MoviePoster: React.FC<MoviePosterProps> = ({
  movieId,
  posterImage,
  title,
  className = '',
}) => {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const presetSrc = movieId ? POSTER_PRESETS[movieId] : undefined;
  let posterSrc: string | undefined = undefined;
  if (posterImage && failedSrc !== posterImage) {
    posterSrc = posterImage;
  } else if (presetSrc && failedSrc !== presetSrc) {
    posterSrc = presetSrc;
  }

  if (posterSrc) {
    const activeSrc = posterSrc;
    return (
      <div className={`overflow-hidden rounded-xl bg-[#0B353A] relative ${className}`}>
        <img
          src={activeSrc}
          alt={title || 'Постер'}
          onError={() => setFailedSrc(activeSrc)}
          className="w-full h-full object-cover select-none block"
          loading="eager"
        />
      </div>
    );
  }

  // Fallback to stylized cinema poster with КАДР colors
  return (
    <div
      className={`overflow-hidden rounded-xl bg-gradient-to-br from-[#0B353A] via-[#0E4349] to-[#06262A] border border-[#005C53]/40 flex flex-col items-center justify-center p-2 text-center relative ${className}`}
    >
      <div className="w-8 h-8 rounded-full bg-[#005C53]/30 flex items-center justify-center text-[#78C5BC] mb-1.5 shrink-0">
        <Film size={16} />
      </div>
      <span className="text-[10px] font-black tracking-wide text-white/95 line-clamp-2 uppercase">
        {title || 'КАДР'}
      </span>
      <span className="text-[8px] font-bold text-[#78C5BC] mt-0.5 tracking-widest">
        ПРЕМЬЕРА
      </span>
    </div>
  );
};
