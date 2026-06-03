import { useState, useMemo, useEffect } from 'react';

export function useListings() {
  const [allData,  setAllData]  = useState([]);
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState(null);
  const [city,     setCity]     = useState(null);
  const [selDay,   setSelDay]   = useState(null);

  useEffect(() => {
    fetch('/api/listings')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) { setAllData(data); return; }
        return fetch('/listings.json').then(r => r.json()).then(d => setAllData(Array.isArray(d) ? d : []));
      })
      .catch(() => fetch('/listings.json').then(r => r.json()).then(d => setAllData(Array.isArray(d) ? d : [])).catch(() => {}));
  }, []);

  const filtered = useMemo(() => {
    let list = allData;

    if (category) list = list.filter(l => l.category === category);

    if (city) list = list.filter(l => l.city?.toLowerCase() === city.toLowerCase());

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
        l.title?.toLowerCase().includes(q) ||
        l.city?.toLowerCase().includes(q) ||
        l.description?.toLowerCase().includes(q) ||
        (l.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }

    return list;
  }, [allData, search, category, city, selDay]);

  return { listings: filtered, allListings: allData, search, setSearch, category, setCategory, city, setCity, selDay, setSelDay };
}
