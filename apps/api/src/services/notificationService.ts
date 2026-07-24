import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';

export const listMyNotifications = async (userId: string) => {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
};

export const getUnreadCount = async (userId: string) => {
  return prisma.notification.count({ where: { userId, isRead: false } });
};

export const markAsRead = async (notificationId: string, userId: string) => {
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification || notification.userId !== userId) throw AppError.notFound('Notification not found');

  return prisma.notification.update({ where: { id: notificationId }, data: { isRead: true } });
};

export const markAllAsRead = async (userId: string) => {
  await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
};
