import type { ReactNode } from 'react';
import { useSession } from '../lib/session';
import { can, type Resource } from '../lib/rbac';
import Forbidden from './Forbidden';

export default function RBACGuard({ resource, children }: { resource: Resource; children: ReactNode }) {
  const { user } = useSession();
  if (!user) return null;
  if (!can(user.role, resource, 'view')) {
    return <Forbidden resource={resource}/>;
  }
  return <>{children}</>;
}
