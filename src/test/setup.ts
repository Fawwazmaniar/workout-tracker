import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

vi.mock('../lib/supabaseClient', async () => await import('./supabaseMock'));

afterEach(() => {
  cleanup();
});
