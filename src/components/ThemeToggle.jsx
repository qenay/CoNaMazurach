import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { GlassFilter } from './ui/liquid-radio';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="inline-flex h-9 rounded-lg p-0.5" style={{ backgroundColor: 'rgba(128,128,128,0.2)' }}>
      <RadioGroup
        value={theme}
        onValueChange={setTheme}
        data-state={theme}
        className="group relative inline-grid grid-cols-[1fr_1fr] items-center gap-0 text-sm font-medium
          after:absolute after:inset-y-0 after:w-1/2 after:rounded-md after:transition-transform after:duration-300
          after:[transition-timing-function:cubic-bezier(0.16,1,0.3,1)]
          data-[state=dark]:after:translate-x-full
          data-[state=light]:after:translate-x-0
          after:bg-white/90 dark:after:bg-white/15
          after:shadow-[0_1px_4px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.8)]
          dark:after:shadow-[0_1px_4px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]"
      >
        <div
          className="absolute top-0 left-0 isolate -z-10 h-full w-full overflow-hidden rounded-md"
          style={{ filter: 'url("#radio-glass")' }}
        />

        {/* Jasny */}
        <label className="relative z-10 inline-flex h-full min-w-8 cursor-pointer select-none items-center justify-center gap-1.5 whitespace-nowrap px-3 transition-colors
          text-gray-400 dark:text-gray-500
          group-data-[state=light]:text-gray-800 dark:group-data-[state=light]:text-white">
          <span className="text-base">☀️</span>
          <span className="text-xs font-semibold hidden sm:inline">Jasny</span>
          <RadioGroupItem value="light" className="sr-only" />
        </label>

        {/* Ciemny */}
        <label className="relative z-10 inline-flex h-full min-w-8 cursor-pointer select-none items-center justify-center gap-1.5 whitespace-nowrap px-3 transition-colors
          text-gray-400 dark:text-gray-500
          group-data-[state=dark]:text-gray-800 dark:group-data-[state=dark]:text-white">
          <span className="text-base">🌙</span>
          <span className="text-xs font-semibold hidden sm:inline">Ciemny</span>
          <RadioGroupItem value="dark" className="sr-only" />
        </label>

        <GlassFilter />
      </RadioGroup>
    </div>
  );
}
