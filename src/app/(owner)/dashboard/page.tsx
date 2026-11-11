import { redirect } from 'next/navigation';
import { getVerifiedOwnerCookie } from '@/lib/auth/owner-auth';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export default async function DashboardRootPage() {
  const verified = await getVerifiedOwnerCookie();
  if (!verified) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: verified.userId },
    select: {
      id: true,
      memberships: {
        select: {
          organization: {
            select: {
              restaurants: {
                select: { id: true },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    redirect('/login');
  }

  const firstRest = user.memberships.find(
    (m) => m.organization.restaurants.length > 0
  )?.organization.restaurants[0];

  if (firstRest) {
    redirect(`/dashboard/${firstRest.id}`);
  }

  redirect('/signup');
}

