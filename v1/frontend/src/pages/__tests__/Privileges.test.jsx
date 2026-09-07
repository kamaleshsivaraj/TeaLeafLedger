import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Privileges from '../Privileges';
import { permissionAPI } from '../../api/client';
import toast from 'react-hot-toast';

vi.mock('../../api/client', () => ({
  permissionAPI: {
    getModules: vi.fn(),
    getMatrix: vi.fn(),
    updateMatrix: vi.fn(),
  },
}));

vi.mock('../../context/AuthContext', () => {
  const user = { role: 'ADMIN' };
  return { useAuth: () => ({ user }) };
});

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const matrix = (role) => ({
  DASHBOARD: ['VIEW'],
  FARMERS: ['VIEW', 'CREATE'],
  FINANCE: role === 'MANAGER' ? ['VIEW', 'CREATE', 'UPDATE'] : ['VIEW'],
});

const moduleRow = (moduleLabel) => {
  const row = screen
    .getAllByRole('row')
    .find((r) => within(r).queryByText(moduleLabel));
  return within(row).getAllByRole('checkbox');
};

describe('Privileges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    permissionAPI.getModules.mockResolvedValue({
      data: { modules: ['DASHBOARD', 'FARMERS', 'FINANCE'], actions: ['VIEW', 'CREATE', 'UPDATE'] },
    });
    permissionAPI.getMatrix.mockImplementation((role) => Promise.resolve({ data: matrix(role) }));
    permissionAPI.updateMatrix.mockResolvedValue({ data: {} });
  });

  it('renders role tabs and disables Save until a checkbox changes', async () => {
    render(<Privileges />);

    await screen.findByRole('heading', { name: 'Roles & privileges' });
    expect(screen.getByRole('button', { name: 'manager' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'accountant' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'operator' })).toBeInTheDocument();

    const save = screen.getByRole('button', { name: /save manager permissions/i });
    await waitFor(() => expect(save).toBeDisabled());

    const dashboard = moduleRow('Overview / dashboard');
    expect(dashboard[0]).toBeChecked();
    expect(dashboard[1]).not.toBeChecked();
  });

  it('enables Save after a toggle and persists the matrix for the active role', async () => {
    const user = userEvent.setup();
    render(<Privileges />);

    const save = await screen.findByRole('button', { name: /save manager permissions/i });
    await waitFor(() => expect(permissionAPI.getMatrix).toHaveBeenCalledTimes(3));
    await waitFor(() => expect(save).toBeDisabled());

    const dashboard = moduleRow('Overview / dashboard');
    await user.click(dashboard[1]);

    await waitFor(() => expect(save).toBeEnabled());
    await user.click(save);
    await waitFor(() => {
      expect(permissionAPI.updateMatrix).toHaveBeenCalledWith(
        'MANAGER',
        expect.objectContaining({
          DASHBOARD: expect.arrayContaining(['VIEW', 'CREATE']),
        })
      );
    });
    expect(toast.success).toHaveBeenCalledWith('MANAGER permissions saved');
    await waitFor(() => expect(save).toBeDisabled());
  });

  it('saves to the role selected in the tab, not the default', async () => {
    const user = userEvent.setup();
    render(<Privileges />);

    await user.click(await screen.findByRole('button', { name: 'operator' }));

    const operatorSave = screen.getByRole('button', { name: /save operator permissions/i });
    await waitFor(() => expect(operatorSave).toBeDisabled());

    const farmers = moduleRow('Farmers');
    await user.click(farmers[2]);

    await user.click(operatorSave);
    await waitFor(() => {
      expect(permissionAPI.updateMatrix).toHaveBeenCalledWith(
        'OPERATOR',
        expect.objectContaining({
          FARMERS: expect.arrayContaining(['VIEW', 'UPDATE']),
        })
      );
    });
    expect(toast.success).toHaveBeenCalledWith('OPERATOR permissions saved');
  });
});