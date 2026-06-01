import { useState } from 'react';

export default function SearchBar({ onCitySelect }) {
  const [value, setValue] = useState('');

  function handleChange(e) {
    const val = e.target.value;
    setValue(val);
    if (onCitySelect) onCitySelect(val || null, null);
  }

  return (
    <div className="flex gap-3 items-center max-w-lg w-full">
      <div className="relative flex-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">📍</span>
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder="Wpisz miasto..."
          className="w-full pl-10 pr-4 py-3 rounded-full border-2 border-white/40 bg-white/20 text-white placeholder-white/70 backdrop-blur-sm text-sm font-semibold focus:outline-none focus:border-white"
        />
      </div>
    </div>
  );
}
