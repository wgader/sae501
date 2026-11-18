import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Sans cette déclaration, « text-caption » passe pour une couleur et disparaît face à « text-ink ».
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['micro', 'caption', 'label', 'meta', 'body-sm', 'body', 'body-lg'],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
