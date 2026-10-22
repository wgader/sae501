// components/ui/CategorySelector.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import arrowIcon from '../../assets/Arrow 2.svg';

export default function CategorySelector() {
  const [selected, setSelected] = useState('Sportive');
  const categories = ['Sportive', 'Culturelle', 'Solidarité', 'Environnement', 'Autre'];

  return (
    <div className="flex w-full flex-col overflow-hidden border border-line bg-white sm:flex-row">
      <div className="relative w-full">
        <select
          name="category"
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
          className="relative flex h-16 w-full appearance-none items-center justify-between border-2 border-transparent bg-grey px-4 py-3 pr-12 transition-all duration-200"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <Image
          src={arrowIcon}
          alt=""
          aria-hidden="true"
          width={15}
          height={27}
          unoptimized
          className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2"
        />
      </div>
    </div>
  );
}