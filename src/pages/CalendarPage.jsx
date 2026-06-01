import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { mockListings } from '../data/mockListings';
import EventCalendar from '../components/EventCalendar';
import ListingCard from '../components/ListingCard';

export default function CalendarPage() {
  const [selDay, setSelDay] = useState(null);

  const filtered = selDay
    ? mockListings.filter(l => {
        if (!l.date) return false;
        const d = new Date(l.date);
        return d.getDate() === selDay.day && d.getMonth() === selDay.month && d.getFullYear() === selDay.year;
      })
    : mockListings.filter(l => l.date);

  return (
    <>
      <Helmet>
        <title>Kalendarz wydarzeń na Mazurach | Co na Mazurach?</title>
        <meta name="description" content="Pełny kalendarz wydarzeń na Mazurach 2026. Regaty, koncerty, festiwale — sprawdź co dzieje się na Mazurach każdego dnia." />
        <link rel="canonical" href="https://conamazurach.pl/kalendarz" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-black text-[#1C2B3A] mb-2">📅 Kalendarz wydarzeń na Mazurach</h1>
        <p className="text-gray-500 mb-8">Kliknij dzień z kropką, aby zobaczyć wydarzenia w tym dniu</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div>
            <EventCalendar
              listings={mockListings}
              onDaySelect={setSelDay}
              selectedDay={selDay}
            />
            {selDay && (
              <p className="mt-3 text-sm font-semibold text-[#1B4F8A]">
                📅 Filtrowanie: {selDay.day}.{String(selDay.month + 1).padStart(2, '0')}.{selDay.year}
              </p>
            )}
          </div>

          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-[#1C2B3A] mb-4">
              {selDay ? 'Wyniki dla wybranego dnia' : 'Wszystkie nadchodzące wydarzenia'}
              <span className="text-gray-400 text-base font-normal ml-2">({filtered.length})</span>
            </h2>

            {filtered.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-4xl mb-3">📭</p>
                <p className="font-bold">Brak wydarzeń w tym dniu</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filtered.map(l => <ListingCard key={l.id} listing={l} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
