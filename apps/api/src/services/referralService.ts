import { randomBytes } from 'crypto';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';

const generateCode = (firstName: string): string => {
  const suffix = randomBytes(3).toString('hex').toUpperCase();
  return `${firstName.slice(0, 4).toUpperCase()}${suffix}`;
};

// Lazily generates a referral code the first time a user requests one,
// rather than generating one for every user at signup — most users never
// use this feature, so it's wasted work (and a wasted unique constraint
// check) to generate codes upfront.
export const getOrCreateReferralCode = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw AppError.notFound('User not found');
  if (user.referralCode) return user.referralCode;

  let code = generateCode(user.firstName);
  // Extremely unlikely collision given the random suffix, but guard anyway.
  while (await prisma.user.findUnique({ where: { referralCode: code } })) {
    code = generateCode(user.firstName);
  }

  await prisma.user.update({ where: { id: userId }, data: { referralCode: code } });
  return code;
};

// Called during registration when a new user signs up with a referral code.
// Records the referral immediately; the reward itself is granted once the
// referee completes a qualifying action (their first successful payment),
// handled separately by grantReferralRewardIfEligible.
export const recordReferral = async (referralCode: string, refereeId: string) => {
  const referrer = await prisma.user.findUnique({ where: { referralCode } });
  if (!referrer) return null; // invalid code — silently ignored, doesn't block registration
  if (referrer.id === refereeId) return null; // can't refer yourself

  return prisma.referral.create({ data: { referrerId: referrer.id, refereeId } });
};

const REFERRAL_REWARD_DAYS = 7; // bonus days of premium access granted to the referrer

// Called from the payment fulfillment flow when a referee's first payment
// succeeds — grants the referrer a small subscription extension as a reward.
export const grantReferralRewardIfEligible = async (refereeId: string) => {
  const referral = await prisma.referral.findUnique({ where: { refereeId } });
  if (!referral || referral.rewardGranted) return;

  const referrerSubscription = await prisma.subscription.findFirst({
    where: { userId: referral.referrerId, status: 'ACTIVE' },
    orderBy: { expiresAt: 'desc' },
  });

  if (referrerSubscription && referrerSubscription.expiresAt) {
    const extended = new Date(referrerSubscription.expiresAt);
    extended.setDate(extended.getDate() + REFERRAL_REWARD_DAYS);
    await prisma.subscription.update({ where: { id: referrerSubscription.id }, data: { expiresAt: extended } });
  }

  await prisma.referral.update({ where: { id: referral.id }, data: { rewardGranted: true } });

  await prisma.notification.create({
    data: {
      userId: referral.referrerId,
      title: 'Referral reward earned!',
      message: `Someone you referred just subscribed — you've earned ${REFERRAL_REWARD_DAYS} bonus days of premium access.`,
      type: 'in_app',
    },
  });
};

export const getReferralStats = async (userId: string) => {
  const referrals = await prisma.referral.findMany({
    where: { referrerId: userId },
    include: { referee: { select: { firstName: true, lastName: true, createdAt: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return {
    totalReferred: referrals.length,
    rewardsEarned: referrals.filter((r) => r.rewardGranted).length,
    referrals,
  };
};
