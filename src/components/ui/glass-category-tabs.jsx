import { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import { CATEGORIES } from '../../data/mockListings';
import { useTheme } from '../../context/ThemeContext';

const ALL_TABS = [
  { id: null, label: '🗺️ Wszystkie', color: '#1B4F8A' },
  ...CATEGORIES.map(c => ({ id: c.id, label: `${c.icon} ${c.label}`, color: c.color })),
];

const StyledWrapper = styled.div`
  .glass-radio-group {
    display: flex;
    position: relative;
    background: ${p => p.$dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'};
    border-radius: 2rem;
    backdrop-filter: blur(12px);
    overflow: hidden;
    width: fit-content;
    box-shadow: ${p => p.$dark
      ? 'inset 1px 1px 4px rgba(255,255,255,0.2), inset -1px -1px 6px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.15)'
      : 'inset 1px 1px 4px rgba(255,255,255,0.7), inset -1px -1px 4px rgba(0,0,0,0.07), 0 2px 10px rgba(0,0,0,0.07)'};
  }

  .glass-glider {
    position: absolute;
    top: 0;
    bottom: 0;
    border-radius: 2rem;
    z-index: 1;
    transition:
      left 0.45s cubic-bezier(0.37, 1.95, 0.66, 0.56),
      width 0.3s ease,
      background 0.35s ease,
      box-shadow 0.35s ease;
  }

  .glass-tab {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.4rem 1rem;
    font-size: 0.875rem;
    font-weight: 600;
    white-space: nowrap;
    cursor: pointer;
    border: none;
    background: transparent;
    color: ${p => p.$dark ? '#9ca3af' : '#6b7280'};
    position: relative;
    z-index: 2;
    transition: color 0.3s ease;
    font-family: inherit;
    letter-spacing: 0.01em;
  }

  .glass-tab:hover {
    color: ${p => p.$dark ? '#e5e7eb' : '#374151'};
  }

  .glass-tab.active {
    color: #fff !important;
  }
`;

export default function GlassCategoryTabs({ activeCategory, onCategoryChange }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const tabRefs = useRef([]);
  const [glider, setGlider] = useState({ left: 0, width: 0 });

  const activeIndex = activeCategory === null
    ? 0
    : Math.max(0, ALL_TABS.findIndex(t => t.id === activeCategory));

  const activeColor = ALL_TABS[activeIndex]?.color ?? '#1B4F8A';

  useEffect(() => {
    const el = tabRefs.current[activeIndex];
    if (el) setGlider({ left: el.offsetLeft, width: el.offsetWidth });
  }, [activeIndex]);

  return (
    <StyledWrapper $dark={isDark}>
      <div className="glass-radio-group">
        <div
          className="glass-glider"
          style={{
            left: glider.left,
            width: glider.width,
            background: `linear-gradient(135deg, ${activeColor}bb, ${activeColor})`,
            boxShadow: `0 0 18px ${activeColor}55, inset 0 0 10px rgba(255,255,255,0.2)`,
          }}
        />
        {ALL_TABS.map((tab, i) => (
          <button
            key={i}
            ref={el => { tabRefs.current[i] = el; }}
            className={`glass-tab${activeIndex === i ? ' active' : ''}`}
            onClick={() => onCategoryChange?.(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </StyledWrapper>
  );
}
