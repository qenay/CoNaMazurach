import { useState } from 'react';
import { MAZURY_CITIES } from '../data/cities';

export default function SearchBar({ onCitySelect }) {
  const [selected, setSelected] = useState('');

  function handleChange(e) {
    const val = e.target.value;
    setSelected(val);
    if (val && onCitySelect) {
      const city = MAZURY_CITIES.find(c => c.name === val);
      onCitySelect(val, city);
    } else if (!val && onCitySelect) {
      onCitySelect(null, null);
    }
  }

  return (
    <div className="flex gap-3 items-center max-w-lg w-full">
      <div className="relative flex-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">📍</span>
        <select
          value={selected}
          onChange={handleChange}
          className="w-full pl-10 pr-4 py-3 rounded-full border-2 border-white/40 bg-white/20 text-white placeholder-white/70 backdrop-blur-sm text-sm font-semibold focus:outline-none focus:border-white appearance-none cursor-pointer"
          style={{ colorScheme: 'dark' }}
        >
          <option value="" className="text-gray-800 bg-white">Wybierz lokalizację...</option>
          {MAZURY_CITIES.map(c => (
            <option key={c.name} value={c.name} className="text-gray-800 bg-white">
              {c.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
