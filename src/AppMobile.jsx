import { useState, useEffect, useRef, useMemo, useCallback, memo, lazy, Suspense } from 'react';
import { mockListings } from './data/mockListings';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
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

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371, r = d => d * Math.PI / 180;
  const a = Math.sin(r(lat2-lat1)/2)**2 + Math.cos(r(lat1))*Math.cos(r(lat2))*Math.sin(r(lon2-lon1)/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
function fmtDist(km) { return km < 1 ? `${Math.round(km*1000)} m` : `${km.toFixed(1)} km`; }

function useUserLocation() {
  const [loc, setLoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const get = useCallback(() => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      p => { setLoc({ lat: p.coords.latitude, lng: p.coords.longitude }); setLoading(false); },
      () => setLoading(false),
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }, []);
  return [loc, get, loading];
}

function useSwipeBack(onBack, bgRef) {
  const elRef = useRef(null);
  const onBackRef = useRef(onBack);
  const state = useRef({ startX: null, startY: null, startTime: null, dragging: false });
  useEffect(() => { onBackRef.current = onBack; }, [onBack]);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    function setBg(dx) {
      const bg = bgRef?.current;
      if (!bg) return;
      // parallax: bg slides from -30% toward 0 as overlay moves right
      const offset = -window.innerWidth * 0.3 + dx * 0.3;
      bg.style.transform = `translateX(${offset}px)`;
    }

    function resetBg(animate) {
      const bg = bgRef?.current;
      if (!bg) return;
      if (animate) bg.style.transition = 'transform 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      bg.style.transform = '';
      setTimeout(() => { if (bg) { bg.style.transition = ''; } }, 350);
    }

    function onTouchStart(e) {
      const t = e.touches[0];
      if (t.clientX < 40)
        state.current = { startX: t.clientX, startY: t.clientY, startTime: Date.now(), dragging: false };
    }

    function onTouchMove(e) {
      const s = state.current;
      if (s.startX === null) return;
      const t = e.touches[0];
      const dx = t.clientX - s.startX;
      const dy = Math.abs(t.clientY - s.startY);
      if (!s.dragging) {
        if (dx > 8 && dy < dx * 0.8) s.dragging = true;
        else if (dy > 15) { s.startX = null; return; }
      }
      if (s.dragging && dx > 0) {
        e.preventDefault();
        el.style.transition = 'none';
        el.style.transform = `translateX(${dx}px)`;
        el.style.boxShadow = `-${Math.min(dx * 0.15, 20)}px 0 30px rgba(0,0,0,${Math.max(0.15 - dx * 0.0005, 0).toFixed(3)})`;
        if (bgRef?.current) { bgRef.current.style.transition = 'none'; setBg(dx); }
      }
    }

    function onTouchEnd(e) {
      const s = state.current;
      if (s.startX === null) return;
      const endX = e.changedTouches[0].clientX;
      const dx = endX - s.startX;
      const velocity = dx / Math.max(Date.now() - s.startTime, 1); // px/ms
      const dragging = s.dragging;
      state.current = { startX: null, startY: null, startTime: null, dragging: false };
      if (!dragging) return;

      const shouldBack = dx > window.innerWidth * 0.35 || (velocity > 0.4 && dx > 40);

      if (shouldBack) {
        el.style.transition = 'transform 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.28s';
        el.style.transform = `translateX(${window.innerWidth}px)`;
        el.style.boxShadow = 'none';
        resetBg(true);
        setTimeout(() => { el.style.transition = ''; el.style.transform = ''; el.style.boxShadow = ''; onBackRef.current(); }, 280);
      } else {
        el.style.transition = 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.35s';
        el.style.transform = 'translateX(0)';
        el.style.boxShadow = '';
        resetBg(true);
        setTimeout(() => { el.style.transition = ''; }, 350);
      }
    }

    function onTouchCancel() {
      if (!state.current.dragging) return;
      state.current = { startX: null, startY: null, startTime: null, dragging: false };
      el.style.transition = 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)';
      el.style.transform = 'translateX(0)';
      el.style.boxShadow = '';
      resetBg(true);
      setTimeout(() => { el.style.transition = ''; }, 350);
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchCancel, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchCancel);
    };
  }, []);

  return elRef;
}

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
    const t1 = setTimeout(() => setGo(true), 1500); // po 1.5s zacznij animację
    const t2 = setTimeout(() => onDone(), 2700);     // po 1.5s + 1.1s animacji + 0.1s margines
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  const tr = go ? 'transform 1.1s cubic-bezier(0.77,0,0.175,1)' : 'none';
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
const Card = memo(function Card({ listing, onClick, favs, toggleFav, T, distKm }) {
  const c = cat(listing.category);
  const isFav = favs?.has(String(listing.id));
  return (
    <div onClick={() => onClick(listing)} style={{ background: T.card, borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', cursor: 'pointer', position: 'relative', contain: 'layout style paint' }}>
      <div style={{ position: 'relative', aspectRatio: '16/9', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {hasImg(listing)
          ? <img src={listing.image} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
          : <span style={{ fontSize: 52 }}>{c.icon}</span>}
        <div style={{ position: 'absolute', top: 10, left: 10, background: c.color, color: '#fff', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>{c.icon} {c.label}</div>
        <button
          onClick={e => { e.stopPropagation(); toggleFav && toggleFav(String(listing.id)); }}
          style={{ position: 'absolute', top: 8, right: 8, width: 34, height: 34, borderRadius: 999, background: 'rgba(255,255,255,0.95)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: '0 1px 6px rgba(0,0,0,0.15)', transition: 'transform 0.15s' }}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {distKm != null && (
              <span style={{ fontSize: 10, color: '#1B4F8A', background: '#DBEAFE', padding: '2px 7px', borderRadius: 999, fontWeight: 700 }}>📍 {fmtDist(distKm)}</span>
            )}
            {(listing.tags || []).slice(0, 1).map(t => (
              <span key={t} style={{ fontSize: 10, color: T.muted, background: T.chipBg, padding: '2px 7px', borderRadius: 999, fontWeight: 600 }}>#{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

// ─── Swipe-back overlay wrapper ───────────────────────────────────────────────
function SwipeBackWrapper({ onBack, zIndex, bgRef, children }) {
  const ref = useSwipeBack(onBack, bgRef);
  return (
    <div ref={ref} style={{ position: 'absolute', inset: 0, zIndex, willChange: 'transform' }}>
      {children}
    </div>
  );
}

// ─── Detail screen ────────────────────────────────────────────────────────────
function DetailScreen({ listing, onBack, favs, toggleFav, T }) {
  const c = cat(listing.category);
  const isFav = favs?.has(String(listing.id));
  const mailto = `mailto:kontakt@conamazurach.pl?subject=${encodeURIComponent(`Zapytanie: ${listing.title}`)}&body=${encodeURIComponent(`Dzień dobry,\n\nChciałbym się dowiedzieć więcej o "${listing.title}" w ${listing.city}.\n\nPozdrawiam`)}`;

  async function share() {
    const text = `${listing.title} – ${listing.city} | Co na Mazurach?`;
    if (navigator.share) {
      try { await navigator.share({ title: listing.title, text, url: 'https://conamazurach.pl' }); } catch {}
    } else {
      try { await navigator.clipboard.writeText('https://conamazurach.pl'); } catch {}
    }
  }

  return (
    <div style={{ ...FONT, height: '100%', overflowY: 'auto', background: T.bg, WebkitOverflowScrolling: 'touch', overscrollBehavior: 'none' }}>
      <div style={{ position: 'relative', aspectRatio: '4/3', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {hasImg(listing)
          ? <img src={listing.image} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 80 }}>{c.icon}</span>}
        <button onClick={onBack} style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top) + 16px)', left: 16, width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.92)', border: 'none', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>←</button>
        <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top) + 16px)', right: 16, display: 'flex', gap: 8 }}>
          <button onClick={share} style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.92)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1B4F8A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          </button>
          <button onClick={() => toggleFav && toggleFav(String(listing.id))} style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.92)', border: 'none', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>{isFav ? '❤️' : '🤍'}</button>
        </div>
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
  const [cat,       setCat]       = useState('all');
  const [search,    setSearch]    = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sortNear,  setSortNear]  = useState(false);
  const [userLoc, getUserLoc, locLoading] = useUserLocation();

  function toggleNear() {
    if (!sortNear && !userLoc) getUserLoc();
    setSortNear(s => !s);
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let result = listings.filter(l => {
      if (cat !== 'all' && l.category !== cat) return false;
      return !q || l.title?.toLowerCase().includes(q) || l.city?.toLowerCase().includes(q) || (l.tags||[]).some(t => t.toLowerCase().includes(q));
    });
    if (sortNear && userLoc) {
      result = result
        .filter(l => l.lat && l.lng)
        .map(l => ({ ...l, _dist: haversine(userLoc.lat, userLoc.lng, l.lat, l.lng) }))
        .sort((a, b) => a._dist - b._dist);
    }
    return result;
  }, [listings, cat, search, sortNear, userLoc]);

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: T.bg, WebkitOverflowScrolling: 'touch', overscrollBehavior: 'none' }}>
      <div style={{ padding: '16px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ margin: 0, fontSize: 13, color: T.muted, fontWeight: 500 }}>Cześć! 👋</p>
          <p style={{ margin: 0, fontSize: 30, fontWeight: 800, color: T.heading, fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: -0.3 }}>Co na Mazurach?</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button onClick={toggleNear} style={{
            height: 46, padding: '0 14px', borderRadius: 999,
            background: sortNear ? '#1B4F8A' : '#1e3a6e',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 4px 12px rgba(14,36,68,0.3)',
            color: '#fff', fontSize: 12, fontWeight: 700, ...FONT,
          }}>
            {locLoading ? '⏳' : '📍'}{sortNear ? 'Blisko' : 'Blisko mnie'}
          </button>
          <button onClick={() => setShowSearch(s => !s)} style={{
            width: 46, height: 46, borderRadius: 999,
            background: '#1e3a6e',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(14,36,68,0.3)',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(200,215,235,0.95)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7"/>
              <line x1="16.5" y1="16.5" x2="22" y2="22"/>
            </svg>
          </button>
        </div>
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
        {filtered.map(l => (
          <Card key={l.id} listing={l} onClick={onSelect} favs={favs} toggleFav={toggleFav} T={T}
            distKm={sortNear && userLoc && l.lat && l.lng ? haversine(userLoc.lat, userLoc.lng, l.lat, l.lng) : undefined}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Map helpers ──────────────────────────────────────────────────────────────
function MapClickAway({ onClickAway }) {
  useMapEvents({ click: onClickAway });
  return null;
}
function MapCapture({ onReady }) {
  const map = useMap();
  useEffect(() => { onReady(map); }, []);
  return null;
}

// ─── Map screen ───────────────────────────────────────────────────────────────
function MapScreen({ listings, onSelect, T }) {
  const [activeCat, setActiveCat] = useState('all');
  const [search,    setSearch]    = useState('');
  const [selected,  setSelected]  = useState(null);
  const [nearMe,    setNearMe]    = useState(false);
  const mapRef = useRef(null);
  const [userLoc, getUserLoc, locLoading] = useUserLocation();

  function geolocate() {
    if (!userLoc) {
      getUserLoc();
    } else {
      mapRef.current?.flyTo([userLoc.lat, userLoc.lng], 13);
    }
  }

  function toggleNearMe() {
    if (!nearMe && !userLoc) {
      getUserLoc();
      mapRef.current && navigator.geolocation.getCurrentPosition(
        p => mapRef.current?.flyTo([p.coords.latitude, p.coords.longitude], 11),
        () => {}
      );
    } else if (!nearMe && userLoc) {
      mapRef.current?.flyTo([userLoc.lat, userLoc.lng], 11);
    }
    setNearMe(s => !s);
  }

  const NEAR_RADIUS_KM = 40;

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return listings.filter(l => {
      if (!l.lat || !l.lng) return false;
      if (activeCat !== 'all' && l.category !== activeCat) return false;
      if (nearMe && userLoc) {
        if (haversine(userLoc.lat, userLoc.lng, l.lat, l.lng) > NEAR_RADIUS_KM) return false;
      }
      return !q || l.title?.toLowerCase().includes(q) || l.city?.toLowerCase().includes(q);
    });
  }, [listings, activeCat, search, nearMe, userLoc]);

  const isDark = T.bg === '#0f172a';
  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  return (
    <div style={{ height: '100%', position: 'relative', overflow: 'hidden' }}>

      {/* Pełnoekranowa mapa */}
      <MapContainer center={[53.87, 21.5]} zoom={9} style={{ height: '100%', width: '100%' }} attributionControl={false} zoomControl={false}>
        <TileLayer url={tileUrl} maxZoom={19} />
        <MapCapture onReady={m => { mapRef.current = m; }} />
        <MapClickAway onClickAway={() => setSelected(null)} />
        {filtered.map(l => {
          const c = cat(l.category);
          const isSel = selected?.id === l.id;
          const size = isSel ? 42 : 36;
          const icon = L.divIcon({
            html: `<div style="width:${size}px;height:${size}px;border-radius:999px;background:${isSel ? c.color : '#fff'};display:flex;align-items:center;justify-content:center;font-size:${isSel ? 20 : 17}px;box-shadow:0 3px 10px rgba(0,0,0,${isSel ? 0.35 : 0.2});border:2.5px solid ${isSel ? '#fff' : c.color}">${c.icon}</div>`,
            className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2],
          });
          return (
            <Marker key={l.id} position={[l.lat, l.lng]} icon={icon}
              eventHandlers={{ click: e => { e.originalEvent?.stopPropagation(); setSelected(l); } }}
            />
          );
        })}
      </MapContainer>

      {/* Górny overlay: wyszukiwarka + filtry */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, paddingTop: 'calc(env(safe-area-inset-top) + 10px)', paddingLeft: 14, paddingRight: 14, pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'all', background: T.card, borderRadius: 14, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 16px rgba(0,0,0,0.15)', ...FONT }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.subtle} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Szukaj w pobliżu..."
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, color: T.text, background: 'transparent', ...FONT }} />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: T.subtle, cursor: 'pointer', fontSize: 20, padding: 0, lineHeight: 1 }}>×</button>}
        </div>
        <div style={{ pointerEvents: 'all', display: 'flex', gap: 7, marginTop: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 6, WebkitOverflowScrolling: 'touch' }}>
          <button onClick={toggleNearMe} style={{
            flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 13px', borderRadius: 999, border: 'none', cursor: 'pointer',
            background: nearMe ? '#1B4F8A' : T.card,
            color: nearMe ? '#fff' : T.text,
            fontSize: 12, fontWeight: 700, ...FONT,
            boxShadow: '0 1px 6px rgba(0,0,0,0.12)',
          }}>{locLoading ? '⏳' : '📍'} Blisko mnie</button>
          {CATS.map(c => (
            <button key={c.id} onClick={() => setActiveCat(c.id)} style={{
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 13px', borderRadius: 999, border: 'none', cursor: 'pointer',
              background: activeCat === c.id ? c.color : T.card,
              color: activeCat === c.id ? '#fff' : T.text,
              fontSize: 12, fontWeight: 700, ...FONT,
              boxShadow: '0 1px 6px rgba(0,0,0,0.12)',
            }}><span>{c.icon}</span>{c.label}</button>
          ))}
        </div>
      </div>

      {/* Przycisk geolokalizacji */}
      <button onClick={geolocate} style={{
        position: 'absolute', right: 14,
        bottom: selected ? 148 : 24,
        zIndex: 1000, width: 46, height: 46, borderRadius: 999,
        background: T.card, border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
        transition: 'bottom 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1B4F8A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="9" opacity=".3"/>
        </svg>
      </button>

      {/* Karta wybranego miejsca */}
      {selected && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1000, padding: '0 14px 20px' }}>
          <div onClick={() => onSelect(selected)} style={{ background: T.card, borderRadius: 20, padding: 12, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', cursor: 'pointer', ...FONT }}>
            <div style={{ width: 72, height: 72, borderRadius: 14, overflow: 'hidden', flexShrink: 0, background: cat(selected.category).bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {hasImg(selected)
                ? <img src={selected.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                : <span style={{ fontSize: 32 }}>{cat(selected.category).icon}</span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.title}</p>
                {selected.rating && <span style={{ fontSize: 12, color: '#F4A825', fontWeight: 700, flexShrink: 0 }}>⭐ {selected.rating}</span>}
              </div>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: T.muted }}>{cat(selected.category).label} · 📍 {selected.city}</p>
              <p style={{ margin: '5px 0 0', fontSize: 14, fontWeight: 800, color: '#1B4F8A' }}>{selected.priceLabel || (selected.price === 0 ? 'Bezpłatne' : `${selected.price} zł`)}</p>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.subtle} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
      )}
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

  const eventDays = useMemo(() => new Set(
    listings.filter(l => l.date).filter(l => { const d = new Date(l.date); return d.getFullYear() === year && d.getMonth() === month; }).map(l => new Date(l.date).getDate())
  ), [listings, year, month]);

  const dayListings = useMemo(() => selDay
    ? listings.filter(l => { if (!l.date) return false; const d = new Date(l.date); return d.getDate() === selDay && d.getMonth() === month && d.getFullYear() === year; })
    : [], [listings, selDay, month, year]);

  const upcomingListings = useMemo(() =>
    listings.filter(l => l.date && new Date(l.date) >= today).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5)
  , [listings]);

  const cells = useMemo(() => {
    const c = [];
    for (let i = 0; i < firstWeekday; i++) c.push(null);
    for (let d = 1; d <= daysInMonth; d++) c.push(d);
    return c;
  }, [firstWeekday, daysInMonth]);

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: T.bg, WebkitOverflowScrolling: 'touch', overscrollBehavior: 'none' }}>
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
            {upcomingListings.map(l => (
              <div key={l.id} style={{ marginBottom: 12 }}><Card listing={l} onClick={onSelect} favs={favs} toggleFav={toggleFav} T={T} /></div>
            ))}
            {upcomingListings.length === 0 && (
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
      const r = await fetch(`${API}/api/pending`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pending: payload }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || `Błąd serwera ${r.status}`);
      }
      setDone(true);
    } catch (e) {
      setSendErr(e.message || 'Nieznany błąd. Spróbuj ponownie.');
    }
    setSending(false);
  }

  if (done) {
    return (
      <div style={{ ...FONT, height: '100%', overflowY: 'auto', background: T.bg, WebkitOverflowScrolling: 'touch', overscrollBehavior: 'none' }}>
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
    <div style={{ ...FONT, height: '100%', overflowY: 'auto', background: T.bg, WebkitOverflowScrolling: 'touch', overscrollBehavior: 'none' }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
              {CATS.filter(c => c.id !== 'all').map(c => (
                <button key={c.id} onClick={() => f('category', c.id)} style={{
                  padding: '14px 8px', borderRadius: 14, border: '2px solid', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, ...FONT,
                  borderColor: form.category === c.id ? c.color : T.border,
                  background: form.category === c.id ? c.bg : T.card2,
                  color: form.category === c.id ? c.color : T.muted,
                  transition: 'all 0.15s',
                }}>
                  <span style={{ fontSize: 26 }}>{c.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, textAlign: 'center', lineHeight: 1.2 }}>{c.label}</span>
                </button>
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
  const favListings = useMemo(() => listings.filter(l => favs.has(String(l.id))), [listings, favs]);
  return (
    <div style={{ height: '100%', overflowY: 'auto', background: T.bg, WebkitOverflowScrolling: 'touch', overscrollBehavior: 'none' }}>
      <div style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)', paddingLeft: 16, paddingRight: 16, paddingBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
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

// ─── About screen ─────────────────────────────────────────────────────────────
function AboutScreen({ onBack, T }) {
  const categories = [
    { icon: '🏠', label: 'Noclegi',             desc: 'Domki nad jeziorem, apartamenty, agroturystyki' },
    { icon: '⛺', label: 'Kempingi',             desc: 'Dzikie i komfortowe, dla każdego turysty' },
    { icon: '🎸', label: 'Koncerty i festiwale', desc: 'Muzyczne lato pełne mazurskich emocji' },
    { icon: '🍽️', label: 'Restauracje',          desc: 'Od mazurskiej kuchni po street food' },
    { icon: '🎉', label: 'Wydarzenia',           desc: 'Regaty, jarmarki, festiwale, atrakcje dla dzieci' },
    { icon: '🚣', label: 'Czartery',             desc: 'Jachty, łódki, kajaki, rowery wodne' },
    { icon: '🎡', label: 'Atrakcje',             desc: 'Wszystko co warto zobaczyć i przeżyć' },
  ];
  return (
    <div style={{ height: '100%', overflowY: 'auto', background: T.bg }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: T.bg, paddingTop: 'calc(env(safe-area-inset-top) + 12px)', paddingBottom: 8, paddingLeft: 16, paddingRight: 16, display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${T.border}` }}>
        <button onClick={onBack} style={{ width: 38, height: 38, borderRadius: 999, background: T.card, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.text} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.text }}>O nas</p>
      </div>
      <div style={{ padding: '0 16px 40px' }}>
        <div style={{ background: 'linear-gradient(135deg, #0e2444 0%, #1B4F8A 60%, #1a6fa8 100%)', borderRadius: 20, padding: '20px 20px', margin: '12px 0', textAlign: 'center', display: 'flex', alignItems: 'center', gap: 14 }}>
          <img src="/logo1.png" alt="Co na Mazurach" style={{ width: 52, height: 52, borderRadius: 14, objectFit: 'contain', flexShrink: 0 }} />
          <div style={{ textAlign: 'left' }}>
            <p style={{ margin: '0 0 3px', fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: -0.3 }}>Co na Mazurach?</p>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>Bezpłatna platforma stworzona z miłości do Mazur</p>
          </div>
        </div>
        <div style={{ background: T.card, borderRadius: 20, padding: 20, marginBottom: 12 }}>
          <p style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800, color: T.text }}>Jedno miejsce. Wszystko o Mazurach.</p>
          <p style={{ margin: 0, fontSize: 14, color: T.muted, lineHeight: 1.75 }}>Mazury to kraina 3&nbsp;000 jezior, sosnowych lasów i nieba odbitego w wodzie. Miejsce, które wciąga na całe życie — i zasługuje na przewodnik godny swojej wyjątkowości.</p>
          <div style={{ height: 1, background: T.border, margin: '14px 0' }} />
          <p style={{ margin: 0, fontSize: 14, color: T.muted, lineHeight: 1.75 }}>Stworzyliśmy <strong style={{ color: T.text }}>Co na Mazurach?</strong> bo byliśmy zmęczeni przeszukiwaniem dziesiątek stron przed każdym wyjazdem. Noclegi tu, koncerty tam, restauracje gdzieś indziej... Teraz wszystko jest w jednym miejscu — wygodnie, szybko i bezpłatnie.</p>
        </div>
        <div style={{ background: 'linear-gradient(135deg, rgba(26,111,168,0.12), rgba(46,158,110,0.10))', borderRadius: 20, padding: 20, marginBottom: 12, border: `1.5px solid rgba(26,111,168,0.2)` }}>
          <p style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, color: '#1a6fa8' }}>💙 100% bezpłatne — dla wszystkich</p>
          <p style={{ margin: 0, fontSize: 14, color: T.muted, lineHeight: 1.7 }}>Ani grosz dla turystów. Ani grosz dla właścicieli miejsc. Zero prowizji, zero ukrytych opłat. Wierzymy, że Mazury są dla wszystkich — i każdy zasługuje na łatwy dostęp do najlepszych miejsc w regionie.</p>
        </div>
        <div style={{ background: T.card, borderRadius: 20, padding: 20, marginBottom: 12 }}>
          <p style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 800, color: T.text }}>Co znajdziesz w aplikacji?</p>
          {categories.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: i < categories.length - 1 ? 12 : 0, marginBottom: i < categories.length - 1 ? 12 : 0, borderBottom: i < categories.length - 1 ? `1px solid ${T.border}` : 'none' }}>
              <span style={{ fontSize: 22, width: 40, height: 40, borderRadius: 12, background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{c.icon}</span>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.text }}>{c.label}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: T.subtle }}>{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: 'linear-gradient(135deg, rgba(46,158,110,0.12), rgba(26,111,168,0.08))', borderRadius: 20, padding: 20, marginBottom: 20, border: `1.5px solid rgba(46,158,110,0.2)` }}>
          <p style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, color: '#2E9E6E' }}>🏡 Masz miejsce na Mazurach?</p>
          <p style={{ margin: 0, fontSize: 14, color: T.muted, lineHeight: 1.7 }}>Dodaj je za darmo i dotrzyj do tysięcy turystów szukających właśnie czegoś takiego jak Ty oferujesz. Bądź częścią mazurskiej społeczności — razem budujemy coś wyjątkowego.</p>
        </div>
        <a href="mailto:kontakt@conamazurach.pl?subject=Chcę dodać moje miejsce" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '17px', borderRadius: 18, background: '#1a6fa8', color: '#fff', fontWeight: 800, fontSize: 16, textDecoration: 'none', marginBottom: 10, boxShadow: '0 4px 16px rgba(26,111,168,0.35)', ...FONT }}>
          + Dodaj swoje miejsce — to nic nie kosztuje
        </a>
        <a href="https://conamazurach.pl" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '15px', borderRadius: 18, background: 'transparent', color: '#1a6fa8', fontWeight: 700, fontSize: 15, textDecoration: 'none', border: `2px solid #1a6fa8`, ...FONT }}>
          🌐 Odwiedź conamazurach.pl
        </a>
        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: T.subtle, lineHeight: 1.6 }}>Zrobione z 💙 dla Mazur<br/>© 2025 Co na Mazurach?</p>
      </div>
    </div>
  );
}

// ─── Profile screen ────────────────────────────────────────────────────────────
function ProfileScreen({ favs, onShowFavs, onShowAbout, isDark, toggleTheme, T }) {
  const favsCount = favs?.size ?? 0;
  const items = [
    { icon: '❤️', label: 'Ulubione', sub: favsCount > 0 ? `${favsCount} zapisanych ofert` : 'Brak zapisanych ofert', action: onShowFavs, highlight: true },
    { icon: '🌊', label: 'O Co na Mazurach?', sub: 'Poznaj nasz portal', action: onShowAbout },
    { icon: '📧', label: 'Kontakt', sub: 'kontakt@conamazurach.pl' },
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
  const [showAbout, setShowAbout] = useState(false);
  const [themeName, setThemeName] = useState(loadTheme);
  const mainContentRef = useRef(null);
  const [mountedTabs, setMountedTabs] = useState(() => new Set(['odkryj']));

  const isDark = themeName === 'dark';
  const T = THEMES[themeName];

  function toggleTheme() {
    const next = isDark ? 'light' : 'dark';
    setThemeName(next);
    localStorage.setItem(THEME_KEY, next);
  }

  const handleTabChange = useCallback((id) => {
    setTab(id);
    setMountedTabs(prev => prev.has(id) ? prev : new Set([...prev, id]));
  }, []);

  const toggleFav = useCallback((id) => {
    setFavs(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      saveFavs(next);
      return next;
    });
  }, []);

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
          {/* Mapa: pełny ekran od top:0, pod spodem safe area jest obsługiwane przez własny overlay */}
          {mountedTabs.has('mapa') && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 'calc(65px + env(safe-area-inset-bottom))', display: tab === 'mapa' ? 'block' : 'none', zIndex: 1 }}>
              <MapScreen listings={listings} onSelect={setDetail} T={T} />
            </div>
          )}

          <div ref={mainContentRef} style={{ position: 'absolute', top: 'env(safe-area-inset-top)', left: 0, right: 0, bottom: 'calc(65px + env(safe-area-inset-bottom))', overflowY: 'hidden' }}>
            <div style={{ height: '100%', display: tab === 'odkryj' ? 'block' : 'none' }}>
              <DiscoverScreen listings={listings} onSelect={setDetail} favs={favs} toggleFav={toggleFav} T={T} />
            </div>
            {mountedTabs.has('dodaj') && (
              <div style={{ height: '100%', display: tab === 'dodaj' ? 'block' : 'none' }}>
                <AddListingScreen T={T} />
              </div>
            )}
            {mountedTabs.has('kalendarz') && (
              <div style={{ height: '100%', display: tab === 'kalendarz' ? 'block' : 'none' }}>
                <CalendarScreen listings={listings} onSelect={setDetail} favs={favs} toggleFav={toggleFav} T={T} />
              </div>
            )}
            {mountedTabs.has('profil') && (
              <div style={{ height: '100%', display: tab === 'profil' ? 'block' : 'none' }}>
                <ProfileScreen favs={favs} onShowFavs={() => setShowFavs(true)} onShowAbout={() => setShowAbout(true)} isDark={isDark} toggleTheme={toggleTheme} T={T} />
              </div>
            )}
          </div>
          <BottomNav active={tab} onChange={handleTabChange} T={T} />
        </>
      )}

      {showFavs && (
        <SwipeBackWrapper onBack={() => setShowFavs(false)} zIndex={60} bgRef={mainContentRef}>
          <FavoritesScreen listings={listings} favs={favs} toggleFav={toggleFav} onSelect={l => { setShowFavs(false); setDetail(l); }} onBack={() => setShowFavs(false)} T={T} />
        </SwipeBackWrapper>
      )}

      {showAbout && (
        <SwipeBackWrapper onBack={() => setShowAbout(false)} zIndex={60} bgRef={mainContentRef}>
          <AboutScreen onBack={() => setShowAbout(false)} T={T} />
        </SwipeBackWrapper>
      )}

      {detail && (
        <SwipeBackWrapper onBack={() => setDetail(null)} zIndex={70} bgRef={mainContentRef}>
          <DetailScreen listing={detail} onBack={() => setDetail(null)} favs={favs} toggleFav={toggleFav} T={T} />
        </SwipeBackWrapper>
      )}
    </div>
  );
}
