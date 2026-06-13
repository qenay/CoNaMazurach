import { useState, useEffect } from 'react';

const CATS = [
  { id: 'wydarzenia',  label: 'Wydarzenie',  icon: '🎉' },
  { id: 'noclegi',     label: 'Nocleg',       icon: '🏡' },
  { id: 'restauracje', label: 'Restauracja',  icon: '🍽️' },
  { id: 'kempingi',    label: 'Kemping',      icon: '⛺' },
  { id: 'koncerty',    label: 'Koncert',       icon: '🎸' },
  { id: 'atrakcje',    label: 'Atrakcja',     icon: '🎯' },
  { id: 'czartery',   label: 'Czarter',      icon: '⛵' },
];

const ICONS      = ['🏡', '⛺', '🎸', '🎉', '🍽️', '🌊', '🏄', '🎪', '🏕️', '🚣', '🎯', '🎭'];
const PASS_KEY   = 'cnm_admin_pass';
const SESSION_KEY = 'cnm_admin_session';
const DEFAULT_PASS = 'admin';

const emptyForm = {
  category: '', title: '', description: '', city: '', postalCode: '', address: '',
  price: '', rating: '', features: [], hashtags: [], images: [], icon: '🎉', status: 'aktywne',
  lat: null, lng: null,
  name: '', email: '', phone: '', website: '',
};

function getAdminPass() {
  return localStorage.getItem(PASS_KEY) || DEFAULT_PASS;
}

function listingToForm(l) {
  return {
    category:    l.category || '',
    title:       l.title || '',
    description: l.description?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || '',
    city:        l.city || '',
    postalCode:  l.postalCode || '',
    address:     l.address || '',
    price:       l.priceLabel || l.price?.toString() || '',
    rating:      l.rating?.toString() || '',
    features:    l.features || [],
    hashtags:    l.tags || l.hashtags || [],
    images:      l.images?.length ? l.images : (l.image ? [l.image] : []),
    icon:        l.icon || CATS.find(c => c.id === l.category)?.icon || '🎉',
    status:      l.status || 'aktywne',
    lat:         l.lat || null,
    lng:         l.lng || null,
    name:        l.name || '',
    email:       l.email || '',
    phone:       l.phone || '',
    website:     l.website || '',
  };
}

function buildListing(form, existing) {
  return {
    date:      null,
    time:      null,
    isNew:     true,
    ...existing,
    id:          existing?.id || Date.now(),
    title:       form.title,
    category:    form.category,
    city:        form.city,
    postalCode:  form.postalCode || '',
    address:     form.address,
    lat:         form.lat  ?? existing?.lat  ?? 53.8,
    lng:         form.lng  ?? existing?.lng  ?? 21.5,
    description: form.description,
    priceLabel:  form.price,
    price:       parseFloat(form.price) ?? (existing?.price ?? 0),
    rating:      parseFloat(form.rating) || (existing?.rating ?? 0),
    tags:        form.hashtags,
    features:    form.features,
    icon:        form.icon,
    status:      form.status,
    image:       form.images?.[0] || existing?.image || '',
    images:      form.images?.length > 0 ? form.images : (existing?.images || []),
    createdAt:   existing?.createdAt || Date.now(),
    name:        form.name || existing?.name || '',
    email:       form.email || existing?.email || '',
    phone:       form.phone || existing?.phone || '',
    website:     form.website || existing?.website || '',
  };
}

/* Jednoklikowa poprawa opisu: czyści odstępy i interpunkcję, dzieli na akapity,
   a krótkie wyliczenia w osobnych liniach zamienia na listę punktowaną */
function beautifyDescription(text) {
  if (!text || !text.trim()) return '';

  // wielka litera tylko gdy tekst zaczyna się od litery (nie zmienia "2 domki")
  const cap = s => /^[a-ząćęłńóśźż]/i.test(s) ? s[0].toUpperCase() + s.slice(1) : s;

  const cleanLine = l => l
    .replace(/[ \t]+/g, ' ')
    .replace(/ ?([,.;:!?]) ?/g, '$1 ')
    .replace(/ \)/g, ')').replace(/\( /g, '(')
    .trim();

  const lines = text
    .replace(/<[^>]+>/g, ' ')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(l => l.trim());

  // grupuj w bloki rozdzielone pustymi liniami
  const blocks = [];
  let cur = [];
  for (const l of lines) {
    if (l === '') { if (cur.length) { blocks.push(cur); cur = []; } }
    else cur.push(l);
  }
  if (cur.length) blocks.push(cur);

  const out = blocks.map(block => {
    // blok-lista: kilka krótkich linii bez kropek na końcu → punktory
    const shortLines = block.filter(l => l.length < 60 && !/[.!?…]$/.test(l));
    const isList = block.length >= 2 && shortLines.length / block.length >= 0.6;

    if (isList) {
      return block
        .map(l => '• ' + cap(cleanLine(l).replace(/^[-•*–]\s*/, '').replace(/[.,;]$/, '')))
        .join('\n');
    }

    // blok-proza: złącz, podziel na zdania, akapity po 2-3 zdania
    const t = cleanLine(block.join(' '));
    const sentences = t
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => {
        s = cap(s);
        if (!/[.!?…]$/.test(s)) s += '.';
        return s;
      });

    const paragraphs = [];
    for (let i = 0; i < sentences.length; ) {
      const take = sentences.length - i === 4 ? 2 : Math.min(3, sentences.length - i);
      paragraphs.push(sentences.slice(i, i + take).join(' '));
      i += take;
    }
    return paragraphs.join('\n\n');
  });

  return out.join('\n\n');
}

async function saveToGitHub(listings) {
  const r = await fetch('/api/listings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ listings }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${r.status}`);
  }
}

// ─── Login screen ──────────────────────────────────────────────────────────
function AdminLogin({ onLogin }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  function submit(e) {
    e.preventDefault();
    if (input === getAdminPass()) {
      sessionStorage.setItem(SESSION_KEY, '1');
      onLogin();
    } else {
      setError(true);
      setInput('');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-4xl mb-3">🌊</p>
          <h1 className="text-white font-black text-2xl">Panel admina</h1>
          <p className="text-gray-400 text-sm mt-1">conamazurach.pl/paneladmina</p>
        </div>
        <form onSubmit={submit} className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <label className="block text-sm font-semibold text-gray-300 mb-2">Hasło</label>
          <input
            type="password"
            value={input}
            onChange={e => { setInput(e.target.value); setError(false); }}
            placeholder="Wpisz hasło..."
            autoFocus
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#1a6fa8] mb-3"
          />
          {error && <p className="text-red-400 text-xs mb-3">Nieprawidłowe hasło</p>}
          <button type="submit" className="w-full bg-[#1a6fa8] text-white py-2.5 rounded-xl font-bold text-sm hover:bg-[#155d8f] transition-colors">
            Zaloguj się →
          </button>
        </form>
        <p className="text-center mt-4">
          <a href="/" className="text-gray-500 text-xs hover:text-gray-300 transition-colors">← Wróć na stronę</a>
        </p>
      </div>
    </div>
  );
}

// ─── Main panel ────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [authed, setAuthed] = useState(sessionStorage.getItem(SESSION_KEY) === '1');

  if (!authed) return <AdminLogin onLogin={() => setAuthed(true)} />;
  return <AdminPanel onLogout={() => { sessionStorage.removeItem(SESSION_KEY); setAuthed(false); }} />;
}

function AdminPanel({ onLogout }) {
  const [view,         setView]        = useState('dashboard');
  const [listings,     setListings]    = useState([]);
  const [loading,      setLoading]     = useState(true);
  const [saving,       setSaving]      = useState(false);
  const [saveStatus,   setSaveStatus]  = useState('');
  const [sortOrder,    setSortOrder]   = useState('newest');
  const [daysFilter,   setDaysFilter]  = useState(0);
  const [editId,       setEditId]      = useState(null);
  const [form,         setForm]        = useState(emptyForm);
  const [featureInput, setFeatInput]   = useState('');
  const [hashInput,    setHashInput]   = useState('');
  const [sidebarOpen,  setSidebar]     = useState(false);
  const [newPass,      setNewPass]     = useState('');
  const [passSaved,    setPassSaved]   = useState(false);
  const [geocoding,    setGeocoding]   = useState(false);
  const [geoStatus,    setGeoStatus]   = useState('');
  const [pending,      setPending]     = useState([]);
  const [pendingLoad,  setPendingLoad] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [contactCat,    setContactCat]    = useState('');
  const [descProposal,  setDescProposal]  = useState(null);

  useEffect(() => {
    setPendingLoad(true);
    fetch('/api/pending')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setPending(d); })
      .catch(() => {})
      .finally(() => setPendingLoad(false));
  }, []);

  async function rejectPending(id) {
    if (!window.confirm('Odrzucić to zgłoszenie?')) return;
    await fetch(`/api/pending?id=${id}`, { method: 'DELETE' });
    setPending(p => p.filter(x => x.id !== id));
  }

  function importPending(item) {
    setForm({
      category:    item.category || '',
      title:       item.title || '',
      description: item.description || '',
      city:        item.city || '',
      postalCode:  item.postalCode || '',
      address:     item.address || '',
      price:       item.price || item.priceLabel || '',
      rating:      '',
      features:    item.features || [],
      hashtags:    item.tags || [],
      images:      item.images?.length ? item.images : (item.image ? [item.image] : []),
      icon:        CATS.find(c => c.id === item.category)?.icon || '🎉',
      status:      'aktywne',
      lat:         item.lat || null,
      lng:         item.lng || null,
      name:        item.name || '',
      email:       item.email || '',
      phone:       item.phone || '',
      website:     item.website || '',
    });
    setEditId(null);
    setView('form');
    setSidebar(false);
    // usuń z pending po imporcie
    fetch(`/api/pending?id=${item.id}`, { method: 'DELETE' })
      .then(() => setPending(p => p.filter(x => x.id !== item.id)));
  }

  async function geocodeAddress() {
    const q = [form.address, form.city, 'Polska'].filter(Boolean).join(', ');
    if (!q.trim()) return;
    setGeocoding(true);
    setGeoStatus('');
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&countrycodes=pl&limit=1`;
      const res = await fetch(url, { headers: { 'User-Agent': 'CoNaMazurach-Admin/1.0' } });
      const data = await res.json();
      if (data.length > 0) {
        setForm(f => ({ ...f, lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }));
        setGeoStatus('ok');
      } else {
        setGeoStatus('err');
      }
    } catch {
      setGeoStatus('err');
    }
    setGeocoding(false);
  }

  useEffect(() => {
    fetch('/api/listings')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) { setListings(data); setLoading(false); return; }
        // API returned error — fallback to static file
        return fetch('/listings.json').then(r => r.json()).then(d => { setListings(Array.isArray(d) ? d : []); setLoading(false); });
      })
      .catch(() => {
        fetch('/listings.json').then(r => r.json()).then(d => { setListings(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false));
      });
  }, []);

  const catMap = Object.fromEntries(CATS.map(c => [c.id, c]));

  async function pushToGitHub(newListings) {
    setSaving(true);
    setSaveStatus('saving');
    try {
      await saveToGitHub(newListings);
      setSaveStatus('ok');
      setTimeout(() => setSaveStatus(''), 5000);
    } catch (e) {
      setSaveStatus('err:' + e.message);
    } finally {
      setSaving(false);
    }
  }

  function openNew() {
    setForm(emptyForm); setEditId(null); setView('form'); setSidebar(false);
  }
  function openEdit(id) {
    const l = listings.find(x => x.id === id);
    if (!l) return;
    setForm(listingToForm(l));
    setEditId(id); setView('form');
  }
  async function deleteListing(id) {
    if (!window.confirm('Usunąć to ogłoszenie?')) return;
    const next = listings.filter(x => x.id !== id);
    setListings(next);
    await pushToGitHub(next);
  }
  async function save(status) {
    const existing = editId ? listings.find(x => x.id === editId) : null;
    const data = buildListing({ ...form, status }, existing);
    const next = editId ? listings.map(x => x.id === editId ? data : x) : [...listings, data];
    setListings(next);
    setView('list'); setEditId(null); setForm(emptyForm);
    await pushToGitHub(next);
  }
  function addFeature() {
    const v = featureInput.trim();
    if (v && !form.features.includes(v)) setForm(f => ({ ...f, features: [...f.features, v] }));
    setFeatInput('');
  }
  function addHash() {
    const v = hashInput.trim().replace(/^#/, '');
    if (v && !form.hashtags.includes(v)) setForm(f => ({ ...f, hashtags: [...f.hashtags, v] }));
    setHashInput('');
  }
  function savePass() {
    if (!newPass.trim()) return;
    localStorage.setItem(PASS_KEY, newPass.trim());
    setNewPass(''); setPassSaved(true);
    setTimeout(() => setPassSaved(false), 2500);
  }

  const inputCls = 'w-full bg-[#1a2232] border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#1a6fa8] focus:ring-2 focus:ring-[#1a6fa8]/30';

  const navItems = [
    { id: 'dashboard',   label: 'Pulpit',           icon: '📊' },
    { id: 'list',        label: 'Lista ogłoszeń',   icon: '📋' },
    { id: 'akceptacje',  label: `Akceptacje${pending.length > 0 ? ` (${pending.length})` : ''}`, icon: '📥' },
    { id: 'kontakty',    label: 'Baza kontaktów',   icon: '📞' },
    { id: 'form_new',    label: 'Dodaj ogłoszenie', icon: '➕' },
    { id: 'settings',    label: 'Ustawienia',       icon: '⚙️' },
  ];

  function navClick(id) {
    if (id === 'form_new') openNew();
    else { setView(id); setSidebar(false); }
  }

  const activeNav = view === 'form' ? 'form_new' : view;
  const viewTitle = { dashboard: 'Pulpit', list: 'Lista ogłoszeń', form: editId ? 'Edytuj ogłoszenie' : 'Dodaj ogłoszenie', settings: 'Ustawienia', akceptacje: 'Akceptacje', kontakty: 'Baza kontaktów' };

  return (
    <div className="min-h-screen flex bg-[#f5f2eb]" style={{ fontFamily: 'Nunito, sans-serif' }}>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-56 bg-[#12192b] flex flex-col transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-5 py-5 border-b border-white/10">
          <p className="text-white font-black text-base leading-tight">🌊 Co na Mazurach</p>
          <p className="text-gray-500 text-xs mt-1">conamazurach.pl/paneladmina</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => navClick(item.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2.5 ${
                activeNav === item.id
                  ? 'bg-[#1a6fa8] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="text-base">{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-white/10 space-y-2">
          <a href="/" className="block text-gray-500 text-xs hover:text-gray-300 transition-colors">← Strona główna</a>
          <button onClick={onLogout} className="text-gray-500 text-xs hover:text-red-400 transition-colors">Wyloguj</button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setSidebar(false)} />}

      {/* Content */}
      <div className="flex-1 md:ml-56 flex flex-col min-h-screen">
        {saveStatus === 'saving' && (
          <div className="bg-blue-50 border-b border-blue-200 px-6 py-2 text-sm text-blue-700 font-semibold flex items-center gap-2">
            <span className="animate-spin">⏳</span> Zapisywanie do GitHuba… strona zaktualizuje się za ~1 minutę.
          </div>
        )}
        {saveStatus === 'ok' && (
          <div className="bg-green-50 border-b border-green-200 px-6 py-2 text-sm text-green-700 font-semibold">
            ✓ Zapisano! Vercel wdraża zmiany (~1 min).
          </div>
        )}
        {saveStatus.startsWith('err:') && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-2 text-sm text-red-700 font-semibold">
            ✗ Błąd zapisu: {saveStatus.slice(4)} — sprawdź GITHUB_TOKEN w Vercel.
          </div>
        )}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-gray-500 text-xl" onClick={() => setSidebar(true)}>☰</button>
            <h2 className="font-black text-[#12192b] text-lg">{viewTitle[view] || view}</h2>
          </div>
          {view !== 'form' && (
            <button onClick={openNew} className="bg-[#1a6fa8] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#155d8f] transition-colors">
              + Dodaj nowe
            </button>
          )}
        </header>

        <main className="flex-1 p-6">

          {loading && (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <p className="text-4xl animate-bounce mr-3">🌊</p>
              <p className="font-semibold">Ładowanie ogłoszeń…</p>
            </div>
          )}

          {/* ── DASHBOARD ── */}
          {!loading && view === 'dashboard' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-[#12192b] text-white rounded-2xl p-5 col-span-2 md:col-span-1">
                  <p className="text-gray-400 text-sm">Wszystkie ogłoszenia</p>
                  <p className="text-4xl font-black mt-1">{listings.filter(l => l.status === 'aktywne').length}</p>
                  <p className="text-green-400 text-xs mt-1">aktywne</p>
                </div>
                {CATS.slice(0, 2).map(c => (
                  <div key={c.id} className="bg-[#12192b] text-white rounded-2xl p-5">
                    <p className="text-gray-400 text-sm">{c.label}</p>
                    <p className="text-4xl font-black mt-1">{listings.filter(l => l.category === c.id && l.status === 'aktywne').length}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h3 className="font-black text-[#12192b] mb-4">Ostatnio dodane</h3>
                {listings.length === 0 ? (
                  <p className="text-gray-400 text-sm py-4 text-center">Brak ogłoszeń. Dodaj pierwsze!</p>
                ) : (
                  <div className="space-y-0">
                    {[...listings].reverse().slice(0, 6).map(l => (
                      <div key={l.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{l.icon || catMap[l.category]?.icon}</span>
                          <div>
                            <p className="text-sm font-semibold text-[#12192b] truncate max-w-[200px]">{l.title}</p>
                            <p className="text-xs text-gray-400">{catMap[l.category]?.label} · {l.city}</p>
                          </div>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${l.status === 'aktywne' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {l.status === 'aktywne' ? 'Aktywne' : 'Szkic'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── LIST ── */}
          {!loading && view === 'list' && (() => {
            const now = Date.now();
            const DAY = 86400000;
            function daysAgo(ts) { return ts ? Math.floor((now - ts) / DAY) : null; }

            let filtered = [...listings];
            if (daysFilter > 0) filtered = filtered.filter(l => l.createdAt && daysAgo(l.createdAt) <= daysFilter);
            filtered.sort((a, b) => {
              const ta = a.createdAt || 0;
              const tb = b.createdAt || 0;
              return sortOrder === 'newest' ? tb - ta : ta - tb;
            });

            return (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                  <p className="font-black text-[#12192b]">Lista ogłoszeń <span className="text-gray-400 font-normal text-sm">({filtered.length}/{listings.length})</span></p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <select value={sortOrder} onChange={e => setSortOrder(e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-600 font-semibold focus:outline-none focus:border-[#1a6fa8]">
                      <option value="newest">Najnowsze najpierw</option>
                      <option value="oldest">Najstarsze najpierw</option>
                    </select>
                    <select value={daysFilter} onChange={e => setDaysFilter(Number(e.target.value))}
                      className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-600 font-semibold focus:outline-none focus:border-[#1a6fa8]">
                      <option value={0}>Wszystkie daty</option>
                      <option value={7}>Ostatnie 7 dni</option>
                      <option value={14}>Ostatnie 14 dni</option>
                      <option value={30}>Ostatnie 30 dni</option>
                      <option value={90}>Ostatnie 90 dni</option>
                    </select>
                  </div>
                </div>
                {filtered.length === 0 ? (
                  <div className="p-12 text-center text-gray-400">
                    <p className="text-4xl mb-2">📭</p>
                    <p className="font-semibold">{daysFilter > 0 ? 'Brak ogłoszeń w tym okresie' : 'Brak ogłoszeń'}</p>
                    {!daysFilter && <button onClick={openNew} className="mt-4 text-[#1a6fa8] text-sm font-bold hover:underline">+ Dodaj pierwsze</button>}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-left">
                          {['Tytuł','Kategoria','Miasto','Dodano','Status','Akcje'].map(h => (
                            <th key={h} className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map(l => {
                          const days = daysAgo(l.createdAt);
                          return (
                            <tr key={l.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{l.icon || catMap[l.category]?.icon}</span>
                                  <span className="font-semibold text-[#12192b] truncate max-w-[180px]">{l.title}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-500">{catMap[l.category]?.label || '—'}</td>
                              <td className="px-4 py-3 text-gray-500">{l.city || '—'}</td>
                              <td className="px-4 py-3">
                                {days === null ? <span className="text-gray-300 text-xs">—</span>
                                  : days === 0 ? <span className="text-green-600 text-xs font-bold">Dziś</span>
                                  : days === 1 ? <span className="text-blue-500 text-xs font-semibold">Wczoraj</span>
                                  : <span className="text-gray-500 text-xs">{days} dni temu</span>}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${l.status === 'aktywne' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                  {l.status === 'aktywne' ? 'Aktywne' : 'Szkic'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2">
                                  <button onClick={() => openEdit(l.id)} className="text-xs border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors font-semibold">
                                    Edytuj
                                  </button>
                                  <button onClick={() => deleteListing(l.id)} className="text-xs border border-red-200 text-red-500 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── AKCEPTACJE ── */}
          {!loading && view === 'akceptacje' && (
            <div className="space-y-4">
              {pendingLoad && <p className="text-gray-400 text-sm text-center py-8">⏳ Ładowanie zgłoszeń…</p>}
              {!pendingLoad && pending.length === 0 && (
                <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                  <p className="text-4xl mb-3">📭</p>
                  <p className="font-bold text-[#12192b]">Brak nowych zgłoszeń</p>
                  <p className="text-gray-400 text-sm mt-1">Gdy ktoś wyśle ogłoszenie z aplikacji, pojawi się tutaj.</p>
                </div>
              )}
              {pending.map(item => {
                const cat = CATS.find(c => c.id === item.category);
                const coverImg = item.images?.[0] || item.image;
                return (
                  <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex gap-4 p-5">
                      {/* Thumbnail */}
                      <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
                        {coverImg
                          ? <img src={coverImg} alt="" className="w-full h-full object-cover" />
                          : <span className="text-3xl">{cat?.icon || '📋'}</span>}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#DBEAFE', color: '#1e40af' }}>{cat?.icon} {cat?.label || item.category}</span>
                          <span className="text-xs text-gray-400">{new Date(item.submittedAt).toLocaleDateString('pl-PL')}</span>
                        </div>
                        <p className="font-bold text-[#12192b] truncate">{item.title}</p>
                        <p className="text-sm text-gray-500">📍 {item.city}{item.postalCode ? ` ${item.postalCode}` : ''}{item.address ? `, ${item.address}` : ''}</p>
                        {item.price && <p className="text-sm font-semibold text-[#1a6fa8] mt-0.5">{item.price}</p>}
                        {item.name && <p className="text-xs text-gray-400 mt-1">Zgłosił: {item.name}{item.email ? ` · ${item.email}` : ''}{item.phone ? ` · ${item.phone}` : ''}</p>}
                      </div>
                    </div>
                    {/* Opis */}
                    {item.description && (
                      <div className="px-5 pb-3">
                        <p className="text-sm text-gray-600 line-clamp-3">{item.description}</p>
                      </div>
                    )}
                    {/* Wszystkie zdjęcia */}
                    {item.images?.length > 1 && (
                      <div className="px-5 pb-3 flex gap-2">
                        {item.images.slice(1).map((img, i) => (
                          <img key={i} src={img} alt="" className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
                        ))}
                      </div>
                    )}
                    {/* Akcje */}
                    <div className="px-5 pb-5 flex gap-3">
                      <button onClick={() => importPending(item)}
                        className="flex-1 bg-[#1a6fa8] text-white py-2.5 rounded-xl font-bold text-sm hover:bg-[#155d8f] transition-colors">
                        ✓ Importuj do oferty
                      </button>
                      <button onClick={() => rejectPending(item.id)}
                        className="px-4 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition-colors">
                        🗑️ Odrzuć
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── FORM ── */}
          {view === 'form' && (
            <div className="max-w-2xl space-y-4">

              {/* Category chips */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">⊞ Kategoria</p>
                <div className="flex flex-wrap gap-2">
                  {CATS.map(c => (
                    <button key={c.id} onClick={() => setForm(f => ({ ...f, category: c.id }))}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                        form.category === c.id
                          ? 'bg-[#1a6fa8] text-white border-[#1a6fa8]'
                          : 'border-gray-300 text-gray-600 hover:border-[#1a6fa8] hover:text-[#1a6fa8]'
                      }`}>
                      {c.icon} {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Basic info */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">≡ Podstawowe informacje</p>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">Tytuł ogłoszenia *</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="np. Domek na Mazurach — widok na jezioro Niegocin" className={inputCls} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-gray-500">Opis</label>
                    <button type="button"
                      onClick={() => setDescProposal(beautifyDescription(form.description))}
                      disabled={!form.description?.trim()}
                      className="text-xs font-bold text-[#1a6fa8] bg-[#1a6fa8]/10 hover:bg-[#1a6fa8]/20 px-3 py-1 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-default">
                      ✨ Popraw opis
                    </button>
                  </div>
                  <div className={descProposal !== null ? 'grid grid-cols-1 md:grid-cols-2 gap-3' : ''}>
                    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Klimatyczny opis miejsca lub wydarzenia..." rows={8} className={`${inputCls} resize-y`} />
                    {descProposal !== null && (
                      <div className="border-2 border-[#2E9E6E]/40 bg-[#2E9E6E]/5 rounded-xl p-3 flex flex-col">
                        <p className="text-[11px] font-bold text-[#2E9E6E] uppercase tracking-wider mb-2">✨ Proponowany opis</p>
                        <div className="text-sm text-gray-700 whitespace-pre-line flex-1 overflow-y-auto" style={{ maxHeight: 200 }}>
                          {descProposal || <span className="text-gray-400 italic">Brak zmian do zaproponowania</span>}
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button type="button"
                            onClick={() => { setForm(f => ({ ...f, description: descProposal })); setDescProposal(null); }}
                            className="flex-1 bg-[#2E9E6E] text-white text-xs font-bold py-2 rounded-lg hover:bg-[#247d57] transition-colors">
                            ✓ Zastosuj
                          </button>
                          <button type="button"
                            onClick={() => setDescProposal(null)}
                            className="flex-1 border border-gray-300 text-gray-500 text-xs font-bold py-2 rounded-lg hover:bg-gray-50 transition-colors">
                            ✕ Odrzuć
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">✨ porządkuje odstępy i interpunkcję, dzieli na akapity, a wyliczenia zamienia na listę punktowaną</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">Miasto *</label>
                    <input value={form.city}
                      onChange={e => { setForm(f => ({ ...f, city: e.target.value, lat: null, lng: null })); setGeoStatus(''); }}
                      placeholder="np. Kozłowo" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">Kod pocztowy</label>
                    <input value={form.postalCode || ''}
                      onChange={e => setForm(f => ({ ...f, postalCode: e.target.value }))}
                      placeholder="np. 11-500" maxLength={6} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">Adres</label>
                    <input value={form.address}
                      onChange={e => { setForm(f => ({ ...f, address: e.target.value, lat: null, lng: null })); setGeoStatus(''); }}
                      placeholder="np. Kownatki 19A" className={inputCls} />
                  </div>
                </div>

                {/* Geocoding */}
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={geocodeAddress}
                    disabled={geocoding || (!form.city && !form.address)}
                    className="flex items-center gap-2 bg-[#1a2232] border border-gray-600 hover:border-[#1a6fa8] text-gray-300 hover:text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                  >
                    {geocoding ? <span className="animate-spin">⏳</span> : '📍'}
                    {geocoding ? 'Szukam...' : 'Znajdź lokalizację na mapie'}
                  </button>
                  {geoStatus === 'ok' && form.lat && (
                    <span className="text-green-400 text-xs font-semibold flex items-center gap-1">
                      ✓ Znaleziono: {form.lat.toFixed(5)}, {form.lng.toFixed(5)}
                    </span>
                  )}
                  {geoStatus === 'err' && (
                    <span className="text-red-400 text-xs font-semibold">✗ Nie znaleziono — sprawdź miasto i adres</span>
                  )}
                  {!geoStatus && form.lat && (
                    <span className="text-gray-500 text-xs">📍 {form.lat.toFixed(5)}, {form.lng.toFixed(5)}</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">Cena (zł)</label>
                    <input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                      placeholder="np. od 299 zł / noc" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">Ocena (0–5)</label>
                    <input value={form.rating} onChange={e => setForm(f => ({ ...f, rating: e.target.value }))}
                      placeholder="np. 4.9" type="number" min="0" max="5" step="0.1" className={inputCls} />
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">≔ Cechy / udogodnienia</p>
                <div className="flex gap-2 mb-3">
                  <input value={featureInput} onChange={e => setFeatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); }}}
                    placeholder="np. Prywatna plaża i pomost" className={inputCls} />
                  <button onClick={addFeature}
                    className="bg-[#1a6fa8] text-white w-11 rounded-xl flex-shrink-0 flex items-center justify-center hover:bg-[#155d8f] transition-colors text-xl font-bold">
                    +
                  </button>
                </div>
                {form.features.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.features.map((feat, i) => (
                      <span key={i} className="bg-[#e8f4fd] text-[#1a6fa8] text-xs px-3 py-1.5 rounded-full font-semibold flex items-center gap-1">
                        {feat}
                        <button onClick={() => setForm(f => ({ ...f, features: f.features.filter((_, j) => j !== i) }))}
                          className="hover:text-red-500 ml-1 font-bold leading-none">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Hashtags */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3"># Hashtagi</p>
                <input value={hashInput} onChange={e => setHashInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); addHash(); }}}
                  placeholder="#domek #jezioro..." className={inputCls} />
                <p className="text-xs text-gray-500 mt-1.5">Wpisz hashtag i naciśnij Enter lub spację</p>
                {form.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {form.hashtags.map((h, i) => (
                      <span key={i} className="bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-full font-semibold flex items-center gap-1">
                        #{h}
                        <button onClick={() => setForm(f => ({ ...f, hashtags: f.hashtags.filter((_, j) => j !== i) }))}
                          className="hover:text-red-500 ml-1 font-bold leading-none">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Contact info */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">📞 Dane kontaktowe (opcjonalne)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">Imię i nazwisko / Firma</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="np. Jan Kowalski" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">Email</label>
                    <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      type="email" placeholder="np. jan@example.com" className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">Telefon</label>
                    <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="np. +48 600 000 000" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">Strona / Social media</label>
                    <input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                      placeholder="np. facebook.com/..." className={inputCls} />
                  </div>
                </div>
              </div>

              {/* Icon / photo */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">🖼 Zdjęcia</p>
                <label className="block border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400 mb-4 cursor-pointer hover:border-[#1a6fa8] hover:text-[#1a6fa8] transition-colors">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={e => {
                      const files = Array.from(e.target.files);
                      files.forEach(file => {
                        if (file.size > 10 * 1024 * 1024) return;
                        const reader = new FileReader();
                        reader.onload = ev => setForm(f => ({ ...f, images: [...(f.images || []), ev.target.result] }));
                        reader.readAsDataURL(file);
                      });
                      e.target.value = '';
                    }}
                  />
                  <p className="text-3xl mb-2">☁️</p>
                  <p className="text-sm font-semibold">Kliknij aby dodać zdjęcia lub przeciągnij pliki</p>
                  <p className="text-xs mt-1">JPG, PNG — maks. 10 MB każde</p>
                </label>
                {form.images?.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {form.images.map((src, i) => (
                      <div key={i} className="relative group">
                        <img src={src} alt="" className="w-full h-24 object-cover rounded-xl border border-gray-200" />
                        <button
                          onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}
                          className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold"
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs font-bold text-gray-500 mb-2">Ikona zastępcza (do podglądu):</p>
                <div className="grid grid-cols-6 gap-2">
                  {ICONS.map(icon => (
                    <button key={icon} onClick={() => setForm(f => ({ ...f, icon }))}
                      className={`py-2 rounded-xl text-xl border-2 transition-all ${
                        form.icon === icon ? 'border-[#1a6fa8] bg-[#e8f4fd]' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pb-6">
                <button onClick={() => { setView(editId ? 'list' : 'list'); setEditId(null); }}
                  className="flex-1 border-2 border-gray-300 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors text-sm">
                  Anuluj
                </button>
                <button onClick={() => save('szkic')}
                  className="flex-1 border-2 border-[#1a6fa8] text-[#1a6fa8] py-3 rounded-xl font-bold hover:bg-[#e8f4fd] transition-colors text-sm">
                  Zapisz jako szkic
                </button>
                <button onClick={() => save('aktywne')} disabled={!form.title || !form.category || !form.city}
                  className="flex-1 bg-[#1a6fa8] text-white py-3 rounded-xl font-bold hover:bg-[#155d8f] transition-colors text-sm disabled:opacity-50">
                  ✓ Opublikuj
                </button>
              </div>
            </div>
          )}

          {/* ── KONTAKTY ── */}
          {!loading && view === 'kontakty' && (() => {
            const q = contactSearch.toLowerCase();
            const allContacts = listings.filter(l =>
              l.email || l.phone || l.name || l.website
            );
            const filtered = allContacts.filter(l => {
              const matchSearch = !q ||
                l.title?.toLowerCase().includes(q) ||
                l.name?.toLowerCase().includes(q) ||
                l.email?.toLowerCase().includes(q) ||
                l.phone?.includes(q) ||
                l.city?.toLowerCase().includes(q);
              const matchCat = !contactCat || l.category === contactCat;
              return matchSearch && matchCat;
            });

            function exportCSV() {
              const header = ['Firma/Tytuł','Kategoria','Miasto','Kod pocztowy','Adres','Kontakt','Email','Telefon','Strona'];
              const rows = filtered.map(l => [
                l.title || '',
                catMap[l.category]?.label || l.category || '',
                l.city || '',
                l.postalCode || '',
                l.address || '',
                l.name || '',
                l.email || '',
                l.phone || '',
                l.website || '',
              ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
              const csv = [header.join(','), ...rows].join('\n');
              const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = 'kontakty-conamazurach.csv'; a.click();
              URL.revokeObjectURL(url);
            }

            function copyText(text) {
              navigator.clipboard.writeText(text).catch(() => {});
            }

            return (
              <div className="space-y-4">
                {/* Toolbar */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-wrap items-center gap-3">
                  <input
                    value={contactSearch} onChange={e => setContactSearch(e.target.value)}
                    placeholder="Szukaj po nazwie, email, telefonie, mieście…"
                    className="flex-1 min-w-[200px] border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#1a6fa8] focus:ring-2 focus:ring-[#1a6fa8]/20"
                  />
                  <select value={contactCat} onChange={e => setContactCat(e.target.value)}
                    className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-600 font-semibold focus:outline-none focus:border-[#1a6fa8]">
                    <option value="">Wszystkie kategorie</option>
                    {CATS.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                  </select>
                  <button onClick={exportCSV}
                    className="flex items-center gap-2 bg-[#1a6fa8] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#155d8f] transition-colors">
                    ⬇️ Eksportuj CSV
                  </button>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 text-sm text-gray-500 px-1">
                  <span className="font-semibold text-[#12192b]">{filtered.length}</span> kontaktów
                  {(contactSearch || contactCat) && <span>· z {allContacts.length} łącznie</span>}
                  {allContacts.length < listings.length && (
                    <span className="text-gray-400">· {listings.length - allContacts.length} ogłoszeń bez danych kontaktowych</span>
                  )}
                </div>

                {filtered.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                    <p className="text-4xl mb-3">📭</p>
                    <p className="font-bold text-[#12192b]">{contactSearch || contactCat ? 'Brak wyników' : 'Brak kontaktów'}</p>
                    <p className="text-gray-400 text-sm mt-1">
                      {contactSearch || contactCat
                        ? 'Spróbuj zmienić filtry'
                        : 'Dodaj dane kontaktowe w formularzach ogłoszeń lub zaakceptuj zgłoszenia z aplikacji.'}
                    </p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 text-left">
                            {['Firma / Ogłoszenie','Kategoria','Lokalizacja','Kontakt','Email','Telefon','Strona'].map(h => (
                              <th key={h} className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map(l => (
                            <tr key={l.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-base">{l.icon || catMap[l.category]?.icon}</span>
                                  <div>
                                    <p className="font-semibold text-[#12192b] truncate max-w-[160px]">{l.title}</p>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${l.status === 'aktywne' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                      {l.status === 'aktywne' ? 'Aktywne' : 'Szkic'}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{catMap[l.category]?.label || '—'}</td>
                              <td className="px-4 py-3">
                                <p className="text-gray-700 text-xs font-semibold">{l.city || '—'}</p>
                                {l.postalCode && <p className="text-gray-400 text-xs">{l.postalCode}</p>}
                                {l.address && <p className="text-gray-400 text-xs truncate max-w-[120px]">{l.address}</p>}
                              </td>
                              <td className="px-4 py-3 text-gray-600 text-xs max-w-[120px] truncate">{l.name || <span className="text-gray-300">—</span>}</td>
                              <td className="px-4 py-3">
                                {l.email ? (
                                  <div className="flex items-center gap-1">
                                    <a href={`mailto:${l.email}`} className="text-[#1a6fa8] hover:underline text-xs truncate max-w-[150px]">{l.email}</a>
                                    <button onClick={() => copyText(l.email)} title="Kopiuj" className="text-gray-300 hover:text-[#1a6fa8] transition-colors flex-shrink-0">
                                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                                    </button>
                                  </div>
                                ) : <span className="text-gray-300 text-xs">—</span>}
                              </td>
                              <td className="px-4 py-3">
                                {l.phone ? (
                                  <div className="flex items-center gap-1">
                                    <a href={`tel:${l.phone.replace(/\s/g, '')}`} className="text-[#1a6fa8] hover:underline text-xs whitespace-nowrap">{l.phone}</a>
                                    <button onClick={() => copyText(l.phone)} title="Kopiuj" className="text-gray-300 hover:text-[#1a6fa8] transition-colors flex-shrink-0">
                                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                                    </button>
                                  </div>
                                ) : <span className="text-gray-300 text-xs">—</span>}
                              </td>
                              <td className="px-4 py-3">
                                {l.website ? (
                                  <a href={l.website.startsWith('http') ? l.website : `https://${l.website}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="text-[#1a6fa8] hover:underline text-xs truncate max-w-[130px] block">
                                    {l.website.replace(/^https?:\/\//, '')}
                                  </a>
                                ) : <span className="text-gray-300 text-xs">—</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── SETTINGS ── */}
          {view === 'settings' && (
            <div className="max-w-lg space-y-5">
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Informacje o panelu</p>
                <div className="bg-[#e8f4fd] rounded-xl p-4">
                  <p className="text-sm font-semibold text-[#12192b]">Adres panelu:</p>
                  <p className="text-[#1a6fa8] font-mono text-sm mt-1">conamazurach.pl/paneladmina</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Zmień hasło do panelu</p>
                <p className="text-xs text-gray-400">Hasło jest zapisywane lokalnie w przeglądarce.</p>
                <input value={newPass} onChange={e => setNewPass(e.target.value)}
                  type="password" placeholder="Nowe hasło..."
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a6fa8] focus:ring-2 focus:ring-[#1a6fa8]/20" />
                <button onClick={savePass} disabled={!newPass.trim()}
                  className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all ${passSaved ? 'bg-green-500 text-white' : 'bg-[#1a6fa8] text-white hover:bg-[#155d8f] disabled:opacity-50'}`}>
                  {passSaved ? '✓ Zapisano!' : 'Zapisz hasło'}
                </button>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Ogłoszenia</p>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-2xl font-black text-[#1a6fa8]">{listings.filter(l => l.status === 'aktywne').length}</p>
                    <p className="text-xs text-gray-500">aktywne</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-2xl font-black text-gray-400">{listings.filter(l => l.status === 'szkic').length}</p>
                    <p className="text-xs text-gray-500">szkice</p>
                  </div>
                </div>
                {listings.length > 0 && (
                  <button onClick={() => { if (window.confirm('Usunąć WSZYSTKIE ogłoszenia?')) { setListings([]); } }}
                    className="mt-4 w-full border border-red-200 text-red-500 py-2 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors">
                    🗑️ Usuń wszystkie ogłoszenia
                  </button>
                )}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
