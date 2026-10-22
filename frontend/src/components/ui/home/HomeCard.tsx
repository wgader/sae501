interface HomeCardProps {
  tag: string;
  number: number | string;
  name: string;
  desc: string;
  variant?: 'pink' | 'green' | 'purple';
  children?: React.ReactNode;
  className?: string;
}

const variantStyles = {
  pink: 'bg-rose-100 text-ink',
  green: 'bg-accent text-ink',
  purple: 'bg-indigo text-white',
};

export default function HomeCard({
  tag,
  number,
  name,
  desc,
  variant = 'pink',
  children,
  className,
}: HomeCardProps) {
  const isPurple = variant === 'purple';

  return (
    <article
      className={[
        'flex min-h-80 w-full flex-col rounded-card border border-black/10 px-7 pb-7 pt-6.5',
        variantStyles[variant],
        className,
      ].join(' ')}
    >
      <div className="flex items-start justify-between">
        <p className="text-meta font-bold uppercase tracking-widest">
          {tag}
        </p>
        <p className="text-meta font-bold uppercase tracking-widest">
          {String(number).padStart(2, '0')}
        </p>
      </div>

      <div className="mt-4.5 flex flex-1 flex-col justify-end">
        <h3 className="max-w-80 text-[clamp(2.1rem,2.5vw,3.4rem)] font-black leading-none tracking-tight">
          {name}
        </h3>

        <p className="mt-3.5 max-w-85 text-body leading-relaxed opacity-90">
          {desc}
        </p>
      </div>

      <div className="mt-4.5 flex items-center justify-between border-t border-current/80 pt-4.5">
        <p className="text-meta font-bold uppercase tracking-widest">
          Démarrer
        </p>

        <span
          className={[
            'grid size-9.5 place-items-center rounded-full',
            isPurple ? 'bg-white text-black' : 'bg-black text-white',
          ].join(' ')}
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="size-4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h12" />
            <path d="M13 5l7 7-7 7" />
          </svg>
        </span>
      </div>

      {children}
    </article>
  );
}