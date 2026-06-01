import { Helmet } from 'react-helmet-async';

export default function RegulaminPage() {
  return (
    <>
      <Helmet>
        <title>Regulamin | Co na Mazurach?</title>
        <link rel="canonical" href="https://conamazurach.pl/regulamin" />
      </Helmet>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-black text-[#1C2B3A] mb-8">Regulamin serwisu</h1>
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm space-y-6 text-gray-700 text-sm leading-relaxed">
          {[
            ['§1. Postanowienia ogólne', 'Serwis Co na Mazurach? jest bezpłatną platformą ogłoszeniową promującą wydarzenia, noclegi, restauracje i atrakcje na Mazurach. Administratorem serwisu jest redakcja Co na Mazurach?.'],
            ['§2. Dodawanie ogłoszeń', 'Każdy użytkownik może bezpłatnie dodać ogłoszenie bez rejestracji. Ogłoszenie przed publikacją przechodzi weryfikację redakcji (do 24 godzin). Redakcja zastrzega sobie prawo do odmowy publikacji ogłoszeń niezgodnych z tematyką serwisu lub zawierających treści niedozwolone.'],
            ['§3. Treści zabronione', 'Zabrania się publikowania treści: niezgodnych z prawem, obraźliwych, naruszających prawa osób trzecich, o charakterze spamu lub reklamy nieetycznej, wprowadzających w błąd.'],
            ['§4. Ochrona danych osobowych', 'Dane osobowe podane w formularzach są przetwarzane wyłącznie w celu realizacji usług serwisu, zgodnie z RODO. Użytkownik ma prawo do dostępu, poprawienia i usunięcia swoich danych.'],
            ['§5. Odpowiedzialność', 'Redakcja nie ponosi odpowiedzialności za treść ogłoszeń zamieszczanych przez użytkowników. Redakcja dokłada starań, aby informacje były aktualne i rzetelne.'],
          ].map(([title, body]) => (
            <div key={title}>
              <h2 className="font-black text-[#1C2B3A] text-base mb-2">{title}</h2>
              <p>{body}</p>
            </div>
          ))}
          <p className="text-xs text-gray-400 pt-4 border-t border-gray-100">Regulamin obowiązuje od 1 stycznia 2025 r.</p>
        </div>
      </div>
    </>
  );
}
