import { useRef, useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import ListingCard from '../components/ListingCard';
import MapView from '../components/MapView';
import EventCalendar from '../components/EventCalendar';
import SearchBar from '../components/SearchBar';

const PER_PAGE = 15;

export default function HomePage({ listings, allListings, city, setCity, selDay, setSelDay, category }) {
  const cardsRef = useRef(null);
  const [page, setPage] = useState(1);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [listings]);

  const totalPages = Math.max(1, Math.ceil(listings.length / PER_PAGE));
  const paginated  = listings.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function goToPage(p) {
    setPage(p);
    setTimeout(() => cardsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  function handleCitySelect(name, cityObj) {
    setCity(name);
    if (name) {
      setTimeout(() => cardsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Co na Mazurach?',
    url: 'https://conamazurach.pl',
    description: 'Największy portal wydarzeń, noclegów i atrakcji na Mazurach',
    potentialAction: { '@type': 'SearchAction', target: 'https://conamazurach.pl/?q={search_term_string}', 'query-input': 'required name=search_term_string' },
  };

  return (
    <>
      <Helmet>
        <title>Co na Mazurach? | Największy portal wydarzeń, noclegów i atrakcji na Mazurach</title>
        <meta name="description" content="Odkryj Mazury — jeziora, lasy i niezapomniane przeżycia. Mazury noclegi, Mazury atrakcje, Mazury wakacje 2026. Giżycko, Mikołajki, Mrągowo, Pisz, Węgorzewo." />
        <meta name="keywords" content="Mazury, Mazury noclegi, Mazury atrakcje, Mazury jeziora, co robić na Mazurach, Mazury 2025, Mazury 2026, Mazury wakacje, Giżycko atrakcje, Mikołajki noclegi, Mrągowo events, kemping Mazury, restauracje Mazury" />
        <meta property="og:title" content="Co na Mazurach? | Portal wydarzeń i atrakcji" />
        <meta property="og:description" content="Największy bezpłatny portal wydarzeń, noclegów i atrakcji na Mazurach. Giżycko, Mikołajki, Mrągowo, Pisz — odkryj Krainę Wielkich Jezior!" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://conamazurach.pl/" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      {/* Hero */}
      <section className="relative min-h-[380px] md:min-h-[520px] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(https://picsum.photos/seed/mazury-hero/1600/600)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1B4F8A]/70 via-[#1B4F8A]/50 to-[#1C2B3A]/80" />

        <div className="relative z-10 text-center text-white px-4 max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black leading-tight mb-4">
            Odkryj Mazury<br />
            <span className="text-[#F4A825]">jeziora, lasy i niezapomniane przeżycia</span>
          </h1>
          <p className="text-lg text-white/80 mb-8">
            Największy portal wydarzeń, noclegów i atrakcji w Krainie Wielkich Jezior
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <SearchBar onCitySelect={(val) => setCity(val)} />
            {city && (
              <button
                onClick={() => setCity(null)}
                className="text-white/70 text-sm hover:text-white underline transition-colors"
              >
                Pokaż wszystkie
              </button>
            )}
          </div>

          {city && (
            <p className="mt-4 text-[#F4A825] font-bold text-lg">
              📍 Pokazuję wyniki dla: {city}
            </p>
          )}

        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-10">
        {/* Listings grid */}
        <div ref={cardsRef}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-[#1C2B3A] dark:text-white">
              {city ? `Oferty w: ${city}` : category ? 'Przefiltrowane oferty' : 'Wszystkie oferty na Mazurach'}
              <span className="ml-2 text-base font-normal text-gray-500 dark:text-gray-400">({listings.length})</span>
            </h2>
          </div>

          {listings.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-xl font-bold">Brak wyników</p>
              <p className="text-sm mt-2">Spróbuj zmienić filtry lub lokalizację</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {paginated.map(l => <ListingCard key={l.id} listing={l} />)}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <button
                    onClick={() => goToPage(page - 1)}
                    disabled={page === 1}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Poprzednia
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        onClick={() => goToPage(p)}
                        className={`w-9 h-9 rounded-xl text-sm font-bold transition-colors ${
                          p === page
                            ? 'bg-[#1B4F8A] text-white shadow-md'
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => goToPage(page + 1)}
                    disabled={page === totalPages}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Następna →
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Calendar + Map section */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div>
            <h2 className="text-2xl font-black text-[#1C2B3A] dark:text-white mb-5">
              📅 Kalendarz wydarzeń na Mazurach
            </h2>
            <EventCalendar
              listings={allListings}
              onDaySelect={setSelDay}
              selectedDay={selDay}
            />
            {selDay && (
              <p className="mt-3 text-sm text-[#1B4F8A] font-semibold">
                Filtrowanie po: {selDay.day}.{String(selDay.month + 1).padStart(2, '0')}.{selDay.year}
              </p>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-black text-[#1C2B3A] dark:text-white mb-5">
              🗺️ Mapa Mazur
            </h2>
            <MapView listings={listings} height="380px" />
          </div>
        </div>
      </main>
    </>
  );
}
