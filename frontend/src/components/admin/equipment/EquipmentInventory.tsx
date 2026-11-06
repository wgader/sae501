'use client';

import Image from 'next/image';
import { Equipment, getMediaUrl } from '@/lib/api';

interface EquipmentInventoryProps {
  items: Equipment[];
  loading: boolean;
  error: string | null;
  brokenImageIds: number[];
  onBrokenImage: (id: number) => void;
  onAdjust: (item: Equipment) => void;
  onEdit: (item: Equipment) => void;
  onArchive: (item: Equipment) => void;
}

export default function EquipmentInventory({ items, loading, error, brokenImageIds, onBrokenImage, onAdjust, onEdit, onArchive }: EquipmentInventoryProps) {
  if (loading) return <div className="flex h-40 items-center justify-center rounded-2xl border border-line bg-white"><p className="text-sm font-semibold text-muted">Chargement de l&apos;inventaire matériel...</p></div>;
  if (error) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm font-semibold text-danger">{error}</div>;
  if (!items.length) return <div className="rounded-2xl border border-line bg-white p-12 text-center"><p className="text-base font-bold text-ink">Aucun équipement trouvé</p><p className="mt-1 text-xs text-muted">Modifiez vos filtres ou enregistrez un nouveau matériel dans le catalogue.</p></div>;

  return <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => (
    <article key={item.id} className={`group overflow-hidden rounded-card border bg-white shadow-xs ${item.isArchived ? 'border-gray-200 opacity-80' : 'border-line'}`}>
      <div className="relative flex h-52 items-center justify-center overflow-hidden border-b border-line bg-primary-soft">
        {item.imagePath && !brokenImageIds.includes(item.id) ? <Image src={getMediaUrl(item.imagePath)!} alt={`Photo de ${item.designation}`} fill unoptimized sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" onError={() => onBrokenImage(item.id)} /> : <div role="img" aria-label={`Illustration pour ${item.designation}`} className="text-center text-primary"><span className="text-4xl">□</span><p className="text-xs font-semibold">Photo illustrative</p></div>}
        <div className="absolute left-3 right-3 top-3 flex justify-between"><span className="rounded-pill border border-line bg-white/95 px-3 py-1 text-caption font-bold uppercase text-primary">{item.categorie}</span><span className={`rounded-pill px-3 py-1 text-caption font-bold ${item.isArchived ? 'bg-gray-100 text-gray-700' : 'bg-emerald-100 text-emerald-800'}`}>{item.statut}</span></div>
      </div>
      <div className="p-6"><p className="text-xs font-mono text-muted">{item.referenceInterne ? `Réf : ${item.referenceInterne}` : ''}</p><h3 className="mt-1 text-lg font-bold text-ink">{item.designation}</h3>{item.description && <p className="mt-2 line-clamp-2 text-sm text-muted">{item.description}</p>}{item.consignesUtilisation && <p className="mt-4 rounded-soft bg-paper p-3 text-xs text-ink/85"><strong>Consignes d&apos;utilisation</strong><br />{item.consignesUtilisation}</p>}</div>
      <footer className="border-t border-line bg-paper/50 p-6 pt-4"><div className="flex items-baseline justify-between"><span className="text-caption font-bold uppercase text-muted">Stock communal</span><p className="text-2xl font-black text-ink">{item.stockTotal} <span className="text-xs font-medium text-muted">unités</span></p></div><div className="mt-4 grid grid-cols-3 gap-2"><button type="button" onClick={() => onAdjust(item)} className="h-10 rounded-control border border-line bg-white text-xs font-bold uppercase text-ink">Ajuster</button><button type="button" onClick={() => onEdit(item)} className="h-10 rounded-control bg-primary text-xs font-bold uppercase text-white">Modifier</button>{item.isArchived ? <span className="flex h-10 items-center justify-center rounded-control bg-gray-100 text-xs text-gray-500">Archivé</span> : <button type="button" onClick={() => onArchive(item)} className="h-10 rounded-control border border-red-200 bg-red-50 text-xs font-bold uppercase text-danger">Archiver</button>}</div></footer>
    </article>
  ))}</div>;
}
