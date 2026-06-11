import { useState } from 'react';
import { Helmet } from 'react-helmet-async';

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setSent(true);
  }

  const inputCls = 'w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4F8A] focus:ring-2 focus:ring-[#1B4F8A]/20';

  return (
    <>
      <Helmet>
        <title>Kontakt | Co na Mazurach?</title>
        <meta name="description" content="Skontaktuj się z redakcją Co na Mazurach? — pytania, współpraca, zgłoszenia." />
        <link rel="canonical" href="https://conamazurach.pl/kontakt" />
      </Helmet>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-black text-[#1C2B3A] mb-2">Kontakt 📬</h1>
        <p className="text-gray-500 mb-8">Masz pytanie? Napisz do nas!</p>

        {sent ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-5xl mb-4">✅</p>
            <h2 className="text-2xl font-black mb-2">Dziękujemy za wiadomość!</h2>
            <p className="text-gray-500">Odpiszemy w ciągu 24 godzin.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#1C2B3A] mb-1">Imię i nazwisko *</label>
                <input required className={inputCls} placeholder="Jan Kowalski" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1C2B3A] mb-1">Email *</label>
                <input required type="email" className={inputCls} placeholder="jan@example.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1C2B3A] mb-1">Temat *</label>
              <select required className={inputCls}>
                <option value="">Wybierz temat...</option>
                <option>Pytanie o ogłoszenie</option>
                <option>Zgłoszenie nieprawidłowości</option>
                <option>Współpraca</option>
                <option>Reklama</option>
                <option>Inne</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1C2B3A] mb-1">Wiadomość *</label>
              <textarea required rows={5} className={`${inputCls} resize-none`} placeholder="Opisz swoje pytanie lub sprawę..." />
            </div>
            <button type="submit" className="w-full bg-[#1B4F8A] text-white py-3 rounded-xl font-bold hover:bg-[#163f70] transition-colors">
              Wyślij wiadomość
            </button>
          </form>
        )}
      </div>
    </>
  );
}
