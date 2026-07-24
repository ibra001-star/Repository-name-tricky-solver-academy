import { PrismaClient, Role } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

const hash = (pw: string) =>
  argon2.hash(pw, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });

async function main() {
  console.log('🌱 Seeding Tricky Solver Academy database...');

  // ── Demo users ──────────────────────────────────────────────────────
  const adminPassword = await hash('Admin@12345');
  const teacherPassword = await hash('Teacher@12345');
  const studentPassword = await hash('Student@12345');

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@trickysolver.academy' },
    update: {},
    create: {
      email: 'admin@trickysolver.academy',
      passwordHash: adminPassword,
      firstName: 'System',
      lastName: 'Admin',
      role: Role.SUPER_ADMIN,
      isEmailVerified: true,
    },
  });

  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@trickysolver.academy' },
    update: {},
    create: {
      email: 'teacher@trickysolver.academy',
      passwordHash: teacherPassword,
      firstName: 'Ibrahim',
      lastName: 'Teacher',
      role: Role.TEACHER,
      isEmailVerified: true,
      school: 'Mandera Secondary School',
    },
  });

  await prisma.user.upsert({
    where: { email: 'student@trickysolver.academy' },
    update: {},
    create: {
      email: 'student@trickysolver.academy',
      passwordHash: studentPassword,
      firstName: 'Amina',
      lastName: 'Student',
      role: Role.STUDENT,
      isEmailVerified: true,
      form: 3,
      school: 'Mandera Secondary School',
    },
  });

  // ── Subjects ────────────────────────────────────────────────────────
  const mathematics = await prisma.subject.upsert({
    where: { slug: 'mathematics' },
    update: {},
    create: {
      name: 'Mathematics',
      slug: 'mathematics',
      description: 'Master algebra, geometry, calculus, statistics and more — aligned to CBC and KCSE.',
    },
  });

  const businessStudies = await prisma.subject.upsert({
    where: { slug: 'business-studies' },
    update: {},
    create: {
      name: 'Business Studies',
      slug: 'business-studies',
      description: 'Excel in accounting, entrepreneurship, commerce and economics fundamentals.',
    },
  });

  // Future-expansion subjects, created inactive so they appear "coming soon"
  for (const [name, slug] of [
    ['Chemistry', 'chemistry'],
    ['Biology', 'biology'],
    ['Computer Studies', 'computer-studies'],
    ['Physics', 'physics'],
  ]) {
    await prisma.subject.upsert({
      where: { slug },
      update: {},
      create: { name, slug, isActive: false, description: `${name} — coming soon.` },
    });
  }

  // ── Mathematics topics (KCSE Form 1-4 style) ───────────────────────
  const mathTopics = [
    'Numbers', 'Algebra', 'Geometry', 'Trigonometry', 'Statistics',
    'Calculus', 'Vectors', 'Matrices', 'Probability', 'Linear Programming',
  ];
  for (const name of mathTopics) {
    await prisma.topic.upsert({
      where: { subjectId_slug: { subjectId: mathematics.id, slug: name.toLowerCase().replace(/\s+/g, '-') } },
      update: {},
      create: {
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        subjectId: mathematics.id,
        curriculum: 'KCSE',
      },
    });
  }

  // ── Business Studies topics ─────────────────────────────────────────
  const businessTopics = [
    'Entrepreneurship', 'Production', 'Financial Accounting', 'Commerce',
    'Economics', 'Office Practice', 'Management', 'Insurance',
  ];
  for (const name of businessTopics) {
    await prisma.topic.upsert({
      where: { subjectId_slug: { subjectId: businessStudies.id, slug: name.toLowerCase().replace(/\s+/g, '-') } },
      update: {},
      create: {
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        subjectId: businessStudies.id,
        curriculum: 'KCSE',
      },
    });
  }

  // ── Sample questions covering multiple types, so Phase 2 features
  // (question bank browsing, exam engine, instant marking) have real data ──
  const algebraTopic = await prisma.topic.findFirst({
    where: { subjectId: mathematics.id, slug: 'algebra' },
  });
  const numbersTopic = await prisma.topic.findFirst({
    where: { subjectId: mathematics.id, slug: 'numbers' },
  });
  const entrepreneurshipTopic = await prisma.topic.findFirst({
    where: { subjectId: businessStudies.id, slug: 'entrepreneurship' },
  });

  const seededQuestions: { id: string }[] = [];

  if (algebraTopic) {
    const q1 = await prisma.question.create({
      data: {
        subjectId: mathematics.id,
        topicId: algebraTopic.id,
        type: 'CALCULATION',
        difficulty: 'MEDIUM',
        curriculum: 'KCSE',
        form: 2,
        year: 2023,
        tags: ['linear-equations', 'algebra'],
        marks: 3,
        authorId: teacher.id,
        isApproved: true,
        content: { text: 'Solve for x in the equation: 3x + 7 = 22', latex: '3x + 7 = 22' },
        solution: {
          steps: ['Subtract 7 from both sides: 3x = 15', 'Divide both sides by 3: x = 5'],
          finalAnswer: 'x = 5',
        },
      },
    });
    seededQuestions.push(q1);
  }

  if (numbersTopic) {
    const q2 = await prisma.question.create({
      data: {
        subjectId: mathematics.id,
        topicId: numbersTopic.id,
        type: 'MULTIPLE_CHOICE',
        difficulty: 'EASY',
        curriculum: 'KCSE',
        form: 1,
        year: 2024,
        tags: ['integers', 'arithmetic'],
        marks: 1,
        authorId: teacher.id,
        isApproved: true,
        content: {
          text: 'What is the value of 15 - (-8)?',
          options: [
            { id: 'a', text: '7', isCorrect: false },
            { id: 'b', text: '23', isCorrect: true },
            { id: 'c', text: '-23', isCorrect: false },
            { id: 'd', text: '-7', isCorrect: false },
          ],
        },
        solution: {
          steps: ['Subtracting a negative is the same as adding: 15 - (-8) = 15 + 8'],
          finalAnswer: '23',
        },
      },
    });
    seededQuestions.push(q2);

    const q3 = await prisma.question.create({
      data: {
        subjectId: mathematics.id,
        topicId: numbersTopic.id,
        type: 'MULTIPLE_CHOICE',
        difficulty: 'EASY',
        curriculum: 'KCSE',
        form: 1,
        year: 2024,
        tags: ['fractions'],
        marks: 1,
        authorId: teacher.id,
        isApproved: true,
        content: {
          text: 'Simplify: 3/4 + 1/8',
          latex: '\\frac{3}{4} + \\frac{1}{8}',
          options: [
            { id: 'a', text: '7/8', isCorrect: true },
            { id: 'b', text: '4/12', isCorrect: false },
            { id: 'c', text: '1/2', isCorrect: false },
            { id: 'd', text: '5/8', isCorrect: false },
          ],
        },
        solution: {
          steps: ['Convert 3/4 to eighths: 6/8', 'Add: 6/8 + 1/8 = 7/8'],
          finalAnswer: '7/8',
        },
      },
    });
    seededQuestions.push(q3);
  }

  if (entrepreneurshipTopic) {
    const q4 = await prisma.question.create({
      data: {
        subjectId: businessStudies.id,
        topicId: entrepreneurshipTopic.id,
        type: 'STRUCTURED',
        difficulty: 'MEDIUM',
        curriculum: 'KCSE',
        form: 3,
        year: 2023,
        tags: ['entrepreneurship', 'case-study'],
        marks: 6,
        authorId: teacher.id,
        isApproved: true,
        content: {
          text: 'Juma wants to start a small posho mill business in his local market in Mandera. Outline THREE factors he should consider before starting this business.',
        },
        solution: {
          steps: [
            'Capital availability — does Juma have enough startup capital or access to credit?',
            'Market demand — is there sufficient demand for milling services in the area?',
            'Location — is the market accessible to farmers bringing grain for milling?',
          ],
          finalAnswer:
            'Any three well-explained factors relevant to starting a small business (capital, market demand, location, competition, licensing, etc.)',
        },
      },
    });
    seededQuestions.push(q4);
  }

  // Publish a short demo exam from the Mathematics MCQ questions so the
  // exam-taking engine has something to attempt immediately after seeding.
  const mcqQuestions = seededQuestions.filter((_, i) => i === 1 || i === 2);
  if (mcqQuestions.length > 0) {
    const totalMarks = mcqQuestions.length; // 1 mark each in this seed set
    await prisma.exam.create({
      data: {
        title: 'Form 1 Numbers — Quick Practice',
        description: 'A short topical quiz covering integers and fractions.',
        subjectId: mathematics.id,
        examType: 'TOPICAL',
        curriculum: 'KCSE',
        form: 1,
        durationMinutes: 10,
        totalMarks,
        isPublished: true,
        createdById: teacher.id,
        examQuestions: {
          create: mcqQuestions.map((q, index) => ({ questionId: q.id, order: index })),
        },
      },
    });
  }

  // Publish a premium exam (uses the algebra question) so the payment flow
  // has real content to purchase/subscribe against right after seeding.
  const algebraQuestion = seededQuestions[0]; // the CALCULATION question, form 2
  if (algebraQuestion) {
    await prisma.exam.create({
      data: {
        title: 'Form 2 Algebra — KCSE Mock Premium Paper',
        description: 'A premium mock exam covering linear equations, unlocked via subscription or one-time purchase.',
        subjectId: mathematics.id,
        examType: 'KCSE_MOCK',
        curriculum: 'KCSE',
        form: 2,
        durationMinutes: 15,
        totalMarks: 3,
        isPremium: true,
        priceKes: 50,
        isPublished: true,
        createdById: teacher.id,
        examQuestions: {
          create: [{ questionId: algebraQuestion.id, order: 0 }],
        },
      },
    });
  }

  // Demo coupon for testing the discount flow locally.
  await prisma.coupon.upsert({
    where: { code: 'WELCOME20' },
    update: {},
    create: { code: 'WELCOME20', discountPercent: 20, maxUses: 1000 },
  });

  // Demo teacher upload sitting in the admin review queue, so the Upload
  // Approvals screen has something real to show right after seeding.
  const existingUpload = await prisma.teacherUpload.findFirst({
    where: { teacherId: teacher.id, title: 'Form 3 Business Studies — Entrepreneurship Notes' },
  });
  if (!existingUpload) {
    await prisma.teacherUpload.create({
      data: {
        teacherId: teacher.id,
        title: 'Form 3 Business Studies — Entrepreneurship Notes',
        subjectArea: 'Business Studies',
        fileUrl: 'https://example.com/placeholder-demo-upload.pdf',
        fileType: 'pdf',
      },
    });
  }

  // Demo published live class so the Live Classes page has real data.
  const existingLiveClass = await prisma.liveClass.findFirst({
    where: { hostId: teacher.id, title: 'Form 4 Algebra Revision — Live Q&A' },
  });
  if (!existingLiveClass) {
    const scheduledStart = new Date();
    scheduledStart.setDate(scheduledStart.getDate() + 2);
    scheduledStart.setHours(16, 0, 0, 0);

    await prisma.liveClass.create({
      data: {
        title: 'Form 4 Algebra Revision — Live Q&A',
        description: 'A live Q&A session covering common KCSE algebra question patterns.',
        type: 'ZOOM',
        subjectId: mathematics.id,
        hostId: teacher.id,
        joinUrl: 'https://zoom.us/j/1234567890',
        scheduledStart,
        durationMinutes: 60,
        isPublished: true,
      },
    });
  }

  console.log('✅ Seed complete.');
  console.log(`   Admin:   admin@trickysolver.academy / Admin@12345 (id: ${adminUser.id})`);
  console.log('   Teacher: teacher@trickysolver.academy / Teacher@12345');
  console.log('   Student: student@trickysolver.academy / Student@12345');
  console.log('   Demo coupon: WELCOME20 (20% off)');
  console.log('   Demo live class: Form 4 Algebra Revision — Live Q&A (2 days from now)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
