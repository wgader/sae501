import type { AdminEquipmentReservation } from '@/lib/api';
import EquipmentPhoto from './EquipmentPhoto';

const VISIBLE = 3;

/** Les photos du matériel demandé, empilées ; « +N » quand il y en a davantage. */
export default function EquipmentThumbnails({ lines }: { lines: AdminEquipmentReservation['lignes'] }) {
  const visible = lines.slice(0, VISIBLE);
  const hidden = lines.length - visible.length;

  return (
    <ul className="flex shrink-0 -space-x-3" aria-label="Matériel demandé">
      {visible.map((line, index) => (
        <li key={line.materielId ?? index} className="relative size-14 overflow-hidden rounded-soft border-2 border-white bg-paper shadow-xs">
          <EquipmentPhoto path={line.imagePath} alt={line.designation ?? 'Matériel'} sizes="56px" />
        </li>
      ))}
      {hidden > 0 && (
        <li className="grid size-14 place-items-center rounded-soft border-2 border-white bg-ink text-xs font-bold text-white shadow-xs">
          +{hidden}
        </li>
      )}
    </ul>
  );
}
