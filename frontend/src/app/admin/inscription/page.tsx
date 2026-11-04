"use client";

import { useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AssociationCard from "@/components/admin/association/AssociationCard";
import InscriptionStatusTabs, {
  type TabStatus,
} from "@/components/admin/inscription/InscriptionStatusTabs";
import Pagination from "@/components/ui/Pagination";
import { useAssociations } from "@/hooks/useAssociations";

export default function AdminInscriptionsPage() {
  const [activeTab, setActiveTab] = useState<TabStatus>("PENDING_VALIDATION");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setPage(1);
  };

  const { associations, totalItems, counts, loading, error } = useAssociations(
    page,
    activeTab,
    searchTerm,
  );

  const filteredAssociations = useMemo(() => {
    if (!searchTerm.trim()) return associations;
    const lower = searchTerm.toLowerCase();

    return associations.filter((item) => {
      const matchName = item.nom.toLowerCase().includes(lower);
      const matchEmail =
        item.contact?.email?.toLowerCase().includes(lower) ?? false;
      const matchContact =
        `${item.contact?.prenom ?? ""} ${item.contact?.nom ?? ""}`
          .toLowerCase()
          .includes(lower);
      return matchName || matchEmail || matchContact;
    });
  }, [associations, searchTerm]);

  const handleTabChange = (tab: TabStatus) => {
    setActiveTab(tab);
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(totalItems / 10));

  return (
    <AdminLayout searchTerm={searchTerm} onSearchChange={handleSearchChange}>
      <section className="mx-auto max-w-5xl">
        <AdminPageHeader title="Demandes d’inscription" className="mb-6">
          <InscriptionStatusTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            counts={counts}
          />
        </AdminPageHeader>

        {error && (
          <p
            className="mb-6 rounded-lg border-l-4 border-danger bg-rose-50/70 p-4 text-xs font-semibold leading-5 text-danger"
            role="alert"
          >
            {error}
          </p>
        )}

        {loading ? (
          <section className="py-16 text-center text-muted">
            <svg
              className="mx-auto size-8 animate-spin text-primary"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <p className="mt-3 text-xs font-bold uppercase tracking-wider">
              Chargement des demandes...
            </p>
          </section>
        ) : filteredAssociations.length === 0 ? (
          <section className="rounded-2xl border border-line bg-paper py-16 text-center">
            <p className="text-base font-bold text-ink">
              Aucune demande trouvée
            </p>
            <p className="mt-1 text-xs text-muted">
              {searchTerm
                ? `Aucun résultat pour la recherche « ${searchTerm} ».`
                : "Il n’y a aucune demande dans cette catégorie pour le moment."}
            </p>
          </section>
        ) : (
          <ul className="space-y-4 p-0 list-none">
            {filteredAssociations.map((association) => (
              <li key={association.id}>
                <AssociationCard association={association} />
              </li>
            ))}
          </ul>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={10}
          onPageChange={setPage}
        />
      </section>
    </AdminLayout>
  );
}
