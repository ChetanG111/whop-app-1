import { headers } from 'next/headers';
import { whopsdk } from '@/lib/whop-sdk';
import ClientPage from './client-page';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your Fitness Journey',
  description: 'Track your workouts and connect with the community',
};

export default async function Page({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  const headersList = await headers();
  const { experienceId } = await params;

  const { userId } = await whopsdk.verifyUserToken(headersList);

  try {
      // Using whopsdk.users.checkAccess as checkIfUserHasAccessToExperience is not available in this SDK version
      await whopsdk.users.checkAccess(experienceId, { id: userId });
  } catch (e) {
      console.error("Access check failed", e);
  }

  const user = await whopsdk.users.retrieve(userId);

  return <ClientPage user={user} />;
}