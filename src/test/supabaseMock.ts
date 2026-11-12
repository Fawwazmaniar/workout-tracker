import { vi } from 'vitest';

// Stand-in for the Supabase client. Tests never reach the real project:
// setup.ts replaces lib/supabaseClient with this module for every test file.
export const supabase = {
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  },
  from: vi.fn(() => {
    throw new Error('supabase.from was called in a test without being mocked');
  }),
  rpc: vi.fn(() => {
    throw new Error('supabase.rpc was called in a test without being mocked');
  }),
};
