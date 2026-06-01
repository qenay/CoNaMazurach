import { Link } from 'react-router-dom';
import { CATEGORIES } from '../data/mockListings';

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString('pl-PL', { weekday: 'short', day: '2-digit', month: '2-digit' });
}

function StarRating({ rating }) {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span className="flex items-center gap-0.5 text-[#F4A825] text-xs">
      {'★'.repeat(full)}
      {half ? '½' : ''}
      {'☆'.repeat(empty)}
      <span className="text-gray-500 ml-1">{rating.toFixed(1)}</span>
    </span>
  );
}

export default function ListingCard({ listing }) {
  const cat = CATEGORIES.find(c => c.id === listing.category);
  const dateStr = formatDate(listing.date);

  return (
    <Link
      to={`/events/${listing.id}`}
      className="group bg-white dark:bg-[#1e293b] rounded-2xl overflow-hidden shadow-sm hover:shadow-lg dark:hover:shadow-black/40 transition-all duration-300 hover:scale-[1.02] flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={listing.image}
          alt={`${listing.title} — ${listing.city}, Mazury`}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Category badge */}
        {cat && (
          <span
            className="absolute top-2 left-2 px-2.5 py-1 rounded-full text-xs font-bold"
            style={{ backgroundColor: cat.bg, color: cat.color }}
          >
            {cat.icon} {cat.label}
          </span>
        )}
        {/* New badge */}
        {listing.isNew && (
          <span className="absolute top-2 right-2 bg-[#F4A825] text-white px-2.5 py-1 rounded-full text-xs font-bold">
            Nowość
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        {dateStr && listing.time && (
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
            {dateStr}, {listing.time}
          </p>
        )}

        <h3 className="font-bold text-[#1C2B3A] dark:text-white text-base leading-tight line-clamp-2">
          {listing.title}
        </h3>

        <div className="flex items-center gap-1 text-gray-500 text-sm">
          <span>📍</span>
          <span className="truncate">{listing.city}</span>
        </div>

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100 dark:border-gray-700">
          <StarRating rating={listing.rating} />
          <span
            className="px-3 py-1 rounded-full text-xs font-bold text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#1B4F8A' }}
          >
            {listing.priceLabel}
          </span>
        </div>
      </div>
    </Link>
  );
}
