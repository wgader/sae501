'use client';

import { useState, useRef, DragEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Stepper from '@/components/shared/Stepper';

const CloudIcon = () => (
  <svg className="mx-auto mb-2 h-8 w-8 text-[#6d746e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const PdfIcon = () => (
  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-[#b54b4b] text-xs font-bold text-white">
    DOC
  </div>
);

const CheckCircleIcon = () => (
  <svg className="h-4 w-4 shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const LockIcon = () => (
  <svg className="h-5 w-5 shrink-0 text-[#0b644d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Octets', 'Ko', 'Mo', 'Go'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_OTHER_DOCUMENTS = 3;
const ALLOWED_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/webp'];

const validateFile = (file: File): string | null => {
  if (file.size > MAX_FILE_SIZE) return 'Le fichier dépasse la taille maximale de 5 Mo.';
  if (!ALLOWED_TYPES.includes(file.type)) return 'Format non supporté (PDF, Word ou Image uniquement).';
  return null;
};

type FixedDocumentKey = 'statuts' | 'recepisse' | 'listeBureau' | 'reglement';

interface FileState {
  file: File | null;
  error: string | null;
}

interface DynamicFileState extends FileState {
  id: string;
}

const FileUploader = ({
  title,
  required = false,
  highlighted = false,
  file,
  error,
  onChange,
}: {
  title: string;
  required?: boolean;
  highlighted?: boolean;
  file: File | null;
  error: string | null;
  onChange: (file: File | null) => void;
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onChange(e.dataTransfer.files[0]);
    }
  };

  if (file) {
    return (
      <div className="flex flex-col gap-2 h-full">
        <label className="text-xs font-bold text-[#1e2420]">{title} {required && '*'}</label>
        <div className="flex h-full flex-col justify-between rounded-lg border border-[#0b644d] bg-[#f2f7f5] p-4 transition-all shadow-sm">
          <div className="flex items-start justify-between gap-4 overflow-hidden">
            <div className="flex items-center gap-3 overflow-hidden">
              <PdfIcon />
              <div className="overflow-hidden">
                <p className="truncate text-sm font-bold text-[#1e2420]" title={file.name}>{file.name}</p>
                <p className="text-xs text-[#6d746e]">{formatFileSize(file.size)} - à l'instant</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#4CAF50] px-2.5 py-1 text-[10px] font-bold text-white">
              <CheckCircleIcon /> Validé
            </div>
          </div>
          
          {error && <p className="mt-2 text-[10px] font-bold text-[#b54b4b]">{error}</p>}
          
          <div className="mt-4 flex items-center justify-end gap-2 text-xs font-bold text-[#0b644d]">
            <label className="cursor-pointer hover:underline">
              Remplacer
              <input type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" onChange={(e) => onChange(e.target.files?.[0] || null)} />
            </label>
            <span className="text-[#d9ded9]">|</span>
            <button type="button" onClick={() => onChange(null)} className="text-[#b54b4b] hover:underline">
              Supprimer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-[#1e2420]">{title} {required && '*'}</label>
        {!required && <span className="text-[10px] text-[#6d746e]">(Optionnel)</span>}
      </div>
      
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex h-full min-h-35 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          isDragging 
            ? 'border-[#0b644d] bg-[#f2f7f5]' 
            : error 
              ? 'border-[#b54b4b] bg-red-50' 
              : highlighted && required 
                ? 'border-[#d97706] bg-[#fdf8f3] hover:bg-[#fcf3e8]' 
                : 'border-[#d9ded9] bg-[#f7f8f4]/50 hover:bg-[#f7f8f4]'
        }`}
      >
        <input
          type="file"
          ref={inputRef}
          className="hidden"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
          onChange={(e) => onChange(e.target.files?.[0] || null)}
        />
        <CloudIcon />
        <p className="mb-2 text-xs text-[#1e2420]">{required ? 'Glissez votre fichier ici' : 'Facultatif - glissez ou cliquez'}</p>
        {required && <p className="mb-2 text-xs text-[#6d746e]">ou</p>}
        <span className="mb-2 inline-block rounded-full border border-[#d9ded9] bg-white px-4 py-1.5 text-xs font-bold text-[#1e2420] shadow-sm transition-colors hover:bg-gray-50">
          Parcourir mes fichiers
        </span>
        <p className="text-[10px] text-[#6d746e]">PDF, Word ou image - max 5 Mo</p>
      </div>
      
      {error ? (
        <p className="text-[10px] font-bold text-[#b54b4b]">{error}</p>
      ) : highlighted && required ? (
        <p className="flex items-center gap-1.5 text-[10px] font-bold text-[#d97706]">
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Document requis
        </p>
      ) : null}
    </div>
  );
};

export default function DocumentsPage() {
  const router = useRouter();

  const [fixedDocs, setFixedDocs] = useState<Record<FixedDocumentKey, FileState>>({
    statuts: { file: null, error: null },
    recepisse: { file: null, error: null },
    listeBureau: { file: null, error: null },
    reglement: { file: null, error: null },
  });

  const [otherDocs, setOtherDocs] = useState<DynamicFileState[]>([]);
  const [otherError, setOtherError] = useState<string | null>(null);

  const handleFixedChange = (key: FixedDocumentKey, file: File | null) => {
    if (!file) {
      setFixedDocs(prev => ({ ...prev, [key]: { file: null, error: null } }));
      return;
    }
    const err = validateFile(file);
    setFixedDocs(prev => ({ ...prev, [key]: { file: err ? null : file, error: err } }));
  };

  const handleAddOtherDoc = (file: File | null) => {
    if (!file) return;
    
    if (otherDocs.length >= MAX_OTHER_DOCUMENTS) {
      setOtherError(`Vous pouvez ajouter au maximum ${MAX_OTHER_DOCUMENTS} documents complémentaires.`);
      return;
    }
    
    const err = validateFile(file);
    if (err) {
      setOtherError(err);
      return;
    }
    
    setOtherError(null);
    setOtherDocs(prev => [...prev, { id: Math.random().toString(36).substring(2, 9), file, error: null }]);
  };

  const handleReplaceOrRemoveOtherDoc = (id: string, file: File | null) => {
    if (!file) {
      setOtherDocs(prev => prev.filter(doc => doc.id !== id));
      return;
    }
    const err = validateFile(file);
    setOtherDocs(prev => prev.map(doc => 
      doc.id === id ? { ...doc, file: err ? doc.file : file, error: err } : doc
    ));
  };

  const requiredKeys: FixedDocumentKey[] = ['statuts', 'recepisse', 'listeBureau'];
  const isFormValid = requiredKeys.every(key => fixedDocs[key].file !== null);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <Stepper currentStep={3} />

        <div className="mx-auto max-w-4xl">
          <form className="rounded-xl border border-[#d9ded9] p-4 shadow-sm sm:p-8" onSubmit={(e) => e.preventDefault()}>
            <div className="mb-8">
              <h2 className="mb-2 border-l-4 border-[#0b644d] pl-3 text-sm font-bold uppercase tracking-widest text-[#1e2420]">
                COFFRE À DOCUMENTS
              </h2>
              <p className="pl-4 text-xs text-[#6d746e]">
                Ces documents seront réutilisés automatiquement pour toutes vos futures demandes. Un seul upload suffit.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:gap-8">
              <FileUploader 
                title="Statuts de l'association" required 
                highlighted={!fixedDocs.statuts.file}
                file={fixedDocs.statuts.file} error={fixedDocs.statuts.error} 
                onChange={(f) => handleFixedChange('statuts', f)} 
              />
              <FileUploader 
                title="Récépissé de préfecture" required 
                highlighted={!fixedDocs.recepisse.file}
                file={fixedDocs.recepisse.file} error={fixedDocs.recepisse.error} 
                onChange={(f) => handleFixedChange('recepisse', f)} 
              />
              <FileUploader 
                title="Liste des membres du bureau" required 
                highlighted={!fixedDocs.listeBureau.file}
                file={fixedDocs.listeBureau.file} error={fixedDocs.listeBureau.error} 
                onChange={(f) => handleFixedChange('listeBureau', f)} 
              />
              <FileUploader 
                title="Règlement intérieur" 
                file={fixedDocs.reglement.file} error={fixedDocs.reglement.error} 
                onChange={(f) => handleFixedChange('reglement', f)} 
              />
              
              <div className="sm:col-span-2 mt-4 pt-6 border-t border-dashed border-[#d9ded9]">
                <h3 className="mb-6 text-sm font-bold text-[#1e2420]">Documents complémentaires</h3>
                
                <div className="flex flex-col gap-6 lg:gap-8">
                  {otherDocs.map((doc, index) => (
                    <div key={doc.id} className="w-full">
                      <FileUploader
                        title={`Document supplémentaire n°${index + 1}`}
                        file={doc.file}
                        error={doc.error}
                        onChange={(newFile) => handleReplaceOrRemoveOtherDoc(doc.id, newFile)}
                      />
                    </div>
                  ))}
                  
                  {otherDocs.length < MAX_OTHER_DOCUMENTS ? (
                    <div className="w-full">
                      <FileUploader 
                        title={otherDocs.length > 0 ? "Ajouter un autre document" : "Tout autre document utile"}
                        file={null} 
                        error={otherError} 
                        onChange={handleAddOtherDoc} 
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-[#6d746e]">Limite atteinte : {MAX_OTHER_DOCUMENTS} documents complémentaires maximum.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-10 flex items-center gap-4 rounded-lg bg-[#f2f7f5] p-5 text-sm text-[#4f5851]">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0b644d]/10">
                <LockIcon />
              </div>
              <p>
                <strong className="text-[#1e2420]">Vos documents sont sécurisés et accessibles uniquement par la mairie de Feytiat.</strong><br />
                Vous pouvez les mettre à jour à tout moment depuis votre espace association.
              </p>
            </div>

            <div className="mt-10 flex flex-col-reverse justify-between gap-6 border-t border-[#d9ded9] pt-6 sm:flex-row sm:items-center">
              <a href="#" className="text-center text-xs text-[#6d746e] hover:text-[#1e2420] hover:underline sm:text-left">
                Besoin d'aide ? Contactez la mairie 
              </a>
              
              <div className="flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row sm:gap-6">
                <div className="flex w-full gap-3 sm:w-auto">
                  <Link href="/signup/step2" className="flex-1 rounded-md border border-[#d9ded9] bg-white px-4 py-3 text-center text-xs font-bold text-[#1e2420] transition-colors hover:bg-[#f7f8f4] sm:flex-none sm:px-6">
                      Retour
                  </Link>
                  <div className="group relative flex-1 sm:flex-none">
                    <button
                      type="button"
                      onClick={() => router.push('/signup/step4')}
                      disabled={!isFormValid}
                      className="w-full rounded-md bg-[#0b644d] px-4 py-3 text-xs font-bold text-white transition-colors hover:bg-[#084e3c] disabled:cursor-not-allowed disabled:opacity-50 sm:px-6"
                    >
                      Continuer →
                    </button>
                    {!isFormValid && (
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[#1e2420] px-3 py-1.5 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                        Veuillez uploader tous les documents requis
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
}