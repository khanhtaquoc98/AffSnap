'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check, Building2 } from 'lucide-react';
import { VietQRBank } from '@/app/api/banks/route';

interface BankAutocompleteProps {
  banks: VietQRBank[];
  selectedBankCode: string;
  onSelectBank: (bank: VietQRBank) => void;
  disabled?: boolean;
}

export const BankAutocomplete: React.FC<BankAutocompleteProps> = ({
  banks,
  selectedBankCode,
  onSelectBank,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedBank = banks.find((b) => b.code.toUpperCase() === selectedBankCode.toUpperCase()) || banks[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredBanks = banks.filter((bank) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      bank.shortName.toLowerCase().includes(q) ||
      bank.name.toLowerCase().includes(q) ||
      bank.code.toLowerCase().includes(q)
    );
  });

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Selected Bank Display / Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-bold flex items-center justify-between gap-3 focus:outline-none focus:bg-white focus:border-orange-500 transition disabled:opacity-60"
      >
        <div className="flex items-center gap-3 truncate">
          {selectedBank?.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selectedBank.logo}
              alt={selectedBank.shortName}
              className="w-7 h-7 object-contain rounded-md bg-white p-0.5 border border-slate-100 shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-7 h-7 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
          )}

          <div className="text-left truncate space-y-0.5">
            <span className="block font-black text-slate-900 text-xs truncate">
              {selectedBank ? `${selectedBank.shortName} (${selectedBank.code})` : 'Chọn ngân hàng...'}
            </span>
            {selectedBank?.name && (
              <span className="block text-[10px] text-slate-400 font-normal truncate">
                {selectedBank.name}
              </span>
            )}
          </div>
        </div>

        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Autocomplete Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden animate-tab-fade">
          {/* Search Input Field */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/80">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm ngân hàng (VD: Vietcombank, TPB, MB...)"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500"
                autoFocus
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Bank Options List */}
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
            {filteredBanks.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 font-medium">
                Không tìm thấy ngân hàng khớp với từ khóa
              </div>
            ) : (
              filteredBanks.map((bank) => {
                const isSelected = selectedBank?.code.toUpperCase() === bank.code.toUpperCase();
                return (
                  <button
                    key={bank.id || bank.code}
                    type="button"
                    onClick={() => {
                      onSelectBank(bank);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={`w-full p-3 flex items-center justify-between text-left transition hover:bg-orange-50/60 ${
                      isSelected ? 'bg-orange-50 font-bold' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      {bank.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={bank.logo}
                          alt={bank.shortName}
                          className="w-8 h-8 object-contain rounded-lg bg-white p-1 border border-slate-200 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                          {bank.code.substring(0, 3)}
                        </div>
                      )}

                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900">{bank.shortName}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold border border-slate-200">
                            {bank.code}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-normal truncate">{bank.name}</p>
                      </div>
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-orange-600 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
