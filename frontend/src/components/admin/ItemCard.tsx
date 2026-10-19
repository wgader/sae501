import Image from 'next/image';
// import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { AssociationStatus } from '@/lib/api';
import StatusTag from './StatusTag';

// const itemCardVariants = cva(
//   'flex min-h-[104px] w-full items-center justify-between gap-6 rounded-2xl border border-[#d6dbe5] bg-white px-[22px] py-5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#146e67]',
// );

// export interface ItemCardProps extends VariantProps<typeof itemCardVariants> {
//   name: string;
//   status: AssociationStatus;
//   onClick?: () => void;
//   className?: string;
//   children?: ReactNode;
// }

interface ItemCardDataProps {
  status?: AssociationStatus;
  moduleSubventionActif?: boolean;
  moduleSalleActif?: boolean;
  moduleMaterielActif?: boolean;
  name: string;
}

interface ItemCardProps {
  onClick?: () => void;
  className?: string;
  children?: ReactNode;
}

export default function ItemCard({
  name,
  status,
  moduleSubventionActif,
  moduleSalleActif,
  moduleMaterielActif,
  onClick,
  className,
  children,
}: ItemCardDataProps & ItemCardProps) {
  return (
    <li className="w-full">
      <button
        type="button"
        onClick={onClick}
        aria-label={`Consulter le dossier de ${name}`}
        className={cn(
        "flex min-h-[104px] items-center justify-between gap-6 rounded-2xl border border-[#d6dbe5] bg-white px-[22px] py-5",
        className,
      )}
      >
       <div className="flex min-w-0 flex-1 flex-col items-start gap-[6px]">
        <h2 className="h-[22.5px] w-full overflow-hidden text-ellipsis whitespace-nowrap text-[20px] font-bold uppercase leading-[15px] text-black">
          {name}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {status ? <StatusTag status={status} /> : null}
          {moduleSubventionActif && <StatusTag status="subvention" className='bg-Misty-Rose' />}
           {moduleMaterielActif && <StatusTag status="materiel" className='bg-Lime-Cream' />}
      {moduleSalleActif && <StatusTag status="salle" className='bg-Mosaic-Tile'/>}
           </div>
      </div>
      {children}
      <Image
        src="/admin-card-arrow.svg"
        alt=""
        width={38}
        height={22}
        className="h-[21.5px] w-[38px] shrink-0"
      />
      </button>
    </li>
  );
}
