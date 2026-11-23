import { useId, type FormEventHandler, type ReactNode } from 'react';

interface SettingsCardProps {
  title: string;
  description: string;
  children: ReactNode;
  /** Bas de carte : dernière modification et bouton d'enregistrement. */
  footer?: ReactNode;
  onSubmit?: FormEventHandler<HTMLFormElement>;
}

/** Bloc de réglages : un formulaire quand il s'enregistre, une simple section sinon. */
export default function SettingsCard({ title, description, children, footer, onSubmit }: SettingsCardProps) {
  const titleId = useId();
  const body = (
    <>
      <header className="border-b border-line px-5 py-4 sm:px-6">
        <h3 id={titleId} className="text-base font-black text-ink">
          {title}
        </h3>
        <p className="mt-1 text-body-sm text-muted">{description}</p>
      </header>
      <div className="px-5 py-5 sm:px-6">{children}</div>
      {footer && (
        <footer className="flex flex-col gap-3 border-t border-line bg-paper px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          {footer}
        </footer>
      )}
    </>
  );

  const className = 'overflow-hidden rounded-card border border-line bg-white';

  if (onSubmit) {
    return (
      <form aria-labelledby={titleId} onSubmit={onSubmit} noValidate className={className}>
        {body}
      </form>
    );
  }

  return (
    <section aria-labelledby={titleId} className={className}>
      {body}
    </section>
  );
}
