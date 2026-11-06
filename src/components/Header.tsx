/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Building2, 
  CheckCircle2, 
  Download, 
  FileSpreadsheet, 
  Terminal, 
  Upload, 
  Layers, 
  LayoutGrid, 
  Table as TableIcon, 
  PieChart, 
  Grid3X3, 
  GitCompare,
  RotateCw,
  Printer,
  ChevronDown,
  Globe,
  Search,
  Eye,
  EyeOff
} from 'lucide-react';
import { UploadedFileInfo, ViewMode } from '../types';

interface HeaderProps {
  selectedRetailer: string;
  retailers: string[];
  onSelectRetailer: (retailer: string) => void;
  retailerCustomerCode?: string;
  retailerCity?: string;
  retailerCountry?: string;
  viewMode: ViewMode;
  onSelectViewMode: (mode: ViewMode) => void;
  selectedLinesheet: string;
  linesheets: string[];
  onSelectLinesheet: (linesheet: string) => void;
  onOpenAudit: () => void;
  onOpenUpload: () => void;
  onOpenSellOutUpload: () => void;
  onOpenPythonScript: () => void;
  onOpenConverter: () => void;
  onExportExcel: () => void;
  totalProductsCount: number;
  sellOutUnitsCount: number;
  uploadedFiles?: UploadedFileInfo[];
  language?: 'RU' | 'IT';
  onToggleLanguage?: () => void;
  showDashboard?: boolean;
  onToggleDashboard?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedRetailer,
  retailers,
  onSelectRetailer,
  retailerCustomerCode = '39646',
  retailerCity = 'Rostov On Don',
  retailerCountry = 'Russian Federation',
  viewMode,
  onSelectViewMode,
  selectedLinesheet,
  linesheets,
  onSelectLinesheet,
  onOpenAudit,
  onOpenUpload,
  onOpenSellOutUpload,
  onOpenPythonScript,
  onOpenConverter,
  onExportExcel,
  totalProductsCount,
  sellOutUnitsCount,
  uploadedFiles = [],
  language = 'RU',
  onToggleLanguage,
  showDashboard = true,
  onToggleDashboard,
}) => {
  const isRussian = language === 'RU';

  // Format client address based on selected retailer
  const clientName = selectedRetailer === 'ALL'
    ? '2 Krasnodarskaya Str. 149 - 5 Apt. 36'
    : selectedRetailer;

  const clientAddress = selectedRetailer === 'ALL'
    ? '344091 * Rostov On Don * Russian Federation, -, Russia'
    : `${retailerCity} * ${retailerCountry}`;

  const filesLabel = uploadedFiles.length > 0
    ? uploadedFiles.map(f => f.fileName).join(', ')
    : '6_Orders_2026 · 10 · 28.xlsx, 226FWCollectionMultilingua.csv, export_ordinato.csv';

  return (
    <header className="border-b border-[#E5E3DC] bg-white sticky top-0 z-40 shadow-xs">
      {/* Top Luxury Brand Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-start justify-between gap-4">
        {/* Left: Brand & Client dossier */}
        <div className="flex flex-col gap-1.5">
          {/* Brand and Subtitle */}
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-serif text-[#1A1A1A] tracking-wider font-semibold uppercase">
              LUISA SPAGNOLI
            </h1>
            <span className="text-stone-300 font-light text-lg hidden sm:inline">|</span>
            <span className="text-[11px] sm:text-xs uppercase tracking-widest text-[#8C7A5E] font-medium">
              {isRussian ? 'АНАЛИТИКА ПРОДАЖ И МЕРЧАНДАЙЗИНГА' : 'ANALISI VENDITE E MERCHANDISING'}
            </span>

            {/* Language Switcher */}
            {onToggleLanguage && (
              <button
                onClick={onToggleLanguage}
                className="ml-2 flex items-center gap-1 px-2 py-0.5 rounded border border-[#DCD9CE] bg-[#FAF9F5] hover:bg-[#F2EFE9] text-[11px] font-mono text-[#332A15] transition-colors"
                title="Cambia lingua interfaccia (RU / IT)"
              >
                <Globe className="w-3 h-3 text-[#C27803]" />
                <span className={language === 'RU' ? 'font-bold text-[#1A1A1A]' : 'text-[#8C7A5E]'}>RU</span>
                <span className="text-stone-400">/</span>
                <span className={language === 'IT' ? 'font-bold text-[#1A1A1A]' : 'text-[#8C7A5E]'}>IT</span>
              </button>
            )}
          </div>

          {/* Yellow Client Pill & Dossier Details matching Screenshot */}
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
            <div className="relative group inline-flex items-center">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#FFF9EA] border border-[#F3E5AB] text-[#332A15] text-[11px] font-semibold shadow-2xs">
                <span className="text-[#8C7A5E] uppercase font-bold tracking-wider">{isRussian ? 'КЛИЕНТ:' : 'CLIENTE:'}</span>
                <span>{clientName}</span>
                <ChevronDown className="w-3 h-3 text-[#8C7A5E]" />
              </span>
              <select
                aria-label="Seleziona Boutique"
                value={selectedRetailer}
                onChange={(e) => onSelectRetailer(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full text-xs"
              >
                <option value="ALL">Consolidato (Tutti i Negozi)</option>
                {retailers.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <span className="text-[#6B7280] text-[11px]">{clientAddress}</span>
          </div>

          {/* Subtext info line */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-[#6B7280]">
            <span>Rep: <strong className="text-[#1A1A1A] font-semibold">LUCA GNAGNETTI</strong></span>
            <span>Created Date: 03/10/2026</span>
            <span>Cust ID: <strong className="text-[#1A1A1A] font-medium">{retailerCustomerCode}</strong></span>
            <span className="inline-flex items-center px-1.5 py-0.2 rounded border border-[#E5E3DC] bg-[#FAF9F5] text-[10px] text-[#71717A]">
              {isRussian ? 'Формула: (Продано / Заказано) * 100' : 'Formula: (Venduto / Ordinato) * 100'}
            </span>
          </div>
        </div>

        {/* Right: Status Tag & Clean Action Buttons */}
        <div className="flex flex-col items-start sm:items-end gap-2.5">
          {/* File sync timestamp with green dot */}
          <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280] max-w-md sm:text-right">
            <span className="w-2 h-2 rounded-full bg-[#10B981] shrink-0 animate-pulse" />
            <span className="truncate">
              {isRussian ? 'Сохранено' : 'Sincronizzato'} — {filesLabel.slice(0, 42)}... ({totalProductsCount} {isRussian ? 'моделей' : 'modelli'} · {sellOutUnitsCount} {isRussian ? 'продано шт.' : 'pz venduti'})
            </span>
          </div>

          {/* Luxury Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {onToggleDashboard && (
              <button
                onClick={onToggleDashboard}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-all shadow-2xs hover:shadow-xs cursor-pointer ${
                  showDashboard 
                    ? 'bg-white hover:bg-[#F8F7F4] text-[#2C2B29] border-[#DCD9CE]' 
                    : 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                }`}
                title={showDashboard ? "Nascondi KPI e pannello dashboard" : "Mostra KPI e pannello dashboard"}
              >
                {showDashboard ? <EyeOff className="w-3.5 h-3.5 text-[#C27803]" /> : <Eye className="w-3.5 h-3.5 text-[#C27803]" />}
                <span>{isRussian ? (showDashboard ? 'Скрыть дашборд' : 'Показать дашборд') : (showDashboard ? 'Nascondi Dashboard' : 'Mostra Dashboard')}</span>
              </button>
            )}

            <button
              onClick={onOpenSellOutUpload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white hover:bg-[#F8F7F4] text-xs font-medium text-[#2C2B29] border border-[#DCD9CE] transition-all shadow-2xs hover:shadow-xs cursor-pointer"
              title="Carica vendite da file Excel o CSV (Principio Nevskiy 1C)"
            >
              <Upload className="w-3.5 h-3.5 text-[#C27803]" />
              <span>{isRussian ? 'Загрузить Excel / CSV' : 'Carica Excel / CSV'}</span>
            </button>

            <button
              onClick={onExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white hover:bg-[#F8F7F4] text-xs font-medium text-[#2C2B29] border border-[#DCD9CE] transition-all shadow-2xs hover:shadow-xs cursor-pointer"
              title="Esporta ordini consolidati in formato CSV / Excel"
            >
              <Download className="w-3.5 h-3.5 text-[#6B7280]" />
              <span>{isRussian ? 'Заказы CSV' : 'Ordini CSV'}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white hover:bg-[#F8F7F4] text-xs font-medium text-[#2C2B29] border border-[#DCD9CE] transition-all shadow-2xs hover:shadow-xs cursor-pointer"
              title="Stampa scheda analitica o esporta in PDF"
            >
              <Printer className="w-3.5 h-3.5 text-[#6B7280]" />
              <span>{isRussian ? 'Печать PDF' : 'Stampa PDF'}</span>
            </button>

            <button
              onClick={onOpenConverter}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white hover:bg-[#F8F7F4] text-xs font-medium text-[#2C2B29] border border-[#DCD9CE] transition-all shadow-2xs hover:shadow-xs cursor-pointer"
              title="Convertitore Formati Cassa & Ordini JOOR"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#C27803]" />
              <span>{isRussian ? 'Конвертер данных' : 'Convertitore'}</span>
            </button>

            <button
              onClick={onOpenPythonScript}
              className="p-1.5 rounded bg-white hover:bg-[#F8F7F4] text-[#6B7280] hover:text-[#1A1A1A] border border-[#DCD9CE] transition-all shadow-2xs hover:shadow-xs cursor-pointer"
              title="Script Python / Pandas per elaborazione dati multi-negozio"
            >
              <Terminal className="w-3.5 h-3.5 text-[#0284C7]" />
            </button>

            <button
              onClick={onOpenAudit}
              className="p-1.5 rounded bg-white hover:bg-[#F8F7F4] text-[#0B5C37] border border-[#DCD9CE] transition-all shadow-2xs hover:shadow-xs cursor-pointer"
              title="Verifica matematica e integrità loop di calcolo"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#0B5C37]" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Bar: Primary Views & Linesheets */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#EAE8E1] bg-[#FAF9F6]">
        {/* View Switcher Tabs matching screenshot tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => onSelectViewMode('lookbook')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all cursor-pointer ${
              viewMode === 'lookbook'
                ? 'bg-white border border-[#DCD9CE] text-[#1A1A1A] font-semibold shadow-2xs'
                : 'text-[#6B7280] hover:text-[#1A1A1A] hover:bg-white/60'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{isRussian ? 'Галерея моделей' : 'Galleria Modelli'}</span>
          </button>

          <button
            onClick={() => onSelectViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white border border-[#DCD9CE] text-[#1A1A1A] font-semibold shadow-2xs'
                : 'text-[#6B7280] hover:text-[#1A1A1A] hover:bg-white/60'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>{isRussian ? 'Таблица' : 'Tabella'}</span>
          </button>

          <button
            onClick={() => onSelectViewMode('silhouettes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all cursor-pointer ${
              viewMode === 'silhouettes'
                ? 'bg-white border border-[#DCD9CE] text-[#1A1A1A] font-semibold shadow-2xs'
                : 'text-[#6B7280] hover:text-[#1A1A1A] hover:bg-white/60'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>{isRussian ? 'Категории' : 'Categorie & Silhouette'}</span>
          </button>

          <button
            onClick={() => onSelectViewMode('sizes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all cursor-pointer ${
              viewMode === 'sizes'
                ? 'bg-white border border-[#DCD9CE] text-[#1A1A1A] font-semibold shadow-2xs'
                : 'text-[#6B7280] hover:text-[#1A1A1A] hover:bg-white/60'
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span>{isRussian ? 'Размерная сетка' : 'Matrice Taglie'}</span>
          </button>

          <button
            onClick={() => onSelectViewMode('po-compare')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all cursor-pointer ${
              viewMode === 'po-compare'
                ? 'bg-white border border-[#DCD9CE] text-[#1A1A1A] font-semibold shadow-2xs'
                : 'text-[#6B7280] hover:text-[#1A1A1A] hover:bg-white/60'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>{isRussian ? 'Заказы' : 'Confronto PO'}</span>
          </button>

          <button
            onClick={() => onSelectViewMode('boutiques')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all cursor-pointer ${
              viewMode === 'boutiques'
                ? 'bg-white border border-[#DCD9CE] text-[#1A1A1A] font-semibold shadow-2xs'
                : 'text-[#6B7280] hover:text-[#1A1A1A] hover:bg-white/60'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{isRussian ? 'Бутики' : 'Negozi'}</span>
          </button>

          <button
            onClick={() => onSelectViewMode('python-analyst')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all cursor-pointer ${
              viewMode === 'python-analyst'
                ? 'bg-[#0284C7]/10 text-[#0284C7] border border-[#0284C7]/30 font-semibold shadow-2xs'
                : 'text-[#6B7280] hover:text-[#0284C7] hover:bg-white/60'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-[#0284C7]" />
            <span>{isRussian ? 'Анализ Python' : 'Python Analyst'}</span>
          </button>
        </div>

        {/* Linesheet Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-[11px] uppercase tracking-wider text-[#8C7A5E] font-medium mr-1 shrink-0 flex items-center gap-1">
            <Layers className="w-3 h-3 text-[#C27803]" /> {isRussian ? 'Коллекция:' : 'Linee:'}
          </span>
          {linesheets.map((ls) => {
            const isSelected = selectedLinesheet === ls;
            return (
              <button
                key={ls}
                onClick={() => onSelectLinesheet(ls)}
                className={`text-xs px-2.5 py-1 rounded transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-[#1A1A1A] text-white font-medium shadow-2xs'
                    : 'text-[#6B7280] hover:text-[#1A1A1A] hover:bg-white'
                }`}
              >
                {ls === 'ALL' ? (isRussian ? `Все линии (${totalProductsCount})` : `Tutte (${totalProductsCount})`) : ls}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
