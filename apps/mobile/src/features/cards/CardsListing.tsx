import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

interface SavedCard {
  id: string;
  title: string;
  cardType?: string;
  expiryDate?: string;
  maskedNumber?: string;
  cardholderName?: string;
}

interface SavedBank {
  id: string;
  title: string;
  accountType?: string;
  maskedAccountNumber?: string;
}

export const CardsListing = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['cards', user?.id],
    queryFn: async () => {
      // Mock cards list - in real app: await api.getCards(user.id)
      return [];
    },
    enabled: !!user,
  });

  const { data: banks = [], isLoading: isLoadingBanks } = useQuery({
    queryKey: ['banks', user?.id],
    queryFn: async () => {
      // Mock banks list - in real app: await api.getBanks(user.id)
      return [];
    },
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-[#0B0D12] text-[#F5F7FA]">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[#293244] bg-[#141821]">
        <h1 className="text-xl font-bold text-[#F5F7FA]">Cards</h1>
        <button
          onClick={() => navigate('/cards/add')}
          className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl"
        >
          <Plus className="w-4 h-4" />
          Add Card
        </button>
      </nav>

      <main className="p-6">
        {isLoading || isLoadingBanks ? (
          <div className="min-h-64 flex items-center justify-center text-[#929BAA]">
            <span>Loading...</span>
          </div>
        ) : (
          <>
            <section className="mb-8">
              <h2 className="text-xl font-bold text-[#F5F7FA] mb-6">Bank Details</h2>
              {banks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {banks.map((bank) => (
                    <div
                      key={bank.id}
                      className="grid grid-cols-2 gap-2 border-b border-[#293244] py-4"
                    >
                      <div>
                        <p className="font-semibold text-sm">{bank.title}</p>
                        {bank.accountType && (
                          <p className="text-xs text-[#929BAA]">{bank.accountType}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-[#929BAA]">
                          {bank.maskedAccountNumber || '**** **** **** ****'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#929BAA] py-8">No bank details saved yet.</p>
              )}
            </section>

            {cards.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {cards.map((card) => (
                  <div
                    key={card.id}
                    className="grid grid-cols-2 gap-4 card-premium p-6 rounded-2xl border border-[#293244] flex items-center justify-between"
                  >
                    <div>
                      <h3 className="font-medium text-lg">{card.title}</h3>
                      {card.cardType && (
                        <p className="text-xs text-[#929BAA]">{card.cardType}</p>
                      )}
                      {card.maskedNumber && (
                        <p className="font-mono text-xs text-[#929BAA]">
                          {card.maskedNumber}
                        </p>
                      )}
                      {card.cardholderName && (
                        <p className="text-sm text-[#929BAA]">{card.cardholderName}</p>
                      )}
                      {card.expiryDate && (
                        <p className="text-xs text-[#929BAA]">{card.expiryDate}</p>
                      )}
                    </div>
                    <button
                      className="flex items-center gap-2 text-[#8B7CFF] hover:underline"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-[#929BAA]">
                <p>No saved cards yet.</p>
                <p className="mt-2">Add your first card to get started.</p>
              </div>
            )}
          </>
        )}
      </main>

    </div>
  );
};