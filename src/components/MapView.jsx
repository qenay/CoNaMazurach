import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CATEGORIES } from '../data/mockListings';

// Fix default Leaflet marker icons with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function categoryIcon(categoryId) {
  const cat = CATEGORIES.find(c => c.id === categoryId);
  const color = cat?.color || '#1B4F8A';
  const icon  = cat?.icon  || '📍';
  return L.divIcon({
    html: `<div style="background:${color};width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);">
             <span style="transform:rotate(45deg);font-size:15px;">${icon}</span>
           </div>`,
    className: '',
    iconSize:   [36, 36],
    iconAnchor: [18, 36],
    popupAnchor:[0, -38],
  });
}

function FlyTo({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 12, { duration: 1.2 });
  }, [center, map]);
  return null;
}

export default function MapView({ listings, height = '500px', flyTo = null, showToggle = false, activeCategory, onCategoryChange }) {
  const center = [53.9, 21.5];

  return (
    <div style={{ height }} className="rounded-2xl overflow-hidden relative z-0">
      {showToggle && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex gap-2 bg-white rounded-full shadow-lg p-1">
          <button
            onClick={() => onCategoryChange && onCategoryChange(null)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${!activeCategory ? 'bg-[#1B4F8A] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Wszystkie
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange && onCategoryChange(cat.id)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${activeCategory === cat.id ? 'text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              style={activeCategory === cat.id ? { backgroundColor: cat.color } : {}}
            >
              {cat.icon}
            </button>
          ))}
        </div>
      )}

      <MapContainer center={center} zoom={9} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true} attributionControl={false}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        {flyTo && <FlyTo center={flyTo} />}
        {listings.filter(l => l.lat && l.lng).map(l => (
          <Marker key={l.id} position={[l.lat, l.lng]} icon={categoryIcon(l.category)}>
            <Popup maxWidth={220}>
              <div className="text-sm">
                <img
                  src={l.image}
                  alt={l.title}
                  loading="lazy"
                  className="w-full h-24 object-cover rounded mb-2"
                />
                <p className="font-bold text-[#1C2B3A] mb-1 leading-tight">{l.title}</p>
                <p className="text-gray-500 text-xs mb-2">📍 {l.city}</p>
                <Link
                  to={`/events/${l.id}`}
                  className="block text-center bg-[#1B4F8A] text-white rounded-full px-3 py-1 text-xs font-semibold hover:bg-[#163f70] transition-colors"
                >
                  Zobacz szczegóły →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
