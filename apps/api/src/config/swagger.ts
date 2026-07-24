import swaggerJsdoc from 'swagger-jsdoc';

// Auto-generates OpenAPI 3.0 docs from JSDoc comments (@openapi blocks) in
// route files, so documentation lives next to the code it describes and
// can't drift out of sync as easily as a hand-maintained spec.
export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tricky Solver Academy API',
      version: '1.0.0',
      description:
        'REST API for Tricky Solver Academy — an online learning and assessment platform for Kenyan secondary school students (CBC Senior School & KCSE).',
      contact: { name: 'Tricky Solver Academy', url: 'https://trickysolver.academy' },
    },
    servers: [
      { url: '/api/v1', description: 'Current environment' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Registration, login, tokens, 2FA' },
      { name: 'Subjects', description: 'Subjects and topics taxonomy' },
      { name: 'Questions', description: 'Question bank: browse, create, approve, bookmark' },
      { name: 'Exams', description: 'Exam builder and exam-taking engine' },
      { name: 'Payments', description: 'M-Pesa, Stripe, and PayPal payments for subscriptions and paper purchases' },
      { name: 'Coupons', description: 'Discount coupon management' },
      { name: 'Uploads', description: 'Teacher revision paper and marking scheme uploads' },
      { name: 'Admin', description: 'User management, revenue reports, platform stats, audit logs' },
      { name: 'Notifications', description: 'In-app notifications' },
      { name: 'Certificates', description: 'Certificate generation and download history' },
      { name: 'Forum', description: 'Student discussion forum' },
      { name: 'Messages', description: 'Direct messaging between teachers and students' },
      { name: 'Blog', description: 'Blog / CMS' },
      { name: 'Referrals', description: 'Referral program' },
      { name: 'Live Classes', description: 'Zoom sessions and YouTube lesson videos' },
      { name: 'Study Plan', description: 'Personal revision timetable' },
      { name: 'Newsletter', description: 'Newsletter subscription' },
      { name: 'Health', description: 'Service health checks' },
    ],
  },
  apis: ['./src/routes/*.ts'],
});
