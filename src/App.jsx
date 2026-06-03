import { lazy, Suspense, useState, Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  componentDidCatch(e) {
    if (e?.message?.includes('preload') || e?.message?.includes('chunk') || e?.name === 'ChunkLoadError') {
      window.location.reload();
    }
  }
  render() {
    if (this.state.error) {
      const isChunkError = this.state.error?.message?.includes('preload') || this.state.error?.message?.includes('chunk');
      if (isChunkError) return null;
      return (
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="max-w-lg bg-red-50 border border-red-200 rounded-2xl p-6">
            <p className="text-2xl mb-2">⚠️</p>
            <p className="font-bold text-red-700 mb-2">Coś poszło nie tak</p>
            <a href="/" className="mt-4 block text-center text-[#1B4F8A] font-bold">← Wróć na stronę główną</a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { useListings } from './hooks/useListings';
import { ThemeProvider } from './context/ThemeContext';

const PASSWORD = 'fado';
const SESSION_KEY = 'cnm_unlocked';

function ComingSoon() {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (input === PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, '1');
      window.location.reload();
    } else {
      setError(true);
      setInput('');
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0f2744] via-[#1B4F8A] to-[#2563EB] px-4">
      <div className="text-center mb-10">
        <p className="text-5xl mb-4">🌊</p>
        <h1 className="text-4xl md:text-5xl font-black text-white mb-3">Co na Mazurach?</h1>
        <p className="text-blue-200 text-lg font-medium">Strona już wkrótce dostępna</p>
        <p className="text-blue-300 text-sm mt-2">Pracujemy nad czymś wyjątkowym dla miłośników Mazur</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 w-full max-w-sm border border-white/20">
        <p className="text-white text-sm font-semibold mb-3 text-center">Masz dostęp wcześniej? Wpisz hasło:</p>
        <input
          type="password"
          value={input}
          onChange={e => { setInput(e.target.value); setError(false); }}
          placeholder="Hasło..."
          className="w-full bg-white/20 border border-white/30 rounded-xl px-4 py-2.5 text-white placeholder-blue-200 text-sm focus:outline-none focus:border-white mb-3"
        />
        {error && <p className="text-red-300 text-xs mb-3 text-center">Nieprawidłowe hasło</p>}
        <button
          type="submit"
          className="w-full bg-white text-[#1B4F8A] py-2.5 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors"
        >
          Wejdź →
        </button>
      </form>
    </div>
  );
}

const HomePage          = lazy(() => import('./pages/HomePage'));
const ListingDetailPage = lazy(() => import('./pages/ListingDetailPage'));
const AddListingPage    = lazy(() => import('./pages/AddListingPage'));
const MapPage           = lazy(() => import('./pages/MapPage'));
const CalendarPage      = lazy(() => import('./pages/CalendarPage'));
const AboutPage         = lazy(() => import('./pages/AboutPage'));
const ContactPage       = lazy(() => import('./pages/ContactPage'));
const RegulaminPage     = lazy(() => import('./pages/RegulaminPage'));
const NotFoundPage      = lazy(() => import('./pages/NotFoundPage'));
const AdminPage         = lazy(() => import('./pages/AdminPage'));

function LoadingSpinner() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="text-center">
        <p className="text-4xl animate-bounce">🌊</p>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Ładowanie...</p>
      </div>
    </div>
  );
}

function AppLayout() {
  const { listings, allListings, setSearch, category, setCategory, city, setCity, selDay, setSelDay } = useListings();

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F4EE] dark:bg-[#0f172a] transition-colors duration-300">
      <Navbar onSearch={setSearch} onCategoryChange={setCategory} activeCategory={category} />

      <div className="flex-1">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={
              <HomePage listings={listings} allListings={allListings} city={city} setCity={setCity} selDay={selDay} setSelDay={setSelDay} category={category} />
            } />
            <Route path="/events/:id"  element={<ListingDetailPage />} />
            <Route path="/dodaj"       element={<AddListingPage />} />
            <Route path="/mapa"        element={<MapPage />} />
            <Route path="/kalendarz"   element={<CalendarPage />} />
            <Route path="/o-nas"       element={<AboutPage />} />
            <Route path="/kontakt"     element={<ContactPage />} />
            <Route path="/regulamin"   element={<RegulaminPage />} />
            <Route path="/paneladmina" element={<AdminPage />} />
            <Route path="*"            element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </div>

      <Footer />
    </div>
  );
}

function AppRouter() {
  const { pathname } = useLocation();

  if (pathname.startsWith('/paneladmina')) {
    return (
      <Suspense fallback={null}>
        <AdminPage />
      </Suspense>
    );
  }

  if (sessionStorage.getItem(SESSION_KEY) !== '1') {
    return <ComingSoon />;
  }

  return (
    <ThemeProvider>
      <AppLayout />
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <ErrorBoundary>
          <AppRouter />
        </ErrorBoundary>
      </BrowserRouter>
    </HelmetProvider>
  );
}
