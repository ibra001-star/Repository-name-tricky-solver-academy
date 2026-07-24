import { config } from 'dotenv';

config({ path: '.env.test' });

// Fallback test secrets if .env.test is absent, so `npm test` works out of
// the box in CI as long as DATABASE_URL points at a disposable test DB.
process.env.JWT_ACCESS_SECRET ||= 'test-access-secret-please-override-in-env-test-file-123456';
process.env.JWT_REFRESH_SECRET ||= 'test-refresh-secret-please-override-in-env-test-file-654321';
process.env.NODE_ENV = 'test';
