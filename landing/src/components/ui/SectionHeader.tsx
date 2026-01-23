interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  id?: string;
  bordered?: boolean;
}

export default function SectionHeader({
  title,
  subtitle,
  id,
  bordered = false
}: SectionHeaderProps) {
  return (
    <div className="mb-8">
      <h2
        id={id}
        className={`text-3xl font-bold ${bordered ? 'border-b-2 border-brand-eucalyptus pb-2 inline-block' : ''}`}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-brand-slate text-sm">{subtitle}</p>
      )}
    </div>
  );
}
