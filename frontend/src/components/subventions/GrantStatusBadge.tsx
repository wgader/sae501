import StatusBadge from '@/components/ui/StatusBadge';
import type { GrantStatus } from '@/lib/api';
import { grantStatusBadge } from '@/lib/grantApplication';

export default function GrantStatusBadge({ status }: { status: GrantStatus }) {
  const { code, label } = grantStatusBadge(status);
  return <StatusBadge status={code} label={label} size="md" />;
}
