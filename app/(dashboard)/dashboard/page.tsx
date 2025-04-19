import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Redirect to the tenders dashboard as the main entry point
  redirect('/dashboard/tenders');
}
