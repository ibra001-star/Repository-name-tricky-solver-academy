import { prisma } from '../config/prisma';

export const subscribe = async (email: string) => {
  // Idempotent: re-subscribing an already-subscribed (and not unsubscribed)
  // email is a silent no-op success, not an error — avoids leaking whether
  // an email is already on the list, and matches user expectations of a
  // "sign up" form that never shows a confusing "already exists" error.
  const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });

  if (existing) {
    if (existing.unsubscribedAt) {
      return prisma.newsletterSubscriber.update({
        where: { email },
        data: { unsubscribedAt: null },
      });
    }
    return existing;
  }

  return prisma.newsletterSubscriber.create({ data: { email } });
};

export const unsubscribe = async (email: string) => {
  await prisma.newsletterSubscriber.updateMany({
    where: { email, unsubscribedAt: null },
    data: { unsubscribedAt: new Date() },
  });
};
