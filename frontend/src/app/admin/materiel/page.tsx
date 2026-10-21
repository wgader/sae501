import AdminLayout from '@/components/admin/AdminLayout';
import AdminSectionPage from '@/components/admin/AdminSectionPage';

export default function AdminMaterielPage() {
  return (
    <AdminLayout>
      <AdminSectionPage
        title="Matériel"
        description="Gérez le catalogue et les demandes de prêt de matériel des associations."
        emptyMessage="Les demandes de prêt de matériel apparaîtront ici."
      />
    </AdminLayout>
  );
}
