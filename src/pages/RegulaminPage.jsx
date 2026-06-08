import { Helmet } from 'react-helmet-async';

const SECTIONS = [
  {
    title: '§1. Postanowienia ogólne',
    content: [
      'Niniejszy Regulamin określa zasady korzystania z serwisu internetowego oraz aplikacji mobilnej „Co na Mazurach?" dostępnych pod adresem conamazurach.pl (dalej: „Serwis").',
      'Administratorem Serwisu jest redakcja Co na Mazurach?, kontakt: kontakt@conamazurach.pl.',
      'Serwis jest bezpłatną platformą ogłoszeniową promującą wydarzenia, noclegi, restauracje, kempingi, koncerty, atrakcje i czartery na terenie Mazur i okolic.',
      'Korzystanie z Serwisu jest równoznaczne z akceptacją niniejszego Regulaminu w całości.',
      'Regulamin dostępny jest w każdym czasie na stronie conamazurach.pl/regulamin oraz w aplikacji mobilnej.',
    ],
  },
  {
    title: '§2. Rodzaje i zakres usług',
    content: [
      'Serwis umożliwia bezpłatne przeglądanie ogłoszeń dotyczących ofert turystycznych i rekreacyjnych na Mazurach.',
      'Użytkownicy mogą bezpłatnie dodawać ogłoszenia za pośrednictwem formularza dostępnego w Serwisie.',
      'Serwis oferuje następujące kategorie ogłoszeń: wydarzenia, noclegi, restauracje, kempingi, koncerty, atrakcje, czartery.',
      'Wszystkie ogłoszenia przed publikacją podlegają weryfikacji przez redakcję Serwisu w terminie do 48 godzin roboczych.',
    ],
  },
  {
    title: '§3. Zasady dodawania ogłoszeń',
    content: [
      'Dodanie ogłoszenia jest bezpłatne i nie wymaga rejestracji konta w Serwisie.',
      'Ogłoszeniodawca oświadcza, że jest uprawniony do publikacji zamieszczanych treści oraz że treści te są zgodne z prawdą.',
      'Ogłoszenie powinno zawierać rzetelne i aktualne informacje o ofercie, w tym cenę, lokalizację, dane kontaktowe.',
      'Jedno ogłoszenie może dotyczyć tylko jednej oferty lub jednego miejsca. Zabronione jest tworzenie ogłoszeń zbiorczych.',
      'Ogłoszeniodawca zobowiązuje się do aktualizowania treści ogłoszenia w przypadku zmiany informacji w nim zawartych.',
      'Redakcja zastrzega sobie prawo do odmowy publikacji lub usunięcia ogłoszenia naruszającego postanowienia niniejszego Regulaminu.',
    ],
  },
  {
    title: '§4. Treści zabronione',
    content: [
      'W Serwisie zabrania się publikowania treści: niezgodnych z przepisami prawa polskiego i unijnego; obraźliwych, wulgarnych lub naruszających godność osobistą; dyskryminujących ze względu na płeć, wiek, rasę, religię lub inne cechy osobiste.',
      'Zabrania się zamieszczania treści stanowiących spam, niechcianą reklamę lub phishing.',
      'Zabrania się publikowania ogłoszeń zawierających nieprawdziwe lub wprowadzające w błąd informacje.',
      'Zabrania się naruszania praw własności intelektualnej, w tym praw autorskich do zdjęć, tekstów lub innych materiałów.',
      'Zabrania się dodawania ogłoszeń niezwiązanych z turystyką, rekreacją lub ofertą regionu Mazur.',
    ],
  },
  {
    title: '§5. Ochrona danych osobowych (RODO)',
    content: [
      'Administratorem danych osobowych Użytkowników jest redakcja Co na Mazurach?, kontakt: kontakt@conamazurach.pl.',
      'Dane osobowe podane w formularzach (imię, adres e-mail, numer telefonu) są przetwarzane wyłącznie w celu weryfikacji i publikacji ogłoszenia oraz kontaktu z ogłoszeniodawcą.',
      'Podstawą prawną przetwarzania danych jest zgoda Użytkownika (art. 6 ust. 1 lit. a RODO).',
      'Dane nie są udostępniane podmiotom trzecim, z wyjątkiem przypadków wymaganych przez prawo.',
      'Użytkownik ma prawo do dostępu do swoich danych, ich sprostowania oraz usunięcia — w tym celu należy skontaktować się pod adresem kontakt@conamazurach.pl.',
      'Dane przechowywane są przez okres niezbędny do realizacji celów, dla których zostały zebrane.',
    ],
  },
  {
    title: '§6. Odpowiedzialność',
    content: [
      'Redakcja Serwisu nie ponosi odpowiedzialności za treść ogłoszeń zamieszczanych przez użytkowników, w szczególności za ich prawdziwość i aktualność.',
      'Redakcja dokłada starań, aby informacje w Serwisie były rzetelne, jednak nie gwarantuje ich kompletności.',
      'Redakcja nie odpowiada za działania osób trzecich, których oferty są prezentowane w Serwisie.',
    ],
  },
  {
    title: '§7. Zakaz kopiowania i własność intelektualna',
    content: [
      'Wszelkie prawa do Serwisu, w tym prawa autorskie do szaty graficznej, logotypu, kodu źródłowego i treści redakcyjnych, przysługują wyłącznie redakcji Co na Mazurach?.',
      'Zabrania się kopiowania, powielania, pobierania, drukowania lub rozpowszechniania jakichkolwiek treści Serwisu — zarówno w całości, jak i w części — bez uprzedniej pisemnej zgody redakcji.',
      'Zabrania się korzystania z treści Serwisu w celach komercyjnych bez zgody redakcji.',
      'Zabrania się automatycznego pobierania danych z Serwisu za pomocą botów, scraperów lub innych narzędzi automatycznych.',
      'Naruszenie zakazu kopiowania może skutkować odpowiedzialnością cywilną i karną na podstawie przepisów o prawie autorskim.',
      'Dodając ogłoszenie, ogłoszeniodawca udziela redakcji nieodpłatnej licencji na prezentację zamieszczonych materiałów w Serwisie i jego kanałach komunikacji.',
    ],
  },
  {
    title: '§8. Zmiany Regulaminu',
    content: [
      'Redakcja zastrzega sobie prawo do zmiany niniejszego Regulaminu w dowolnym czasie.',
      'Zmiany wchodzą w życie z dniem ich opublikowania w Serwisie.',
      'Dalsze korzystanie z Serwisu po opublikowaniu zmian jest równoznaczne z akceptacją nowej treści Regulaminu.',
    ],
  },
  {
    title: '§9. Postanowienia końcowe',
    content: [
      'W sprawach nieuregulowanych niniejszym Regulaminem zastosowanie mają przepisy prawa polskiego, w szczególności Kodeksu cywilnego oraz ustawy o świadczeniu usług drogą elektroniczną.',
      'Nieważność lub bezskuteczność któregokolwiek z postanowień Regulaminu nie wpływa na ważność pozostałych postanowień.',
      'Regulamin wchodzi w życie z dniem 9 czerwca 2026 r.',
    ],
  },
];

export default function RegulaminPage() {
  return (
    <>
      <Helmet>
        <title>Regulamin | Co na Mazurach?</title>
        <meta name="description" content="Regulamin serwisu Co na Mazurach? — zasady korzystania z platformy ogłoszeniowej, ochrona danych osobowych, prawa użytkowników." />
        <link rel="canonical" href="https://conamazurach.pl/regulamin" />
      </Helmet>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-[#1C2B3A] dark:text-white mb-2">Regulamin serwisu</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Ostatnia aktualizacja: 9 czerwca 2026 r.</p>
        </div>

        <div className="bg-[#EFF6FF] dark:bg-[#1e3a5f]/30 border border-[#1B4F8A]/20 rounded-2xl p-5 mb-8">
          <p className="text-sm text-[#1B4F8A] dark:text-blue-300 font-medium leading-relaxed">
            <strong>Witaj w Co na Mazurach?</strong> — bezpłatnej platformie łączącej turystów z najlepszymi miejscami i wydarzeniami na Mazurach. Korzystając z serwisu, akceptujesz poniższy Regulamin. Masz pytania? Napisz do nas: <a href="mailto:kontakt@conamazurach.pl" className="underline">kontakt@conamazurach.pl</a>
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
          <p>© 2025 Co na Mazurach? · Wszelkie prawa zastrzeżone</p>
          <p>Kontakt: <a href="mailto:kontakt@conamazurach.pl" className="underline hover:text-[#1B4F8A] transition-colors">kontakt@conamazurach.pl</a></p>
        </div>
      </div>
    </>
  );
}
