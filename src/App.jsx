import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { useListings } from './hooks/useListings';
import { ThemeProvider } from './context/ThemeContext';

const HomePage          = lazy(() => import('./pages/HomePage'));
const ListingDetailPage = lazy(() => import('./pages/ListingDetailPage'));
const AddListingPage    = lazy(() => import('./pages/AddListingPage'));
const MapPage           = lazy(() => import('./pages/MapPage'));
const CalendarPage      = lazy(() => import('./pages/CalendarPage'));
const AboutPage         = lazy(() => import('./pages/AboutPage'));
const ContactPage       = lazy(() => import('./pages/ContactPage'));
const RegulaminPage     = lazy(() => import('./pages/RegulaminPage'));
const NotFoundPage      = lazy(() => import('./pages/NotFoundPage'));

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
            <Route path="*"            element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </div>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </ThemeProvider>
    </HelmetProvider>
  );
}
