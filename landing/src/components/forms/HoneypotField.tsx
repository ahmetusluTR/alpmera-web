// Honeypot field to catch bots
// Invisible to users, bots will fill it

interface HoneypotFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export function HoneypotField({ value, onChange }: HoneypotFieldProps) {
  return (
    <div
      aria-hidden="true"
      className="absolute w-0 h-0 overflow-hidden opacity-0 pointer-events-none"
      style={{
        clip: 'rect(0, 0, 0, 0)',
        clipPath: 'inset(50%)',
        whiteSpace: 'nowrap',
      }}
    >
      <label htmlFor="website">Website</label>
      <input
        type="text"
        id="website"
        name="website"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
      />
    </div>
  );
}
