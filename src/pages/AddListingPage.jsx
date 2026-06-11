import { useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CATEGORIES } from '../data/mockListings';
import DatePickerInput from '../components/ui/DatePickerInput';

const API = 'https://conamazurach.pl';

function compressImage(file, maxW = 900) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

const step1Schema = z.object({
  title:     z.string().min(10, 'Tytuł musi mieć minimum 10 znaków'),
  category:  z.string().min(1, 'Wybierz kategorię'),
  city:      z.string().min(2, 'Wpisz nazwę miasta'),
  address:   z.string().min(5, 'Podaj adres'),
  dateStart: z.string().optional(),
  dateEnd:   z.string().optional(),
  time:      z.string().optional(),
});

const step2Schema = z.object({
  description:   z.string().min(50, 'Opis musi mieć minimum 50 znaków'),
  free:          z.boolean().optional(),
  price:         z.string().optional(),
  website:       z.string().url('Nieprawidłowy URL').optional().or(z.literal('')),
  phone:         z.string().optional(),
  senderEmail:   z.string().email('Nieprawidłowy email').optional().or(z.literal('')),
  senderName:    z.string().min(2, 'Podaj imię i nazwisko'),
});

const STEPS = ['Podstawowe informacje', 'Szczegóły i kontakt', 'Gotowe — wyślij'];

function Field({ label, error, children, hint }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[#1C2B3A] mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

const inputCls = 'w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4F8A] focus:ring-2 focus:ring-[#1B4F8A]/20';


function SuccessPanel({ title }) {
  return (
    <div className="space-y-6 text-center">
      <div className="bg-gradient-to-br from-[#1B4F8A] to-[#2563EB] rounded-2xl p-8 text-white">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-xl font-black mb-2">Zgłoszenie wysłane!</h2>
        <p className="text-white/80 text-sm leading-relaxed">
          Twoje ogłoszenie <strong className="text-white">„{title}"</strong> trafiło do panelu admina.<br />
          Po weryfikacji pojawi się na portalu automatycznie.
        </p>
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl p-5 flex gap-3 text-left shadow-sm">
        <span className="text-2xl">✅</span>
        <p className="text-sm text-gray-600 leading-relaxed">
          <strong className="text-[#1C2B3A]">Co dalej?</strong><br />
          Administrator przejrzy Twoje zgłoszenie i opublikuje je na stronie i w aplikacji.
        </p>
      </div>
      <a href="/" className="block w-full bg-[#1B4F8A] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-[#163f70] transition-colors">
        Wróć na stronę główną
      </a>
    </div>
  );
}

export default function AddListingPage() {
  const [step,       setStep]       = useState(0);
  const [data1,      setData1]      = useState({});
  const [isFree,     setIsFree]     = useState(false);
  const [done,       setDone]       = useState(false);
  const [photos,     setPhotos]     = useState([]);
  const [sending,    setSending]    = useState(false);
  const [sendErr,    setSendErr]    = useState('');

  const form1 = useForm({ resolver: zodResolver(step1Schema) });
  const form2 = useForm({ resolver: zodResolver(step2Schema) });

  async function addPhoto(file) {
    if (photos.length >= 8) return;
    const compressed = await compressImage(file);
    setPhotos(p => [...p, compressed]);
  }

  function onStep1(values) { setData1(values); setStep(1); }

  async function onStep2(values) {
    setSending(true);
    setSendErr('');
    try {
      const payload = {
        title:       data1.title,
        category:    data1.category,
        city:        data1.city,
        address:     data1.address,
        date:        data1.dateStart || null,
        time:        data1.time || null,
        description: values.description,
        price:       values.free ? 0 : parseFloat(values.price) || 0,
        priceLabel:  values.free ? 'Bezpłatne' : values.price ? `${values.price} zł` : '',
        website:     values.website || '',
        phone:       values.phone || '',
        name:        values.senderName,
        email:       values.senderEmail || '',
        images:      photos,
        image:       photos[0] || '',
        tags:        [],
        status:      'pending',
      };
      const r = await fetch(`${API}/api/pending`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pending: payload }),
      });
      if (!r.ok) throw new Error(`Błąd serwera ${r.status}`);
      setDone(true);
      setStep(2);
    } catch (e) {
      setSendErr(e.message || 'Wystąpił błąd. Spróbuj ponownie.');
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Helmet>
        <title>Dodaj ogłoszenie | Co na Mazurach?</title>
        <meta name="description" content="Zgłoś ogłoszenie na Co na Mazurach? — wydarzenie, nocleg, restaurację lub atrakcję. Weryfikacja przez redakcję." />
        <link rel="canonical" href="https://conamazurach.pl/dodaj" />
      </Helmet>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-black text-[#1C2B3A] mb-1">Dodaj ogłoszenie</h1>
        <p className="text-gray-500 mb-8">Wypełnij formularz — my dodamy Twoje ogłoszenie po weryfikacji 🌊</p>

        {/* Stepper */}
        <div className="flex items-center mb-10">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center flex-1 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all ${
                  i < step ? 'bg-[#2E9E6E] text-white' : i === step ? 'bg-[#1B4F8A] text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-semibold truncate ${i === step ? 'text-[#1B4F8A]' : 'text-gray-400'}`}>{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-2 flex-shrink-0 ${i < step ? 'bg-[#2E9E6E]' : 'bg-gray-200'}`} style={{minWidth: '16px'}} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1 */}
        {step === 0 && (
          <form onSubmit={form1.handleSubmit(onStep1)} className="space-y-5 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <Field label="Tytuł ogłoszenia *" error={form1.formState.errors.title?.message}>
              <input {...form1.register('title')} placeholder="np. Regaty na Śniardwach 2026" className={inputCls} />
            </Field>
            <Field label="Kategoria *" error={form1.formState.errors.category?.message}>
              <select {...form1.register('category')} className={inputCls}>
                <option value="">Wybierz kategorię...</option>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Miasto *" error={form1.formState.errors.city?.message}>
                <input {...form1.register('city')} placeholder="np. Giżycko, Ryn..." className={inputCls} />
              </Field>
              <Field label="Adres *" error={form1.formState.errors.address?.message}>
                <input {...form1.register('address')} placeholder="ul. Przykładowa 1" className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Data rozpoczęcia">
                <Controller
                  name="dateStart"
                  control={form1.control}
                  render={({ field }) => (
                    <DatePickerInput value={field.value || ''} onChange={field.onChange} placeholder="Wybierz datę" />
                  )}
                />
              </Field>
              <Field label="Data zakończenia">
                <Controller
                  name="dateEnd"
                  control={form1.control}
                  render={({ field }) => (
                    <DatePickerInput value={field.value || ''} onChange={field.onChange} placeholder="Wybierz datę" />
                  )}
                />
              </Field>
              <Field label="Godzina">
                <input {...form1.register('time')} type="time" className={inputCls} />
              </Field>
            </div>
            <button type="submit" className="w-full bg-[#1B4F8A] text-white py-3 rounded-xl font-bold hover:bg-[#163f70] transition-colors">
              Dalej →
            </button>
          </form>
        )}

        {/* Step 2 */}
        {step === 1 && (
          <form onSubmit={form2.handleSubmit(onStep2)} className="space-y-5 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <Field label="Opis *" error={form2.formState.errors.description?.message}
              hint="Min. 50 znaków — opisz co, gdzie, kiedy i dla kogo">
              <textarea
                {...form2.register('description')}
                rows={6}
                placeholder="Opisz swoje ogłoszenie szczegółowo..."
                className={`${inputCls} resize-none`}
              />
            </Field>

            <div className="flex items-center gap-3">
              <input type="checkbox" id="free" {...form2.register('free')}
                onChange={e => setIsFree(e.target.checked)}
                className="w-4 h-4 accent-[#1B4F8A]" />
              <label htmlFor="free" className="text-sm font-semibold text-[#1C2B3A]">Wydarzenie bezpłatne</label>
            </div>

            {!isFree && (
              <Field label="Cena (zł)">
                <input {...form2.register('price')} type="number" placeholder="np. 99" className={inputCls} />
              </Field>
            )}

            <Field label="Strona internetowa" error={form2.formState.errors.website?.message}>
              <input {...form2.register('website')} placeholder="https://..." className={inputCls} />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Telefon kontaktowy">
                <input {...form2.register('phone')} placeholder="+48 123 456 789" className={inputCls} />
              </Field>
              <Field label="Twój email" error={form2.formState.errors.senderEmail?.message}>
                <input {...form2.register('senderEmail')} placeholder="twoj@email.pl" className={inputCls} />
              </Field>
            </div>

            <Field label="Twoje imię i nazwisko *" error={form2.formState.errors.senderName?.message}
              hint="Potrzebne do weryfikacji zgłoszenia">
              <input {...form2.register('senderName')} placeholder="Jan Kowalski" className={inputCls} />
            </Field>

            {/* Zdjęcia */}
            <div>
              <label className="block text-sm font-semibold text-[#1C2B3A] mb-1">
                📷 Zdjęcia
                <span className="text-gray-400 font-normal ml-1">({photos.length}/8) — pierwsze = okładka</span>
              </label>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                {photos.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border-2 border-[#1B4F8A]">
                    <img src={src} className="w-full h-full object-cover" alt="" />
                    {i === 0 && (
                      <div className="absolute bottom-0 left-0 right-0 text-center text-[8px] font-bold text-white bg-[#1B4F8A]/80 py-0.5">
                        OKŁADKA
                      </div>
                    )}
                    <button type="button" onClick={() => setPhotos(p => p.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-black/80">
                      ×
                    </button>
                  </div>
                ))}
                {photos.length < 8 && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-[#1B4F8A] hover:bg-blue-50 transition-colors gap-1">
                    <span className="text-2xl text-gray-400">+</span>
                    <span className="text-[9px] text-gray-400 font-semibold">Dodaj</span>
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => { if (e.target.files[0]) { addPhoto(e.target.files[0]); e.target.value = ''; } }} />
                  </label>
                )}
              </div>
            </div>

            {sendErr && <p className="text-red-500 text-sm">⚠️ {sendErr}</p>}

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(0)}
                className="flex-1 border-2 border-gray-300 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors">
                ← Wróć
              </button>
              <button type="submit" disabled={sending}
                className="flex-1 bg-[#2E9E6E] text-white py-3 rounded-xl font-bold hover:bg-[#247d57] transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                {sending ? '⏳ Wysyłanie...' : '✓ Wyślij zgłoszenie'}
              </button>
            </div>
          </form>
        )}

        {/* Step 3 — success */}
        {step === 2 && done && (
          <SuccessPanel title={data1.title} />
        )}
      </div>
    </>
  );
}
