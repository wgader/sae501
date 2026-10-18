'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Input } from '../admin/Input';
import { Label } from '../admin/Label';

interface SearchBarProps {
  label?: string;
  placeholder?: string;
  paramName?: string; // par défaut 'q'
}

export default function SearchBar({
  label = 'Rechercher une association',
  placeholder = 'Nom, RNA ou e-mail du contact',
  paramName = 'q',
}: SearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const query = searchParams.get(paramName) || '';

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (term) {
      params.set(paramName, term);
    } else {
      params.delete(paramName);
    }
    params.set('page', '1'); // Remet à la première page lors d'une recherche
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-[400px]">
      <Label htmlFor="search-input" className="sr-only">
        {label}
      </Label>
      <Input
        id="search-input"
        type="search"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder={placeholder}
        className="rounded-lg border border-[#d6dbe5] bg-white px-3 py-2 text-sm"
      />
    </div>
  );
}
