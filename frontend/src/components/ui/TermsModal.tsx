'use client';

type TermsModalProps = {
  onClose: () => void;
};

const termsSections = [
  {
    title: '1. Objet',
    text: "Les présentes conditions définissent les règles d'accès et d'utilisation du service. La création d'un compte signifie que vous acceptez ces conditions dans leur intégralité.",
  },
  {
    title: '2. Création du compte',
    text: "Vous devez fournir des informations exactes et à jour. Votre compte est personnel : vous êtes responsable de la confidentialité de vos identifiants et de toute activité réalisée depuis celui-ci.",
  },
  {
    title: '3. Données personnelles',
    text: "Les coordonnées du contact de l'association sont utilisées pour instruire le dossier, sécuriser l'accès au service et transmettre les notifications liées à la demande. Elles ne sont pas vendues.",
  },
  {
    title: '4. Utilisation du service',
    text: "Vous vous engagez à utiliser le service de manière légale, respectueuse et conforme à sa finalité. Toute utilisation frauduleuse ou tentative d'accès non autorisé peut entraîner la suspension du compte.",
  },
  {
    title: '5. Contact',
    text: "Pour toute question concernant ces conditions ou l'exercice de vos droits, adressez-vous à la mairie de Feytiat via le canal de contact indiqué sur le portail.",
  },
];

export default function TermsModal({ onClose }: TermsModalProps) {
  return (
    <div
      className="fixed inset-0 z-10 flex items-center justify-center bg-[#1e2420]/50 px-5 py-8"
      role="presentation"
      onClick={onClose}
    >
      <section
        className="max-h-full w-full max-w-2xl overflow-y-auto bg-[#f7f8f4] p-7 text-[#1e2420] shadow-2xl sm:p-10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-7 flex items-start justify-between gap-6 border-b border-[#d9ded9] pb-5">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#496a56]">
              Informations légales
            </p>
            <h2 id="terms-title" className="text-2xl font-black uppercase tracking-[-0.04em] sm:text-3xl">
              Conditions générales d&apos;utilisation
            </h2>
          </div>
          <button
            className="shrink-0 text-2xl leading-none text-[#6d746e] transition hover:text-[#1e2420]"
            type="button"
            aria-label="Fermer les conditions générales d'utilisation"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="space-y-6 text-sm leading-6 text-[#4f5851]">
          <p>Dernière mise à jour : 15 septembre 2026</p>
          {termsSections.map((section) => (
            <div key={section.title}>
              <h3 className="mb-1 font-bold text-[#1e2420]">{section.title}</h3>
              <p>{section.text}</p>
            </div>
          ))}
        </div>

        <button
          className="mt-8 w-full bg-[#1e2420] px-5 py-3.5 text-xs font-bold uppercase tracking-[0.15em] text-white transition hover:bg-[#496a56]"
          type="button"
          onClick={onClose}
        >
          Fermer
        </button>
      </section>
    </div>
  );
}
