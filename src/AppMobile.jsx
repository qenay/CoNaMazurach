import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { mockListings } from './data/mockListings';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Inject fonts
if (!document.getElementById('mobile-font')) {
  const s = document.createElement('link');
  s.id = 'mobile-font'; s.rel = 'stylesheet';
  s.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap';
  document.head.appendChild(s);
}

const API        = 'https://conamazurach.pl';
const GITHUB_RAW = 'https://raw.githubusercontent.com/qenay/CoNaMazurach/main/public/listings.json';
const FONT      = { fontFamily: "'Space Grotesk', sans-serif" };
const FAV_KEY   = 'cnm_favorites';
const THEME_KEY = 'cnm_theme';

function loadFavs()  { try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]')); } catch { return new Set(); } }
function saveFavs(s) { try { localStorage.setItem(FAV_KEY, JSON.stringify([...s])); } catch {} }
function loadTheme() { return localStorage.getItem(THEME_KEY) || 'light'; }

const THEMES = {
  light: {
    bg:      '#F7F4EE',
    card:    '#ffffff',
    card2:   '#F1F5F9',
    heading: '#0e2444',
    text:    '#0f172a',
    muted:   '#64748b',
    subtle:  '#94a3b8',
    border:  '#E2E8F0',
    navBg:   '#ffffff',
    navBorder: '#F1F5F9',
    input:   '#ffffff',
    inputBorder: '#E2E8F0',
    chipBg:  '#F1F5F9',
    chipText:'#475569',
  },
  dark: {
    bg:      '#0f172a',
    card:    '#1e293b',
    card2:   '#0f172a',
    heading: '#ffffff',
    text:    '#f1f5f9',
    muted:   '#94a3b8',
    subtle:  '#64748b',
    border:  '#334155',
    navBg:   '#1e293b',
    navBorder: '#334155',
    input:   '#1e293b',
    inputBorder: '#334155',
    chipBg:  '#334155',
    chipText:'#cbd5e1',
  },
};

const CATS = [
  { id: 'all',         label: 'Wszystkie',   icon: '🗺️', color: '#1B4F8A', bg: '#DBEAFE' },
  { id: 'wydarzenia',  label: 'Wydarzenia',  icon: '🎉', color: '#D97706', bg: '#FEF3C7' },
  { id: 'noclegi',     label: 'Noclegi',     icon: '🏡', color: '#059669', bg: '#D1FAE5' },
  { id: 'restauracje', label: 'Restauracje', icon: '🍽️', color: '#DC2626', bg: '#FEE2E2' },
  { id: 'kempingi',    label: 'Kempingi',    icon: '⛺', color: '#7C3AED', bg: '#EDE9FE' },
  { id: 'koncerty',    label: 'Koncerty',    icon: '🎸', color: '#DB2777', bg: '#FCE7F3' },
  { id: 'atrakcje',    label: 'Atrakcje',    icon: '🎯', color: '#1B4F8A', bg: '#DBEAFE' },
];

const NAV = [
  { id: 'odkryj',    label: 'Odkryj',    icon: '🏠' },
  { id: 'mapa',      label: 'Mapa',      icon: '🗺️' },
  { id: 'dodaj',     label: 'Dodaj',     icon: '➕' },
  { id: 'kalendarz', label: 'Kalendarz', icon: '📅' },
  { id: 'profil',    label: 'Profil',    icon: '👤' },
];

const MONTHS = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'];
const DAYS   = ['Pon','Wt','Śr','Czw','Pt','Sob','Ndz'];

function cat(id) { return CATS.find(c => c.id === id) || CATS[0]; }
function hasImg(l) { return l.image && l.image.length > 10; }

// ─── Splash ─────────────────────────────────────────────────────────────────
function Splash({ onDone }) {
  const [go, setGo] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setGo(true), 1500);
    const t2 = setTimeout(() => onDone(), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  const tr = go ? 'transform 0.85s cubic-bezier(0.77,0,0.175,1)' : 'none';
  const bg = 'url(/splash-bg.jpg)';

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200 }}>

      {/* LEWA POŁÓWKA — background-position:left pokazuje lewą połowę obrazka */}
      <div style={{
        position:'absolute', top:0, left:0, width:'50%', height:'100%',
        backgroundImage: bg,
        backgroundSize: '200% 100%',
        backgroundPosition: 'left center',
        transform: go ? 'translateX(-100%)' : 'none',
        transition: tr,
      }} />

      {/* PRAWA POŁÓWKA — background-position:right pokazuje prawą połowę obrazka */}
      <div style={{
        position:'absolute', top:0, right:0, width:'50%', height:'100%',
        backgroundImage: bg,
        backgroundSize: '200% 100%',
        backgroundPosition: 'right center',
        transform: go ? 'translateX(100%)' : 'none',
        transition: tr,
      }} />

    </div>
  );
}

// ─── Category chips ──────────────────────────────────────────────────────────
function CategoryChips({ active, onChange, T }) {
  return (
    <div style={{ overflowX: 'auto', display: 'flex', gap: 8, padding: '0 16px 2px', scrollbarWidth: 'none' }}>
      {CATS.map(c => (
        <button key={c.id} onClick={() => onChange(c.id)} style={{
          flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
          padding: '7px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
          background: active === c.id ? '#1B4F8A' : T.chipBg,
          color: active === c.id ? '#fff' : T.chipText,
          fontSize: 13, fontWeight: 600, ...FONT, transition: 'all 0.15s',
        }}><span>{c.icon}</span>{c.label}</button>
      ))}
    </div>
  );
}

// ─── Listing card (full width) ────────────────────────────────────────────────
function Card({ listing, onClick, favs, toggleFav, T }) {
  const c = cat(listing.category);
  const isFav = favs?.has(String(listing.id));
  return (
    <div onClick={() => onClick(listing)} style={{ background: T.card, borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.08)', cursor: 'pointer', position: 'relative' }}>
      <div style={{ position: 'relative', aspectRatio: '16/9', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {hasImg(listing)
          ? <img src={listing.image} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
          : <span style={{ fontSize: 52 }}>{c.icon}</span>}
        <div style={{ position: 'absolute', top: 10, left: 10, background: c.color, color: '#fff', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>{c.icon} {c.label}</div>
        <button
          onClick={e => { e.stopPropagation(); toggleFav && toggleFav(String(listing.id)); }}
          style={{ position: 'absolute', top: 8, right: 8, width: 34, height: 34, borderRadius: 999, background: 'rgba(255,255,255,0.92)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', transition: 'transform 0.15s', backdropFilter: 'blur(4px)' }}
          aria-label={isFav ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
        >{isFav ? '❤️' : '🤍'}</button>
      </div>
      <div style={{ padding: '12px 14px 14px' }}>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.text, lineHeight: 1.3 }}>{listing.title}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 5 }}>
          <span style={{ fontSize: 12, color: T.muted, fontWeight: 500 }}>📍 {listing.city}</span>
          {listing.rating ? <span style={{ fontSize: 12, color: '#F4A825', fontWeight: 700 }}>⭐ {listing.rating}</span> : null}
        </div>
        {listing.date && <p style={{ margin: '4px 0 0', fontSize: 12, color: T.heading, fontWeight: 600 }}>📅 {new Date(listing.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })}{listing.time ? ` · ${listing.time}` : ''}</p>}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: T.heading }}>{listing.priceLabel || (listing.price === 0 ? 'Bezpłatne' : `${listing.price} zł`)}</p>
          <div style={{ display: 'flex', gap: 4 }}>
            {(listing.tags || []).slice(0, 2).map(t => (
              <span key={t} style={{ fontSize: 10, color: T.muted, background: T.chipBg, padding: '2px 7px', borderRadius: 999, fontWeight: 600 }}>#{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Detail screen ────────────────────────────────────────────────────────────
function DetailScreen({ listing, onBack, favs, toggleFav, T }) {
  const c = cat(listing.category);
  const isFav = favs?.has(String(listing.id));
  const mailto = `mailto:conamazurach@gmail.com?subject=${encodeURIComponent(`Zapytanie: ${listing.title}`)}&body=${encodeURIComponent(`Dzień dobry,\n\nChciałbym się dowiedzieć więcej o "${listing.title}" w ${listing.city}.\n\nPozdrawiam`)}`;

  return (
    <div style={{ ...FONT, height: '100%', overflowY: 'auto', background: T.bg }}>
      <div style={{ position: 'relative', aspectRatio: '4/3', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {hasImg(listing)
          ? <img src={listing.image} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 80 }}>{c.icon}</span>}
        <button onClick={onBack} style={{ position: 'absolute', top: 16, left: 16, width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.92)', border: 'none', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>←</button>
        <button onClick={() => toggleFav && toggleFav(String(listing.id))} style={{ position: 'absolute', top: 16, right: 16, width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.92)', border: 'none', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>{isFav ? '❤️' : '🤍'}</button>
      </div>

      <div style={{ padding: 20, paddingBottom: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ background: c.color, color: '#fff', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>{c.icon} {c.label}</span>
          {listing.rating ? <span style={{ fontSize: 13, color: '#F4A825', fontWeight: 700 }}>⭐ {listing.rating}/5</span> : null}
          {listing.isNew && <span style={{ background: '#FEF3C7', color: '#D97706', padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>✨ Nowość</span>}
        </div>

        <h1 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: T.text, lineHeight: 1.2 }}>{listing.title}</h1>

        <div style={{ background: T.card, borderRadius: 16, padding: 14, marginBottom: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <p style={{ margin: 0, fontSize: 13, color: T.muted, fontWeight: 500 }}>📍 {listing.address}, {listing.city}</p>
            {listing.date && <p style={{ margin: 0, fontSize: 13, color: T.muted }}>📅 {new Date(listing.date).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>}
            {listing.time && <p style={{ margin: 0, fontSize: 13, color: T.muted }}>🕐 {listing.time}</p>}
          </div>
        </div>

        {listing.description && (
          <div style={{ background: T.card, borderRadius: 16, padding: 16, marginBottom: 14 }}>
            <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 15, color: T.text }}>Opis</p>
            <div style={{ fontSize: 14, color: T.muted, lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: listing.description }} />
          </div>
        )}

        {listing.features?.length > 0 && (
          <div style={{ background: T.card, borderRadius: 16, padding: 16, marginBottom: 14 }}>
            <p style={{ margin: '0 0 10px', fontWeight: 700, fontSize: 15, color: T.text }}>Udogodnienia</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {listing.features.map((f, i) => (
                <p key={i} style={{ margin: 0, fontSize: 13, color: T.muted }}>✓ {f}</p>
              ))}
            </div>
          </div>
        )}

        {(listing.tags || []).length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            {listing.tags.map(t => (
              <span key={t} style={{ fontSize: 12, color: '#1B4F8A', background: '#DBEAFE', padding: '4px 10px', borderRadius: 999, fontWeight: 600 }}>#{t}</span>
            ))}
          </div>
        )}

        {listing.lat && listing.lng && (
          <div style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 14, height: 180 }}>
            <MapContainer center={[listing.lat, listing.lng]} zoom={13} style={{ height: '100%', width: '100%' }} attributionControl={false} zoomControl={false}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
              <Marker position={[listing.lat, listing.lng]} />
            </MapContainer>
          </div>
        )}

        <div style={{ background: T.card, borderRadius: 20, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <p style={{ margin: 0, fontSize: 12, color: T.muted }}>Cena</p>
              <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#1B4F8A' }}>{listing.priceLabel || (listing.price === 0 ? 'Bezpłatne' : `${listing.price} zł`)}</p>
            </div>
            {listing.rating && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#F4A825' }}>⭐ {listing.rating}</p>
                <p style={{ margin: 0, fontSize: 11, color: T.muted }}>ocena</p>
              </div>
            )}
          </div>
          {listing.phone && <p style={{ margin: '0 0 12px', fontSize: 14, color: T.muted, fontWeight: 500 }}>📞 {listing.phone}</p>}
          {listing.website && <a href={listing.website} style={{ display: 'block', marginBottom: 12, fontSize: 13, color: '#1B4F8A', fontWeight: 600 }}>🌐 {listing.website}</a>}
          <a href={mailto} style={{ display: 'block', width: '100%', padding: '15px', borderRadius: 16, background: '#1B4F8A', color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, textAlign: 'center', textDecoration: 'none' }}>
            {listing.price === 0 ? '📧 Napisz do nas' : listing.category === 'noclegi' || listing.category === 'kempingi' ? '📧 Zarezerwuj' : '📧 Kup bilety'}
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Discover screen ──────────────────────────────────────────────────────────
function DiscoverScreen({ listings, onSelect, favs, toggleFav, T }) {
  const [cat,    setCat]    = useState('all');
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const filtered = listings.filter(l => {
    const matchCat = cat === 'all' || l.category === cat;
    const q = search.toLowerCase().trim();
    const matchSearch = !q || l.title?.toLowerCase().includes(q) || l.city?.toLowerCase().includes(q) || (l.tags||[]).some(t => t.toLowerCase().includes(q));
    return matchCat && matchSearch;
  });

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: T.bg }}>
      <div style={{ padding: '16px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ margin: 0, fontSize: 13, color: T.muted, fontWeight: 500 }}>Cześć! 👋</p>
          <p style={{ margin: 0, fontSize: 30, fontWeight: 800, color: T.heading, fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: -0.3 }}>Co na Mazurach?</p>
        </div>
        <button onClick={() => setShowSearch(s => !s)} style={{
          width: 46, height: 46, borderRadius: 999,
          background: '#1e3a6e',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(14,36,68,0.3)',
          flexShrink: 0,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(200,215,235,0.95)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7"/>
            <line x1="16.5" y1="16.5" x2="22" y2="22"/>
          </svg>
        </button>
      </div>

      {showSearch && (
        <div style={{ padding: '0 16px 12px' }}>
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Szukaj miasta, tytułu, tagu..."
            style={{ width: '100%', padding: '12px 16px', borderRadius: 14, border: `2px solid #1B4F8A`, fontSize: 14, ...FONT, boxSizing: 'border-box', outline: 'none', background: T.input, color: T.text }}
          />
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <CategoryChips active={cat} onChange={setCat} T={T} />
      </div>

      <div style={{ padding: '0 16px 8px' }}>
        <p style={{ margin: 0, fontSize: 13, color: T.muted, fontWeight: 600 }}>
          {filtered.length} {filtered.length === 1 ? 'oferta' : 'ofert'}{search ? ` dla "${search}"` : ''}
        </p>
      </div>

      <div style={{ padding: '0 16px 80px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: T.subtle }}>
            <p style={{ fontSize: 40 }}>😕</p>
            <p style={{ fontWeight: 600 }}>Brak wyników</p>
          </div>
        )}
        {filtered.map(l => <Card key={l.id} listing={l} onClick={onSelect} favs={favs} toggleFav={toggleFav} T={T} />)}
      </div>
    </div>
  );
}

// ─── Map screen ───────────────────────────────────────────────────────────────
function MapScreen({ listings, onSelect, favs, toggleFav, T }) {
  const withCoords = listings.filter(l => l.lat && l.lng);
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: T.bg }}>
      <div style={{ padding: '16px 16px 8px' }}>
        <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.text }}>Mapa Mazur</p>
        <p style={{ margin: '2px 0 0', fontSize: 13, color: T.muted }}>{withCoords.length} miejsc na mapie</p>
      </div>
      <div style={{ flex: 1, margin: '0 16px 8px', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.1)' }}>
        <MapContainer center={[53.87, 21.5]} zoom={9} style={{ height: '100%', width: '100%' }} attributionControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
          {withCoords.map(l => {
            const c = cat(l.category);
            const icon = L.divIcon({
              html: `<div style="background:${c.color};width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"><span style="transform:rotate(45deg);font-size:13px">${c.icon}</span></div>`,
              className: '', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -34],
            });
            return (
              <Marker key={l.id} position={[l.lat, l.lng]} icon={icon}>
                <Popup maxWidth={200}>
                  <div style={{ ...FONT, padding: 4 }} onClick={() => onSelect(l)}>
                    <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 13 }}>{l.title}</p>
                    <p style={{ margin: '0 0 6px', fontSize: 12, color: '#64748b' }}>📍 {l.city}</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#1B4F8A' }}>{l.priceLabel || (l.price === 0 ? 'Bezpłatne' : `${l.price} zł`)}</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
      {/* Quick list below map */}
      <div style={{ height: 140, overflowX: 'auto', display: 'flex', gap: 10, padding: '0 16px 16px', scrollbarWidth: 'none' }}>
        {withCoords.slice(0, 10).map(l => {
          const c = cat(l.category);
          return (
            <div key={l.id} onClick={() => onSelect(l)} style={{ flexShrink: 0, width: 140, background: '#fff', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <div style={{ height: 70, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {hasImg(l) ? <img src={l.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 28 }}>{c.icon}</span>}
              </div>
              <div style={{ padding: '6px 8px' }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>{l.title.substring(0, 30)}{l.title.length > 30 ? '…' : ''}</p>
                <p style={{ margin: '2px 0 0', fontSize: 10, color: '#64748b' }}>📍 {l.city}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Calendar screen ──────────────────────────────────────────────────────────
function CalendarScreen({ listings, onSelect, favs, toggleFav, T }) {
  const today  = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selDay, setSelDay] = useState(null);

  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (() => { const d = new Date(year, month, 1).getDay(); return d === 0 ? 6 : d - 1; })();

  const eventDays = new Set(
    listings.filter(l => l.date).filter(l => { const d = new Date(l.date); return d.getFullYear() === year && d.getMonth() === month; }).map(l => new Date(l.date).getDate())
  );

  const dayListings = selDay
    ? listings.filter(l => { if (!l.date) return false; const d = new Date(l.date); return d.getDate() === selDay && d.getMonth() === month && d.getFullYear() === year; })
    : [];

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: T.bg }}>
      {/* Calendar header */}
      <div style={{ margin: 16, borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.1)' }}>
        <div style={{ background: 'linear-gradient(135deg, #1B4F8A, #2563EB)', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <button onClick={() => { if (month === 0) { setYear(y => y-1); setMonth(11); } else setMonth(m => m-1); }} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}>‹</button>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, color: '#fff', fontWeight: 800, fontSize: 18, ...FONT }}>{MONTHS[month]}</p>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 500 }}>{year}</p>
            </div>
            <button onClick={() => { if (month === 11) { setYear(y => y+1); setMonth(0); } else setMonth(m => m+1); }} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}>›</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {DAYS.map((d, i) => <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: i >= 5 ? 'rgba(147,197,253,0.9)' : 'rgba(255,255,255,0.7)', padding: '4px 0' }}>{d}</div>)}
          </div>
        </div>
        <div style={{ background: T.card, padding: '8px 12px 12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
            {cells.map((day, idx) => {
              if (!day) return <div key={`e-${idx}`} />;
              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              const hasEv  = eventDays.has(day);
              const isSel  = selDay === day;
              const isWeekend = ((firstWeekday + day - 1) % 7) >= 5;
              return (
                <button key={day} onClick={() => setSelDay(isSel ? null : day)} style={{
                  width: '100%', aspectRatio: '1', borderRadius: 999, border: 'none', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: isSel || isToday ? 800 : hasEv ? 700 : 500, position: 'relative',
                  background: isSel ? '#1B4F8A' : isToday ? '#F4A825' : hasEv ? 'rgba(27,79,138,0.1)' : 'transparent',
                  color: isSel || isToday ? '#fff' : hasEv ? '#1B4F8A' : isWeekend ? '#2E9E6E' : '#374151',
                }}>
                  {day}
                  {hasEv && !isSel && <div style={{ position: 'absolute', bottom: 2, width: 4, height: 4, borderRadius: 999, background: '#F4A825' }} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ padding: '0 16px 80px' }}>
        {selDay ? (
          <>
            <p style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: T.text }}>
              {selDay} {MONTHS[month]} {year} · {dayListings.length} {dayListings.length === 1 ? 'wydarzenie' : 'wydarzeń'}
            </p>
            {dayListings.length === 0
              ? <div style={{ background: T.card, borderRadius: 16, padding: 20, textAlign: 'center', color: T.subtle }}><p>Brak wydarzeń tego dnia</p></div>
              : dayListings.map(l => <div key={l.id} style={{ marginBottom: 12 }}><Card listing={l} onClick={onSelect} favs={favs} toggleFav={toggleFav} T={T} /></div>)
            }
          </>
        ) : (
          <>
            <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#64748b' }}>Najbliższe wydarzenia</p>
            {listings.filter(l => l.date && new Date(l.date) >= today).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5).map(l => (
              <div key={l.id} style={{ marginBottom: 12 }}><Card listing={l} onClick={onSelect} favs={favs} toggleFav={toggleFav} T={T} /></div>
            ))}
            {listings.filter(l => l.date && new Date(l.date) >= today).length === 0 && (
              <div style={{ background: T.card, borderRadius: 16, padding: 20, textAlign: 'center', color: T.subtle }}>
                <p style={{ fontSize: 32 }}>📅</p>
                <p style={{ fontWeight: 600 }}>Brak nadchodzących wydarzeń</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Kompresja zdjęć ─────────────────────────────────────────────────────────
function compressImage(file, maxW = 900) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const c = document.createElement('canvas');
        c.width = img.width * scale;
        c.height = img.height * scale;
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.78));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ─── Add listing screen ────────────────────────────────────────────────────────
function AddListingScreen({ T }) {
  const [step, setStep]       = useState(0);
  const EMPTY_FORM = { category: '', title: '', city: '', address: '', description: '', price: '', website: '', name: '', email: '', phone: '' };
  const [form, setForm]       = useState(EMPTY_FORM);
  const [photos, setPhotos]   = useState([]); // max 3, photos[0] = okładka
  const [sending, setSending] = useState(false);
  const [done, setDone]       = useState(false);
  const [sendErr, setSendErr] = useState('');

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const inputStyle = { width: '100%', padding: '13px 16px', borderRadius: 14, border: `1.5px solid ${T.inputBorder}`, fontSize: 14, ...FONT, boxSizing: 'border-box', outline: 'none', background: T.input, color: T.text };

  async function addPhoto(file) {
    if (photos.length >= 3) return;
    const compressed = await compressImage(file);
    setPhotos(p => [...p, compressed]);
  }

  async function submit() {
    setSending(true);
    setSendErr('');
    try {
      const payload = {
        ...form,
        images: photos,
        image: photos[0] || '',
        tags: [],
        status: 'pending',
      };
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 20000);
      // text/plain unika preflight CORS — serwer parsuje ręcznie
      const r = await fetch(`${API}/api/pending`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ pending: payload }),
        signal: ctrl.signal,
      });
      clearTimeout(tid);
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${r.status}`);
      }
      setDone(true);
    } catch (e) {
      if (e.name === 'AbortError') {
        setSendErr('Przekroczono czas oczekiwania. Sprawdź internet i spróbuj ponownie.');
      } else {
        setSendErr(`${e.message}`);
      }
    }
    setSending(false);
  }

  if (done) {
    return (
      <div style={{ ...FONT, height: '100%', overflowY: 'auto', background: T.bg }}>
        <div style={{ padding: 20, paddingBottom: 80 }}>
          <div style={{ background: 'linear-gradient(135deg, #1B4F8A, #2563EB)', borderRadius: 24, padding: 28, marginBottom: 20, textAlign: 'center' }}>
            <p style={{ fontSize: 52, margin: '0 0 10px' }}>🎉</p>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 20, color: '#fff' }}>Zgłoszenie wysłane!</p>
            <p style={{ margin: '8px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
              Twoje ogłoszenie trafiło do panelu admina. Po weryfikacji pojawi się na portalu automatycznie.
            </p>
          </div>
          <div style={{ background: T.card, borderRadius: 16, padding: 16, marginBottom: 16, display: 'flex', gap: 12 }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>✅</span>
            <p style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.5 }}>
              <strong style={{ color: T.text }}>Co dalej?</strong><br/>
              Administrator przeglądnie Twoje zgłoszenie i opublikuje je na stronie i w aplikacji.
            </p>
          </div>
          <button onClick={() => { setDone(false); setStep(0); setForm(EMPTY_FORM); setPhotos([]); }} style={{ width: '100%', padding: '15px', borderRadius: 16, background: '#1B4F8A', color: '#fff', border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer', ...FONT }}>
            + Dodaj kolejne ogłoszenie
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...FONT, height: '100%', overflowY: 'auto', background: T.bg }}>
      <div style={{ padding: '16px 16px 0' }}>
        <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.text }}>Dodaj ogłoszenie</p>
        <p style={{ margin: '2px 0 16px', fontSize: 13, color: T.muted }}>Krok {step + 1} z 3</p>
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {[0,1,2].map(i => <div key={i} style={{ flex: 1, height: 4, borderRadius: 999, background: i <= step ? '#1B4F8A' : T.border, transition: 'background 0.3s' }} />)}
        </div>
      </div>

      <div style={{ padding: '0 16px 80px' }}>
        {step === 0 && (
          <div style={{ background: T.card, borderRadius: 20, padding: 20 }}>
            <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 15, color: T.text }}>Kategoria *</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {CATS.filter(c => c.id !== 'all').map(c => (
                <button key={c.id} onClick={() => f('category', c.id)} style={{
                  padding: '8px 14px', borderRadius: 12, border: '2px solid', cursor: 'pointer', fontSize: 13, fontWeight: 600, ...FONT,
                  borderColor: form.category === c.id ? c.color : '#E2E8F0',
                  background: form.category === c.id ? c.bg : '#F8FAFC',
                  color: form.category === c.id ? c.color : '#64748b',
                }}>{c.icon} {c.label}</button>
              ))}
            </div>
            <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: 13, color: T.muted }}>Tytuł ogłoszenia *</p>
            <input value={form.title} onChange={e => f('title', e.target.value)} placeholder="np. Domek nad jeziorem Niegocin" style={{ ...inputStyle, marginBottom: 14 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: 13, color: T.muted }}>Miasto *</p>
                <input value={form.city} onChange={e => f('city', e.target.value)} placeholder="np. Giżycko" style={inputStyle} />
              </div>
              <div>
                <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: 13, color: T.muted }}>Adres</p>
                <input value={form.address} onChange={e => f('address', e.target.value)} placeholder="ul. Przykładowa 1" style={inputStyle} />
              </div>
            </div>
            <button onClick={() => setStep(1)} disabled={!form.category || !form.title || !form.city} style={{ width: '100%', padding: '15px', borderRadius: 16, background: !form.category || !form.title || !form.city ? '#E2E8F0' : '#1B4F8A', color: !form.category || !form.title || !form.city ? '#94a3b8' : '#fff', border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer', ...FONT, marginTop: 20 }}>Dalej →</button>
          </div>
        )}

        {step === 1 && (
          <div style={{ background: T.card, borderRadius: 20, padding: 20 }}>
            <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: 13, color: T.muted }}>Opis *</p>
            <textarea value={form.description} onChange={e => f('description', e.target.value)} placeholder="Opisz swoje ogłoszenie szczegółowo..." rows={4} style={{ ...inputStyle, resize: 'none', marginBottom: 14 }} />
            <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: 13, color: T.muted }}>Cena</p>
            <input value={form.price} onChange={e => f('price', e.target.value)} placeholder="np. od 299 zł / noc lub Bezpłatne" style={{ ...inputStyle, marginBottom: 14 }} />
            <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: 13, color: T.muted }}>
              🌐 Strona / Facebook <span style={{ fontSize: 11, fontWeight: 400, color: T.subtle }}>(opcjonalne)</span>
            </p>
            <input value={form.website} onChange={e => f('website', e.target.value)} placeholder="https://facebook.com/..." type="url" style={{ ...inputStyle, marginBottom: 18 }} />

            {/* Zdjęcia */}
            <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: 13, color: T.muted }}>
              📷 Zdjęcia <span style={{ fontSize: 11, fontWeight: 400, color: T.subtle }}>maks. 3 — pierwsze = okładka</span>
            </p>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ flex: 1, aspectRatio: '1', borderRadius: 14, overflow: 'hidden', position: 'relative', border: `2px dashed ${photos[i] ? '#1B4F8A' : T.border}`, background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {photos[i] ? (
                    <>
                      <img src={photos[i]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {i === 0 && <div style={{ position: 'absolute', bottom: 4, left: 0, right: 0, textAlign: 'center', fontSize: 9, fontWeight: 700, color: '#fff', background: 'rgba(27,79,138,0.7)', padding: '2px 0' }}>OKŁADKA</div>}
                      <button onClick={() => setPhotos(p => p.filter((_, j) => j !== i))} style={{ position: 'absolute', top: 3, right: 3, width: 22, height: 22, borderRadius: 999, background: 'rgba(0,0,0,0.55)', border: 'none', color: '#fff', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>×</button>
                    </>
                  ) : (
                    <label style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: photos.length > i ? 'default' : 'pointer', gap: 4 }}>
                      <span style={{ fontSize: 22, opacity: 0.4 }}>📷</span>
                      <span style={{ fontSize: 10, color: T.subtle }}>{i === 0 ? 'Okładka' : `Zdjęcie ${i+1}`}</span>
                      {photos.length === i && <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files[0] && addPhoto(e.target.files[0])} />}
                    </label>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(0)} style={{ flex: 1, padding: '14px', borderRadius: 16, border: `2px solid ${T.border}`, background: T.card, color: T.muted, fontWeight: 700, fontSize: 14, cursor: 'pointer', ...FONT }}>← Wróć</button>
              <button onClick={() => setStep(2)} disabled={!form.description} style={{ flex: 2, padding: '14px', borderRadius: 16, background: !form.description ? T.border : '#1B4F8A', color: !form.description ? T.subtle : '#fff', border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer', ...FONT }}>Dalej →</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ background: T.card, borderRadius: 20, padding: 20 }}>
            <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: 13, color: T.muted }}>Twoje imię i nazwisko *</p>
            <input value={form.name} onChange={e => f('name', e.target.value)} placeholder="Jan Kowalski" style={{ ...inputStyle, marginBottom: 14 }} />
            <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: 13, color: T.muted }}>Email</p>
            <input value={form.email} onChange={e => f('email', e.target.value)} placeholder="twoj@email.pl" type="email" style={{ ...inputStyle, marginBottom: 14 }} />
            <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: 13, color: T.muted }}>Telefon</p>
            <input value={form.phone} onChange={e => f('phone', e.target.value)} placeholder="+48 123 456 789" style={{ ...inputStyle, marginBottom: 6 }} />
            {sendErr ? <p style={{ fontSize: 12, color: '#EF4444', margin: '8px 0 10px' }}>⚠️ {sendErr}</p> : <div style={{ height: 20 }} />}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, padding: '14px', borderRadius: 16, border: `2px solid ${T.border}`, background: T.card, color: T.muted, fontWeight: 700, fontSize: 14, cursor: 'pointer', ...FONT }}>← Wróć</button>
              <button onClick={submit} disabled={!form.name || sending} style={{ flex: 2, padding: '14px', borderRadius: 16, background: !form.name || sending ? T.border : '#2E9E6E', color: !form.name || sending ? T.subtle : '#fff', border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer', ...FONT }}>
                {sending ? '⏳ Wysyłanie...' : '✓ Wyślij zgłoszenie'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Favorites screen ─────────────────────────────────────────────────────────
function FavoritesScreen({ listings, favs, onSelect, toggleFav, onBack, T }) {
  const favListings = listings.filter(l => favs.has(String(l.id)));
  return (
    <div style={{ height: '100%', overflowY: 'auto', background: T.bg }}>
      <div style={{ padding: '16px 16px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ width: 38, height: 38, borderRadius: 999, background: T.card, border: 'none', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>←</button>
        <div>
          <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.text }}>❤️ Ulubione</p>
          <p style={{ margin: 0, fontSize: 13, color: T.muted }}>{favListings.length} {favListings.length === 1 ? 'oferta' : 'ofert'}</p>
        </div>
      </div>
      <div style={{ padding: '8px 16px 80px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {favListings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: T.subtle }}>
            <p style={{ fontSize: 52, margin: '0 0 12px' }}>🤍</p>
            <p style={{ fontSize: 17, fontWeight: 700, margin: '0 0 6px', color: T.muted }}>Brak ulubionych</p>
            <p style={{ fontSize: 13, margin: 0 }}>Dotknij serduszka 🤍 na dowolnym kafelku, żeby go tu zapisać</p>
          </div>
        ) : (
          favListings.map(l => <Card key={l.id} listing={l} onClick={onSelect} favs={favs} toggleFav={toggleFav} T={T} />)
        )}
      </div>
    </div>
  );
}

// ─── Profile screen ────────────────────────────────────────────────────────────
function ProfileScreen({ favs, onShowFavs, isDark, toggleTheme, T }) {
  const favsCount = favs?.size ?? 0;
  const items = [
    { icon: '❤️', label: 'Ulubione', sub: favsCount > 0 ? `${favsCount} zapisanych ofert` : 'Brak zapisanych ofert', action: onShowFavs, highlight: true },
    { icon: '🌊', label: 'O Co na Mazurach?', sub: 'Poznaj nasz portal' },
    { icon: '📧', label: 'Kontakt', sub: 'conamazurach@gmail.com' },
    { icon: '📋', label: 'Regulamin', sub: 'Zasady korzystania' },
    { icon: '⭐', label: 'Oceń aplikację', sub: 'Zostaw recenzję' },
  ];
  return (
    <div style={{ height: '100%', overflowY: 'auto', background: T.bg }}>
      <div style={{ padding: 20 }}>
        <div style={{ background: 'linear-gradient(135deg, #1B4F8A, #2563EB)', borderRadius: 24, padding: 28, marginBottom: 16, textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: 999, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 12px' }}>🌊</div>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#fff' }}>Co na Mazurach?</p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>Twój przewodnik po Mazurach</p>
          {favsCount > 0 && (
            <div style={{ marginTop: 14, background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '8px 16px', display: 'inline-block' }}>
              <p style={{ margin: 0, fontSize: 13, color: '#fff', fontWeight: 600 }}>❤️ {favsCount} {favsCount === 1 ? 'ulubiona oferta' : 'ulubione oferty'}</p>
            </div>
          )}
        </div>

        {/* Motyw */}
        <div style={{ background: T.card, borderRadius: 20, padding: '14px 20px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 24, width: 40, height: 40, borderRadius: 12, background: T.card2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{isDark ? '🌙' : '☀️'}</span>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.text }}>Motyw</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: T.subtle }}>{isDark ? 'Ciemny' : 'Jasny'}</p>
            </div>
          </div>
          {/* Toggle — kamper */}
          <div onClick={toggleTheme} style={{
            width: 68, height: 34, borderRadius: 999, cursor: 'pointer', position: 'relative', flexShrink: 0,
            background: isDark ? 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' : 'linear-gradient(135deg, #BAE6FD 0%, #FEF9C3 100%)',
            border: isDark ? '1.5px solid #334155' : '1.5px solid #BFE3F5',
            boxShadow: isDark ? 'inset 0 2px 8px rgba(0,0,0,0.45)' : 'inset 0 2px 8px rgba(0,0,0,0.08)',
            transition: 'background 0.4s, border-color 0.4s',
          }}>
            {/* gwiazdki / słońce w tle */}
            <span style={{ position: 'absolute', top: 5, left: isDark ? 8 : 44, fontSize: 11, opacity: 0.7, transition: 'left 0.4s, opacity 0.4s', pointerEvents: 'none' }}>
              {isDark ? '✦' : '☀️'}
            </span>
            {/* kamper */}
            <div style={{
              position: 'absolute', top: 4, left: isDark ? 36 : 4,
              width: 26, height: 26, borderRadius: 999,
              background: isDark ? '#1e293b' : '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.22)',
              transition: 'left 0.38s cubic-bezier(0.4,0,0.2,1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15,
            }}>🚐</div>
          </div>
        </div>

        <div style={{ background: T.card, borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
          {items.map((item, i) => (
            <div key={i} onClick={item.action} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: i < items.length - 1 ? `1px solid ${T.border}` : 'none', cursor: item.action ? 'pointer' : 'default', background: item.highlight ? (isDark ? 'rgba(153,27,27,0.15)' : '#FFF5F5') : 'transparent' }}>
              <span style={{ fontSize: 24, width: 40, height: 40, borderRadius: 12, background: item.highlight ? (isDark ? 'rgba(153,27,27,0.2)' : '#FEE2E2') : T.card2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: item.highlight ? (isDark ? '#FCA5A5' : '#991B1B') : T.text }}>{item.label}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: T.subtle }}>{item.sub}</p>
              </div>
              {item.action && <span style={{ color: T.subtle, fontSize: 18 }}>›</span>}
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: T.subtle }}>Co na Mazurach? v1.0.0</p>
      </div>
    </div>
  );
}

// ─── Bottom navigation ─────────────────────────────────────────────────────────
function BottomNav({ active, onChange, T }) {
  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: T.navBg, borderTop: `1px solid ${T.navBorder}`, display: 'flex', paddingBottom: 'env(safe-area-inset-bottom)', boxShadow: '0 -4px 20px rgba(0,0,0,0.06)', zIndex: 50 }}>
      {NAV.map(n => (
        <button key={n.id} onClick={() => onChange(n.id)} style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: n.id === 'dodaj' ? '6px 0 8px' : '10px 0 8px',
          border: 'none', background: 'transparent', cursor: 'pointer', gap: 2, position: 'relative',
        }}>
          {n.id === 'dodaj' ? (
            <div style={{ width: 48, height: 48, borderRadius: 999, background: '#1e3a6e', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(14,36,68,0.35)', marginTop: -18 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(200,215,235,0.95)" strokeWidth="2.2" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
          ) : (
            <span style={{ fontSize: 22, lineHeight: 1 }}>{n.icon}</span>
          )}
          <span style={{ fontSize: 10, fontWeight: active === n.id ? 700 : 500, color: active === n.id ? T.heading : T.muted, ...FONT }}>{n.label}</span>
          {active === n.id && n.id !== 'dodaj' && <div style={{ width: 4, height: 4, borderRadius: 999, background: '#1B4F8A' }} />}
        </button>
      ))}
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function AppMobile() {
  const [splash,    setSplash]    = useState(true);
  const [tab,       setTab]       = useState('odkryj');
  const [listings,  setListings]  = useState([]);
  const [detail,    setDetail]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [favs,      setFavs]      = useState(loadFavs);
  const [showFavs,  setShowFavs]  = useState(false);
  const [themeName, setThemeName] = useState(loadTheme);

  const isDark = themeName === 'dark';
  const T = THEMES[themeName];

  function toggleTheme() {
    const next = isDark ? 'light' : 'dark';
    setThemeName(next);
    localStorage.setItem(THEME_KEY, next);
  }

  function toggleFav(id) {
    setFavs(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      saveFavs(next);
      return next;
    });
  }

  useEffect(() => {
    const tryLocal = () =>
      fetch('/listings.json')
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(d => { setListings(Array.isArray(d) && d.length ? d : mockListings); setLoading(false); })
        .catch(() => { setListings(mockListings); setLoading(false); });

    function loadData() {
      // ?t= omija cache CDN GitHuba — zawsze świeże dane
      fetch(`${GITHUB_RAW}?t=${Date.now()}`)
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(d => { if (Array.isArray(d) && d.length) { setListings(d); setLoading(false); } else return tryLocal(); })
        .catch(tryLocal);
    }

    loadData();

    // Odświeżaj gdy użytkownik wraca do aplikacji
    const onVisible = () => { if (document.visibilityState === 'visible') loadData(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  if (detail) {
    return (
      <div style={{ ...FONT, position: 'fixed', inset: 0, background: T.bg, overflow: 'hidden' }}>
        <DetailScreen listing={detail} onBack={() => setDetail(null)} favs={favs} toggleFav={toggleFav} T={T} />
      </div>
    );
  }

  if (showFavs) {
    return (
      <div style={{ ...FONT, position: 'fixed', inset: 0, background: T.bg, overflow: 'hidden' }}>
        <FavoritesScreen listings={listings} favs={favs} toggleFav={toggleFav} onSelect={l => { setShowFavs(false); setDetail(l); }} onBack={() => setShowFavs(false)} T={T} />
      </div>
    );
  }

  return (
    <div style={{ ...FONT, position: 'fixed', inset: 0, background: T.bg, overflow: 'hidden' }}>
      {splash && <Splash onDone={() => setSplash(false)} />}

      {loading && !splash && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, background: T.bg }}>
          <span style={{ fontSize: 48 }}>🌊</span>
          <p style={{ margin: 0, color: T.muted, fontWeight: 600 }}>Ładowanie ogłoszeń...</p>
        </div>
      )}

      {!loading && (
        <>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 65, overflowY: 'hidden' }}>
            {tab === 'odkryj'    && <DiscoverScreen  listings={listings} onSelect={setDetail} favs={favs} toggleFav={toggleFav} T={T} />}
            {tab === 'mapa'      && <MapScreen        listings={listings} onSelect={setDetail} favs={favs} toggleFav={toggleFav} T={T} />}
            {tab === 'dodaj'     && <AddListingScreen T={T} />}
            {tab === 'kalendarz' && <CalendarScreen   listings={listings} onSelect={setDetail} favs={favs} toggleFav={toggleFav} T={T} />}
            {tab === 'profil'    && <ProfileScreen favs={favs} onShowFavs={() => setShowFavs(true)} isDark={isDark} toggleTheme={toggleTheme} T={T} />}
          </div>
          <BottomNav active={tab} onChange={setTab} T={T} />
        </>
      )}
    </div>
  );
}
