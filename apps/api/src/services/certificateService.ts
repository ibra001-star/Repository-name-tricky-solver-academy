import PDFDocument from 'pdfkit';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { uploadBuffer } from './uploadService';

const PASS_THRESHOLD_PERCENT = 50;

// Renders a certificate PDF in-memory and returns it as a Buffer — no
// temp files touch disk, consistent with how uploads are handled elsewhere.
const renderCertificatePdf = (params: {
  studentName: string;
  examTitle: string;
  subjectName: string;
  percentage: number;
  dateCompleted: Date;
  certificateId: string;
}): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ layout: 'landscape', size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width;

    // Decorative border in the brand blue/gold palette
    doc
      .rect(20, 20, pageWidth - 40, doc.page.height - 40)
      .lineWidth(3)
      .stroke('#2456e8');
    doc
      .rect(28, 28, pageWidth - 56, doc.page.height - 56)
      .lineWidth(1)
      .stroke('#d4af37');

    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('#2456e8')
      .text('TRICKY SOLVER ACADEMY', 0, 70, { align: 'center' });

    doc
      .font('Helvetica-Bold')
      .fontSize(34)
      .fillColor('#0b1638')
      .text('Certificate of Completion', 0, 110, { align: 'center' });

    doc
      .font('Helvetica')
      .fontSize(14)
      .fillColor('#444')
      .text('This certifies that', 0, 175, { align: 'center' });

    doc
      .font('Helvetica-Bold')
      .fontSize(28)
      .fillColor('#2456e8')
      .text(params.studentName, 0, 200, { align: 'center' });

    doc
      .font('Helvetica')
      .fontSize(14)
      .fillColor('#444')
      .text(`has successfully completed`, 0, 250, { align: 'center' });

    doc
      .font('Helvetica-Bold')
      .fontSize(18)
      .fillColor('#0b1638')
      .text(`${params.examTitle}`, 0, 275, { align: 'center' });

    doc
      .font('Helvetica')
      .fontSize(13)
      .fillColor('#444')
      .text(`${params.subjectName} · Score: ${params.percentage.toFixed(0)}%`, 0, 305, { align: 'center' });

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#888')
      .text(
        `Completed on ${params.dateCompleted.toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}`,
        0,
        340,
        { align: 'center' }
      );

    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#aaa')
      .text(`Certificate ID: ${params.certificateId}`, 0, doc.page.height - 60, { align: 'center' });

    doc.end();
  });
};

// Generates (or returns an already-generated) certificate for a passed exam
// attempt, uploads it to Cloudinary, and records it in the Download table
// so it shows up in the student's download history.
export const getOrCreateCertificate = async (attemptId: string, userId: string) => {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      exam: { include: { subject: true } },
      user: { select: { firstName: true, lastName: true } },
    },
  });

  if (!attempt || attempt.userId !== userId) throw AppError.notFound('Attempt not found');
  if (attempt.status !== 'MARKED') {
    throw AppError.badRequest('This exam has not been fully marked yet');
  }
  if ((attempt.percentage ?? 0) < PASS_THRESHOLD_PERCENT) {
    throw AppError.badRequest(
      `A certificate is only issued for a passing score (${PASS_THRESHOLD_PERCENT}% or higher).`
    );
  }

  // Idempotent: if a certificate was already generated for this attempt, return it.
  const existing = await prisma.download.findFirst({
    where: { userId, resourceType: 'certificate', resourceId: attemptId },
  });
  if (existing) return existing;

  const pdfBuffer = await renderCertificatePdf({
    studentName: `${attempt.user.firstName} ${attempt.user.lastName}`,
    examTitle: attempt.exam.title,
    subjectName: attempt.exam.subject.name,
    percentage: attempt.percentage ?? 0,
    dateCompleted: attempt.submittedAt ?? new Date(),
    certificateId: attempt.id,
  });

  const uploaded = await uploadBuffer(pdfBuffer, { folder: 'certificates', resourceType: 'raw' });

  return prisma.download.create({
    data: {
      userId,
      resourceType: 'certificate',
      resourceId: attemptId,
      fileUrl: uploaded.url,
    },
  });
};

export const listMyDownloads = async (userId: string) => {
  return prisma.download.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
};
