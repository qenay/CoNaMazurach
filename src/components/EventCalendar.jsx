import { useState } from 'react';

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfWeek(year, month) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

const MONTHS_PL = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec',
                   'Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'];
const DAYS_PL   = ['Pon','Wt','Śr','Czw','Pt','Sob','Ndz'];

export default function EventCalendar({ listings, onDaySelect, selectedDay }) {
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const daysInMonth  = getDaysInMonth(year, month);
  const firstWeekday = getFirstDayOfWeek(year, month);

  const eventDays = new Set(
    listings
      .filter(l => l.date)
      .filter(l => {
        const d = new Date(l.date);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .map(l => new Date(l.date).getDate())
  );

  function prev() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function next() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="rounded-2xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700 max-w-md">

      {/* Gradient header */}
      <div className="bg-gradient-to-r from-[#1B4F8A] to-[#2563EB] px-5 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={prev}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors flex items-center justify-center text-lg font-bold"
          >
            ‹
          </button>
          <div className="text-center">
            <p className="text-white font-black text-lg tracking-wide" style={{ fontFamily: 'Nunito, sans-serif' }}>
              {MONTHS_PL[month]}
            </p>
            <p className="text-blue-200 text-xs font-semibold">{year}</p>
          </div>
          <button
            onClick={next}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors flex items-center justify-center text-lg font-bold"
          >
            ›
          </button>
        </div>

        {/* Day labels in header */}
        <div className="grid grid-cols-7 mt-4">
          {DAYS_PL.map((d, i) => (
            <div
              key={d}
              className={`text-center text-xs font-bold py-1 ${i >= 5 ? 'text-blue-300' : 'text-blue-100'}`}
            >
              {d}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar body */}
      <div className="bg-white dark:bg-[#1e293b] px-3 py-3">
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((day, idx) => {
            if (!day) return <div key={`e-${idx}`} />;

            const hasEvent  = eventDays.has(day);
            const isToday   = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const isSelected = selectedDay?.day === day && selectedDay?.month === month && selectedDay?.year === year;
            const isWeekend = ((firstWeekday + day - 1) % 7) >= 5;

            return (
              <button
                key={day}
                onClick={() => onDaySelect?.(isSelected ? null : { day, month, year })}
                className={`
                  relative w-full aspect-square rounded-full text-sm font-semibold
                  transition-all duration-150 flex flex-col items-center justify-center
                  ${isSelected
                    ? 'bg-[#1B4F8A] text-white shadow-md scale-110'
                    : isToday
                    ? 'bg-[#F4A825] text-white font-black shadow-sm'
                    : hasEvent
                    ? 'bg-[#1B4F8A]/15 dark:bg-blue-900/40 text-[#1B4F8A] dark:text-blue-300 font-bold ring-2 ring-[#1B4F8A]/40 hover:bg-[#1B4F8A] hover:text-white hover:ring-0'
                    : isWeekend
                    ? 'text-[#2E9E6E] dark:text-emerald-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
              >
                {day}
                {hasEvent && !isSelected && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#F4A825]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between px-1">
          <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#F4A825] inline-block" /> Dziś
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-200 dark:bg-blue-700 inline-block" /> Wydarzenie
            </span>
          </div>
          {selectedDay && (
            <button
              onClick={() => onDaySelect?.(null)}
              className="text-xs text-[#1B4F8A] dark:text-blue-400 font-semibold hover:underline transition-colors"
            >
              Wyczyść ×
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
