import Image from 'next/image';
import Link from 'next/link';
import LandingFooter from '@/components/landing/LandingFooter';
import ContactForm from '@/components/contact/ContactForm';

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-ink antialiased">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-340 items-center justify-between px-4 py-5 sm:px-8 lg:px-12">
          <Link href="/" aria-label="Accueil Feytiat">
            <Image
              src="/assets/logo-feytiat.svg"
              alt="Ville de Feytiat"
              width={160}
              height={33}
              priority
              className="h-8 w-auto object-contain"
            />
          </Link>
          <Link
            href="/"
            className="text-xs font-bold uppercase tracking-label text-primary transition-colors hover:text-primary-hover"
          >
            Retour à l’accueil
          </Link>
        </div>
      </header>

      <main className="flex-1 bg-paper px-4 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <header className="mb-8 text-center">
            <p className="text-label font-bold uppercase tracking-eyebrow text-primary">
              Espace associations · Feytiat
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-display text-ink sm:text-4xl">
              Contactez-nous
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-copy text-muted">
              Une question sur vos démarches ou les services municipaux ? Envoyez-nous
              un message, nous vous répondrons dès que possible.
            </p>
          </header>

          <section
            aria-labelledby="contact-form-title"
            className="rounded-panel border border-line bg-white p-6 shadow-panel sm:p-8"
          >
            <h2 id="contact-form-title" className="sr-only">
              Formulaire de contact
            </h2>
            <ContactForm />
            <p className="mt-6 border-t border-line pt-5 text-sm text-muted">
              Vous pouvez également nous écrire directement à{' '}
              <a
                href="mailto:contact@ville-feytiat.fr"
                className="font-semibold text-primary underline underline-offset-2"
              >
                contact@ville-feytiat.fr
              </a>
              .
            </p>
          </section>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
