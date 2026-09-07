import { getCurrentUser } from '@/lib/auth/server';
import { getRoleHomePath } from '@/config/roles';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?redirect=/dashboard');
  }

  const destination = getRoleHomePath(user.role);
  redirect(destination);
}
