import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Splits } from './Splits';
import { createSplit, fetchSplits } from '../../lib/splits';
import { fetchActiveSplit } from '../../lib/logs';
import { renderWithProviders, signIn } from '../../test/renderWithProviders';

vi.mock('../../lib/splits', () => ({
  fetchSplits: vi.fn(),
  createSplit: vi.fn(),
  updateSplit: vi.fn(),
  deleteSplit: vi.fn(),
  setActiveSplit: vi.fn(),
}));
vi.mock('../../lib/logs', () => ({ fetchActiveSplit: vi.fn() }));

describe('Split builder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signIn('user-1');
    vi.mocked(fetchActiveSplit).mockResolvedValue(null);
  });

  it('lists existing splits', async () => {
    vi.mocked(fetchSplits).mockResolvedValue([
      { id: 's1', name: 'Push Pull Legs', user_id: 'user-1' },
    ] as never);
    renderWithProviders(<Splits />);
    expect(await screen.findByRole('heading', { name: 'Push Pull Legs' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /manage/i })).toHaveAttribute('href', '/splits/s1');
  });

  it('creates a split for the signed-in user and shows it after the list refreshes', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchSplits)
      .mockResolvedValueOnce([{ id: 's1', name: 'Push Pull Legs', user_id: 'user-1' }] as never)
      .mockResolvedValue([
        { id: 's1', name: 'Push Pull Legs', user_id: 'user-1' },
        { id: 's2', name: 'Upper Lower', user_id: 'user-1' },
      ] as never);
    vi.mocked(createSplit).mockResolvedValue([{ id: 's2' }] as never);

    renderWithProviders(<Splits />);
    await user.click(await screen.findByRole('button', { name: 'Add split' }));
    await user.type(screen.getByLabelText('Split name'), '  Upper Lower ');
    await user.click(screen.getByRole('button', { name: 'Add split', description: '' }));

    await waitFor(() => expect(createSplit).toHaveBeenCalledWith('user-1', 'Upper Lower'));
    expect(await screen.findByRole('heading', { name: 'Upper Lower' })).toBeInTheDocument();
  });

  it('shows an error message when splits fail to load', async () => {
    vi.mocked(fetchSplits).mockRejectedValue(new Error('network down'));
    renderWithProviders(<Splits />);
    expect(await screen.findByText(/network down/)).toBeInTheDocument();
  });
});
