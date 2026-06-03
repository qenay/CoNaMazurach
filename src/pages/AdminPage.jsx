import { useState, useEffect } from 'react';

const CATS = [
  { id: 'wydarzenia',  label: 'Wydarzenie',  icon: '🎉' },
  { id: 'noclegi',     label: 'Nocleg',       icon: '🏡' },
  { id: 'restauracje', label: 'Restauracja',  icon: '🍽️' },
  { id: 'kempingi',    label: 'Kemping',      icon: '⛺' },
  { id: 'koncerty',    label: 'Koncert',       icon: '🎸' },
  { id: 'atrakcje',    label: 'Atrakcja',     icon: '🎯' },
];

const ICONS      = ['🏡', '⛺', '🎸', '🎉', '🍽️', '🌊', '🏄', '🎪', '🏕️', '🚣', '🎯', '🎭'];
const PASS_KEY   = 'cnm_admin_pass';
const SESSION_KEY = 'cnm_admin_session';
const DEFAULT_PASS = 'admin';

const emptyForm = {
  category: '', title: '', description: '', city: '', address: '',
  price: '', rating: '', features: [], hashtags: [], images: [], icon: '🎉', status: 'aktywne',
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
    address:     l.address || '',
    price:       l.priceLabel || l.price?.toString() || '',
    rating:      l.rating?.toString() || '',
    features:    l.features || [],
    hashtags:    l.tags || l.hashtags || [],
    images:      l.image ? [l.image] : (l.images || []),
    icon:        l.icon || CATS.find(c => c.id === l.category)?.icon || '🎉',
    status:      l.status || 'aktywne',
  };
}

function buildListing(form, existing) {
  return {
    ...existing,
    id:          existing?.id || Date.now(),
    title:       form.title,
    category:    form.category,
    city:        form.city,
    address:     form.address,
    description: form.description,
    priceLabel:  form.price,
    price:       parseFloat(form.price) ?? (existing?.price ?? 0),
    rating:      parseFloat(form.rating) || (existing?.rating ?? 0),
    tags:        form.hashtags,
    features:    form.features,
    icon:        form.icon,
    status:      form.status,
    image:       form.images?.[0] || existing?.image || '',
  };
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
  const [editId,       setEditId]      = useState(null);
  const [form,         setForm]        = useState(emptyForm);
  const [featureInput, setFeatInput]   = useState('');
  const [hashInput,    setHashInput]   = useState('');
  const [sidebarOpen,  setSidebar]     = useState(false);
  const [newPass,      setNewPass]     = useState('');
  const [passSaved,    setPassSaved]   = useState(false);

  useEffect(() => {
    fetch('/listings.json?t=' + Date.now())
      .then(r => r.json())
      .then(data => { setListings(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
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
    { id: 'dashboard', label: 'Pulpit',         icon: '📊' },
    { id: 'list',      label: 'Lista ogłoszeń', icon: '📋' },
    { id: 'form_new',  label: 'Dodaj ogłoszenie', icon: '➕' },
    { id: 'settings',  label: 'Ustawienia',     icon: '⚙️' },
  ];

  function navClick(id) {
    if (id === 'form_new') openNew();
    else { setView(id); setSidebar(false); }
  }

  const activeNav = view === 'form' ? 'form_new' : view;

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
            <h2 className="font-black text-[#12192b] text-lg">
              {view === 'dashboard' && 'Pulpit'}
              {view === 'list'      && 'Lista ogłoszeń'}
              {view === 'form'      && (editId ? 'Edytuj ogłoszenie' : 'Dodaj ogłoszenie')}
              {view === 'settings'  && 'Ustawienia'}
            </h2>
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
          {!loading && view === 'list' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <p className="font-black text-[#12192b]">Lista ogłoszeń</p>
                <span className="text-xs text-gray-400">{listings.length} ogłoszeń</span>
              </div>
              {listings.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <p className="text-4xl mb-2">📭</p>
                  <p className="font-semibold">Brak ogłoszeń</p>
                  <button onClick={openNew} className="mt-4 text-[#1a6fa8] text-sm font-bold hover:underline">+ Dodaj pierwsze</button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        {['Tytuł','Kategoria','Miasto','Status','Akcje'].map(h => (
                          <th key={h} className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {listings.map(l => (
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
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">Opis</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Klimatyczny opis miejsca lub wydarzenia..." rows={4} className={`${inputCls} resize-none`} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">Miasto *</label>
                    <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                      placeholder="np. Giżycko" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">Adres</label>
                    <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                      placeholder="np. ul. Wodna 12" className={inputCls} />
                  </div>
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
