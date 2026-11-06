/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Search, X, ArrowUpDown } from 'lucide-react';
import { FilterState, SellOutStatus } from '../types';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  silhouettes: string[];
  poNumbers: string[];
  totalResults: number;
  totalAll?: number;
  language?: 'RU' | 'IT';
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  silhouettes,
  poNumbers,
  totalResults,
  totalAll = totalResults,
  language = 'RU',
}) => {
  const isRussian = language === 'RU';

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const clearFilters = () => {
    onFilterChange({
      search: '',
      linesheet: 'ALL',
      silhouette: 'ALL',
      sellOutStatus: 'ALL',
      poNumber: 'ALL',
      sortBy: 'sellOutDesc',
    });
  };

  const isFiltered =
    filters.search !== '' ||
    filters.silhouette !== 'ALL' ||
    filters.sellOutStatus !== 'ALL' ||
    filters.poNumber !== 'ALL' ||
    filters.linesheet !== 'ALL';

  return (
    <div className="bg-white border border-[#E5E3DC] rounded-xl p-3.5 mb-6 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
      {/* Search Bar - Full search line like screenshot */}
      <div className="relative w-full">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
        <input
          type="text"
          value={filters.search}
          onChange={handleSearch}
          placeholder={
            isRussian
              ? 'Поиск по модели, артикулу, цвету или составу ткани...'
              : 'Cerca per modello, codice stile, colore o composizione tessuto...'
          }
          className="w-full bg-white border border-[#DCD9CE] rounded-lg pl-9 pr-8 py-2 text-xs text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#C27803] transition-colors shadow-2xs"
        />
        {filters.search && (
          <button
            onClick={() => onFilterChange({ ...filters, search: '' })}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#1A1A1A] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Row of Dropdown Filters matching screenshot */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 w-full pt-1">
        {/* Silhouette selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-[#6B7280] font-normal">{isRussian ? 'Категория:' : 'Categoria:'}</span>
          <select
            aria-label="Filter by silhouette"
            value={filters.silhouette}
            onChange={(e) => onFilterChange({ ...filters, silhouette: e.target.value })}
            className="bg-white border border-[#DCD9CE] text-[#1A1A1A] rounded-md px-2.5 py-1.5 text-xs outline-none focus:border-[#C27803] cursor-pointer shadow-2xs"
          >
            <option value="ALL">{isRussian ? 'Все категории' : 'Tutte le categorie'}</option>
            {silhouettes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Sell-out performance status */}
        <div className="flex items-center gap-1.5">
          <span className="text-[#6B7280] font-normal">{isRussian ? 'Уровень продаж:' : 'Livello vendite:'}</span>
          <select
            aria-label="Filter by sell-out status"
            value={filters.sellOutStatus}
            onChange={(e) =>
              onFilterChange({ ...filters, sellOutStatus: e.target.value as SellOutStatus })
            }
            className="bg-white border border-[#DCD9CE] text-[#1A1A1A] rounded-md px-2.5 py-1.5 text-xs outline-none focus:border-[#C27803] cursor-pointer shadow-2xs"
          >
            <option value="ALL">{isRussian ? 'Все уровни' : 'Tutti i livelli'}</option>
            <option value="BESTSELLER">{isRussian ? '★ Лидеры (≥ 70%)' : '★ Bestseller (≥ 70%)'}</option>
            <option value="HEALTHY">{isRussian ? '● Средний (40% - 69%)' : '● Regolare (40% - 69%)'}</option>
            <option value="SLOW">{isRussian ? '▼ Медленный (< 40%)' : '▼ Slow Mover (< 40%)'}</option>
            <option value="OUT_OF_STOCK">{isRussian ? '✕ Распродано' : '✕ Esaurito'}</option>
          </select>
        </div>

        {/* PO filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[#6B7280] font-normal">{isRussian ? 'Заказ:' : 'Ordine:'}</span>
          <select
            aria-label="Filter by purchase order"
            value={filters.poNumber}
            onChange={(e) => onFilterChange({ ...filters, poNumber: e.target.value })}
            className="bg-white border border-[#DCD9CE] text-[#1A1A1A] rounded-md px-2.5 py-1.5 text-xs outline-none focus:border-[#C27803] cursor-pointer shadow-2xs"
          >
            <option value="ALL">{isRussian ? 'Все заказы' : 'Tutti gli ordini'}</option>
            {poNumbers.map((po) => (
              <option key={po} value={po}>
                PO #{po}
              </option>
            ))}
          </select>
        </div>

        {/* Sort by */}
        <div className="flex items-center gap-1.5">
          <span className="text-[#6B7280] font-normal">{isRussian ? 'Сортировка:' : 'Ordinamento:'}</span>
          <div className="flex items-center gap-1 bg-white border border-[#DCD9CE] rounded-md px-2 py-1 shadow-2xs">
            <ArrowUpDown className="w-3 h-3 text-[#6B7280]" />
            <select
              aria-label="Sort products by"
              value={filters.sortBy}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  sortBy: e.target.value as FilterState['sortBy'],
                })
              }
              className="bg-transparent text-[#1A1A1A] text-xs outline-none cursor-pointer pr-1"
            >
              <option value="sellOutDesc">
                {isRussian ? 'Продано: от большего к меньшему' : 'Sell-Out % (Decrescente)'}
              </option>
              <option value="unitsDesc">
                {isRussian ? 'Количество единиц' : 'Capi Ordinati (Volume)'}
              </option>
              <option value="wholesaleDesc">
                {isRussian ? 'Оптовая стоимость' : 'Valore Wholesale (€)'}
              </option>
              <option value="retailDesc">
                {isRussian ? 'Розничная стоимость' : 'Valore Retail (€)'}
              </option>
              <option value="nameAsc">
                {isRussian ? 'Модель (А-Я / A-Z)' : 'Nome Modello (A-Z)'}
              </option>
            </select>
          </div>
        </div>

        {/* Reset filter if active */}
        {isFiltered && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs text-[#DC2626] hover:bg-[#FEE2E2] transition-colors cursor-pointer"
          >
            <X className="w-3 h-3" />
            <span>{isRussian ? 'Сбросить' : 'Azzera'}</span>
          </button>
        )}

        {/* Counter */}
        <div className="ml-auto text-[#6B7280] text-xs">
          {isRussian ? (
            <>Показано <strong className="text-[#1A1A1A] font-medium">{totalResults}</strong> из {totalAll} моделей</>
          ) : (
            <><strong className="text-[#1A1A1A] font-medium">{totalResults}</strong> su {totalAll} modelli</>
          )}
        </div>
      </div>
    </div>
  );
};
