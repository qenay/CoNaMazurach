import { useState, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CATEGORIES } from '../data/mockListings';
import DatePickerInput from '../components/ui/DatePickerInput';

const API = 'https://www.conamazurach.pl';

const step1Schema = z.object({
  title:      z.string().min(1, 'Wpisz tytuł ogłoszenia'),
  category:   z.string().min(1, 'Wybierz kategorię'),
  city:       z.string().min(2, 'Wpisz nazwę miasta'),
  postalCode: z.string().optional(),
  address:    z.string().min(5, 'Podaj adres'),
  dateStart:  z.string().optional(),
  dateEnd:    z.string().optional(),
  time:       z.string().optional(),
});

const step2Schema = z.object({
  description: z.string().min(50, 'Opis musi mieć minimum 50 znaków'),
  free:        z.boolean().optional(),
  price:       z.string().optional(),
  website:     z.string().optional().or(z.literal('')),
  senderEmail: z.string().email('Nieprawidłowy email').optional().or(z.literal('')),
});

const STEPS = ['Podstawowe informacje', 'Szczegóły i kontakt', 'Podgląd i publikacja'];

/* Kompresja zdjęcia do base64 (JPEG).
   Przycina do proporcji 4:3 (centralny kadr) — format, w jakim oferta wyświetla zdjęcia */
function compressImage(file, maxW = 800) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const RATIO = 4 / 3;
        let sw = img.width, sh = img.height, sx = 0, sy = 0;
        if (sw / sh > RATIO) { sw = Math.round(sh * RATIO); sx = Math.round((img.width - sw) / 2); }
        else { sh = Math.round(sw / RATIO); sy = Math.round((img.height - sh) / 2); }
        const w = Math.min(maxW, sw);
        const h = Math.round(w / RATIO);
        const c = document.createElement('canvas');
        c.width  = w;
        c.height = h;
        c.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
        let dataUrl = c.toDataURL('image/jpeg', 0.7);
        if (dataUrl.length > 110000) dataUrl = c.toDataURL('image/jpeg', 0.5);
        resolve(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/* Cena: "1500 - 2000" → "1500 - 2000 zł" */
function formatPrice(d2) {
  if (d2.free) return 'Bezpłatne';
  const p = (d2.price || '').trim();
  if (!p) return '';
  return /zł/i.test(p) ? p : `${p} zł`;
}

/* ── Premium design system (scoped styles) ─────────────────────────────── */
const PF_CSS = `
  .pf-page { background: #F8F8F6; min-height: 100vh; font-family: 'Inter', sans-serif; }
  .pf-wrap { max-width: 760px; margin: 0 auto; padding: 56px 24px 80px; }
  .pf-title { font-size: 42px; font-weight: 700; color: #1B1D22; letter-spacing: -0.02em; margin: 0; line-height: 1.15; }
  .pf-sub { color: #7A7F87; font-size: 17px; margin: 16px 0 0; line-height: 1.55; }

  .pf-card { background: #fff; border: 1px solid #ECECEC; border-radius: 20px;
             box-shadow: 0 8px 40px rgba(0,0,0,0.06); padding: 40px; }
  @media (max-width: 768px) { .pf-card { padding: 28px; } .pf-title { font-size: 34px; } }
  @media (max-width: 480px) { .pf-card { padding: 20px; } .pf-title { font-size: 30px; } }

  /* Stepper */
  .pf-stepper { display: flex; align-items: flex-start; margin: 40px 0 32px; }
  .pf-step-item { display: flex; flex-direction: column; align-items: center; gap: 8px; min-width: 0; }
  .pf-step-dot { width: 40px; height: 40px; border-radius: 999px; display: flex; align-items: center;
                 justify-content: center; font-size: 15px; font-weight: 600; flex-shrink: 0;
                 transition: all 0.25s ease; }
  .pf-step-dot.active   { background: #234E92; color: #fff; box-shadow: 0 0 0 6px rgba(35,78,146,0.10); }
  .pf-step-dot.done     { background: #E3EBF7; color: #234E92; }
  .pf-step-dot.inactive { background: #EFEFED; color: #A2A8B0; }
  .pf-step-label { font-size: 13px; font-weight: 600; text-align: center; line-height: 1.3; transition: color 0.25s; }
  .pf-step-label.active   { color: #1B1D22; }
  .pf-step-label.done     { color: #234E92; }
  .pf-step-label.inactive { color: #A2A8B0; }
  .pf-step-line { flex: 1; height: 2px; margin-top: 19px; border-radius: 2px; transition: background 0.3s; }
  .pf-step-line.done { background: #234E92; }
  .pf-step-line.todo { background: #ECECEC; }
  @media (max-width: 560px) { .pf-step-label { font-size: 11px; } .pf-step-dot { width: 34px; height: 34px; } .pf-step-line { margin-top: 16px; } }

  /* Fields */
  .pf-label { display: block; font-size: 15px; font-weight: 600; color: #1B1D22; margin-bottom: 10px; }
  .pf-req { color: #E5484D; margin-left: 2px; }
  .pf-input, .pf-select, .pf-textarea {
    width: 100%; height: 56px; border-radius: 14px; border: 1px solid #E7E8EB;
    padding: 0 18px; font-size: 16px; color: #1B1D22; background: #fff;
    font-family: 'Inter', sans-serif; outline: none; box-sizing: border-box;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    -webkit-appearance: none; appearance: none;
  }
  .pf-textarea { height: auto; padding: 16px 18px; resize: none; line-height: 1.6; }
  .pf-input::placeholder, .pf-textarea::placeholder { color: #A2A8B0; }
  .pf-input:focus, .pf-select:focus, .pf-textarea:focus {
    border-color: #234E92; box-shadow: 0 0 0 4px rgba(35,78,146,0.12);
  }
  .pf-select { background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%237A7F87' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
               background-repeat: no-repeat; background-position: right 18px center; padding-right: 44px; cursor: pointer; }
  .pf-error { color: #E5484D; font-size: 13px; margin: 8px 0 0; font-weight: 500; }
  .pf-hint  { color: #A2A8B0; font-size: 13px; margin: 8px 0 0; }
  .pf-gap { margin-bottom: 24px; }

  /* Section heading inside card */
  .pf-section-h { font-size: 18px; font-weight: 700; color: #1B1D22; margin: 0 0 20px; letter-spacing: -0.01em; }
  .pf-divider { height: 1px; background: #ECECEC; margin: 32px 0; border: none; }

  /* Buttons */
  .pf-btn-primary {
    height: 56px; border-radius: 14px; background: #234E92; color: #fff; border: none;
    font-size: 16px; font-weight: 600; font-family: 'Inter', sans-serif; cursor: pointer;
    width: 100%; transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
    box-shadow: 0 10px 30px rgba(35,78,146,0.20);
    display: flex; align-items: center; justify-content: center; gap: 8px; text-decoration: none;
  }
  .pf-btn-primary:hover { background: #1E437F; transform: translateY(-1px); }
  .pf-btn-primary:active { transform: translateY(0); }
  .pf-btn-secondary {
    height: 56px; border-radius: 14px; background: #fff; color: #1B1D22;
    border: 1px solid #E7E8EB; font-size: 16px; font-weight: 600; font-family: 'Inter', sans-serif;
    cursor: pointer; width: 100%; transition: background 0.2s ease, border-color 0.2s ease;
    display: flex; align-items: center; justify-content: center; gap: 8px; text-decoration: none;
  }
  .pf-btn-secondary:hover { background: #FAFAFA; border-color: #D8DADF; }

  /* Checkbox */
  .pf-check { display: flex; align-items: center; gap: 12px; cursor: pointer; user-select: none; }
  .pf-check input { width: 20px; height: 20px; accent-color: #234E92; cursor: pointer; }
  .pf-check span { font-size: 15px; font-weight: 600; color: #1B1D22; }

  /* Upload */
  .pf-upload {
    border: 1.5px dashed #D8DADF; border-radius: 14px; padding: 32px 20px; text-align: center;
    cursor: pointer; transition: border-color 0.2s ease, background 0.2s ease; background: #FCFCFB;
  }
  .pf-upload:hover, .pf-upload.drag { border-color: #234E92; background: rgba(35,78,146,0.03); }
  .pf-upload-icon { font-size: 28px; margin-bottom: 8px; }
  .pf-upload-text { font-size: 15px; font-weight: 600; color: #1B1D22; margin: 0; }
  .pf-upload-hint { font-size: 13px; color: #A2A8B0; margin: 6px 0 0; }
  .pf-thumbs { display: flex; gap: 12px; margin-top: 16px; flex-wrap: wrap; }
  .pf-thumb { width: 88px; height: 88px; border-radius: 12px; object-fit: cover; border: 1px solid #ECECEC; }
  .pf-thumb-box { position: relative; }
  .pf-thumb-x { position: absolute; top: -8px; right: -8px; width: 24px; height: 24px; border-radius: 999px;
                background: #1B1D22; color: #fff; border: 2px solid #fff; font-size: 12px; cursor: pointer;
                display: flex; align-items: center; justify-content: center; line-height: 1; }
  .pf-thumb-badge { position: absolute; bottom: 4px; left: 4px; right: 4px; text-align: center;
                    font-size: 10px; font-weight: 600; color: #fff; background: rgba(35,78,146,0.85);
                    border-radius: 8px; padding: 2px 0; }

  /* Tag input */
  .pf-tagrow { display: flex; gap: 10px; }
  .pf-tag-add { width: 56px; height: 56px; border-radius: 14px; border: none; color: #fff;
                font-size: 22px; font-weight: 600; cursor: pointer; flex-shrink: 0;
                display: flex; align-items: center; justify-content: center;
                transition: filter 0.2s ease, transform 0.2s ease; }
  .pf-tag-add:hover { filter: brightness(1.12); transform: translateY(-1px); }
  .pf-tag-add:disabled { opacity: 0.4; cursor: default; transform: none; filter: none; }
  .pf-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
  .pf-chip { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px;
             border-radius: 999px; font-size: 13px; font-weight: 600; }
  .pf-chip button { background: none; border: none; cursor: pointer; font-size: 14px;
                    line-height: 1; padding: 0; color: inherit; opacity: 0.7; }
  .pf-chip button:hover { opacity: 1; }
  .pf-chip.blue  { background: #E3EBF7; color: #234E92; }
  .pf-chip.green { background: #E2F3EA; color: #1F7A4D; }

  /* Review */
  .pf-review-section { background: #fff; border: 1px solid #ECECEC; border-radius: 16px; padding: 24px; margin-bottom: 16px; }
  .pf-review-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .pf-review-title { font-size: 16px; font-weight: 700; color: #1B1D22; margin: 0; }
  .pf-edit-btn { background: none; border: none; color: #234E92; font-size: 14px; font-weight: 600;
                 cursor: pointer; font-family: 'Inter', sans-serif; padding: 6px 10px; border-radius: 8px;
                 transition: background 0.2s; }
  .pf-edit-btn:hover { background: rgba(35,78,146,0.06); }
  .pf-review-row { display: flex; gap: 16px; padding: 10px 0; border-bottom: 1px solid #F4F4F2; }
  .pf-review-row:last-child { border-bottom: none; }
  .pf-review-key { font-size: 14px; color: #7A7F87; width: 140px; flex-shrink: 0; font-weight: 500; }
  .pf-review-val { font-size: 14px; color: #1B1D22; font-weight: 500; word-break: break-word; line-height: 1.5; }

  /* Step transition */
  .pf-step-content { animation: pfFadeUp 0.3s ease; }
  @keyframes pfFadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

  /* Result */
  .pf-success { background: #F0F7F2; border: 1px solid rgba(46,158,110,0.25); border-radius: 16px;
                padding: 24px; display: flex; gap: 16px; align-items: flex-start; margin-bottom: 24px; }

  /* ── Dark mode ───────────────────────────────────────────────────────── */
  .dark .pf-page { background: #0f172a; }
  .dark .pf-title { color: #f1f5f9; }
  .dark .pf-sub { color: #94a3b8; }
  .dark .pf-card { background: #1e293b; border-color: #334155; box-shadow: 0 8px 40px rgba(0,0,0,0.4); }
  .dark .pf-section-h { color: #f1f5f9; }
  .dark .pf-divider { background: #334155; }
  .dark .pf-label { color: #e2e8f0; }
  .dark .pf-input, .dark .pf-select, .dark .pf-textarea {
    background: #0f172a; border-color: #334155; color: #f1f5f9;
  }
  .dark .pf-input::placeholder, .dark .pf-textarea::placeholder { color: #64748b; }
  .dark .pf-input:focus, .dark .pf-select:focus, .dark .pf-textarea:focus {
    border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59,130,246,0.18);
  }
  .dark .pf-hint { color: #64748b; }
  .dark .pf-step-dot.inactive { background: #1e293b; color: #64748b; }
  .dark .pf-step-dot.done { background: rgba(59,130,246,0.18); color: #93c5fd; }
  .dark .pf-step-label.active { color: #f1f5f9; }
  .dark .pf-step-label.inactive { color: #64748b; }
  .dark .pf-step-label.done { color: #93c5fd; }
  .dark .pf-step-line.todo { background: #334155; }
  .dark .pf-btn-secondary { background: #1e293b; color: #e2e8f0; border-color: #334155; }
  .dark .pf-btn-secondary:hover { background: #283548; border-color: #475569; }
  .dark .pf-check span { color: #e2e8f0; }
  .dark .pf-upload { background: #0f172a; border-color: #334155; }
  .dark .pf-upload:hover, .dark .pf-upload.drag { border-color: #3b82f6; background: rgba(59,130,246,0.06); }
  .dark .pf-upload-text { color: #e2e8f0; }
  .dark .pf-upload-hint { color: #64748b; }
  .dark .pf-thumb { border-color: #334155; }
  .dark .pf-chip.blue  { background: rgba(59,130,246,0.18); color: #93c5fd; }
  .dark .pf-chip.green { background: rgba(46,158,110,0.18); color: #6ee7b7; }
  .dark .pf-review-section { background: #1e293b; border-color: #334155; }
  .dark .pf-review-title { color: #f1f5f9; }
  .dark .pf-review-row { border-bottom-color: #283548; }
  .dark .pf-review-key { color: #94a3b8; }
  .dark .pf-review-val { color: #e2e8f0; }
  .dark .pf-edit-btn { color: #93c5fd; }
  .dark .pf-edit-btn:hover { background: rgba(59,130,246,0.12); }
  .dark .pf-success { background: rgba(46,158,110,0.10); border-color: rgba(46,158,110,0.3); }
  .dark .pf-success p:first-child { color: #f1f5f9 !important; }
`;

/* ── Components ─────────────────────────────────────────────────────────── */

function Stepper({ step }) {
  return (
    <div className="pf-stepper">
      {STEPS.map((s, i) => {
        const state = i < step ? 'done' : i === step ? 'active' : 'inactive';
        return (
          <div key={i} style={{ display: 'contents' }}>
            <div className="pf-step-item" style={{ flex: '0 0 auto', width: 120 }}>
              <div className={`pf-step-dot ${state}`}>{i < step ? '✓' : i + 1}</div>
              <span className={`pf-step-label ${state}`}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`pf-step-line ${i < step ? 'done' : 'todo'}`} />}
          </div>
        );
      })}
    </div>
  );
}

function Field({ label, required, error, hint, children, className = 'pf-gap' }) {
  return (
    <div className={className}>
      <label className="pf-label">{label}{required && <span className="pf-req">*</span>}</label>
      {children}
      {hint && !error && <p className="pf-hint">{hint}</p>}
      {error && <p className="pf-error">{error}</p>}
    </div>
  );
}

function TagInput({ icon, label, max, placeholder, items, setItems, color, btnColor }) {
  const [val, setVal] = useState('');

  function add() {
    const v = val.trim().replace(/^#/, '');
    if (!v || items.includes(v) || items.length >= max) return;
    setItems([...items, v]);
    setVal('');
  }

  return (
    <div className="pf-gap">
      <label className="pf-label">
        {icon} {label}{' '}
        <span style={{ color: '#A2A8B0', fontWeight: 500, fontSize: 13 }}>({items.length}/{max} — {placeholder})</span>
      </label>
      <div className="pf-tagrow">
        <input
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={`np. ${placeholder.split(',')[0].replace('np. ', '')}`}
          className="pf-input"
          disabled={items.length >= max}
        />
        <button type="button" className="pf-tag-add" style={{ background: btnColor }}
                onClick={add} disabled={items.length >= max || !val.trim()}>+</button>
      </div>
      {items.length > 0 && (
        <div className="pf-chips">
          {items.map((t, i) => (
            <span key={i} className={`pf-chip ${color}`}>
              {t}
              <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const MAX_PHOTOS = 15;

function PhotoUploader({ photos, setPhotos }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);

  async function addFiles(files) {
    setBusy(true);
    const imgs = Array.from(files).filter(f => f.type.startsWith('image/'));
    const room = MAX_PHOTOS - photos.length;
    const compressed = await Promise.all(imgs.slice(0, room).map(f => compressImage(f)));
    setPhotos(prev => [...prev, ...compressed].slice(0, MAX_PHOTOS));
    setBusy(false);
  }

  return (
    <div>
      <div
        className={`pf-upload ${drag ? 'drag' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
      >
        <div className="pf-upload-icon">🖼️</div>
        <p className="pf-upload-text">{busy ? 'Przetwarzanie zdjęć...' : 'Przeciągnij zdjęcia lub kliknij, aby wybrać'}</p>
        <p className="pf-upload-hint">Maksymalnie {MAX_PHOTOS} zdjęć · JPG lub PNG · pierwsze będzie okładką ({photos.length}/{MAX_PHOTOS})</p>
        <input ref={inputRef} type="file" accept="image/*" multiple hidden
               onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
      </div>
      {photos.length > 0 && (
        <div className="pf-thumbs">
          {photos.map((p, i) => (
            <div key={i} className="pf-thumb-box">
              <img src={p} alt={`Zdjęcie ${i + 1}`} className="pf-thumb" />
              {i === 0 && <span className="pf-thumb-badge">Okładka</span>}
              <button type="button" className="pf-thumb-x"
                      onClick={() => setPhotos(photos.filter((_, j) => j !== i))}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewRow({ k, v }) {
  if (!v) return null;
  return (
    <div className="pf-review-row">
      <span className="pf-review-key">{k}</span>
      <span className="pf-review-val">{v}</span>
    </div>
  );
}

function SuccessPanel({ onReset }) {
  return (
    <div className="pf-step-content">
      <div className="pf-success">
        <span style={{ fontSize: 28 }}>✅</span>
        <div>
          <p style={{ fontWeight: 700, color: '#1B1D22', fontSize: 17, margin: 0 }}>Zgłoszenie wysłane!</p>
          <p style={{ fontSize: 14, color: '#7A7F87', margin: '6px 0 0', lineHeight: 1.6 }}>
            Twoje ogłoszenie trafiło do panelu administratora. Po pozytywnej weryfikacji
            pojawi się na stronie i w aplikacji — zwykle w ciągu 24 godzin.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <a href="/" className="pf-btn-secondary">← Strona główna</a>
        <button onClick={onReset} className="pf-btn-primary">+ Dodaj kolejne ogłoszenie</button>
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function AddListingPage() {
  const [step,   setStep]   = useState(0);
  const [data1,  setData1]  = useState({});
  const [data2,  setData2]  = useState({});
  const [photos,   setPhotos]   = useState([]);
  const [hashtags, setHashtags] = useState([]);
  const [features, setFeatures] = useState([]);
  const [isFree, setIsFree]   = useState(false);
  const [done,   setDone]     = useState(false);
  const [sending, setSending] = useState(false);
  const [sendErr, setSendErr] = useState('');

  const form1 = useForm({ resolver: zodResolver(step1Schema), defaultValues: data1 });
  const form2 = useForm({ resolver: zodResolver(step2Schema), defaultValues: data2 });

  const selectedCategory = form1.watch('category');
  const showDates = ['wydarzenia', 'koncerty', 'atrakcje'].includes(selectedCategory);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [step, done]);

  function onStep1(values) { setData1(values); setStep(1); }
  function onStep2(values) { setData2(values); setStep(2); }
  function goEdit(s) { setDone(false); setStep(s); }

  function resetAll() {
    setDone(false); setStep(0); setData1({}); setData2({}); setPhotos([]);
    setHashtags([]); setFeatures([]); setIsFree(false); setSendErr('');
    form1.reset({}); form2.reset({});
  }

  async function publish() {
    setSending(true);
    setSendErr('');
    try {
      const payload = {
        title:       data1.title,
        category:    data1.category,
        city:        data1.city,
        postalCode:  data1.postalCode || '',
        address:     data1.address,
        date:        data1.dateStart || null,
        dateEnd:     data1.dateEnd || null,
        time:        data1.time || null,
        description: data2.description,
        price:       formatPrice(data2),
        priceLabel:  formatPrice(data2),
        website:     data2.website || '',
        email:       data2.senderEmail || '',
        name:        '',
        phone:       '',
        images:      photos,
        image:       photos[0] || '',
        tags:        hashtags,
        features:    features,
        status:      'pending',
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
      setSendErr(e.message || 'Nie udało się wysłać. Spróbuj ponownie.');
    }
    setSending(false);
  }

  const cat = CATEGORIES.find(c => c.id === data1.category);

  return (
    <div className="pf-page">
      <Helmet>
        <title>Dodaj ogłoszenie | Co na Mazurach?</title>
        <meta name="description" content="Zgłoś ogłoszenie na Co na Mazurach? — wydarzenie, nocleg, restaurację lub atrakcję. Weryfikacja przez redakcję." />
        <link rel="canonical" href="https://conamazurach.pl/dodaj" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Helmet>
      <style>{PF_CSS}</style>

      <div className="pf-wrap">
        <h1 className="pf-title">Dodaj ogłoszenie</h1>
        <p className="pf-sub">Wypełnij formularz — opublikujemy Twoje ogłoszenie po weryfikacji.</p>

        <Stepper step={step} />

        {/* ── Step 1 ── */}
        {step === 0 && (
          <form onSubmit={form1.handleSubmit(onStep1)} className="pf-card pf-step-content" noValidate>
            <h2 className="pf-section-h">Podstawowe informacje</h2>

            <Field label="Tytuł ogłoszenia" required error={form1.formState.errors.title?.message}>
              <input {...form1.register('title')} placeholder="np. Regaty na Śniardwach 2026" className="pf-input" />
            </Field>

            <Field label="Kategoria" required error={form1.formState.errors.category?.message}>
              <select {...form1.register('category')} className="pf-select" defaultValue="">
                <option value="" disabled>Wybierz kategorię...</option>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
              </select>
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
              <Field label="Miasto" required error={form1.formState.errors.city?.message}>
                <input {...form1.register('city')} placeholder="np. Giżycko" className="pf-input" />
              </Field>
              <Field label="Kod pocztowy">
                <input {...form1.register('postalCode')} placeholder="np. 11-500" className="pf-input" />
              </Field>
            </div>

            <Field label="Adres" required error={form1.formState.errors.address?.message}>
              <input {...form1.register('address')} placeholder="ul. Przykładowa 1" className="pf-input" />
            </Field>

            {showDates && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <Field label="Data rozpoczęcia">
                  <Controller name="dateStart" control={form1.control}
                    render={({ field }) => <DatePickerInput value={field.value || ''} onChange={field.onChange} placeholder="Wybierz datę" />} />
                </Field>
                <Field label="Data zakończenia">
                  <Controller name="dateEnd" control={form1.control}
                    render={({ field }) => <DatePickerInput value={field.value || ''} onChange={field.onChange} placeholder="Wybierz datę" />} />
                </Field>
                <Field label="Godzina">
                  <input {...form1.register('time')} type="time" className="pf-input" />
                </Field>
              </div>
            )}

            <button type="submit" className="pf-btn-primary">Dalej →</button>
          </form>
        )}

        {/* ── Step 2 ── */}
        {step === 1 && (
          <form onSubmit={form2.handleSubmit(onStep2)} className="pf-card pf-step-content" noValidate>
            <h2 className="pf-section-h">Szczegóły ogłoszenia</h2>

            <Field label="Opis" required error={form2.formState.errors.description?.message}
                   hint="Min. 50 znaków — opisz co, gdzie, kiedy i dla kogo">
              <textarea {...form2.register('description')} rows={6}
                        placeholder="Opisz swoje ogłoszenie szczegółowo..." className="pf-textarea" />
            </Field>

            <Field label="Zdjęcia" hint="Pierwsze zdjęcie będzie okładką ogłoszenia">
              <PhotoUploader photos={photos} setPhotos={setPhotos} />
            </Field>

            <div className="pf-gap">
              <label className="pf-check">
                <input type="checkbox" {...form2.register('free')} onChange={e => setIsFree(e.target.checked)} />
                <span>Wydarzenie bezpłatne</span>
              </label>
            </div>

            {!isFree && (
              <Field label="Cena" hint="Możesz podać zakres — „zł” dodamy automatycznie">
                <input {...form2.register('price')} type="text" placeholder="np. 1500 - 2000" className="pf-input" />
              </Field>
            )}

            <Field label="Strona internetowa" error={form2.formState.errors.website?.message}>
              <input {...form2.register('website')} placeholder="https://..." className="pf-input" />
            </Field>

            <TagInput icon="🏷️" label="Hashtagi" max={3} placeholder="np. jezioro, mazury, camping"
                      items={hashtags} setItems={setHashtags} color="blue" btnColor="#234E92" />

            <TagInput icon="✅" label="Udogodnienia" max={5} placeholder="np. prywatna plaża, basen, WiFi"
                      items={features} setItems={setFeatures} color="green" btnColor="#2E9E6E" />

            <Field label="Email kontaktowy" error={form2.formState.errors.senderEmail?.message}>
              <input {...form2.register('senderEmail')} placeholder="twoj@email.pl" className="pf-input" />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
              <button type="button" onClick={() => setStep(0)} className="pf-btn-secondary">← Wróć</button>
              <button type="submit" className="pf-btn-primary">Dalej →</button>
            </div>
          </form>
        )}

        {/* ── Step 3 — review ── */}
        {step === 2 && !done && (
          <div className="pf-step-content">
            <div className="pf-review-section">
              <div className="pf-review-head">
                <p className="pf-review-title">Podstawowe informacje</p>
                <button className="pf-edit-btn" onClick={() => goEdit(0)}>Edytuj</button>
              </div>
              <ReviewRow k="Tytuł"        v={data1.title} />
              <ReviewRow k="Kategoria"    v={cat ? `${cat.icon} ${cat.label}` : data1.category} />
              <ReviewRow k="Miasto"       v={data1.postalCode ? `${data1.city} (${data1.postalCode})` : data1.city} />
              <ReviewRow k="Adres"        v={data1.address} />
              <ReviewRow k="Data"         v={data1.dateStart ? `${data1.dateStart}${data1.dateEnd && data1.dateEnd !== data1.dateStart ? ` → ${data1.dateEnd}` : ''}` : null} />
              <ReviewRow k="Godzina"      v={data1.time} />
            </div>

            <div className="pf-review-section">
              <div className="pf-review-head">
                <p className="pf-review-title">Szczegóły</p>
                <button className="pf-edit-btn" onClick={() => goEdit(1)}>Edytuj</button>
              </div>
              <ReviewRow k="Opis"          v={data2.description} />
              <ReviewRow k="Cena"          v={formatPrice(data2) || 'Nie podano'} />
              <ReviewRow k="Strona"        v={data2.website} />
              <ReviewRow k="Hashtagi"      v={hashtags.length ? hashtags.map(h => `#${h}`).join('  ') : null} />
              <ReviewRow k="Udogodnienia"  v={features.length ? features.join(' · ') : null} />
              <ReviewRow k="Email"         v={data2.senderEmail} />
              <ReviewRow k="Zdjęcia"       v={photos.length > 0 ? `${photos.length} ${photos.length === 1 ? 'zdjęcie' : photos.length < 5 ? 'zdjęcia' : 'zdjęć'}` : null} />
            </div>

            {photos.length > 0 && (
              <div className="pf-review-section">
                <div className="pf-review-head">
                  <p className="pf-review-title">Zdjęcia</p>
                  <button className="pf-edit-btn" onClick={() => goEdit(1)}>Edytuj</button>
                </div>
                <div className="pf-thumbs" style={{ marginTop: 0 }}>
                  {photos.map((p, i) => (
                    <div key={i} className="pf-thumb-box">
                      <img src={p} alt={`Zdjęcie ${i + 1}`} className="pf-thumb" />
                      {i === 0 && <span className="pf-thumb-badge">Okładka</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sendErr && (
              <p className="pf-error" style={{ marginBottom: 16, textAlign: 'center' }}>⚠️ {sendErr}</p>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginTop: 24 }}>
              <button onClick={() => setStep(1)} disabled={sending} className="pf-btn-secondary">← Wróć</button>
              <button onClick={publish} disabled={sending} className="pf-btn-primary" style={sending ? { opacity: 0.7, cursor: 'wait' } : undefined}>
                {sending ? 'Wysyłanie...' : 'Opublikuj ogłoszenie'}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3 — result ── */}
        {step === 2 && done && <SuccessPanel onReset={resetAll} />}
      </div>
    </div>
  );
}
