import React from 'react';

interface AlpmeraInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function AlpmeraInput({ 
  label, 
  error, 
  className = '',
  ...props 
}: AlpmeraInputProps) {
  return (
    <div className="w-full">
      {label && (
        <label 
          className="block mb-2 text-sm opacity-70"
          style={{ fontFamily: 'var(--font-sans)', color: '#1B4D3E' }}
        >
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-4 py-3
          bg-white
          border-2 border-[#1B4D3E]/20
          rounded-md
          focus:border-[#C9A962]
          focus:outline-none
          focus:ring-2
          focus:ring-[#C9A962]/20
          transition-all
          placeholder:text-[#1B4D3E]/40
          ${error ? 'border-red-500' : ''}
          ${className}
        `}
        style={{ fontFamily: 'var(--font-sans)' }}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500" style={{ fontFamily: 'var(--font-sans)' }}>
          {error}
        </p>
      )}
    </div>
  );
}

interface AlpmeraSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export function AlpmeraSelect({ 
  label, 
  error, 
  options,
  className = '',
  ...props 
}: AlpmeraSelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label 
          className="block mb-2 text-sm opacity-70"
          style={{ fontFamily: 'var(--font-sans)', color: '#1B4D3E' }}
        >
          {label}
        </label>
      )}
      <select
        className={`
          w-full px-4 py-3
          bg-white
          border-2 border-[#1B4D3E]/20
          rounded-md
          focus:border-[#C9A962]
          focus:outline-none
          focus:ring-2
          focus:ring-[#C9A962]/20
          transition-all
          ${error ? 'border-red-500' : ''}
          ${className}
        `}
        style={{ fontFamily: 'var(--font-sans)' }}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-500" style={{ fontFamily: 'var(--font-sans)' }}>
          {error}
        </p>
      )}
    </div>
  );
}

interface AlpmeraCheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

export function AlpmeraCheckbox({ label, className = '', ...props }: AlpmeraCheckboxProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        className={`
          w-5 h-5
          rounded
          border-2 border-[#1B4D3E]/30
          text-[#C9A962]
          focus:ring-2
          focus:ring-[#C9A962]/20
          cursor-pointer
          ${className}
        `}
        {...props}
      />
      <span 
        className="text-base"
        style={{ fontFamily: 'var(--font-sans)', color: '#1B4D3E' }}
      >
        {label}
      </span>
    </label>
  );
}

interface AlpmeraToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export function AlpmeraToggle({ checked, onChange, label }: AlpmeraToggleProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div 
          className={`
            w-12 h-6 rounded-full transition-colors duration-200
            ${checked ? 'bg-[#3A6B5A]' : 'bg-[#1B4D3E]/20'}
          `}
        />
        <div 
          className={`
            absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white
            transition-transform duration-200
            shadow-md
            ${checked ? 'translate-x-6' : 'translate-x-0'}
          `}
        />
      </div>
      {label && (
        <span 
          className="text-base"
          style={{ fontFamily: 'var(--font-sans)', color: '#1B4D3E' }}
        >
          {label}
        </span>
      )}
    </label>
  );
}