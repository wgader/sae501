'use client';

import { useId, useRef, useState, type ChangeEvent } from 'react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import { IconTrash, IconUpload } from '@/components/ui/icons';
import { deleteAssociationPhoto, uploadAssociationPhoto } from '@/lib/api/auth';
import { getMediaUrl } from '@/lib/api/client';
import type { AccountProfile } from '@/lib/api/types';

const MAX_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface ProfilePhotoProps {
  logoUrl: string | null;
  initials: string;
  /** Faux pour un compte sans association (agent de la mairie). */
  editable: boolean;
  onChange: (profile: AccountProfile) => void;
}

/** Photo de profil de l'association : envoi, remplacement et retrait. */
export default function ProfilePhoto({ logoUrl, initials, editable, onChange }: ProfilePhotoProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imageUrl = getMediaUrl(logoUrl);

  const run = async (action: () => Promise<AccountProfile>) => {
    setIsBusy(true);
    setError(null);
    try {
      onChange(await action());
    } catch (err) {
      console.error('Mise à jour de la photo impossible', err);
      setError(err instanceof Error ? err.message : 'La photo n’a pas pu être mise à jour.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    // Contrôle immédiat ; le serveur vérifie de toute façon le contenu réel du fichier.
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Choisissez une image JPEG, PNG ou WebP.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('L’image ne doit pas dépasser 5 Mo.');
      return;
    }
    void run(() => uploadAssociationPhoto(file));
  };

  return (
    <div className="flex flex-col items-start gap-4">
      <div className="relative flex size-20 items-center justify-center overflow-hidden rounded-pill bg-accent text-2xl font-black text-ink">
        {imageUrl ? (
          <Image src={imageUrl} alt="Photo de profil de l’association" fill unoptimized sizes="5rem" className="object-cover" />
        ) : (
          <span aria-hidden="true">{initials}</span>
        )}
      </div>

      {editable && (
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            onChange={handleFile}
            className="sr-only"
          />
          <Button
            variant="secondary"
            size="sm"
            isLoading={isBusy}
            leftIcon={<IconUpload className="h-4 w-4" />}
            onClick={() => inputRef.current?.click()}
          >
            {imageUrl ? 'Changer la photo' : 'Ajouter une photo'}
          </Button>
          {imageUrl && (
            <Button variant="ghost" size="sm" disabled={isBusy} leftIcon={<IconTrash className="h-4 w-4" />} onClick={() => void run(deleteAssociationPhoto)}>
              Retirer
            </Button>
          )}
        </div>
      )}
      {editable && <p className="text-meta text-muted">JPEG, PNG ou WebP, 5 Mo maximum.</p>}
      {error && (
        <p role="alert" className="text-meta font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
