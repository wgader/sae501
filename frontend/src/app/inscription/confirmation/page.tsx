import Link from 'next/link';
import { IconChevronRight } from '@/components/ui/icons';


export default function ConfirmationPage() {
  return (
    <div className="flex min-h-full items-center justify-center bg-white px-6 pt-10 sm:px-10 lg:px-16 lg:pt-12">
      <div className="w-full max-w-[620px] text-center">
        <h1 className="text-[clamp(2rem,3vw,4rem)] font-black leading-[0.95] tracking-[-0.08em] text-[var(--ink)]">
          Demande envoyée
        </h1>

        <p className="mt-6 text-[15px] text-[var(--ink)]/70">
          Votre demande d&apos;inscription a bien été reçue. Vous recevrez un email
          dès qu&apos;elle aura été examinée par le service des associations.
        </p>

        <Link
          href="/connexion"
          className="mt-10 inline-flex items-center gap-2 text-[14px] font-bold uppercase tracking-[0.18em] text-[var(--Mosaic-Tile)]"
        >
          <span>Retour à la connexion</span>
          <IconChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}