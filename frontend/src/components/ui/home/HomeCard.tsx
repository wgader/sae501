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
  pink: 'bg-[var(--Misty-Rose)] text-[var(--ink)]',
  green: 'bg-[var(--Lime-Cream)] text-[var(--ink)]',
  purple: 'bg-[var(--Indigo-Bloom)] text-[var(--White)]',
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
        'flex min-h-[320px] w-full flex-col rounded-[24px] border border-black/10 px-[28px] pb-[28px] pt-[26px]',
        variantStyles[variant],
        className,
      ].join(' ')}
    >
      <div className="flex items-start justify-between">
        <p className="text-[12px] font-bold uppercase tracking-[1.7px]">
          {tag}
        </p>
        <p className="text-[12px] font-bold uppercase tracking-[1.7px]">
          {String(number).padStart(2, '0')}
        </p>
      </div>

      <div className="mt-[18px] flex flex-1 flex-col justify-end">
        <h3 className="max-w-[320px] text-[clamp(2.1rem,2.5vw,3.4rem)] font-black leading-[0.96] tracking-[-0.8px]">
          {name}
        </h3>

        <p className="mt-[14px] max-w-[340px] text-[15px] leading-[1.48] opacity-90">
          {desc}
        </p>
      </div>

      <div className="mt-[18px] flex items-center justify-between border-t border-current/80 pt-[18px]">
        <p className="text-[12px] font-bold uppercase tracking-[1.7px]">
          Démarrer
        </p>

        <span
          className={[
            'grid h-[38px] w-[38px] place-items-center rounded-full',
            isPurple ? 'bg-white text-black' : 'bg-black text-white',
          ].join(' ')}
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-[18px] w-[18px]"
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