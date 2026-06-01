export const CATEGORIES = [
  { id: 'wydarzenia', label: 'Wydarzenia', icon: '🎉', color: '#F4A825', bg: '#FEF3C7' },
  { id: 'noclegi',    label: 'Noclegi',    icon: '🏡', color: '#2E9E6E', bg: '#D1FAE5' },
  { id: 'restauracje',label: 'Restauracje',icon: '🍽️', color: '#EF4444', bg: '#FEE2E2' },
  { id: 'kempingi',   label: 'Kempingi',   icon: '⛺', color: '#8B5CF6', bg: '#EDE9FE' },
  { id: 'koncerty',   label: 'Koncerty',   icon: '🎸', color: '#EC4899', bg: '#FCE7F3' },
  { id: 'atrakcje',   label: 'Atrakcje',   icon: '🎯', color: '#1B4F8A', bg: '#DBEAFE' },
];

export const mockListings = [
  {
    id: 1,
    title: 'Regaty Żeglarskie na Jeziorze Śniardwy',
    category: 'wydarzenia',
    city: 'Mikołajki',
    address: 'Marina Mikołajki, ul. Kowalska 5',
    lat: 53.7922,
    lng: 21.5735,
    date: '2026-06-14',
    time: '10:00',
    price: 0,
    priceLabel: 'Bezpłatne',
    description: `<p>Zapraszamy na coroczne Regaty Żeglarskie na największym jeziorze Mazur — Śniardwach. To jedno z najbardziej prestiżowych wydarzeń żeglarskich w Polsce Wschodniej.</p>
<p>W programie:</p>
<ul>
<li>Wyścigi klas Optimist, Laser i Omega</li>
<li>Pokazy ratownictwa wodnego</li>
<li>Konkursy dla dzieci</li>
<li>Strefa gastronomiczna z lokalnymi przysmakami</li>
</ul>
<p>Nie musisz być żeglarzem, żeby świetnie się bawić — zapraszamy wszystkich miłośników Mazur!</p>`,
    image: 'https://picsum.photos/seed/regaty/800/450',
    rating: 4.8,
    isNew: true,
    tags: ['żeglarstwo', 'jezioro', 'regaty', 'Śniardwy'],
  },
  {
    id: 2,
    title: 'Domek na Mazurach — widok na jezioro Niegocin',
    category: 'noclegi',
    city: 'Giżycko',
    address: 'ul. Wodna 12, Giżycko',
    lat: 54.0369,
    lng: 21.7622,
    date: null,
    time: null,
    price: 299,
    priceLabel: 'od 299 zł / noc',
    description: `<p>Klimatyczny drewniany domek z bezpośrednim dostępem do jeziora Niegocin. Idealne miejsce na rodzinny wypoczynek lub romantyczny weekend.</p>
<ul>
<li>2 sypialnie (max 6 osób)</li>
<li>Prywatna plaża i pomost</li>
<li>Kajaki i rowery wodne w cenie</li>
<li>Grill i ognisko</li>
<li>WiFi i Smart TV</li>
</ul>`,
    image: 'https://picsum.photos/seed/domek-niegocin/800/450',
    rating: 4.9,
    isNew: false,
    tags: ['domek', 'jezioro', 'Niegocin', 'rodziny'],
  },
  {
    id: 3,
    title: 'Restauracja "Pod Żaglami" — kuchnia mazurska',
    category: 'restauracje',
    city: 'Mrągowo',
    address: 'ul. Giżycka 3, Mrągowo',
    lat: 53.8695,
    lng: 21.3063,
    date: null,
    time: null,
    price: 45,
    priceLabel: 'od 45 zł / os.',
    description: `<p>Najlepsza restauracja mazurska w Mrągowie, serwująca tradycyjne dania kuchni warmińsko-mazurskiej. Specjalność domu: karp z jeziora, raki i zupa rybna.</p>
<p>Otwarte codziennie 12:00–22:00. Rezerwacja stolik zalecana w weekendy.</p>`,
    image: 'https://picsum.photos/seed/restauracja-mragowo/800/450',
    rating: 4.7,
    isNew: false,
    tags: ['kuchnia mazurska', 'ryby', 'karp', 'tradycja'],
  },
  {
    id: 4,
    title: 'Kemping "Leśna Polana" nad jeziorem Śniardwy',
    category: 'kempingi',
    city: 'Pisz',
    address: 'Wiartel Mały 45, gmina Pisz',
    lat: 53.6325,
    lng: 21.8012,
    date: null,
    time: null,
    price: 35,
    priceLabel: 'od 35 zł / namiot',
    description: `<p>Kemping zlokalizowany bezpośrednio nad brzegiem Śniardw, w cieniu sosnowego lasu. Spokojne, rodzinne miejsce z pełnym zapleczem.</p>
<ul>
<li>Miejsca namiotowe i dla kamperów</li>
<li>Sanitariaty i prysznice (ciepła woda 24h)</li>
<li>Plac zabaw dla dzieci</li>
<li>Wypożyczalnia kajaków</li>
<li>Sklep spożywczy na miejscu</li>
</ul>`,
    image: 'https://picsum.photos/seed/kemping-pisz/800/450',
    rating: 4.5,
    isNew: true,
    tags: ['kemping', 'namioty', 'kamper', 'Śniardwy', 'las'],
  },
  {
    id: 5,
    title: 'Festiwal Country Piknik — Mrągowo 2026',
    category: 'koncerty',
    city: 'Mrągowo',
    address: 'Amfiteatr Mrągowo, ul. Leśna 1',
    lat: 53.8720,
    lng: 21.3150,
    date: '2026-08-01',
    time: '18:00',
    price: 120,
    priceLabel: 'od 120 zł',
    description: `<p>Jeden z największych festiwali muzyki country w Europie Środkowej wraca na Mazury! W tym roku na scenie pojawią się gwiazdy z USA, Kanady i Polski.</p>
<p>Program:</p>
<ul>
<li>3 dni koncertów na 2 scenach</li>
<li>Tańce country i warsztaty line dance</li>
<li>Jarmark kowbojski</li>
<li>Food trucks z kuchnią meksykańską i texańską</li>
</ul>`,
    image: 'https://picsum.photos/seed/country-piknik/800/450',
    rating: 4.9,
    isNew: true,
    tags: ['country', 'muzyka', 'festiwal', 'Mrągowo'],
  },
  {
    id: 6,
    title: 'Spływ kajakowy Krutynią — 3 dni przez puszczę',
    category: 'atrakcje',
    city: 'Mrągowo',
    address: 'Krutyń 7, gmina Piecki',
    lat: 53.7008,
    lng: 21.5241,
    date: '2026-06-21',
    time: '09:00',
    price: 180,
    priceLabel: 'od 180 zł / os.',
    description: `<p>Niezapomniany 3-dniowy spływ trasą rzeki Krutyni — perły Mazur. Jeden z najpiękniejszych szlaków kajakowych w Polsce, przez serce Mazurskiego Parku Krajobrazowego.</p>
<p>W cenie:</p>
<ul>
<li>Kajak i sprzęt (kamizelka, pagaj, worek wodoodporny)</li>
<li>Nocleg w agrokwaterze</li>
<li>Śniadania i kolacje</li>
<li>Przewodnik</li>
<li>Transport powrotny</li>
</ul>`,
    image: 'https://picsum.photos/seed/krutyn-kayak/800/450',
    rating: 4.95,
    isNew: false,
    tags: ['kajaki', 'Krutynia', 'spływ', 'przyroda', 'puszcza'],
  },
  {
    id: 7,
    title: 'Agroturystyka "Mazurski Raj" — cisza i spokój',
    category: 'noclegi',
    city: 'Węgorzewo',
    address: 'Węgielsztyn 22, gmina Węgorzewo',
    lat: 54.2185,
    lng: 21.7324,
    date: null,
    time: null,
    price: 180,
    priceLabel: 'od 180 zł / noc',
    description: `<p>Tradycyjna mazurska agroturystyka w sercu Krainy Wielkich Jezior. Dala od miejskiego zgiełku, blisko natury.</p>
<ul>
<li>4 pokoje gościnne (2-4 osoby)</li>
<li>Śniadania z lokalnych produktów</li>
<li>Jazda konna</li>
<li>Wędkowanie na prywatnym stawie</li>
<li>Grzybobranie z przewodnikiem</li>
</ul>`,
    image: 'https://picsum.photos/seed/agroturystyka-wegorzewo/800/450',
    rating: 4.8,
    isNew: false,
    tags: ['agroturystyka', 'konie', 'wędkowanie', 'spokój'],
  },
  {
    id: 8,
    title: 'Dni Giżycka 2026 — wielkie święto nad Niegocinem',
    category: 'wydarzenia',
    city: 'Giżycko',
    address: 'Promenada Wojska Polskiego, Giżycko',
    lat: 54.0396,
    lng: 21.7689,
    date: '2026-06-07',
    time: '12:00',
    price: 0,
    priceLabel: 'Bezpłatne',
    description: `<p>Coroczne Dni Giżycka to największa impreza plenerowa w Krainie Wielkich Jezior! Trzy dni pełne atrakcji dla całej rodziny.</p>
<p>W programie:</p>
<ul>
<li>Koncerty muzyczne — polskie i zagraniczne gwiazdy</li>
<li>Pokazy fajerwerków nad jeziorem</li>
<li>Wyścigi motorówek</li>
<li>Jarmark rękodzielniczy</li>
<li>Strefa dla dzieci</li>
</ul>`,
    image: 'https://picsum.photos/seed/dni-gizycka/800/450',
    rating: 4.6,
    isNew: false,
    tags: ['festyn', 'Giżycko', 'Niegocin', 'muzyka', 'fajerwerki'],
  },
  {
    id: 9,
    title: 'Pub "Mazurska Belka" — craft beer i muzyka na żywo',
    category: 'restauracje',
    city: 'Giżycko',
    address: 'ul. Wyzwolenia 14, Giżycko',
    lat: 54.0380,
    lng: 21.7650,
    date: null,
    time: null,
    price: 20,
    priceLabel: 'od 20 zł',
    description: `<p>Klimatyczny pub w centrum Giżycka z szerokim wyborem lokalnych piw rzemieślniczych. Każdy weekend — muzyka na żywo i karaoke.</p>
<p>Specjalność: piwo mazurskie warzone na miejscu i lokalne przekąski.</p>`,
    image: 'https://picsum.photos/seed/pub-gizycko/800/450',
    rating: 4.4,
    isNew: true,
    tags: ['pub', 'craft beer', 'muzyka na żywo', 'Giżycko'],
  },
  {
    id: 10,
    title: 'Kemping "Przystań Ryn" — przy Kanale Mazurskim',
    category: 'kempingi',
    city: 'Ryn',
    address: 'ul. Mazurska 8, Ryn',
    lat: 53.9421,
    lng: 21.5305,
    date: null,
    time: null,
    price: 45,
    priceLabel: 'od 45 zł / noc',
    description: `<p>Kemping z widokiem na słynny zamek w Rynie i Kanał Mazurski. Idealne miejsce dla fanów żeglarstwa, rowerów i pieszych wycieczek.</p>
<ul>
<li>Miejsca namiotowe i dla kamperów z prądem</li>
<li>Domki letniskowe (2-6 osób)</li>
<li>Wypożyczalnia rowerów i sprzętu wodnego</li>
<li>Restauracja mazurska na miejscu</li>
</ul>`,
    image: 'https://picsum.photos/seed/kemping-ryn/800/450',
    rating: 4.7,
    isNew: false,
    tags: ['kemping', 'zamek', 'Ryn', 'kanał mazurski', 'rowery'],
  },
  {
    id: 11,
    title: 'Nocna obserwacja nieba nad Puszczą Piską',
    category: 'atrakcje',
    city: 'Pisz',
    address: 'Leśniczówka Wiartel, Pisz',
    lat: 53.6280,
    lng: 21.7980,
    date: '2026-08-10',
    time: '21:30',
    price: 60,
    priceLabel: 'od 60 zł / os.',
    description: `<p>Mazury to jedno z ostatnich miejsc w Polsce z tak ciemnym niebem nocnym. Dołącz do naszej grupy astronomicznej i odkryj Drogę Mleczną gołym okiem!</p>
<p>W programie:</p>
<ul>
<li>Prelekcja o gwiazdozbiorach i planetach</li>
<li>Obserwacje przez teleskop 10"</li>
<li>Fotografowanie nocnego nieba (wskazówki)</li>
<li>Gorąca czekolada i przekąski</li>
</ul>`,
    image: 'https://picsum.photos/seed/astronomia-pisz/800/450',
    rating: 4.9,
    isNew: true,
    tags: ['astronomia', 'nocne niebo', 'gwiazdy', 'Puszcza Piska'],
  },
  {
    id: 12,
    title: 'Wynajem jachtu żaglowego 8m — jezioro Mamry',
    category: 'atrakcje',
    city: 'Węgorzewo',
    address: 'Marina Węgorzewo, ul. Portowa 1',
    lat: 54.2219,
    lng: 21.7442,
    date: null,
    time: null,
    price: 650,
    priceLabel: 'od 650 zł / dzień',
    description: `<p>Wynajmij jacht i odkryj Mazury od strony wody! Oferujemy jachty żaglowe 8m i 10m w pełni wyposażone do samodzielnego czarterowania.</p>
<p>Wymagania: patent żeglarski lub sternik motorowodny. Wynajem możliwy od 1 do 14 dni.</p>
<ul>
<li>Jacht 8m — max 6 osób, od 650 zł/dzień</li>
<li>Jacht 10m — max 8 osób, od 950 zł/dzień</li>
<li>GPS, VHF, koła ratunkowe</li>
<li>Opcja: skipper (+200 zł/dzień)</li>
</ul>`,
    image: 'https://picsum.photos/seed/jacht-wegorzewo/800/450',
    rating: 4.85,
    isNew: false,
    tags: ['jacht', 'żeglarstwo', 'Mamry', 'czarter', 'Węgorzewo'],
  },
];
