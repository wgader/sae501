'use client';
import { SignupProvider } from '@/context/SignupContext';
import AsideSignup from '@/components/layout/AsideSignup';

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return (
    <SignupProvider>
      <div className="flex min-h-screen w-full flex-row">
        <AsideSignup />
        <div className="min-w-0 flex-1 bg-white">{children}</div>
      </div>
    </SignupProvider>
  );
}
