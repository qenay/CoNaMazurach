import { useState } from 'react';

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfWeek(year, month) {
  let d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1; // Monday = 0
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

  // Which days have events?
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 max-w-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prev} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600">‹</button>
        <h3 className="font-bold text-[#1C2B3A] text-lg">{MONTHS_PL[month]} {year}</h3>
        <button onClick={next} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600">›</button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS_PL.map(d => (
          <div key={d} className="text-center text-xs font-bold text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} />;
          const hasEvent = eventDays.has(day);
          const isToday  = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const isSelected = selectedDay && selectedDay.day === day && selectedDay.month === month && selectedDay.year === year;

          return (
            <button
              key={day}
              onClick={() => onDaySelect && onDaySelect(isSelected ? null : { day, month, year })}
              className={`relative w-full aspect-square rounded-xl text-sm font-semibold transition-all flex items-center justify-center ${
                isSelected
                  ? 'bg-[#1B4F8A] text-white'
                  : isToday
                  ? 'bg-[#FEF3C7] text-[#F4A825] font-black'
                  : hasEvent
                  ? 'bg-[#DBEAFE] text-[#1B4F8A] hover:bg-[#1B4F8A] hover:text-white cursor-pointer'
                  : 'text-gray-600 hover:bg-gray-100 cursor-pointer'
              }`}
            >
              {day}
              {hasEvent && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#F4A825]" />
              )}
            </button>
          );
        })}
      </div>

      {selectedDay && (
        <button
          onClick={() => onDaySelect && onDaySelect(null)}
          className="mt-3 w-full text-xs text-gray-500 hover:text-[#1B4F8A] transition-colors"
        >
          Wyczyść filtr daty ×
        </button>
      )}
    </div>
  );
}
