import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#1C2B3A] text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Col 1: logo + opis */}
        <div>
          <div className="mb-4">
            <p className="text-2xl font-black text-white tracking-tight" style={{ fontFamily: 'Nunito, sans-serif' }}>Co na Mazurach?</p>
            <p className="text-xs font-semibold text-[#2E9E6E] uppercase tracking-widest mt-0.5">Kraina Wielkich Jezior</p>
          </div>
          <p className="text-sm leading-relaxed text-gray-400">
            Największy bezpłatny portal wydarzeń, noclegów i atrakcji na Mazurach.
            Odkryj jeziora, lasy i niezapomniane przeżycia Krainy Wielkich Jezior.
          </p>
          <p className="mt-3 text-[#F4A825] font-semibold text-sm">
            Portal bezpłatny — promujemy Mazury razem 🌊
          </p>
        </div>

        {/* Col 2: szybkie linki */}
        <div>
          <h3 className="text-white font-bold mb-4 text-lg">Szybkie linki</h3>
          <ul className="space-y-2 text-sm">
            {[
              { to: '/',          label: 'Strona główna' },
              { to: '/dodaj',     label: 'Dodaj ogłoszenie' },
              { to: '/mapa',      label: 'Mapa Mazur' },
              { to: '/kalendarz', label: 'Kalendarz wydarzeń' },
              { to: '/o-nas',     label: 'O nas' },
              { to: '/kontakt',   label: 'Kontakt' },
              { to: '/regulamin', label: 'Regulamin' },
            ].map(l => (
              <li key={l.to}>
                <Link to={l.to} className="hover:text-[#F4A825] transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3: social */}
        <div>
          <h3 className="text-white font-bold mb-4 text-lg">Obserwuj nas</h3>
          <div className="flex gap-3 mb-6">
            <a href="https://www.facebook.com/profile.php?id=61572329707071&locale=pl_PL" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-10 h-10 bg-[#1877F2] rounded-full flex items-center justify-center hover:opacity-90 transition-opacity text-white text-sm font-bold">f</a>
            <a href="#" aria-label="Instagram" className="w-10 h-10 bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] rounded-full flex items-center justify-center hover:opacity-90 transition-opacity text-white text-sm font-bold">in</a>
            <a href="#" aria-label="TikTok" className="w-10 h-10 bg-black rounded-full flex items-center justify-center hover:opacity-90 transition-opacity text-white text-sm font-bold">tt</a>
          </div>
          <p className="text-xs text-gray-500">
            Mazury, atrakcje Mazury, noclegi Mazury,<br />
            Giżycko, Mikołajki, Mrągowo, Pisz 2026
          </p>
        </div>
      </div>

      <div className="border-t border-gray-700 text-center py-4 text-xs text-gray-500">
        © Co na Mazurach? 2025 — Wszelkie prawa zastrzeżone
      </div>
    </footer>
  );
}
