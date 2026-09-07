import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Farmers from '../Farmers';
import { farmerAPI } from '../../api/client';
import toast from 'react-hot-toast';

vi.mock('../../api/client', () => ({
  farmerAPI: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../context/PermissionContext', () => ({
  usePermissions: () => ({ has: () => true }),
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const modalStatusSelect = () =>
  screen
    .getAllByRole('combobox')
    .find((sel) => sel.value === 'ACTIVE' || sel.value === 'INACTIVE');

describe('Farmers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    farmerAPI.getAll.mockResolvedValue({
      data: [
        {
          id: 1,
          name: 'Existing',
          code: 'TF-1',
          phone: '077 000 0000',
          division: 'Kegalle Division',
          status: 'ACTIVE',
          monthlyLeaf: 0,
          advanceBalance: 0,
        },
      ],
    });
    farmerAPI.create.mockResolvedValue({ data: { id: 2 } });
  });

  it('adds a farmer with an uppercase ACTIVE status by default', async () => {
    const user = userEvent.setup();
    render(<Farmers />);

    await screen.findByText('Existing');
    await user.click(screen.getByRole('button', { name: /add farmer/i }));

    await screen.findByRole('heading', { name: 'Add farmer' });
    const status = modalStatusSelect();
    expect(status).toHaveValue('ACTIVE');

    await user.type(screen.getByPlaceholderText('e.g. S. Perera'), 'New Supplier');
    await user.type(screen.getByPlaceholderText('TF-1201'), 'TF-99');
    await user.type(screen.getByPlaceholderText('077 123 4567'), '077 111 2222');
    await user.type(screen.getByPlaceholderText('Kegalle Division'), 'Rambukkana');
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => {
      expect(farmerAPI.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Supplier',
          code: 'TF-99',
          status: 'ACTIVE',
        })
      );
    });
    expect(toast.success).toHaveBeenCalledWith('Farmer added');
  });

  it('sends INACTIVE when the status dropdown is changed', async () => {
    const user = userEvent.setup();
    render(<Farmers />);

    await screen.findByText('Existing');
    await user.click(screen.getByRole('button', { name: /add farmer/i }));
    await screen.findByRole('heading', { name: 'Add farmer' });

    await user.type(screen.getByPlaceholderText('e.g. S. Perera'), 'Inactive Supplier');
    await user.type(screen.getByPlaceholderText('TF-1201'), 'TF-98');
    await user.type(screen.getByPlaceholderText('077 123 4567'), '077 333 4444');
    await user.type(screen.getByPlaceholderText('Kegalle Division'), 'Kegalle Division');

    await user.selectOptions(modalStatusSelect(), 'INACTIVE');
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => {
      expect(farmerAPI.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'INACTIVE', name: 'Inactive Supplier' })
      );
    });
  });

  it('expects the status dropdown to offer only uppercase enum values', async () => {
    const user = userEvent.setup();
    render(<Farmers />);

    await screen.findByText('Existing');
    await user.click(screen.getByRole('button', { name: /add farmer/i }));

    const status = await screen.findByRole('heading', { name: 'Add farmer' }).then(() => modalStatusSelect());
    const values = [...status.options].map((o) => o.value);
    expect(values).toEqual(['ACTIVE', 'INACTIVE']);
  });
});