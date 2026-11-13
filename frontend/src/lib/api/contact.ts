import { API_URL } from './client';

export interface ContactMessage {
  nom: string;
  email: string;
  sujet: string;
  message: string;
}

export async function sendContactMessage(input: ContactMessage): Promise<void> {
  const response = await fetch(`${API_URL}/api/contact`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const responseMessage =
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof data.message === 'string'
        ? data.message
        : 'Une erreur est survenue lors de l’envoi de votre message.';

    throw new Error(responseMessage);
  }
}
