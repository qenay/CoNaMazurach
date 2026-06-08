import { Helmet } from 'react-helmet-async';

const SECTIONS = [
  {
    title: '§1. Administrator danych osobowych',
    content: [
      'Administratorem danych osobowych jest redakcja serwisu „Co na Mazurach?", dostępnego pod adresem conamazurach.pl oraz w aplikacji mobilnej „Co na Mazurach?" (dalej: „Serwis").',
      'Kontakt z administratorem: kontakt@conamazurach.pl',
      'Niniejsza Polityka prywatności opisuje, jakie dane zbieramy, w jakim celu i jak je chronimy.',
    ],
  },
  {
    title: '§2. Jakie dane zbieramy',
    content: [
      'Dane podawane dobrowolnie w formularzu dodawania ogłoszenia: imię i nazwisko, adres e-mail, numer telefonu, treść ogłoszenia oraz zdjęcia.',
      'Dane techniczne zbierane automatycznie: adres IP, typ przeglądarki, system operacyjny, strony odwiedzane w Serwisie, czas wizyty. Dane te są anonimowe i służą wyłącznie do celów statystycznych.',
      'Serwis nie wymaga rejestracji ani tworzenia konta — nie przechowujemy haseł ani danych logowania.',
      'Serwis nie zbiera danych wrażliwych (np. danych o zdrowiu, poglądach politycznych, wyznaniu).',
    ],
  },
  {
    title: '§3. Cel i podstawa przetwarzania danych',
    content: [
      'Dane podane w formularzu przetwarzane są w celu weryfikacji i publikacji ogłoszenia oraz umożliwienia kontaktu z ogłoszeniodawcą.',
      'Podstawą prawną przetwarzania jest zgoda osoby, której dane dotyczą (art. 6 ust. 1 lit. a RODO).',
      'Dane techniczne (anonimowe) przetwarzane są w celu zapewnienia prawidłowego działania Serwisu i analizy statystyk.',
      'Dane nie są przetwarzane w celach marketingowych bez wyraźnej zgody użytkownika.',
    ],
  },
  {
    title: '§4. Udostępnianie danych',
    content: [
      'Dane osobowe nie są sprzedawane ani udostępniane podmiotom trzecim w celach komercyjnych.',
      'Dane mogą być przekazane wyłącznie podmiotom świadczącym usługi techniczne niezbędne do działania Serwisu (np. hosting) oraz na żądanie uprawnionych organów państwowych.',
      'Serwis korzysta z zewnętrznych usług: OpenStreetMap (mapy), Google Fonts (czcionki), Picsum Photos (zdjęcia testowe). Usługi te posiadają własne polityki prywatności.',
    ],
  },
  {
    title: '§5. Pliki cookies',
    content: [
      'Serwis może korzystać z plików cookies (ciasteczek) w celu zapewnienia prawidłowego działania (np. zapamiętanie ulubionych ofert, ustawień motywu).',
      'Cookies używane w Serwisie są plikami sesyjnymi lub lokalnymi przechowywanymi wyłącznie na urządzeniu użytkownika.',
      'Serwis nie używa cookies śledzących ani reklamowych.',
      'Użytkownik może wyłączyć obsługę cookies w ustawieniach swojej przeglądarki — może to jednak ograniczyć funkcjonalność Serwisu.',
    ],
  },
  {
    title: '§6. Prawa użytkownika',
    content: [
      'Każda osoba, której dane dotyczą, ma prawo do: dostępu do swoich danych, ich sprostowania oraz usunięcia.',
      'W celu skorzystania z powyższych praw należy skontaktować się pod adresem: kontakt@conamazurach.pl',
      'Administrator odpowie na wniosek w terminie 30 dni od jego otrzymania.',
      'Dane przechowywane są przez okres niezbędny do realizacji celów, dla których zostały zebrane.',
    ],
  },
  {
    title: '§7. Bezpieczeństwo danych',
    content: [
      'Serwis stosuje techniczne i organizacyjne środki bezpieczeństwa w celu ochrony danych przed nieuprawnionym dostępem, utratą lub zniszczeniem.',
      'Transmisja danych odbywa się z wykorzystaniem szyfrowania SSL/TLS (protokół HTTPS).',
      'Dostęp do danych osobowych mają wyłącznie upoważnione osoby z redakcji Serwisu.',
    ],
  },
  {
    title: '§8. Zmiany Polityki prywatności',
    content: [
      'Administrator zastrzega sobie prawo do zmiany niniejszej Polityki prywatności.',
      'Zmiany wchodzą w życie z dniem ich opublikowania w Serwisie.',
      'Dalsze korzystanie z Serwisu po opublikowaniu zmian oznacza ich akceptację.',
      'Niniejsza Polityka prywatności obowiązuje od 9 czerwca 2026 r.',
    ],
  },
];

export default function PrywatnoPage() {
  return (
    <>
      <Helmet>
        <title>Polityka prywatności | Co na Mazurach?</title>
        <meta name="description" content="Polityka prywatności serwisu Co na Mazurach? — informacje o przetwarzaniu danych osobowych, plikach cookies i prawach użytkownika." />
        <link rel="canonical" href="https://conamazurach.pl/prywatnosc" />
      </Helmet>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-[#1C2B3A] dark:text-white mb-2">Polityka prywatności</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Obowiązuje od 9 czerwca 2026 r.</p>
        </div>

        <div className="bg-[#EFF6FF] dark:bg-[#1e3a5f]/30 border border-[#1B4F8A]/20 rounded-2xl p-5 mb-8">
          <p className="text-sm text-[#1B4F8A] dark:text-blue-300 font-medium leading-relaxed">
            Twoja prywatność jest dla nas ważna. Poniżej znajdziesz pełne informacje o tym, jakie dane zbieramy i jak je chronimy. Pytania? Napisz: <a href="mailto:kontakt@conamazurach.pl" className="underline">kontakt@conamazurach.pl</a>
          </p>
        </div>

        <div className="space-y-6">
          {SECTIONS.map(({ title, content }) => (
            <div key={title} className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
              <h2 className="font-black text-[#1C2B3A] dark:text-white text-base mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">{title}</h2>
              <ol className="space-y-2 list-none">
                {content.map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    <span className="text-[#1B4F8A] dark:text-blue-400 font-bold flex-shrink-0 mt-0.5">{i + 1}.</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center text-xs text-gray-400 dark:text-gray-500 space-y-1">
          <p>© 2026 Co na Mazurach? · Wszelkie prawa zastrzeżone</p>
          <p>Kontakt: <a href="mailto:kontakt@conamazurach.pl" className="underline hover:text-[#1B4F8A] transition-colors">kontakt@conamazurach.pl</a></p>
        </div>
      </div>
    </>
  );
}
