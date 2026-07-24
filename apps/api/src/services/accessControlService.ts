import { prisma } from '../config/prisma';

// A user has premium access if they hold an ACTIVE subscription that hasn't
// expired (LIFETIME plans have expiresAt = null, meaning "never expires").
export const hasActiveSubscription = async (userId: string): Promise<boolean> => {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });
  return !!subscription;
};

export const hasPurchasedExam = async (userId: string, examId: string): Promise<boolean> => {
  const purchase = await prisma.paperPurchase.findUnique({
    where: { userId_examId: { userId, examId } },
  });
  return !!purchase;
};

// The single check exam-taking should use: either a blanket subscription,
// or a specific purchase of this exact paper.
export const canAccessExam = async (
  userId: string | null,
  exam: { id: string; isPremium: boolean }
): Promise<boolean> => {
  if (!exam.isPremium) return true;
  if (!userId) return false;

  const [subscribed, purchased] = await Promise.all([
    hasActiveSubscription(userId),
    hasPurchasedExam(userId, exam.id),
  ]);

  return subscribed || purchased;
};
