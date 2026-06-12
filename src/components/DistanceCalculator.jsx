import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useDistance } from '../hooks/useDistance';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function FitRoute({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 1) map.fitBounds(positions, { padding: [40, 40] });
  }, [positions, map]);
  return null;
}

export default function DistanceCalculator({ toLat, toLng, toName }) {
  const [query,       setQuery]    = useState('');
  const [suggestions, setSugg]     = useState([]);
  const [showSugg,    setShowSugg] = useState(false);
  const [selected,    setSelected] = useState(null);
  const [localError,  setLocalErr] = useState('');
  const [searching,   setSearching] = useState(false);
  const { calculate, loading, result, error, routeGeo } = useDistance();
  const wrapRef = useRef(null);

  useEffect(() => {
    if (query.length < 2) { setSugg([]); return; }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(
        `/api/geocode?q=${encodeURIComponent(query)}`,
        { signal: controller.signal }
      )
        .then(r => r.json())
        .then(data => setSugg((data.features || []).map(f => ({
          name: [f.properties.name, f.properties.city, f.properties.county].filter(Boolean).join(', '),
          lat:  f.geometry.coordinates[1],
          lng:  f.geometry.coordinates[0],
        }))))
        .catch(() => {});
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query]);

  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowSugg(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function pick(city) {
    setQuery(city.name);
    setSelected(city);
    setSugg([]);
    setShowSugg(false);
    setLocalErr('');
    calculate(city.lat, city.lng, city.name, toLat, toLng);
  }

  async function handleGo() {
    setLocalErr('');
    setShowSugg(false);
    if (selected) {
      calculate(selected.lat, selected.lng, selected.name, toLat, toLng);
      return;
    }
    if (suggestions.length > 0) {
      pick(suggestions[0]);
      return;
    }
    // Geocode directly from typed text
    setSearching(true);
    try {
      const res  = await fetch(`/api/geocode?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (!data.features?.length) { setLocalErr('Nie znaleziono miejscowości. Sprawdź pisownię.'); return; }
      const f    = data.features[0];
      const city = {
        name: [f.properties.name, f.properties.city].filter(Boolean)[0] || query.trim(),
        lat:  f.geometry.coordinates[1],
        lng:  f.geometry.coordinates[0],
      };
      setSelected(city);
      setQuery(city.name);
      calculate(city.lat, city.lng, city.name, toLat, toLng);
    } catch {
      setLocalErr('Błąd połączenia. Spróbuj ponownie.');
    } finally {
      setSearching(false);
    }
  }

  const routePositions = routeGeo
    ? routeGeo.coordinates.map(([lng, lat]) => [lat, lng])
    : [];

  const displayError = localError || error;

  return (
    <div className="bg-gray-50 dark:bg-[#1e293b] rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-bold text-[#1C2B3A] dark:text-white mb-4 flex items-center gap-2">
        🚗 Kalkulator dojazdu
      </h3>

      <div className="flex gap-2 mb-4" ref={wrapRef}>
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(null); setShowSugg(true); setLocalErr(''); }}
            onFocus={() => setShowSugg(true)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleGo(); } }}
            placeholder="Skąd jedziesz? (np. Warszawa)"
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-[#0f172a] dark:text-gray-100 dark:placeholder-gray-500 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-[#1B4F8A] focus:ring-2 focus:ring-[#1B4F8A]/20"
          />
          {showSugg && suggestions.length > 0 && (
            <ul className="absolute top-full left-0 right-0 bg-white dark:bg-[#1e293b] dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg z-50 mt-1 overflow-hidden">
              {suggestions.map((c, i) => (
                <li
                  key={i}
                  onMouseDown={e => { e.preventDefault(); pick(c); }}
                  className="px-4 py-2 text-sm hover:bg-[#1B4F8A] hover:text-white cursor-pointer transition-colors"
                >
                  📍 {c.name}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={handleGo}
          disabled={loading || searching || !query.trim()}
          className="bg-[#1B4F8A] text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-[#163f70] disabled:opacity-50 transition-colors flex-shrink-0"
        >
          {loading || searching ? '⏳' : 'Oblicz trasę'}
        </button>
      </div>

      {displayError && (
        <p className="text-red-500 text-sm mb-4 bg-red-50 rounded-xl p-3">{displayError}</p>
      )}

      {result && (
        <div className="mb-4 bg-white dark:bg-[#0f172a] rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-300 mb-2">
            Trasa: <strong>{result.fromName}</strong> → <strong>{toName}</strong>
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-[#DBEAFE] rounded-xl p-3">
              <p className="text-2xl font-black text-[#1B4F8A]">{result.km}</p>
              <p className="text-xs text-gray-600">km</p>
            </div>
            <div className="bg-[#D1FAE5] rounded-xl p-3">
              <p className="text-2xl font-black text-[#2E9E6E]">{result.hours}h {result.mins}min</p>
              <p className="text-xs text-gray-600">czas jazdy</p>
            </div>
            <div className="bg-[#FEF3C7] rounded-xl p-3">
              <p className="text-2xl font-black text-[#F4A825]">~{result.fuelCost} zł</p>
              <p className="text-xs text-gray-600">szac. paliwo</p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl overflow-hidden" style={{ height: '250px' }}>
        <MapContainer center={[toLat, toLng]} zoom={9} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true} attributionControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
          <Marker position={[toLat, toLng]} />
          {routePositions.length > 1 && (
            <>
              <Polyline positions={routePositions} color="#1B4F8A" weight={4} opacity={0.8} />
              <FitRoute positions={routePositions} />
            </>
          )}
        </MapContainer>
      </div>
    </div>
  );
}
