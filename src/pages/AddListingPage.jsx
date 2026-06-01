import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CATEGORIES } from '../data/mockListings';

const CONTACT_EMAIL = 'conamazurach@gmail.com';

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

const STEPS = ['Podstawowe info', 'Szczegóły i kontakt', 'Gotowe — wyślij'];

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

function buildMessage(d1, d2) {
  const cat = CATEGORIES.find(c => c.id === d1.category);
  const lines = [
    `NOWE OGŁOSZENIE — Co na Mazurach?`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `📌 TYTUŁ: ${d1.title}`,
    `📂 KATEGORIA: ${cat ? `${cat.icon} ${cat.label}` : d1.category}`,
    `📍 MIASTO: ${d1.city}`,
    `🏠 ADRES: ${d1.address}`,
    d1.dateStart ? `📅 DATA: ${d1.dateStart}${d1.dateEnd && d1.dateEnd !== d1.dateStart ? ` → ${d1.dateEnd}` : ''}` : null,
    d1.time      ? `🕐 GODZINA: ${d1.time}` : null,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `💰 CENA: ${d2.free ? 'Bezpłatne' : d2.price ? `${d2.price} zł` : 'Nie podano'}`,
    d2.website     ? `🌐 STRONA: ${d2.website}` : null,
    d2.phone       ? `📞 TELEFON: ${d2.phone}` : null,
    d2.senderEmail ? `📧 EMAIL KONTAKTOWY: ${d2.senderEmail}` : null,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📝 OPIS:`,
    ``,
    d2.description,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `Zgłaszający: ${d2.senderName}${d2.senderEmail ? ` <${d2.senderEmail}>` : ''}`,
    `Data zgłoszenia: ${new Date().toLocaleString('pl-PL')}`,
  ];
  return lines.filter(l => l !== null).join('\n');
}

function ResultPanel({ data1, data2 }) {
  const [copied, setCopied] = useState(false);
  const message  = buildMessage(data1, data2);
  const subject  = encodeURIComponent(`Nowe ogłoszenie: ${data1.title} — ${data1.city}`);
  const body     = encodeURIComponent(message);
  const mailtoHref = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;

  function handleCopy() {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="space-y-6">
      {/* Success header */}
      <div className="bg-[#D1FAE5] border border-[#2E9E6E]/30 rounded-2xl p-5 flex items-start gap-4">
        <span className="text-3xl">✅</span>
        <div>
          <p className="font-black text-[#1C2B3A] text-lg">Formularz wypełniony!</p>
          <p className="text-sm text-gray-600 mt-1">
            Poniżej znajdziesz gotową wiadomość. Wyślij ją mailem lub skopiuj i prześlij samodzielnie.
            <br />Ogłoszenie zostanie dodane <strong>ręcznie przez redakcję</strong> po weryfikacji.
          </p>
        </div>
      </div>

      {/* Message preview */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-bold text-[#1C2B3A]">📋 Treść wiadomości</span>
          <span className="text-xs text-gray-500">Do: {CONTACT_EMAIL}</span>
        </div>
        <pre className="p-4 text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-mono overflow-x-auto max-h-72 overflow-y-auto">
          {message}
        </pre>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <a
          href={mailtoHref}
          className="flex items-center justify-center gap-2 bg-[#1B4F8A] text-white py-4 rounded-xl font-bold text-sm hover:bg-[#163f70] transition-colors"
        >
          <span>📧</span>
          Wyślij przez email
        </a>
        <button
          onClick={handleCopy}
          className={`flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm transition-all border-2 ${
            copied
              ? 'bg-[#2E9E6E] text-white border-[#2E9E6E]'
              : 'border-[#1B4F8A] text-[#1B4F8A] hover:bg-[#1B4F8A] hover:text-white'
          }`}
        >
          <span>{copied ? '✓' : '📋'}</span>
          {copied ? 'Skopiowano!' : 'Kopiuj wiadomość'}
        </button>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Możesz też wysłać wiadomość bezpośrednio na{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#1B4F8A] underline">{CONTACT_EMAIL}</a>
      </p>

      <a href="/" className="block text-center text-sm text-gray-500 hover:text-[#1B4F8A] transition-colors">
        ← Wróć na stronę główną
      </a>
    </div>
  );
}

export default function AddListingPage() {
  const [step,    setStep]    = useState(0);
  const [data1,   setData1]   = useState({});
  const [data2,   setData2]   = useState({});
  const [isFree,  setIsFree]  = useState(false);
  const [done,    setDone]    = useState(false);

  const form1 = useForm({ resolver: zodResolver(step1Schema) });
  const form2 = useForm({ resolver: zodResolver(step2Schema) });

  function onStep1(values) { setData1(values); setStep(1); }
  function onStep2(values) { setData2(values); setStep(2); setDone(true); }

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
            <div className="grid grid-cols-2 gap-4">
              <Field label="Miasto *" error={form1.formState.errors.city?.message}>
                <input {...form1.register('city')} placeholder="np. Giżycko, Ryn..." className={inputCls} />
              </Field>
              <Field label="Adres *" error={form1.formState.errors.address?.message}>
                <input {...form1.register('address')} placeholder="ul. Przykładowa 1" className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Data rozpoczęcia">
                <input {...form1.register('dateStart')} type="date" className={inputCls} />
              </Field>
              <Field label="Data zakończenia">
                <input {...form1.register('dateEnd')} type="date" className={inputCls} />
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

            <div className="grid grid-cols-2 gap-4">
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

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(0)}
                className="flex-1 border-2 border-gray-300 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors">
                ← Wróć
              </button>
              <button type="submit"
                className="flex-1 bg-[#2E9E6E] text-white py-3 rounded-xl font-bold hover:bg-[#247d57] transition-colors">
                Generuj wiadomość →
              </button>
            </div>
          </form>
        )}

        {/* Step 3 — result */}
        {step === 2 && done && (
          <ResultPanel data1={data1} data2={data2} />
        )}
      </div>
    </>
  );
}
