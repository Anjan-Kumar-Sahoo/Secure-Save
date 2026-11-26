// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

// Mock Lucide icons to simple SVG/elements
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual<any>('lucide-react');
  return {
    ...actual,
  };
});

// Mock api service
vi.mock('../src/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  getApiErrorMessage: (err: any) => err?.message || 'Error',
}));

// Mock cardService
vi.mock('../src/services/card.service', () => ({
  cardService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { CardsListing } from '../src/features/cards/CardsListing';
import { cardService } from '../src/services/card.service';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/cards']}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe('CardsListing UI Component Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders exactly one saved card with Title, Cardholder Name, Expiration Date and CVV', async () => {
    const singleCard = {
      _id: 'card-single-1',
      title: 'Personal Visa Debit',
      encryptedPayload: 'enc-payload-1',
      encryptionVersion: '1',
      createdAt: '2026-11-26T12:00:00Z',
      updatedAt: '2026-11-26T12:00:00Z',
      decrypted: {
        cardholderName: 'Anjan Sahoo',
        cardHolderName: 'Anjan Sahoo',
        cardNumber: '4111222233334444',
        expiry: '09/29',
        cvv: '789',
        cardType: 'Visa',
      },
    };

    (cardService.getAll as any).mockResolvedValueOnce([singleCard]);

    render(<CardsListing />, { wrapper: createWrapper() });

    // Verify Title
    expect(await screen.findByText('Personal Visa Debit')).toBeTruthy();

    // Verify Cardholder Name is explicitly rendered, not "—"
    expect(screen.getByText('Anjan Sahoo')).toBeTruthy();
    expect(screen.queryByText('—')).toBeNull();

    // Verify Expiration Date is rendered
    expect(screen.getByText('09/29')).toBeTruthy();

    // Verify masked card number and masked CVV initially
    expect(screen.getByText('•••• •••• •••• 4444')).toBeTruthy();
    expect(screen.getByText('•••')).toBeTruthy();

    // Test CVV toggle reveal
    const toggleCVVBtn = screen.getByTitle('Toggle CVV');
    fireEvent.click(toggleCVVBtn);
    expect(screen.getByText('789')).toBeTruthy();

    // Test card number reveal
    const toggleNumberBtn = screen.getByTitle('Reveal full number');
    fireEvent.click(toggleNumberBtn);
    expect(screen.getByText('4111 2222 3333 4444')).toBeTruthy();
  });

  it('renders multiple saved cards correctly simultaneously', async () => {
    const cards = [
      {
        _id: 'card-1',
        title: 'Mastercard Platinum',
        encryptedPayload: 'enc-1',
        decrypted: {
          cardholderName: 'Jane Doe',
          cardHolderName: 'Jane Doe',
          cardNumber: '5500111122223333',
          expiry: '11/30',
          cvv: '123',
          cardType: 'Mastercard',
        },
      },
      {
        _id: 'card-2',
        title: 'Corporate Amex',
        encryptedPayload: 'enc-2',
        decrypted: {
          cardholderName: 'John Smith',
          cardHolderName: 'John Smith',
          cardNumber: '378211112222333',
          expiry: '04/28',
          cvv: '4567',
          cardType: 'Amex',
        },
      },
    ];

    (cardService.getAll as any).mockResolvedValueOnce(cards);

    render(<CardsListing />, { wrapper: createWrapper() });

    expect(await screen.findByText('Mastercard Platinum')).toBeTruthy();
    expect(screen.getByText('Jane Doe')).toBeTruthy();
    expect(screen.getByText('11/30')).toBeTruthy();

    expect(screen.getByText('Corporate Amex')).toBeTruthy();
    expect(screen.getByText('John Smith')).toBeTruthy();
    expect(screen.getByText('04/28')).toBeTruthy();
  });

  it('renders legacy card records where cardholder was saved as cardHolderName and expiryMonth/Year', async () => {
    const legacyCard = {
      _id: 'card-legacy',
      title: 'Old Legacy Card',
      encryptedPayload: 'enc-legacy',
      decrypted: {
        cardHolderName: 'Legacy Holder',
        cardNumber: '4000123456789010',
        expiryMonth: '05',
        expiryYear: '27',
        cvv: '555',
        cardType: 'Visa',
      },
    };

    (cardService.getAll as any).mockResolvedValueOnce([legacyCard]);

    render(<CardsListing />, { wrapper: createWrapper() });

    expect(await screen.findByText('Old Legacy Card')).toBeTruthy();
    expect(screen.getByText('Legacy Holder')).toBeTruthy();
    expect(screen.getByText('05/27')).toBeTruthy();
  });
});
