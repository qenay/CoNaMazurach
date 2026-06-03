import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { CATEGORIES } from '../data/mockListings';
import DistanceCalculator from '../components/DistanceCalculator';
import MapView from '../components/MapView';

function StarRating({ rating }) {
  return (
    <span className="flex items-center gap-1 text-[#F4A825]">
      {'★'.repeat(Math.floor(rating))}
      {'☆'.repeat(5 - Math.floor(rating))}
      <span className="text-gray-600 text-sm ml-1">{rating.toFixed(1)}/5</span>
    </span>
  );
}

function ShareButtons({ title, url }) {
  function copyLink() {
    navigator.clipboard.writeText(url || window.location.href);
    alert('Link skopiowany!');
  }
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500 font-medium">Udostępnij:</span>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url || window.location.href)}`} target="_blank" rel="noopener noreferrer"
        className="w-8 h-8 bg-[#1877F2] rounded-full flex items-center justify-center text-white text-xs font-bold hover:opacity-90">f</a>
      <a href={`https://www.instagram.com/`} target="_blank" rel="noopener noreferrer"
        className="w-8 h-8 bg-gradient-to-br from-[#F58529] to-[#8134AF] rounded-full flex items-center justify-center text-white text-xs font-bold hover:opacity-90">in</a>
      <button onClick={copyLink}
        className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-xs hover:bg-gray-300 transition-colors" title="Kopiuj link">
        🔗
      </button>
    </div>
  );
}

export default function ListingDetailPage() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const [allListings, setAllListings] = useState([]);
  const [loaded,      setLoaded]      = useState(false);

  useEffect(() => {
    fetch('/api/listings')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) { setAllListings(data); setLoaded(true); return; }
        return fetch('/listings.json').then(r => r.json()).then(d => { setAllListings(Array.isArray(d) ? d : []); setLoaded(true); });
      })
      .catch(() => fetch('/listings.json').then(r => r.json()).then(d => { setAllListings(Array.isArray(d) ? d : []); setLoaded(true); }).catch(() => setLoaded(true)));
  }, []);

  const listing = allListings.find(l => String(l.id) === id);

  if (!loaded) {
    return (
      <div className="text-center py-32">
        <p className="text-4xl animate-bounce">🌊</p>
        <p className="text-gray-500 mt-2">Ładowanie...</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="text-center py-32">
        <p className="text-5xl mb-4">😕</p>
        <h1 className="text-2xl font-black mb-2">Nie znaleziono ogłoszenia</h1>
        <Link to="/" className="text-[#1B4F8A] underline">Wróć na stronę główną</Link>
      </div>
    );
  }

  const cat = CATEGORIES.find(c => c.id === listing.category);
  const singleListingMap = [listing];

  const jsonLd = listing.category === 'wydarzenia' || listing.category === 'koncerty'
    ? {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: listing.title,
        startDate: listing.date ? `${listing.date}T${listing.time || '00:00'}` : undefined,
        location: { '@type': 'Place', name: listing.address, address: { '@type': 'PostalAddress', addressLocality: listing.city, addressCountry: 'PL' } },
        image: listing.image,
        description: listing.description.replace(/<[^>]+>/g, ''),
        offers: listing.price === 0 ? { '@type': 'Offer', price: '0', priceCurrency: 'PLN', availability: 'https://schema.org/InStock' } : { '@type': 'Offer', price: listing.price, priceCurrency: 'PLN' },
      }
    : {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: listing.title,
        image: listing.image,
        address: { '@type': 'PostalAddress', streetAddress: listing.address, addressLocality: listing.city, addressCountry: 'PL' },
        aggregateRating: { '@type': 'AggregateRating', ratingValue: listing.rating, bestRating: 5, reviewCount: Math.floor(listing.rating * 20) },
      };

  return (
    <>
      <Helmet>
        <title>{listing.title} — {listing.city} | Co na Mazurach?</title>
        <meta name="description" content={`${listing.title} w ${listing.city}. ${listing.priceLabel}. Mazury ${new Date().getFullYear()} — Co na Mazurach?`} />
        <meta property="og:title" content={`${listing.title} — ${listing.city}`} />
        <meta property="og:description" content={`${listing.priceLabel} | ${listing.city}, Mazury`} />
        <meta property="og:image" content={listing.image} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={`https://conamazurach.pl/events/${listing.id}`} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-[#1B4F8A] transition-colors">Strona główna</Link>
          <span>›</span>
          <button onClick={() => navigate(`/?category=${listing.category}`)} className="hover:text-[#1B4F8A] transition-colors">
            {cat?.icon} {cat?.label}
          </button>
          <span>›</span>
          <span className="text-[#1C2B3A] font-medium truncate max-w-xs">{listing.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN — 70% */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero image */}
            <div className="rounded-2xl overflow-hidden aspect-video">
              <img
                src={listing.image}
                alt={`${listing.title} — ${listing.city}, Mazury`}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Title + meta */}
            <div>
              {cat && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold mb-3"
                  style={{ backgroundColor: cat.bg, color: cat.color }}>
                  {cat.icon} {cat.label}
                </span>
              )}
              <h1 className="text-2xl md:text-3xl font-black text-[#1C2B3A] dark:text-white leading-tight mb-3">
                {listing.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">📍 {listing.city}</span>
                {listing.date && <span>📅 {new Date(listing.date).toLocaleDateString('pl-PL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>}
                {listing.time && <span>🕐 {listing.time}</span>}
                <StarRating rating={listing.rating} />
              </div>
            </div>

            {/* Tags */}
            {listing.tags && (
              <div className="flex flex-wrap gap-2">
                {listing.tags.map(t => (
                  <span key={t} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">#{t}</span>
                ))}
              </div>
            )}

            {/* Description */}
            <div
              className="prose prose-lg max-w-none text-[#1C2B3A] leading-relaxed [&_h2]:font-black [&_h2]:text-[#1B4F8A] [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1"
              dangerouslySetInnerHTML={{ __html: listing.description }}
            />

            {/* Share */}
            <ShareButtons title={listing.title} url={`https://conamazurach.pl/events/${listing.id}`} />

            {/* Distance Calculator */}
            <DistanceCalculator toLat={listing.lat} toLng={listing.lng} toName={`${listing.title}, ${listing.city}`} />
          </div>

          {/* RIGHT COLUMN — sticky */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 space-y-5">
              {/* Booking card */}
              <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
                <div className="text-3xl font-black text-[#1B4F8A] mb-1">{listing.priceLabel}</div>
                {listing.date && (
                  <p className="text-sm text-gray-500 mb-4">
                    📅 {new Date(listing.date).toLocaleDateString('pl-PL', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                    {listing.time && ` o ${listing.time}`}
                  </p>
                )}
                <div className="space-y-2 text-sm text-gray-600 mb-5">
                  <p className="flex items-start gap-2">
                    <span className="mt-0.5">📍</span>
                    <span>{listing.address}, {listing.city}</span>
                  </p>
                  {listing.isNew && (
                    <span className="inline-block bg-[#FEF3C7] text-[#F4A825] text-xs font-bold px-2 py-1 rounded-full">
                      ✨ Nowość
                    </span>
                  )}
                </div>

                <button className="w-full bg-[#1B4F8A] text-white py-3 rounded-xl font-bold text-lg hover:bg-[#163f70] transition-colors mb-3">
                  {listing.price === 0 ? 'Sprawdź szczegóły' : listing.category === 'noclegi' ? 'Zarezerwuj nocleg' : listing.category === 'koncerty' || listing.category === 'wydarzenia' ? 'Kup bilety' : 'Sprawdź dostępność'}
                </button>
                <button className="w-full border-2 border-[#2E9E6E] text-[#2E9E6E] py-2 rounded-xl font-semibold text-sm hover:bg-[#2E9E6E] hover:text-white transition-colors">
                  📞 Kontakt z organizatorem
                </button>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <ShareButtons title={listing.title} url={`https://conamazurach.pl/events/${listing.id}`} />
                </div>
              </div>

              {/* Mini map */}
              <MapView listings={singleListingMap} height="220px" />
            </div>
          </div>
        </div>

        {/* Related listings */}
        <section className="mt-16">
          <h2 className="text-2xl font-black text-[#1C2B3A] dark:text-white mb-6">
            Podobne oferty na Mazurach
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {allListings
              .filter(l => l.id !== listing.id && l.category === listing.category)
              .slice(0, 3)
              .map(l => (
                <Link key={l.id} to={`/events/${l.id}`} className="group bg-white dark:bg-[#1e293b] rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all hover:scale-[1.01] flex gap-3 p-3">
                  <img src={l.image} alt={l.title} loading="lazy" className="w-20 h-16 rounded-xl object-cover flex-shrink-0" />
                  <div className="flex flex-col justify-center">
                    <p className="font-bold text-sm text-[#1C2B3A] line-clamp-2 leading-tight">{l.title}</p>
                    <p className="text-xs text-gray-500 mt-1">📍 {l.city}</p>
                  </div>
                </Link>
              ))}
          </div>
        </section>
      </div>
    </>
  );
}
