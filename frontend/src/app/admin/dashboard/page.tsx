import AssociationsList from '@/components/admin/AssociationsList';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function DashboardPage() {
  return (
    <main className="flex min-h-screen bg-[#F5F8F5] text-[#1E2420]">
      <AdminSidebar />
      <section className="min-w-0 flex-1 px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
        <div className="mx-auto max-w-[1440px]">
          <header className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-[#D9E8E4] pb-7">
            <div>
              <p className="mb-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#146E67]">Administration mairie</p>
              <h1 className="text-3xl font-black tracking-[-0.04em] text-[#1E2420] sm:text-4xl">Tableau de bord</h1>
              <p className="mt-2 max-w-2xl text-sm text-[#6D746E]">Suivez les associations et accédez aux modules de gestion de la mairie.</p>
            </div>
            <div className="rounded-lg border border-[#B9D8D1] bg-white px-4 py-3 text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6D746E]">Espace mairie</p>
              <p className="mt-1 text-sm font-bold text-[#146E67]">Vue générale</p>
            </div>
          </header>
          <div id="associations" className="pt-4">
            <AssociationsList />
          </div>
        </div>
      </section>
    </main>
  );
}
