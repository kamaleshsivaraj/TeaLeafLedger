import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { settingsAPI } from '../../api/client';
import toast from 'react-hot-toast';

vi.mock('../../api/client', () => ({
  settingsAPI: {
    getDayStatus: vi.fn(),
    updateDayStatus: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

async function renderFor(role) {
  const user = { role };
  vi.doMock('../../context/AuthContext', () => ({
    useAuth: () => ({ user }),
  }));
  const { default: DayStatus } = await import('../DayStatus');
  return render(<DayStatus />);
}

describe('DayStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    settingsAPI.getDayStatus.mockResolvedValue({ data: { status: 'OPEN' } });
    settingsAPI.updateDayStatus.mockResolvedValue({ data: { status: 'HALFDAY' } });
  });

  it('shows the current collection day status', async () => {
    await renderFor('ADMIN');

    await screen.findByText('Collection day open');
    expect(screen.getByTitle('Change collection day status')).toBeInTheDocument();
  });

  it('sends the selected status to the API through the dropdown', async () => {
    const user = userEvent.setup();
    await renderFor('ADMIN');

    await user.click(await screen.findByTitle('Change collection day status'));
    await user.click(screen.getByRole('button', { name: /half day/i }));

    await waitFor(() => expect(settingsAPI.updateDayStatus).toHaveBeenCalledWith('HALFDAY'));
    await waitFor(() => expect(screen.getByText('Collection day — half day')).toBeInTheDocument());
    expect(toast.success).toHaveBeenCalledWith('Collection day set to Half day');
  });

  it('hides the change control for roles without permission', async () => {
    await renderFor('ACCOUNTANT');

    await screen.findByText('Collection day open');
    expect(screen.queryByTitle('Change collection day status')).not.toBeInTheDocument();
  });
});