import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { mockListings } from '../data/mockListings';
import MapView from '../components/MapView';

export default function MapPage() {
  const [activeCategory, setActiveCategory] = useState(null);

  const filtered = activeCategory
    ? mockListings.filter(l => l.category === activeCategory)
    : mockListings;

  return (
    <>
      <Helmet>
        <title>Mapa Mazur — wszystkie oferty | Co na Mazurach?</title>
        <meta name="description" content="Interaktywna mapa wszystkich wydarzeń, noclegów i atrakcji na Mazurach. Giżycko, Mikołajki, Mrągowo, Pisz, Węgorzewo." />
        <link rel="canonical" href="https://conamazurach.pl/mapa" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-black text-[#1C2B3A] mb-2">🗺️ Mapa Mazur</h1>
        <p className="text-gray-500 mb-6">Wszystkie oferty na interaktywnej mapie Krainy Wielkich Jezior</p>

        <MapView
          listings={filtered}
          height="calc(100vh - 280px)"
          showToggle={true}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      </div>
    </>
  );
}
