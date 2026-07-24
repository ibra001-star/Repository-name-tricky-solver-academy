import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';

export const sendMessage = async (senderId: string, recipientId: string, body: string) => {
  if (senderId === recipientId) {
    throw AppError.badRequest('You cannot send a message to yourself');
  }

  const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
  if (!recipient) throw AppError.notFound('Recipient not found');

  const message = await prisma.message.create({
    data: { senderId, recipientId, body },
    include: { sender: { select: { firstName: true, lastName: true, role: true } } },
  });

  await prisma.notification.create({
    data: {
      userId: recipientId,
      title: 'New message',
      message: `You have a new message from ${message.sender.firstName} ${message.sender.lastName}`,
      type: 'in_app',
    },
  });

  return message;
};

interface ConversationPartner {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

// Returns a list of "conversations": one row per person the user has
// exchanged messages with, showing the most recent message and unread count.
export const listConversations = async (userId: string) => {
  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: userId }, { recipientId: userId }] },
    include: {
      sender: { select: { id: true, firstName: true, lastName: true, role: true } },
      recipient: { select: { id: true, firstName: true, lastName: true, role: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const conversationMap = new Map<
    string,
    { partner: ConversationPartner; lastMessage: string; lastAt: Date; unread: number }
  >();

  for (const msg of messages) {
    const isSender = msg.senderId === userId;
    const partner = isSender ? msg.recipient : msg.sender;

    if (!conversationMap.has(partner.id)) {
      conversationMap.set(partner.id, { partner, lastMessage: msg.body, lastAt: msg.createdAt, unread: 0 });
    }
    if (!isSender && !msg.isRead) {
      conversationMap.get(partner.id)!.unread += 1;
    }
  }

  return Array.from(conversationMap.values()).sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());
};

export const getConversation = async (userId: string, partnerId: string) => {
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId, recipientId: partnerId },
        { senderId: partnerId, recipientId: userId },
      ],
    },
    orderBy: { createdAt: 'asc' },
  });

  // Mark any unread messages from the partner as read, since the user is
  // now viewing this conversation.
  await prisma.message.updateMany({
    where: { senderId: partnerId, recipientId: userId, isRead: false },
    data: { isRead: true },
  });

  return messages;
};
