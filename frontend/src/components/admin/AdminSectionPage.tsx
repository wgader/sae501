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
        className="rounded-card border border-line bg-paper p-8 text-center"
      >
        <h2 id="admin-section-content" className="text-base font-bold text-ink">
          {title}
        </h2>
        <p className="mt-2 text-sm text-muted">{emptyMessage}</p>
      </section>
    </section>
  );
}
