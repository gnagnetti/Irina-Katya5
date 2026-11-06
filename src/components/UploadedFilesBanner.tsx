/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  FileSpreadsheet, 
  CheckCircle2, 
  Trash2, 
  Upload, 
  Building2, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  Clock,
  PieChart as PieIcon
} from 'lucide-react';
import { UploadedFileInfo } from '../types';

interface UploadedFilesBannerProps {
  uploadedFiles: UploadedFileInfo[];
  totalSellOutUnits: number;
  totalSellInUnits: number;
  selectedRetailer: string;
  onSelectRetailer: (retailer: string) => void;
  onOpenUpload: (tab?: 'sell-out' | 'sell-in') => void;
  onOpenAudit: () => void;
  onRemoveFile: (id: string) => void;
  onClearAll: () => void;
  onSimulateDemo: () => void;
  language?: 'RU' | 'IT';
}

export const UploadedFilesBanner: React.FC<UploadedFilesBannerProps> = ({
  uploadedFiles,
  totalSellOutUnits,
  totalSellInUnits,
  selectedRetailer,
  onSelectRetailer,
  onOpenUpload,
  onOpenAudit,
  onRemoveFile,
  onClearAll,
  onSimulateDemo,
}) => {
  if (uploadedFiles.length === 0 && totalSellOutUnits === 0) {
    return (
      <div className="mb-6 p-4 sm:p-5 rounded-xl bg-white border border-[#E5E3DC] shadow-2xs flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-start gap-3.5 max-w-2xl">
          <div className="w-10 h-10 rounded-lg bg-[#FFF9EA] border border-[#F3E5AB] flex items-center justify-center text-[#C27803] shrink-0 mt-0.5">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-semibold text-[#1A1A1A]">
                Каталог Luisa Spagnoli FW26 (Заказы B2B / Sell-In)
              </h4>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#FAF9F5] text-[#8C7A5E] border border-[#E5E3DC]">
                Остаток 100% ({totalSellInUnits} единиц заказано)
              </span>
            </div>
            <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
              Все данные каталога загружены из оптовых заказов B2B JOOR. Для расчета фактических продаж, уровня оборачиваемости и остатков загрузите отчеты касс (.xlsx/.csv) по <strong>Принципу Невский 1С</strong>.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onSimulateDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-[#FAF9F5] text-[#0284C7] border border-[#BAE6FD] transition-colors shadow-2xs cursor-pointer"
            title="Заполнить бутики демонстрационными продажами касс для наглядного анализа графиков и круговых диаграмм"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#0284C7]" />
            <span>Демо-продажи касс (Все 6 бутиков)</span>
          </button>
          <button
            onClick={() => onOpenUpload('sell-out')}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#1A1A1A] text-white hover:bg-[#333333] transition-colors shadow-2xs cursor-pointer"
          >
            <Upload className="w-4 h-4 text-[#C27803]" />
            <span>Загрузить отчет кассы 1С (.xlsx)</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="mb-6 rounded-xl bg-white border border-[#0B5C37]/40 p-4 sm:p-5 shadow-2xs relative overflow-hidden print:hidden">
      {/* Top Header of the Status Card */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-[#F0EFEA]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#E8F5E9] border border-[#0B5C37]/30 flex items-center justify-center text-[#0B5C37] shrink-0 shadow-2xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-serif font-bold text-[#1A1A1A] tracking-wide">
                Активные продажи Sell-Out (Принцип Невский 1С)
              </h3>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#E8F5E9] text-[#0B5C37] border border-[#0B5C37]/30 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Сверка 1С POS подтверждена
              </span>
            </div>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Парсер автоматически определил колонку «Количество» в строке 6 (динамический поиск col_4 / col_7), артикул модели из col_2, размер и код цвета из col_0.
            </p>
          </div>
        </div>

        {/* Total Pieces derived from parsing */}
        <div className="flex items-center gap-3">
          <div className="bg-[#FAF9F5] border border-[#E5E3DC] px-3.5 py-1.5 rounded-lg text-right">
            <span className="text-[10px] uppercase font-mono text-[#6B7280] tracking-wider block">
              {selectedRetailer === 'ALL' ? 'Всего продано (Все кассы 1С)' : 'Продано в бутике (1С)'}
            </span>
            <span className="text-lg font-mono font-bold text-[#0B5C37]">
              {totalSellOutUnits} шт.
            </span>
          </div>

          <button
            onClick={onOpenAudit}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#E8F5E9] hover:bg-[#D4EDDA] text-[#0B5C37] border border-[#0B5C37]/30 transition-colors cursor-pointer shadow-2xs"
            title="Провести математический аудит сверки Sell-In vs Sell-Out"
          >
            <ShieldCheck className="w-4 h-4 text-[#0B5C37]" />
            <span>Аудит сверки (Closed-Loop)</span>
          </button>
        </div>
      </div>

      {/* Grid of Uploaded Files with File Name and Parsed Pieces count */}
      <div className="mt-3.5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {uploadedFiles.map((f) => {
          const isSelectedBoutique = selectedRetailer === f.boutique;

          return (
            <div
              key={f.id}
              className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                isSelectedBoutique
                  ? 'bg-[#FFF9EA] border-[#C27803] ring-1 ring-[#C27803]/40 shadow-xs'
                  : 'bg-[#FAF9F5] border-[#E5E3DC] hover:border-[#DCD9CE]'
              }`}
            >
              {/* File Name & Boutique */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileSpreadsheet className="w-4 h-4 text-[#C27803] shrink-0" />
                    <span 
                      className="font-mono text-xs font-bold text-[#1A1A1A] truncate"
                      title={f.fileName}
                    >
                      {f.fileName}
                    </span>
                  </div>

                  <button
                    onClick={() => onRemoveFile(f.id)}
                    className="p-1 rounded text-[#9CA3AF] hover:text-[#DC2626] hover:bg-[#FEE2E2] transition-colors cursor-pointer shrink-0"
                    title={`Удалить файл "${f.fileName}"`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Boutique associated */}
                <div className="flex items-center gap-1.5 text-xs text-[#8C7A5E] mt-1.5 font-medium">
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{f.boutique}</span>
                </div>
              </div>

              {/* Number of Pieces Sold derived from Parsing */}
              <div className="bg-white p-2.5 rounded-lg border border-[#E5E3DC] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-[#6B7280] uppercase tracking-wider block">
                    Продано единиц (1С POS)
                  </span>
                  <span className="text-base font-mono font-bold text-[#0B5C37]">
                    {f.unitsSold} шт.
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-[#6B7280] block">
                    {f.recordsCount} записей
                  </span>
                  <span className="text-[10px] text-[#0284C7] font-mono">
                    Принцип Невский
                  </span>
                </div>
              </div>

              {/* Footer info: time & filter switch */}
              <div className="flex items-center justify-between pt-1 text-[11px] text-[#6B7280]">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#9CA3AF]" />
                  <span>{f.timestamp}</span>
                </span>

                <button
                  onClick={() => onSelectRetailer(f.boutique)}
                  className={`flex items-center gap-1 text-xs font-medium cursor-pointer transition-colors ${
                    isSelectedBoutique ? 'text-[#C27803] font-bold' : 'text-[#0284C7] hover:underline'
                  }`}
                >
                  <span>{isSelectedBoutique ? 'Бутик активен' : 'Выбрать бутик'}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="mt-3.5 pt-3 border-t border-[#F0EFEA] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-[#6B7280]">
          <span className="w-2 h-2 rounded-full bg-[#0B5C37] animate-pulse" />
          <span>
            {uploadedFiles.length} файл(ов) касс загружено · Иерархический анализ 1С POS активен
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenUpload('sell-out')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#FAF9F5] text-[#1A1A1A] border border-[#DCD9CE] font-medium transition-colors cursor-pointer shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-[#C27803]" />
            <span>Загрузить еще отчет кассы</span>
          </button>

          <button
            onClick={onClearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#FEE2E2] text-[#DC2626] border border-[#FECDD3] transition-colors cursor-pointer shadow-2xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Очистить данные продаж</span>
          </button>
        </div>
      </div>
    </section>
  );
};
