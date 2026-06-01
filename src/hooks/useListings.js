import { useState, useMemo } from 'react';
import { mockListings } from '../data/mockListings';

export function useListings() {
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState(null);
  const [city,     setCity]     = useState(null);
  const [selDay,   setSelDay]   = useState(null);

  const filtered = useMemo(() => {
    let list = mockListings;

    if (category) list = list.filter(l => l.category === category);

    if (city) list = list.filter(l => l.city.toLowerCase() === city.toLowerCase());

    if (selDay) {
      list = list.filter(l => {
        if (!l.date) return false;
        const d = new Date(l.date);
        return d.getDate() === selDay.day && d.getMonth() === selDay.month && d.getFullYear() === selDay.year;
      });
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(l =>
        l.title.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        (l.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }

    return list;
  }, [search, category, city, selDay]);

  return { listings: filtered, allListings: mockListings, search, setSearch, category, setCategory, city, setCity, selDay, setSelDay };
}
