import cron from 'node-cron';
import { prisma } from '../config/prisma';
import { logger } from '../config/logger';
import { sendSms } from './smsService';

const REMINDER_WINDOW_MINUTES = 15;

// Finds study plan items starting within the next ~15 minutes that haven't
// been reminded about yet, and notifies their owner via in-app notification
// (always) and SMS (only if they have a phone on file). Runs every 5
// minutes — frequent enough that no item's reminder window is missed
// between runs, without hammering the database.
export const runStudyPlanReminders = async (): Promise<void> => {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_MINUTES * 60 * 1000);

  const dueItems = await prisma.studyPlanItem.findMany({
    where: {
      isCompleted: false,
      reminderSentAt: null,
      scheduledFor: { gte: now, lte: windowEnd },
    },
    include: { user: { select: { id: true, phone: true } } },
  });

  if (dueItems.length === 0) return;

  logger.info({ count: dueItems.length }, 'Sending study plan reminders');

  for (const item of dueItems) {
    await prisma.notification.create({
      data: {
        userId: item.userId,
        title: 'Study reminder',
        message: `"${item.title}" is scheduled to start soon.`,
        type: 'in_app',
      },
    });

    if (item.user.phone) {
      void sendSms(item.user.phone, `Tricky Solver Academy reminder: "${item.title}" starts soon.`);
    }

    await prisma.studyPlanItem.update({ where: { id: item.id }, data: { reminderSentAt: new Date() } });
  }
};

let scheduledTask: ReturnType<typeof cron.schedule> | null = null;

// Started once from server.ts at boot. Kept as an explicit start/stop pair
// (rather than a top-level side effect on import) so tests can import this
// module without accidentally spinning up a background cron job.
export const startReminderScheduler = (): void => {
  if (scheduledTask) return; // idempotent — don't double-schedule on hot reload
  scheduledTask = cron.schedule('*/5 * * * *', () => {
    runStudyPlanReminders().catch((err) => {
      logger.error({ err }, 'Study plan reminder job failed');
    });
  });
  logger.info('Study plan reminder scheduler started (every 5 minutes)');
};

export const stopReminderScheduler = (): void => {
  scheduledTask?.stop();
  scheduledTask = null;
};
