import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <>
      <Helmet>
        <title>O nas | Co na Mazurach?</title>
        <meta name="description" content="Dowiedz się więcej o portalu Co na Mazurach? — największym bezpłatnym portalu wydarzeń, noclegów i atrakcji na Mazurach." />
        <link rel="canonical" href="https://conamazurach.pl/o-nas" />
      </Helmet>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-black text-[#1C2B3A] mb-4">O nas 🌊</h1>
        <p className="text-lg text-gray-500 mb-8">Promujemy Mazury — razem!</p>

        <div className="prose prose-lg max-w-none space-y-6 text-[#1C2B3A]">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-2xl font-black text-[#1B4F8A] mb-3">Co to jest "Co na Mazurach?"</h2>
            <p className="text-gray-600 leading-relaxed">
              <strong>Co na Mazurach?</strong> to bezpłatny portal internetowy poświęcony promocji wydarzeń,
              noclegów, restauracji, kempingów i atrakcji w Krainie Wielkich Jezior. Naszym celem jest
              połączenie turystów z lokalnymi organizatorami i przedsiębiorcami.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-2xl font-black text-[#2E9E6E] mb-3">Nasza misja</h2>
            <p className="text-gray-600 leading-relaxed">
              Mazury to jeden z najpiękniejszych regionów Polski — ponad 2000 jezior, lasy Puszczy Piskiej,
              jeziora Śniardwy i Mamry. Chcemy, żeby każdy — zarówno stały mieszkaniec jak i turysta —
              wiedział co dobrego dzieje się na Mazurach każdego dnia.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: '🎉', val: '200+', label: 'Wydarzeń miesięcznie' },
              { icon: '🏡', val: '500+', label: 'Noclegów i domków' },
              { icon: '🗺️', val: '9',    label: 'Miast na Mazurach' },
            ].map(s => (
              <div key={s.label} className="bg-[#DBEAFE] rounded-2xl p-5 text-center">
                <p className="text-3xl mb-1">{s.icon}</p>
                <p className="text-3xl font-black text-[#1B4F8A]">{s.val}</p>
                <p className="text-sm text-gray-600">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-[#FEF3C7] rounded-2xl p-6 border border-[#F4A825]/30">
            <h2 className="text-xl font-black text-[#F4A825] mb-2">Chcesz dodać swoje ogłoszenie?</h2>
            <p className="text-gray-700 mb-4">
              To całkowicie bezpłatne! Wystarczy wypełnić formularz, a Twoje ogłoszenie pojawi się na
              portalu po weryfikacji (do 24 godzin).
            </p>
            <Link to="/dodaj" className="inline-block bg-[#F4A825] text-white px-6 py-2 rounded-xl font-bold hover:bg-[#d99020] transition-colors">
              + Dodaj ogłoszenie
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
