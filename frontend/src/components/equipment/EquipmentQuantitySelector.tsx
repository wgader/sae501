'use client';

import Button from '@/components/ui/Button';

type EquipmentQuantitySelectorProps = {
  quantity: number;
  maximum: number;
  onChange: (quantity: number) => void;
};

export default function EquipmentQuantitySelector({
  quantity,
  maximum,
  onChange,
}: EquipmentQuantitySelectorProps) {
  const canIncrease = quantity < maximum;

  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        aria-label="Diminuer la quantité"
        onClick={() => onChange(Math.max(1, quantity - 1))}
        disabled={quantity <= 1}
        className="h-10 w-10 px-0"
      >
        −
      </Button>
      <output className="min-w-10 text-center text-lg font-black text-ink" aria-live="polite">
        {quantity}
      </output>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        aria-label="Augmenter la quantité"
        onClick={() => onChange(Math.min(maximum, quantity + 1))}
        disabled={!canIncrease}
        className="h-10 w-10 px-0"
      >
        +
      </Button>
    </div>
  );
}
