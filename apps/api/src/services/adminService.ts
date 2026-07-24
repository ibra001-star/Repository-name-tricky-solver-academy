import { Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';

// ── User management ──────────────────────────────────────────────────

export const listUsers = async (params: { role?: Role; search?: string; page: number; limit: number }) => {
  const where = {
    ...(params.role ? { role: params.role } : {}),
    ...(params.search
      ? {
          OR: [
            { email: { contains: params.search, mode: 'insensitive' as const } },
            { firstName: { contains: params.search, mode: 'insensitive' as const } },
            { lastName: { contains: params.search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const skip = (params.page - 1) * params.limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        school: true,
        form: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: params.limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: { page: params.page, limit: params.limit, total, totalPages: Math.ceil(total / params.limit) },
  };
};

export const setUserActive = async (userId: string, isActive: boolean, actingAdminId: string) => {
  if (userId === actingAdminId && !isActive) {
    throw AppError.badRequest('You cannot deactivate your own account');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw AppError.notFound('User not found');

  const updated = await prisma.user.update({ where: { id: userId }, data: { isActive } });

  await prisma.auditLog.create({
    data: {
      userId: actingAdminId,
      action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      entity: 'User',
      entityId: userId,
    },
  });

  return updated;
};

export const setUserRole = async (userId: string, role: Role, actingAdminId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw AppError.notFound('User not found');

  // Only a SUPER_ADMIN can grant/revoke ADMIN or SUPER_ADMIN roles — an
  // ADMIN escalating their own or someone else's privileges is exactly the
  // kind of thing role-based access control exists to prevent.
  const actingAdmin = await prisma.user.findUnique({ where: { id: actingAdminId } });
  const isEscalation = role === 'ADMIN' || role === 'SUPER_ADMIN';
  if (isEscalation && actingAdmin?.role !== 'SUPER_ADMIN') {
    throw AppError.forbidden('Only a super admin can grant admin privileges');
  }

  const updated = await prisma.user.update({ where: { id: userId }, data: { role } });

  await prisma.auditLog.create({
    data: {
      userId: actingAdminId,
      action: 'USER_ROLE_CHANGED',
      entity: 'User',
      entityId: userId,
      metadata: { newRole: role, previousRole: user.role },
    },
  });

  return updated;
};

// ── Revenue / payment analytics ──────────────────────────────────────

export const getRevenueSummary = async () => {
  const [totalRevenue, byProvider, byPurpose, recentPayments, subscriptionCounts] = await Promise.all([
    prisma.payment.aggregate({ where: { status: 'SUCCESS' }, _sum: { amountKes: true }, _count: true }),
    prisma.payment.groupBy({
      by: ['provider'],
      where: { status: 'SUCCESS' },
      _sum: { amountKes: true },
      _count: true,
    }),
    prisma.payment.groupBy({
      by: ['purpose'],
      where: { status: 'SUCCESS' },
      _sum: { amountKes: true },
      _count: true,
    }),
    prisma.payment.findMany({
      where: { status: 'SUCCESS' },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.subscription.groupBy({ by: ['plan', 'status'], _count: true }),
  ]);

  return {
    totalRevenueKes: totalRevenue._sum.amountKes ?? 0,
    totalTransactions: totalRevenue._count,
    byProvider: byProvider.map((p) => ({ provider: p.provider, revenueKes: p._sum.amountKes ?? 0, count: p._count })),
    byPurpose: byPurpose.map((p) => ({ purpose: p.purpose, revenueKes: p._sum.amountKes ?? 0, count: p._count })),
    recentPayments,
    subscriptionCounts: subscriptionCounts.map((s) => ({ plan: s.plan, status: s.status, count: s._count })),
  };
};

// ── Platform-wide stats for the admin overview dashboard ──────────────

export const getPlatformStats = async () => {
  const [totalStudents, totalTeachers, totalQuestions, pendingQuestions, totalExams, totalAttempts, pendingUploads] =
    await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'TEACHER' } }),
      prisma.question.count({ where: { isApproved: true } }),
      prisma.question.count({ where: { isApproved: false } }),
      prisma.exam.count({ where: { isPublished: true } }),
      prisma.examAttempt.count(),
      prisma.teacherUpload.count({ where: { status: 'PENDING_REVIEW' } }),
    ]);

  return {
    totalStudents,
    totalTeachers,
    totalQuestions,
    pendingQuestions,
    totalExams,
    totalAttempts,
    pendingUploads,
  };
};

// ── Audit log ──────────────────────────────────────────────────────────

export const listAuditLogs = async (params: { page: number; limit: number; action?: string }) => {
  const where = params.action ? { action: params.action } : {};
  const skip = (params.page - 1) * params.limit;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: params.limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    pagination: { page: params.page, limit: params.limit, total, totalPages: Math.ceil(total / params.limit) },
  };
};
