'use client';

import { useState, type FormEvent } from 'react';
import { sendContactMessage } from '@/lib/api';
import Button from '@/components/ui/Button';

export default function ContactForm() {
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [sujet, setSujet] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSent(false);
    setIsSubmitting(true);

    try {
      await sendContactMessage({ nom, email, sujet, message });
      setNom('');
      setEmail('');
      setSujet('');
      setMessage('');
      setSent(true);
    } catch (cause) {
      console.error('Échec de l’envoi du formulaire de contact.', cause);
      setError(
        cause instanceof Error
          ? cause.message
          : 'Impossible d’envoyer votre message pour le moment.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <p
          className="rounded-control border border-danger/30 bg-rose-50 p-4 text-sm font-semibold text-danger"
          role="alert"
        >
          {error}
        </p>
      )}
      {sent && (
        <p
          className="rounded-control border border-primary/30 bg-primary-soft p-4 text-sm font-semibold text-primary"
          role="status"
        >
          Votre message a bien été envoyé. La mairie vous répondra dès que possible.
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-bold text-ink">
          Nom
          <input
            name="name"
            autoComplete="name"
            required
            maxLength={120}
            value={nom}
            onChange={(event) => setNom(event.target.value)}
            className="mt-2 w-full rounded-control border border-line bg-white px-4 py-3 text-sm font-normal text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <label className="block text-sm font-bold text-ink">
          Adresse e-mail
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-control border border-line bg-white px-4 py-3 text-sm font-normal text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
      </div>

      <label className="block text-sm font-bold text-ink">
        Sujet
        <input
          name="subject"
          required
          maxLength={150}
          value={sujet}
          onChange={(event) => setSujet(event.target.value)}
          className="mt-2 w-full rounded-control border border-line bg-white px-4 py-3 text-sm font-normal text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </label>

      <label className="block text-sm font-bold text-ink">
        Votre message
        <textarea
          name="message"
          required
          minLength={10}
          maxLength={5000}
          rows={7}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="mt-2 w-full resize-y rounded-control border border-line bg-white px-4 py-3 text-sm font-normal text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </label>

      <Button type="submit" size="md" isLoading={isSubmitting}>
        Envoyer le message
      </Button>
    </form>
  );
}
