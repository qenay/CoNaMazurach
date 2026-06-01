import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export default function NotFoundPage() {
  return (
    <>
      <Helmet>
        <title>Strona nie znaleziona (404) | Co na Mazurach?</title>
      </Helmet>
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <p className="text-8xl mb-4">🌊</p>
        <h1 className="text-5xl font-black text-[#1B4F8A] mb-3">404</h1>
        <p className="text-xl font-bold text-[#1C2B3A] mb-2">Ta strona odpłynęła...</p>
        <p className="text-gray-500 mb-8">Nie znaleziono strony, której szukasz.</p>
        <Link
          to="/"
          className="bg-[#1B4F8A] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#163f70] transition-colors"
        >
          ← Wróć na stronę główną
        </Link>
      </div>
    </>
  );
}
