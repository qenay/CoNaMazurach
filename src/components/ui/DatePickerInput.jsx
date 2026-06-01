import { useState, useRef, useEffect } from 'react';

const MONTHS_PL = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec',
                   'Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'];
const DAYS_PL   = ['Pon','Wt','Śr','Czw','Pt','Sob','Ndz'];

function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDay(y, m)    { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1; }
function toISO(y, m, d)       { return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`; }
function formatDisplay(iso)   {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

export default function DatePickerInput({ value, onChange, placeholder = 'Wybierz datę...' }) {
  const today   = new Date();
  const initY   = value ? parseInt(value.split('-')[0]) : today.getFullYear();
  const initM   = value ? parseInt(value.split('-')[1]) - 1 : today.getMonth();

  const [open,  setOpen]  = useState(false);
  const [year,  setYear]  = useState(initY);
  const [month, setMonth] = useState(initM);
  const wrapRef = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function prev() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function next() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  function selectDay(day) {
    onChange(toISO(year, month, day));
    setOpen(false);
  }

  const daysInMonth  = getDaysInMonth(year, month);
  const firstWeekday = getFirstDay(year, month);
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selectedDay = value ? parseInt(value.split('-')[2]) : null;
  const selectedM   = value ? parseInt(value.split('-')[1]) - 1 : null;
  const selectedY   = value ? parseInt(value.split('-')[0]) : null;

  return (
    <div ref={wrapRef} className="relative">
      {/* Input trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-left flex items-center justify-between focus:outline-none focus:border-[#1B4F8A] focus:ring-2 focus:ring-[#1B4F8A]/20 bg-white dark:bg-[#0f172a] dark:border-gray-600 dark:text-gray-200 transition-colors"
      >
        <span className={value ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400'}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        <span className="text-gray-400 text-base">📅</span>
      </button>

      {/* Dropdown calendar */}
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 rounded-2xl overflow-hidden shadow-xl border border-gray-100 dark:border-gray-700 w-72">
          {/* Gradient header */}
          <div className="bg-gradient-to-r from-[#1B4F8A] to-[#2563EB] px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <button type="button" onClick={prev}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-base font-bold transition-colors">
                ‹
              </button>
              <div className="text-center">
                <p className="text-white font-black text-sm" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  {MONTHS_PL[month]} {year}
                </p>
              </div>
              <button type="button" onClick={next}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-base font-bold transition-colors">
                ›
              </button>
            </div>
            <div className="grid grid-cols-7">
              {DAYS_PL.map((d, i) => (
                <div key={d} className={`text-center text-[11px] font-bold py-0.5 ${i >= 5 ? 'text-blue-300' : 'text-blue-100'}`}>{d}</div>
              ))}
            </div>
          </div>

          {/* Days */}
          <div className="bg-white dark:bg-[#1e293b] px-2 py-2">
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((day, idx) => {
                if (!day) return <div key={`e-${idx}`} />;
                const isToday    = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                const isSelected = day === selectedDay && month === selectedM && year === selectedY;
                const isWeekend  = ((firstWeekday + day - 1) % 7) >= 5;
                return (
                  <button
                    type="button"
                    key={day}
                    onClick={() => selectDay(day)}
                    className={`w-full aspect-square rounded-full text-xs font-semibold transition-all flex items-center justify-center
                      ${isSelected
                        ? 'bg-[#1B4F8A] text-white shadow-md scale-110'
                        : isToday
                        ? 'bg-[#F4A825] text-white font-black'
                        : isWeekend
                        ? 'text-[#2E9E6E] dark:text-emerald-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {value && (
              <button type="button" onClick={() => { onChange(''); setOpen(false); }}
                className="mt-2 w-full text-xs text-gray-400 hover:text-red-500 transition-colors text-center">
                Wyczyść ×
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
