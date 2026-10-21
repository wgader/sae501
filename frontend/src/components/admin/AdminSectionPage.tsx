import AdminPageHeader from '@/components/admin/AdminPageHeader';

interface AdminSectionPageProps {
  title: string;
  description: string;
  emptyMessage: string;
}

export default function AdminSectionPage({
  title,
  description,
  emptyMessage,
}: AdminSectionPageProps) {
  return (
    <section className="mx-auto max-w-5xl space-y-8">
      <AdminPageHeader title={title} description={description} />

      <section
        aria-labelledby="admin-section-content"
        className="rounded-[20px] border border-[var(--line)] bg-[var(--paper)] p-8 text-center"
      >
        <h2 id="admin-section-content" className="text-base font-bold text-[var(--ink)]">
          {title}
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">{emptyMessage}</p>
      </section>
    </section>
  );
}
