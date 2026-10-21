import AdminLayout from '@/components/admin/AdminLayout';
import AdminSectionPage from '@/components/admin/AdminSectionPage';

export default function AdminSubventionsPage() {
  return (
    <AdminLayout>
      <AdminSectionPage
        title="Subventions"
        description="Gérez les demandes d'aides financières déposées par les associations."
        emptyMessage="Les demandes de subventions apparaîtront ici."
      />
    </AdminLayout>
  );
}
