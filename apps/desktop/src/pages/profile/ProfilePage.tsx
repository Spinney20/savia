import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import { useLogout } from '@/hooks/use-auth';
import { ROLE_LABELS_RO } from '@ssm/shared';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, Button, Avatar } from '@/components/ui';
import { Mail, Shield, Building2, MapPin, KeyRound, LogOut } from 'lucide-react';

export default function ProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  if (!user) return null;

  const fullName = `${user.user.employee.firstName} ${user.user.employee.lastName}`;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <PageHeader title="Profilul meu" className="mb-6" />

      <Card className="mb-6">
        <div className="flex items-center gap-4 mb-6">
          <Avatar name={fullName} size={56} />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{fullName}</h2>
            <p className="text-sm text-gray-500">{ROLE_LABELS_RO[user.user.role]}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Mail size={16} className="text-gray-400" />
            <span className="text-sm text-gray-700">{user.user.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <Shield size={16} className="text-gray-400" />
            <span className="text-sm text-gray-700">{ROLE_LABELS_RO[user.user.role]}</span>
          </div>
          {user.allocatedAgencies.length > 0 && (
            <div className="flex items-center gap-3">
              <Building2 size={16} className="text-gray-400" />
              <span className="text-sm text-gray-700">
                {user.allocatedAgencies.map((a) => a.name).join(', ')}
              </span>
            </div>
          )}
          {user.allocatedSites.length > 0 && (
            <div className="flex items-center gap-3">
              <MapPin size={16} className="text-gray-400" />
              <span className="text-sm text-gray-700">
                {user.allocatedSites.map((s) => s.name).join(', ')}
              </span>
            </div>
          )}
        </div>
      </Card>

      <div className="flex gap-3">
        <Button
          variant="outline"
          icon={KeyRound}
          onClick={() => navigate('/profile/change-password')}
        >
          Schimbă parola
        </Button>
        <Button
          variant="danger"
          icon={LogOut}
          loading={logout.isPending}
          onClick={() => logout.mutate(undefined, { onSuccess: () => navigate('/login') })}
        >
          Deconectare
        </Button>
      </div>
    </div>
  );
}
