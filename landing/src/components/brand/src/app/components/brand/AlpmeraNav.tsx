import React from 'react';
import { AlpmeraLogo } from './AlpmeraLogo';

interface NavItem {
  label: string;
  href: string;
  active?: boolean;
}

interface AlpmeraNavProps {
  items: NavItem[];
  showLogo?: boolean;
}

export function AlpmeraNav({ items, showLogo = true }: AlpmeraNavProps) {
  return (
    <nav 
      className="w-full px-8 py-4 border-b"
      style={{ 
        backgroundColor: '#F0EDE5',
        borderColor: 'rgba(15, 32, 67, 0.1)'
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        {showLogo && (
          <div className="flex items-center gap-3">
            <AlpmeraLogo variant="simplified" size="sm" />
            <span 
              className="text-xl tracking-tight"
              style={{ 
                fontFamily: 'var(--font-sans)',
                fontWeight: 700,
                color: '#0F2043',
                letterSpacing: '-0.02em'
              }}
            >
              ALPMERA
            </span>
          </div>
        )}

        {/* Navigation items */}
        <div className="flex items-center gap-1">
          {items.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className={`
                px-4 py-2 rounded-md transition-all
                ${item.active 
                  ? 'bg-[#0F2043] text-[#F0EDE5]' 
                  : 'text-[#0F2043] hover:bg-[#0F2043]/5'
                }
              `}
              style={{ 
                fontFamily: 'var(--font-sans)',
                fontWeight: 500
              }}
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}

interface AlpmeraSidebarProps {
  items: NavItem[];
  children?: React.ReactNode;
}

export function AlpmeraSidebar({ items, children }: AlpmeraSidebarProps) {
  return (
    <aside 
      className="w-64 h-screen p-6 border-r flex flex-col"
      style={{ 
        backgroundColor: '#0F2043',
        borderColor: 'rgba(240, 237, 229, 0.1)'
      }}
    >
      {/* Logo */}
      <div className="mb-8 pb-6 border-b" style={{ borderColor: 'rgba(240, 237, 229, 0.1)' }}>
        <AlpmeraLogo variant="simplified" size="md" />
        <span 
          className="block mt-3 text-lg tracking-tight"
          style={{ 
            fontFamily: 'var(--font-sans)',
            fontWeight: 700,
            color: '#F0EDE5',
            letterSpacing: '-0.02em'
          }}
        >
          ALPMERA
        </span>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 space-y-1">
        {items.map((item, index) => (
          <a
            key={index}
            href={item.href}
            className={`
              block px-4 py-3 rounded-md transition-all
              ${item.active 
                ? 'bg-[#B87333] text-[#F0EDE5]' 
                : 'text-[#F0EDE5]/80 hover:bg-[#1a3562] hover:text-[#F0EDE5]'
              }
            `}
            style={{ 
              fontFamily: 'var(--font-sans)',
              fontWeight: 500
            }}
          >
            {item.label}
          </a>
        ))}
      </nav>

      {/* Additional content */}
      {children && (
        <div className="mt-auto pt-6 border-t" style={{ borderColor: 'rgba(240, 237, 229, 0.1)' }}>
          {children}
        </div>
      )}
    </aside>
  );
}
