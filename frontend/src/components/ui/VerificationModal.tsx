// components/ui/VerificationModal.tsx
import { useState } from 'react';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (code: string) => void;
  recipient: string;
  channel?: 'email' | 'sms';
}

export default function VerificationModal({ isOpen, onClose, onVerify, recipient, channel = 'sms' }: VerificationModalProps) {
  const [code, setCode] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onVerify(code);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e2420]/60 p-4 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl sm:p-8">
        <h3 className="mb-2 text-xl font-black uppercase tracking-tight text-[#1e2420]">
          Vérification par {channel === 'sms' ? 'SMS' : 'email'}
        </h3>
        <p className="mb-6 text-sm text-[#6d746e]">
          Un code de vérification a été envoyé au <strong className="text-[#1e2420]">{recipient}</strong>. Veuillez le saisir ci-dessous pour continuer.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-[#1e2420]">Code à 6 chiffres *</label>
            <input
              type="text"
              required
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))} // N'accepte que les chiffres
              className="w-full rounded-md border border-[#d9ded9] bg-[#f7f8f4] px-4 py-3 text-center text-2xl font-bold tracking-[0.25em] outline-none transition-colors focus:border-[#0b644d] focus:ring-1 focus:ring-[#0b644d]"
              maxLength={6}
              autoFocus
            />
          </div>

          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-[#d9ded9] bg-white px-4 py-3 text-xs font-bold text-[#1e2420] transition-colors hover:bg-[#f7f8f4]"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={code.length < 6}
              className="flex-1 rounded-md bg-[#0b644d] px-4 py-3 text-xs font-bold text-white transition-colors hover:bg-[#084e3c] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Vérifier
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}