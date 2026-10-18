// components/ui/CategorySelector.tsx
'use client';

import { useState } from 'react';

export default function CategorySelector() {
  const [selected, setSelected] = useState('Sportive');
  const categories = ['Sportive', 'Culturelle', 'Solidarité', 'Environnement', 'Autre'];

  return (
    <div className="flex w-full flex-col sm:flex-row overflow-hidden rounded-md border border-[#d9ded9] bg-white">
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => setSelected(cat)}
          className={`flex-1 border-b sm:border-b-0 sm:border-r border-[#d9ded9] py-3 text-xs font-medium last:border-b-0 sm:last:border-r-0 transition-colors ${
            selected === cat
              ? 'bg-[#0b644d] text-white'
              : 'text-[#1e2420] hover:bg-[#f7f8f4]'
          }`}
        >
          {cat}
        </button>
      ))}
      <input type="hidden" name="category" value={selected} required />
    </div>
  );
}