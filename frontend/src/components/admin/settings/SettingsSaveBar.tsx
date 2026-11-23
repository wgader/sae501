import Button from '@/components/ui/Button';
import { formatAudit } from '@/lib/settingsForm';

interface SettingsSaveBarProps {
  updatedAt: string | null;
  updatedBy: string | null;
  dirty: boolean;
  saving: boolean;
  onReset: () => void;
}

/** Bas d'un formulaire de réglages : qui a modifié en dernier, annuler et enregistrer. */
export default function SettingsSaveBar({ updatedAt, updatedBy, dirty, saving, onReset }: SettingsSaveBarProps) {
  return (
    <>
      <p className="text-meta text-muted">{formatAudit(updatedAt, updatedBy)}</p>
      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        <Button type="button" variant="ghost" size="sm" onClick={onReset} disabled={!dirty || saving}>
          Annuler
        </Button>
        <Button type="submit" size="sm" disabled={!dirty || saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </div>
    </>
  );
}
