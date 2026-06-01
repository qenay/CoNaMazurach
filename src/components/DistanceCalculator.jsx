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
    if (positions.length > 1) {
      map.fitBounds(positions, { padding: [40, 40] });
    }
  }, [positions, map]);
  return null;
}

export default function DistanceCalculator({ toLat, toLng, toName }) {
  const [query, setQuery]       = useState('');
  const [suggestions, setSugg]  = useState([]);
  const [showSugg, setShowSugg] = useState(false);
  const { calculate, loading, result, error, routeGeo } = useDistance();
  const wrapRef = useRef(null);

  useEffect(() => {
    if (query.length < 2) { setSugg([]); return; }
    const controller = new AbortController();
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=pl&format=json&limit=6&addressdetails=1`, {
      signal: controller.signal,
      headers: { 'Accept-Language': 'pl' },
    })
      .then(r => r.json())
      .then(data => setSugg(data.map(d => ({ name: d.display_name.split(',')[0] }))))
      .catch(() => {});
    return () => controller.abort();
  }, [query]);

  // Close suggestions on outside click
  useEffect(() => {
    function handler(e) { if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowSugg(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleSelect(name) {
    setQuery(name);
    setSugg([]);
    setShowSugg(false);
    calculate(name, toLat, toLng);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (query.trim()) calculate(query.trim(), toLat, toLng);
  }

  const routePositions = routeGeo
    ? routeGeo.coordinates.map(([lng, lat]) => [lat, lng])
    : [];

  return (
    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
      <h3 className="text-lg font-bold text-[#1C2B3A] mb-4 flex items-center gap-2">
        🚗 Kalkulator dojazdu
      </h3>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-4" ref={wrapRef}>
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setShowSugg(true); }}
            onFocus={() => setShowSugg(true)}
            placeholder="Skąd jedziesz? (np. Warszawa)"
            className="w-full border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-[#1B4F8A] focus:ring-2 focus:ring-[#1B4F8A]/20"
          />
          {showSugg && suggestions.length > 0 && (
            <ul className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 mt-1 overflow-hidden">
              {suggestions.map(c => (
                <li
                  key={c.name}
                  onClick={() => handleSelect(c.name)}
                  className="px-4 py-2 text-sm hover:bg-[#1B4F8A] hover:text-white cursor-pointer transition-colors"
                >
                  📍 {c.name}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-[#1B4F8A] text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-[#163f70] disabled:opacity-50 transition-colors"
        >
          {loading ? '⏳' : 'Oblicz trasę'}
        </button>
      </form>

      {error && (
        <p className="text-red-500 text-sm mb-4 bg-red-50 rounded-xl p-3">{error}</p>
      )}

      {result && (
        <div className="mb-4 bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500 mb-2">
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

      {/* Mini map */}
      <div className="rounded-xl overflow-hidden" style={{ height: '250px' }}>
        <MapContainer center={[toLat, toLng]} zoom={9} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true} attributionControl={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
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
