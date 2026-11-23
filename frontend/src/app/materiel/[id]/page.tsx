'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import EquipmentReservationView from '@/components/equipment/reservation/EquipmentReservationView';
import Notice from '@/components/ui/Notice';
import { getPublicEquipment, type Equipment } from '@/lib/api';

type LoadState = { status: 'loading' } | { status: 'missing' } | { status: 'ready'; equipment: Equipment };

export default function EquipmentReservationPage() {
  const params = useParams<{ id: string }>();
  const equipmentId = Number(params.id);
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    getPublicEquipment()
      .then((items) => {
        if (!active) return;
        const equipment = items.find((item) => item.id === equipmentId);
        setState(equipment ? { status: 'ready', equipment } : { status: 'missing' });
      })
      .catch((err: unknown) => {
        console.error('Chargement de l’équipement impossible', err);
        if (active) setState({ status: 'missing' });
      });
    return () => {
      active = false;
    };
  }, [equipmentId]);

  return (
    <main className="min-h-screen bg-white px-6 py-8 sm:px-10 lg:px-14 lg:py-10">
      <div className="mx-auto max-w-328">
        {state.status === 'loading' && (
          <p role="status" className="py-16 text-center text-body-sm text-muted">
            Chargement de l’équipement…
          </p>
        )}
        {state.status === 'missing' && (
          <Notice
            tone="danger"
            title="Équipement introuvable"
            action={
              <Link href="/materiel" className="text-meta font-bold uppercase tracking-label text-danger hover:underline">
                Retour au catalogue
              </Link>
            }
          >
            Cet équipement n’est plus proposé à la réservation.
          </Notice>
        )}
        {state.status === 'ready' && <EquipmentReservationView equipment={state.equipment} />}
      </div>
    </main>
  );
}
