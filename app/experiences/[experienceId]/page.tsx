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

  let userId: string;
  let token: string | null = null;
  let user: any;

  try {
    const verified = await whopsdk.verifyUserToken(headersList);
    userId = verified.userId;
    
    // The actual token for API calls - use the JWT from x-whop-user-token header
    token = headersList.get('x-whop-user-token') ||
            headersList.get('authorization')?.replace('Bearer ', '') ||
            headersList.get('Authorization')?.replace('Bearer ', '') ||
            userId; // Fallback to userId if no token found
  } catch (e) {
    // Development fallback - use test user when Whop auth fails
    console.warn('Whop auth failed, using dev fallback user', e);
    userId = process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID || 'user_sn5Ck8sbMAuS5';
    token = userId; // In dev mode, use userId as token
  }

  try {
      // Using whopsdk.users.checkAccess as checkIfUserHasAccessToExperience is not available in this SDK version
      await whopsdk.users.checkAccess(experienceId, { id: userId });
  } catch (e) {
      console.error("Access check failed", e);
  }

  try {
    user = await whopsdk.users.retrieve(userId);
  } catch (e) {
    // Fallback user object for development
    console.warn('Failed to retrieve user, using fallback', e);
    user = {
      id: userId,
      username: 'DevUser',
      email: 'dev@example.com'
    };
  }

  return <ClientPage user={user} token={token} />;
}