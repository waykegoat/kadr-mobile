import React, { useState } from 'react';
import { Search, Heart } from 'lucide-react';
import { MOVIES } from '../data/mockData';
import type { Movie } from '../data/mockData';
import { MoviePoster } from './MoviePoster';

interface CatalogScreenProps {
  movies?: Movie[];
  favorites?: string[];
  onSelectMovie: (movie: Movie) => void;
  onGoSearch?: () => void;
}

export const CatalogScreen: React.FC<CatalogScreenProps> = ({
  movies = MOVIES,
  favorites = [],
  onSelectMovie,
  onGoSearch,
}) => {
  const [selectedFilter, setSelectedFilter] = useState('Все');
  const [selectedDate, setSelectedDate] = useState('Сегодня');

  const filterTabs = ['Все', 'Сейчас', 'Скоро', 'Избранное'];
  const dateChips = ['Сегодня', '27 окт.', '28 окт.', '29 окт.'];

  const filteredMovies = movies.filter((m) => {
    if (selectedFilter === 'Избранное') return favorites.includes(m.id);
    if (selectedFilter === 'Сейчас') return m.showtimes.length >= 2;
    if (selectedFilter === 'Скоро') return m.showtimes.length < 2 || m.priceFrom >= 450;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#FAF9F5] text-[#1A1A1A]">
      {/* Header matching Figma Screen 12 */}
      <div className="p-5 pb-3 border-b border-[#EAE7DF] shrink-0 bg-[#FAF9F5]">
        <h1 className="text-2xl font-black text-[#1A1A1A] tracking-tight">Афиша</h1>

        {/* Filter chips */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar">
          {filterTabs.map((tab) => {
            const active = selectedFilter === tab;
            return (
              <button
                key={tab}
                onClick={() => setSelectedFilter(tab)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                  active
                    ? 'bg-[#005C53] text-white shadow-sm'
                    : 'bg-white border border-[#EAE7DF] text-[#7A7A7A] hover:text-[#1A1A1A]'
                }`}
              >
                {tab === 'Избранное' && <Heart size={11} fill={active ? 'white' : 'none'} />}
                <span>{tab}</span>
                {tab === 'Избранное' && favorites.length > 0 && (
                  <span className="text-[10px] opacity-80">({favorites.length})</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-2">
          {dateChips.map((d) => {
            const active = selectedDate === d;
            return (
              <button
                key={d}
                onClick={() => setSelectedDate(d)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                  active
                    ? 'bg-[#EBF3F2] border border-[#005C53] text-[#005C53] font-bold'
                    : 'bg-white border border-[#EAE7DF] text-[#7A7A7A] hover:text-[#1A1A1A]'
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {/* Movies List matching Figma Screen 12 */}
      <div className="p-5 space-y-3.5 pb-20">
        {filteredMovies.length === 0 ? (
          <div className="p-8 text-center bg-white border border-[#EAE7DF] rounded-2xl text-xs text-[#7A7A7A]">
            {selectedFilter === 'Избранное'
              ? 'Список избранных фильмов пуст. Нажмите ❤️ в карточке фильма, чтобы сохранить его.'
              : 'Фильмы по выбранному фильтру не найдены'}
          </div>
        ) : (
          filteredMovies.map((movie) => (
            <div
              key={movie.id}
              onClick={() => onSelectMovie(movie)}
              className="flex gap-4 p-3.5 bg-white border border-[#EAE7DF] rounded-2xl hover:border-[#005C53] transition-all cursor-pointer shadow-xs group"
            >
              <div className="w-20 h-28 rounded-xl overflow-hidden shrink-0 shadow-sm border border-[#EAE7DF] relative">
                <MoviePoster
                  movieId={movie.id}
                  posterImage={movie.posterImage}
                  title={movie.title}
                  className="w-full h-full"
                />
                {favorites.includes(movie.id) && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white/90 flex items-center justify-center text-[#005C53] shadow-xs">
                    <Heart size={11} fill="#005C53" />
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col justify-center">
                <span className="text-[10px] font-bold text-[#7A7A7A] uppercase tracking-wider">
                  {movie.genre}
                </span>
                <h3 className="text-base font-black text-[#1A1A1A] group-hover:text-[#005C53] transition-colors leading-tight mt-1">
                  {movie.title}
                </h3>
                <div className="text-xs text-[#7A7A7A] mt-1">
                  {movie.age} · {movie.duration}
                </div>
                <div className="text-xs font-bold text-[#005C53] mt-2.5">
                  от {movie.priceFrom} ₽
                </div>
              </div>
            </div>
          ))
        )}

        {onGoSearch && (
          <button
            onClick={onGoSearch}
            className="w-full py-3 bg-white border border-[#EAE7DF] hover:border-[#005C53] text-[#1A1A1A] rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 mt-4"
          >
            <Search size={15} className="text-[#005C53]" />
            <span>Найти фильм</span>
          </button>
        )}
      </div>
    </div>
  );
};
