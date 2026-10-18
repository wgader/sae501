// components/layout/Header.tsx
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { JSX } from 'react/jsx-runtime';

interface headerProps extends React.PropsWithChildren {
  children?: React.ReactNode | JSX.Element;
  className?: string;
}

export default function Header({
  children,
  className }: headerProps) {
  return (
    <header className={cn("mx-auto flex min-h-[104px] w-full max-w-[1440px] items-center justify-between px-[clamp(20px,3.61vw,52px)] py-5", className)}>
      <div className="flex items-center gap-2 font-bold text-base sm:text-lg">
        <Image
          src="/assets/logo-feytiat.svg"
          alt="Logo Feytiat"
          width={364}
          height={75}
          priority
          className="h-auto w-[min(364px,36vw)] sm:w-[min(364px,38vw)] lg:w-[364px]"
        />
      </div>
      

      {children}

    </header>
  );
}