import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import GlassCategoryTabs from './ui/glass-category-tabs';

export default function Navbar({ onSearch, onCategoryChange, activeCategory }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { theme } = useTheme();

  function handleSearch(e) {
    e.preventDefault();
    if (onSearch) onSearch(query);
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-[#1e293b] shadow-md dark:shadow-black/30 transition-colors duration-300">
      {/* Top bar — logo lewo, form absolutnie wyśrodkowany, przyciski prawo */}
      <div className="relative w-full px-4 py-3 flex items-center justify-between">

        <Link to="/" className="flex items-center gap-2 flex-shrink-0 z-10">
          <div style={{
            backgroundColor: theme === 'dark' ? '#1e293b' : 'transparent',
            borderRadius: '50%',
            overflow: 'hidden',
            height: '48px',
            width: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <img
              src="/logo1.png"
              alt="Co na Mazurach?"
              style={{
                height: '48px',
                width: 'auto',
                mixBlendMode: theme === 'dark' ? 'multiply' : 'normal',
                filter: theme === 'dark' ? 'brightness(2)' : 'drop-shadow(0 1px 3px rgba(0,0,0,0.15))',
              }}
            />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xl font-black text-[#1B4F8A] dark:text-white tracking-tight" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Co na Mazurach?
            </span>
            <span className="text-[10px] font-semibold text-[#2E9E6E] uppercase tracking-widest">
              Kraina Wielkich Jezior
            </span>
          </div>
        </Link>

        {/* Absolutnie wyśrodkowana wyszukiwarka */}
        <form
          onSubmit={handleSearch}
          className="absolute left-1/2 -translate-x-1/2 flex gap-2 w-full max-w-xl"
        >
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Szukaj wydarzeń, noclegów, restauracji na Mazurach..."
            className="flex-1 border border-gray-300 dark:border-gray-600 rounded-full px-5 py-2 text-sm bg-white dark:bg-[#0f172a] text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#1B4F8A] focus:ring-2 focus:ring-[#1B4F8A]/20 transition-colors"
          />
          <button
            type="submit"
            className="bg-[#1B4F8A] text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-[#163f70] transition-colors whitespace-nowrap"
          >
            Szukaj
          </button>
        </form>

        <div className="flex items-center gap-2 flex-shrink-0 z-10">
          <Link
            to="/dodaj"
            className="bg-[#F4A825] text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-[#d99020] transition-colors whitespace-nowrap"
          >
            + Dodaj ogłoszenie
          </Link>
          <ThemeToggle />
        </div>
      </div>

      {/* Category tabs */}
      <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-[#162032] transition-colors">
        <div className="w-full px-4 py-2 flex justify-center overflow-x-auto">
          <GlassCategoryTabs activeCategory={activeCategory} onCategoryChange={onCategoryChange} />
        </div>
      </div>
    </header>
  );
}
