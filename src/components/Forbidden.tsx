import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import PageHeader from './PageHeader';
import { useSession } from '../lib/session';
import { roleLabel } from '../lib/rbac';

export default function Forbidden({ resource }: { resource?: string }) {
  const { user } = useSession();
  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      <PageHeader title="Access denied" subtitle="You don\u2019t have permission to view this module." icon={<ShieldAlert size={22} />} />
      <div className="glass-card rounded-3xl p-10 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center shadow-lg">
          <ShieldAlert size={30} />
        </div>
        <h2 className="heading-display text-2xl mt-5 text-[var(--text-primary)]">Restricted area</h2>
        <p className="text-[13.5px] text-[var(--text-secondary)] mt-2 max-w-md mx-auto leading-relaxed">
          Your current role{user ? ` (${roleLabel(user.role)})` : ''} isn’t permitted to access{resource ? ` the ${resource} module` : ' this module'}. Role-based access control is enforced institution-wide for data isolation and security.
        </p>
        <Link to="/app/dashboard" className="btn-primary inline-flex items-center gap-2 mt-6">
          <ArrowLeft size={14} /> Back to dashboard
        </Link>
      </div>
    </div>
  );
}
