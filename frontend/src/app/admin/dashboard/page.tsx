import AssociationsList from '@/components/admin/AssociationsList';

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900 sm:px-10">
      <section className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Administration mairie</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="mt-2 text-slate-600">Gérez les associations et leurs habilitations.</p>
        </header>
        <AssociationsList />
      </section>
    </main>
  );
}
