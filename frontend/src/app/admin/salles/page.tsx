'use client';

import { useState } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import SalleCreateForm from '@/components/admin/SalleCreateForm';
import SallesList from '@/components/admin/SallesList';

export default function AdminSallesPage() {
  const [sallesListKey, setSallesListKey] = useState(0);

  return (
    <main className="flex min-h-screen bg-[#F5F8F5] text-[#1E2420]">
      <AdminSidebar />
      <section className="min-w-0 flex-1">
        <div className="bg-[#146E67] px-5 py-5 text-white sm:px-8 lg:px-12">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#D8EC95]">Administration mairie</p>
              <h1 className="mt-1 text-2xl font-black tracking-[-0.04em] sm:text-3xl">Gestion des salles</h1>
            </div>
            <span className="hidden rounded-full border border-white/30 px-4 py-2 text-xs font-bold sm:block">Catalogue municipal</span>
          </div>
        </div>
        <div className="px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-8">
              <p className="text-sm text-[#6D746E]">Ajoutez, modifiez et rendez disponibles les espaces de la ville.</p>
            </div>
            <SalleCreateForm onCreated={() => setSallesListKey((key) => key + 1)} />
            <SallesList key={sallesListKey} />
          </div>
        </div>
      </section>
    </main>
  );
}
