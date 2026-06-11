import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import GlassCategoryTabs from './ui/glass-category-tabs';

const LogoContent = ({ theme, size = 48, showSubtitle = true, onClick }) => (
  <Link to="/" onClick={onClick} className="flex items-center gap-2 flex-shrink-0">
    <div style={{
      backgroundColor: theme === 'dark' ? '#1e293b' : 'transparent',
      borderRadius: '50%', overflow: 'hidden',
      height: size, width: size,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <img
        src="/logo1.png"
        alt="Co na Mazurach?"
        style={{
          height: size, width: 'auto',
          mixBlendMode: theme === 'dark' ? 'multiply' : 'normal',
          filter: theme === 'dark' ? 'brightness(2)' : 'drop-shadow(0 1px 3px rgba(0,0,0,0.15))',
        }}
      />
    </div>
    <div className="flex flex-col leading-tight">
      <span
        className="font-black text-[#1B4F8A] dark:text-white tracking-tight whitespace-nowrap"
        style={{ fontFamily: 'Nunito, sans-serif', fontSize: showSubtitle ? '1.15rem' : '1rem' }}
      >
        Co na Mazurach?
      </span>
      {showSubtitle && (
        <span className="text-[10px] font-semibold text-[#2E9E6E] uppercase tracking-widest hidden lg:block">
          Kraina Wielkich Jezior
        </span>
      )}
    </div>
  </Link>
);

export default function Navbar({ onSearch, onCategoryChange, activeCategory }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { theme } = useTheme();

  function handleSearch(e) {
    e.preventDefault();
    if (onSearch) onSearch(query);
    navigate('/');
  }

  function handleLogoClick() {
    setQuery('');
    if (onSearch) onSearch('');
    if (onCategoryChange) onCategoryChange(null);
  }

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-[#1e293b] shadow-md dark:shadow-black/30 transition-colors duration-300">

      {/* ── MOBILE ── */}
      <div className="md:hidden">
        {/* Row 1: logo + actions */}
        <div className="px-4 pt-3 pb-2 flex items-center justify-between">
          <LogoContent theme={theme} size={40} showSubtitle={false} onClick={handleLogoClick} />
          <div className="flex items-center gap-2">
            <Link
              to="/dodaj"
              className="bg-[#F4A825] text-white px-3 py-1.5 rounded-full text-xs font-bold hover:bg-[#d99020] transition-colors whitespace-nowrap"
            >
              + Dodaj
            </Link>
            <ThemeToggle />
          </div>
        </div>
        {/* Row 2: search */}
        <div className="px-4 pb-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Szukaj na Mazurach..."
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-full px-4 py-2 text-sm bg-white dark:bg-[#0f172a] text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#1B4F8A] focus:ring-2 focus:ring-[#1B4F8A]/20 transition-colors"
            />
            <button
              type="submit"
              className="bg-[#1B4F8A] text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-[#163f70] transition-colors"
            >
              🔍
            </button>
          </form>
        </div>
      </div>

      {/* ── DESKTOP ── */}
      <div className="hidden md:flex w-full px-4 py-3 items-center gap-3">
        <LogoContent theme={theme} size={44} showSubtitle onClick={handleLogoClick} />

        <div className="flex-1 flex justify-center min-w-0 px-2">
          <form
            onSubmit={handleSearch}
            className="flex gap-2 w-full max-w-xl"
          >
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Szukaj wydarzeń, noclegów, restauracji na Mazurach..."
              className="flex-1 min-w-0 border border-gray-300 dark:border-gray-600 rounded-full px-5 py-2 text-sm bg-white dark:bg-[#0f172a] text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#1B4F8A] focus:ring-2 focus:ring-[#1B4F8A]/20 transition-colors"
            />
            <button
              type="submit"
              className="bg-[#1B4F8A] text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-[#163f70] transition-colors whitespace-nowrap"
            >
              Szukaj
            </button>
          </form>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            to="/dodaj"
            className="bg-[#F4A825] text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-[#d99020] transition-colors whitespace-nowrap"
          >
            <span className="hidden lg:inline">+ Dodaj ogłoszenie</span>
            <span className="lg:hidden">+ Dodaj</span>
          </Link>
          <ThemeToggle />
        </div>
      </div>

      {/* Category tabs — both breakpoints */}
      <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-[#162032] transition-colors">
        <div className="w-full px-4 py-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <div className="flex md:justify-center">
            <GlassCategoryTabs activeCategory={activeCategory} onCategoryChange={onCategoryChange} />
          </div>
        </div>
      </div>
    </header>
  );
}
