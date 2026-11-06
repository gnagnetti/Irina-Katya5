/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Download,
  Trash2,
  Package,
  Building2,
  MapPin,
  ArrowRight,
  FolderOpen
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  cleanRawValue, 
  parseJoorCsv, 
  parseSellOutCsv, 
  parseSellOutUniversal,
  generateDemoSellOutRecords,
  baseStyleName,
  parse1CHierarchicalSheet 
} from '../utils/etl';
import { MergedProduct, OrderItem, SellOutItem, UploadedFileInfo } from '../types';
import { TARGET_BOUTIQUES, BOUTIQUES_CATALOG } from '../data/initialData';

interface FileUploadModalProps {
  onClose: () => void;
  onApplyNewOrders: (orders: OrderItem[]) => void;
  onApplySellOut: (sellOut: SellOutItem[], targetBoutique?: string, fileInfo?: UploadedFileInfo) => void;
  onClearSellOut: (targetBoutique?: string) => void;
  onResetToDefault: () => void;
  currentOrdersCount: number;
  currentSellOutCount: number;
  initialTab?: 'sell-out' | 'sell-in';
  products: MergedProduct[];
  orders?: OrderItem[];
  selectedRetailer?: string;
  onSelectRetailer?: (retailer: string) => void;
  currentSellOutItems?: SellOutItem[];
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  onClose,
  onApplyNewOrders,
  onApplySellOut,
  onClearSellOut,
  onResetToDefault,
  currentOrdersCount,
  currentSellOutCount,
  initialTab = 'sell-out',
  products,
  orders = [],
  selectedRetailer = 'Boutique Nizhniy Novgorod',
  onSelectRetailer,
  currentSellOutItems = [],
}) => {
  const [activeTab, setActiveTab] = useState<'sell-out' | 'sell-in'>(initialTab);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [targetBoutique, setTargetBoutique] = useState<string>(
    selectedRetailer !== 'ALL' ? selectedRetailer : 'Boutique Nizhniy Novgorod'
  );
  const [parsedOrders, setParsedOrders] = useState<OrderItem[]>([]);
  const [parsedSellOut, setParsedSellOut] = useState<SellOutItem[]>([]);
  const [parsedFileInfo, setParsedFileInfo] = useState<UploadedFileInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Group current sell-out items per boutique to show live counts
  const currentSellOutByBoutique = useMemo(() => {
    const map: Record<string, number> = {};
    TARGET_BOUTIQUES.forEach((b) => {
      map[b] = 0;
    });

    currentSellOutItems.forEach((s) => {
      const door = s.door || 'Boutique';
      map[door] = (map[door] || 0) + (s.unitsSold || 0);
    });

    return map;
  }, [currentSellOutItems]);

  // Group orders count per boutique
  const ordersCountByBoutique = useMemo(() => {
    const map: Record<string, number> = {};
    TARGET_BOUTIQUES.forEach((b) => {
      map[b] = 0;
    });

    orders.forEach((o) => {
      const ret = o.retailer || 'Boutique';
      map[ret] = (map[ret] || 0) + (o.units || 1);
    });

    return map;
  }, [orders]);

  const handleProcessFile = async (file: File, boutiqueName: string) => {
    setIsProcessing(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setFileName(file.name);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (activeTab === 'sell-in') {
        let csvText = '';
        if (ext === 'csv') {
          csvText = await file.text();
        } else if (ext === 'xlsx' || ext === 'xls') {
          const buffer = await file.arrayBuffer();
          const workbook = XLSX.read(buffer, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          csvText = XLSX.utils.sheet_to_csv(worksheet);
        } else {
          throw new Error('Формат не поддерживается. Используйте .csv, .xlsx или .xls.');
        }

        const parsed = parseJoorCsv(csvText);
        if (parsed.length === 0) {
          throw new Error('В файле не найдено корректных строк заказов Sell-In.');
        }
        setParsedOrders(parsed);
        setSuccessMsg(`Успешно обработано ${parsed.length} строк заказов Sell-In.`);
      } else {
        let sellOut: SellOutItem[] = [];

        if (ext === 'csv') {
          const csvText = await file.text();
          sellOut = parseSellOutUniversal({ csvText }, boutiqueName);
        } else if (ext === 'xlsx' || ext === 'xls') {
          const buffer = await file.arrayBuffer();
          const workbook = XLSX.read(buffer, { type: 'array' });

          for (const sheetName of workbook.SheetNames) {
            const worksheet = workbook.Sheets[sheetName];
            if (!worksheet) continue;
            const sheetData = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: '' });
            if (Array.isArray(sheetData) && sheetData.length > 0) {
              const sItems = parse1CHierarchicalSheet(sheetData, boutiqueName);
              if (sItems.length > 0) {
                sellOut.push(...sItems);
              }
            }
          }

          if (sellOut.length === 0) {
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const sheetData = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: '' });
            const csvText = XLSX.utils.sheet_to_csv(worksheet);
            sellOut = parseSellOutUniversal({ sheetData, csvText }, boutiqueName);
          }
        } else {
          throw new Error('Формат не поддерживается. Используйте .csv, .xlsx или .xls.');
        }

        if (sellOut.length === 0) {
          throw new Error(
            `Не удалось извлечь данные продаж по Принципу Невский из "${file.name}". Убедитесь, что в файле присутствуют строки модели, размер/цвет и количество продаж.`
          );
        }

        const unitsSoldSum = sellOut.reduce((sum, item) => sum + item.unitsSold, 0);

        const fileInfo: UploadedFileInfo = {
          id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          fileName: file.name,
          boutique: boutiqueName,
          unitsSold: unitsSoldSum,
          recordsCount: sellOut.length,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          fileSize: `${(file.size / 1024).toFixed(1)} KB`,
          parsingMethod: '1С POS Принцип Невский',
        };

        setParsedSellOut(sellOut);
        setParsedFileInfo(fileInfo);
        setSuccessMsg(
          `Файл "${file.name}" успешно обработан для ${boutiqueName}: извлечено ${unitsSoldSum} проданных единиц (${sellOut.length} строк)!`
        );
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg((err as Error).message || 'Ошибка при обработке файла');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0], targetBoutique);
    }
  };

  const handleApply = () => {
    if (activeTab === 'sell-in' && parsedOrders.length > 0) {
      onApplyNewOrders(parsedOrders);
      onClose();
    } else if (activeTab === 'sell-out' && parsedSellOut.length > 0) {
      onApplySellOut(parsedSellOut, targetBoutique, parsedFileInfo || undefined);
      if (onSelectRetailer && targetBoutique !== 'ALL') {
        onSelectRetailer(targetBoutique);
      }
      onClose();
    }
  };

  const handleSingleBoutiqueDemo = (boutiqueName: string) => {
    const demo = generateDemoSellOutRecords(products, boutiqueName);
    const demoUnits = demo.reduce((s, it) => s + it.unitsSold, 0);
    const info: UploadedFileInfo = {
      id: `${Date.now()}_demo`,
      fileName: `Продажи_${boutiqueName.replace(/\s+/g, '_')}_2026.xlsx`,
      boutique: boutiqueName,
      unitsSold: demoUnits,
      recordsCount: demo.length,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      fileSize: 'Демо 1С',
      parsingMethod: '1С POS Принцип Невский',
    };
    onApplySellOut(demo, boutiqueName, info);
    if (onSelectRetailer) onSelectRetailer(boutiqueName);
    setSuccessMsg(`Демо-продажи сгенерированы для ${boutiqueName} (${demoUnits} шт.).`);
  };

  const handleSingleBoutiqueClear = (boutiqueName: string) => {
    onClearSellOut(boutiqueName);
    setSuccessMsg(`Данные продаж сброшены для ${boutiqueName}.`);
  };

  const handleDownloadTemplateForBoutique = (boutiqueName: string) => {
    const boutiqueOrders = orders.filter((o) =>
      boutiqueName === 'ALL' ? true : o.retailer === boutiqueName
    );

    const rowsMap = new Map<string, { model: string; code: string; color: string; size: string; ordered: number; retail: number }>();

    boutiqueOrders.forEach((o) => {
      const key = `${o.styleName}_${o.colorCode || o.colorName}_${o.size}`;
      const existing = rowsMap.get(key);
      if (existing) {
        existing.ordered += o.units || 1;
      } else {
        rowsMap.set(key, {
          model: o.styleName,
          code: o.styleNumber,
          color: o.colorName || o.colorCode,
          size: o.size,
          ordered: o.units || 1,
          retail: o.minRetailPrice || 0,
        });
      }
    });

    const exportRows = Array.from(rowsMap.values()).map((r) => ({
      'Бутик': boutiqueName,
      'Модель (Style Name)': r.model,
      'Артикул': r.code,
      'Цвет': r.color,
      'Размер': r.size,
      'Заказано Sell-In (шт)': r.ordered,
      'Продано (Количество)': 0,
      'Цена розницы (€)': r.retail,
      'Дата продажи (ГГГГ-ММ-ДД)': '2026-10-15',
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    const safeName = boutiqueName.replace(/[^\w-]/g, '_');
    XLSX.utils.book_append_sheet(wb, ws, 'Template_SellOut');
    XLSX.writeFile(wb, `Luisa_Spagnoli_FW26_Template_SellOut_${safeName}.xlsx`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white border border-[#E5E3DC] rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header in Russian */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#E5E3DC] bg-[#FAF9F5]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FFF9EA] border border-[#F3E5AB] flex items-center justify-center text-[#C27803]">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold text-[#1A1A1A]">
                Управление данными: Sell-In опт и Sell-Out бутики
              </h3>
              <p className="text-xs text-[#6B7280]">
                Загрузка оптовых заказов B2B или отчетов розничных продаж касс по бутикам
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#1A1A1A] hover:bg-white border border-[#DCD9CE] transition-colors cursor-pointer shadow-2xs"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#E5E3DC] bg-[#FAF9F5] px-6 pt-2">
          <button
            onClick={() => {
              setActiveTab('sell-out');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'sell-out'
                ? 'border-[#C27803] text-[#1A1A1A]'
                : 'border-transparent text-[#6B7280] hover:text-[#1A1A1A]'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-[#C27803]" />
            <span>1. Продажи касс Sell-Out (1С / Excel)</span>
            {currentSellOutCount > 0 ? (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#E8F5E9] text-[#0B5C37] font-mono font-medium">
                Активно ({currentSellOutCount} шт.)
              </span>
            ) : (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#FFF9EA] text-[#C27803] font-mono">
                Ожидает (0 шт.)
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('sell-in');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'sell-in'
                ? 'border-[#C27803] text-[#1A1A1A]'
                : 'border-transparent text-[#6B7280] hover:text-[#1A1A1A]'
            }`}
          >
            <Package className="w-4 h-4 text-[#0284C7]" />
            <span>2. Оптовые заказы Sell-In (JOOR B2B)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white text-[#6B7280] font-mono border border-[#E5E3DC]">
              {currentOrdersCount} строк
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
          {activeTab === 'sell-out' ? (
            <div className="space-y-5">
              {/* Informative Intro Banner */}
              <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#E5E3DC] flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                <div className="max-w-xl">
                  <h4 className="font-semibold text-sm text-[#1A1A1A] flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#C27803]" />
                    Загрузка розничных продаж по бутикам сети (Принцип Невский 1С)
                  </h4>
                  <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                    Вы можете загрузить файл отчета кассы (.xlsx, .xls, .csv) для <strong>каждого конкретного бутика</strong> или сводный файл. Данные моментально обновят процент Sell-Out, выручку и остатки.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadTemplateForBoutique(targetBoutique)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-[#1A1A1A] border border-[#DCD9CE] hover:bg-[#FAF9F5] font-medium transition-colors cursor-pointer shadow-2xs"
                    title={`Скачать шаблон Excel для ${targetBoutique}`}
                  >
                    <Download className="w-3.5 h-3.5 text-[#C27803]" />
                    <span>Скачать шаблон Excel ({targetBoutique})</span>
                  </button>
                </div>
              </div>

              {/* Grid of 6 Boutiques with Upload Buttons */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-1.5">
                    <FolderOpen className="w-4 h-4 text-[#0284C7]" />
                    Обзор файлов Sell-Out по бутикам:
                  </span>
                  <span className="text-[11px] text-[#6B7280]">
                    Форматы: .xlsx, .xls, .csv
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {TARGET_BOUTIQUES.map((bName, idx) => {
                    const isCurrentTarget = targetBoutique === bName;
                    const soldUnits = currentSellOutByBoutique[bName] || 0;
                    const orderedUnits = ordersCountByBoutique[bName] || 0;
                    const rotazione = orderedUnits > 0 ? ((soldUnits / orderedUnits) * 100).toFixed(1) : '0';
                    const catalog = BOUTIQUES_CATALOG.find((b) => b.name === bName);

                    return (
                      <div
                        key={bName}
                        className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 shadow-2xs ${
                          isCurrentTarget
                            ? 'bg-[#FFF9EA] border-[#C27803] ring-1 ring-[#C27803]/40'
                            : 'bg-white border-[#E5E3DC] hover:border-[#DCD9CE]'
                        }`}
                      >
                        {/* Store Info & Status */}
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-md bg-[#FAF9F5] border border-[#E5E3DC] text-[#C27803] text-[10px] font-bold font-mono flex items-center justify-center">
                                #{idx + 1}
                              </span>
                              <h5 className="font-semibold text-xs text-[#1A1A1A]">
                                {bName}
                              </h5>
                            </div>

                            {soldUnits > 0 ? (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E8F5E9] text-[#0B5C37] font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                {soldUnits} шт. продано ({rotazione}%)
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAF9F5] text-[#6B7280] border border-[#E5E3DC]">
                                Ожидает (0 шт.)
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-[#6B7280] mt-1 pl-7">
                            <MapPin className="w-3 h-3 text-[#C27803] shrink-0" />
                            <span>{catalog?.city || 'Россия'}</span>
                            <span className="text-stone-300">·</span>
                            <span className="text-[#0284C7] font-mono">{orderedUnits} единиц Sell-In</span>
                          </div>
                        </div>

                        {/* Dedicated Upload Buttons */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#F0EFEA]">
                          <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#FAF9F5] text-[#1A1A1A] border border-[#DCD9CE] hover:border-[#C27803] cursor-pointer font-medium transition-all shadow-2xs text-xs">
                            <Upload className="w-3.5 h-3.5 text-[#0284C7]" />
                            <span>Загрузить 1С ({bName.replace('Boutique ', '')})</span>
                            <input
                              type="file"
                              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setTargetBoutique(bName);
                                  handleProcessFile(e.target.files[0], bName);
                                }
                              }}
                              className="hidden"
                            />
                          </label>

                          <button
                            onClick={() => handleSingleBoutiqueDemo(bName)}
                            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#FAF9F5] text-[#C27803] border border-[#DCD9CE] transition-colors cursor-pointer text-xs shadow-2xs"
                            title={`Демо-продажи для ${bName}`}
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDownloadTemplateForBoutique(bName)}
                            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#FAF9F5] text-[#6B7280] hover:text-[#1A1A1A] border border-[#DCD9CE] transition-colors cursor-pointer text-xs shadow-2xs"
                            title={`Шаблон Excel для ${bName}`}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {soldUnits > 0 && (
                            <button
                              onClick={() => handleSingleBoutiqueClear(bName)}
                              className="px-2 py-1.5 rounded-lg bg-white hover:bg-[#FFF0F2] text-[#DC2626] border border-[#FECDD3] transition-colors cursor-pointer text-xs shadow-2xs"
                              title={`Сбросить продажи ${bName}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Drag & Drop Area with Boutique Indicator */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors ${
                  dragActive
                    ? 'border-[#C27803] bg-[#FFF9EA]/50'
                    : 'border-[#DCD9CE] hover:border-[#C27803] bg-[#FAF9F5]'
                }`}
              >
                <FileSpreadsheet className="w-9 h-9 mx-auto text-[#C27803] mb-2 opacity-80" />
                <p className="text-sm font-medium text-[#1A1A1A] mb-1">
                  Перетащите сюда файл Sell-Out для <strong className="text-[#C27803]">{targetBoutique}</strong>
                </p>
                <p className="text-xs text-[#6B7280] mb-3">
                  Поддерживается формат 1С POS (колонка 2 - Модель, колонка 0 - размер и цвет, колонка 4/7 - количество) (.xlsx, .csv)
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-[#DCD9CE] text-xs shadow-2xs">
                    <span className="text-[#6B7280]">Бутик:</span>
                    <select
                      value={targetBoutique}
                      onChange={(e) => setTargetBoutique(e.target.value)}
                      className="bg-transparent text-[#1A1A1A] font-medium cursor-pointer focus:outline-none"
                    >
                      <option value="ALL">
                        Все бутики (Сводный файл)
                      </option>
                      {TARGET_BOUTIQUES.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1A1A1A] hover:bg-[#333333] text-white font-semibold cursor-pointer transition-colors shadow-sm">
                    <Upload className="w-4 h-4 text-[#C27803]" />
                    <span>Выбрать файл отчета кассы (.xlsx / .csv)</span>
                    <input
                      type="file"
                      accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleProcessFile(e.target.files[0], targetBoutique);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#F0EFEA]">
                <div className="flex items-center gap-2">
                  {currentSellOutCount > 0 && (
                    <button
                      onClick={() => {
                        onClearSellOut();
                        setParsedSellOut([]);
                        setSuccessMsg('Продажи сброшены: каталог возвращен в исходное состояние 100% Sell-In.');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-white hover:bg-[#FEE2E2] text-[#DC2626] border border-[#FECDD3] transition-colors cursor-pointer shadow-2xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Очистить продажи всех бутиков</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      const demo = generateDemoSellOutRecords(products);
                      onApplySellOut(demo);
                      setSuccessMsg(`Демо-продажи применены ко всем 6 бутикам (${demo.length} записей).`);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-white hover:bg-[#FAF9F5] text-[#C27803] border border-[#DCD9CE] transition-colors cursor-pointer shadow-2xs"
                    title="Сгенерировать продажи для всех бутиков"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#C27803]" />
                    <span>Демо-продажи для всей сети</span>
                  </button>
                </div>

                <span className="text-xs text-[#6B7280]">
                  Текущий статус: {currentSellOutCount === 0 ? '100% в наличии (нет зарегистрированных продаж)' : `Всего продано ${currentSellOutCount} шт.`}
                </span>
              </div>
            </div>
          ) : (
            /* SELL-IN TAB */
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#E5E3DC]">
                <h4 className="font-semibold text-sm text-[#1A1A1A]">
                  Загрузка оптовых заказов B2B Wholesale (Sell-In)
                </h4>
                <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                  Поддерживает оригинальный экспорт портала <strong>JOOR B2B</strong> с колонками <em>Retailer, Style Name, Color Name, Size, Units, Min Wholesale Price, Min Retail Price, Linesheet, Silhouette Name</em>.
                </p>
              </div>

              {/* Drag & Drop Area for Sell-In */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                  dragActive
                    ? 'border-[#C27803] bg-[#FFF9EA]/50'
                    : 'border-[#DCD9CE] hover:border-[#C27803] bg-[#FAF9F5]'
                }`}
              >
                <FileSpreadsheet className="w-10 h-10 mx-auto text-[#C27803] mb-2 opacity-80" />
                <p className="text-sm font-medium text-[#1A1A1A] mb-1">
                  Перетащите сюда файл заказов JOOR или выберите на диске
                </p>
                <p className="text-xs text-[#6B7280] mb-3">
                  Файл экспорта JOOR (.csv, .xlsx)
                </p>

                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1A1A1A] hover:bg-[#333333] text-white font-semibold cursor-pointer transition-colors shadow-sm">
                  <Upload className="w-4 h-4 text-[#C27803]" />
                  <span>Выбрать файл заказов JOOR</span>
                  <input
                    type="file"
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleProcessFile(e.target.files[0], 'ALL');
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Reset button */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={onResetToDefault}
                  className="flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#DC2626] transition-colors cursor-pointer"
                  title="Восстановить исходный каталог Luisa Spagnoli FW26"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Восстановить исходные заказы FW26</span>
                </button>

                <span className="text-xs text-[#6B7280]">
                  В каталоге: {currentOrdersCount} строк заказов
                </span>
              </div>
            </div>
          )}

          {/* Feedback & Preview */}
          {isProcessing && (
            <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#E5E3DC] text-center text-[#6B7280]">
              Обработка файла через SheetJS...
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-[#FFF0F2] border border-[#FECDD3] text-[#B91C1C] flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-[#E8F5E9] border border-[#0B5C37]/30 text-[#0B5C37] flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Sell-Out Preview */}
          {parsedSellOut.length > 0 && activeTab === 'sell-out' && (
            <div className="p-4 rounded-xl bg-white border border-[#0B5C37]/40 space-y-3 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#F0EFEA]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#E8F5E9] border border-[#0B5C37]/30 flex items-center justify-center text-[#0B5C37]">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-sm text-[#1A1A1A] flex items-center gap-2">
                      <span>Сверка по Принципу Невский 1С завершена</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E8F5E9] text-[#0B5C37] border border-[#0B5C37]/30">
                        1C Hierarchical
                      </span>
                    </h5>
                    <p className="text-xs text-[#0284C7] font-mono mt-0.5">
                      Файл: <strong className="text-[#1A1A1A] underline">{parsedFileInfo?.fileName || fileName}</strong>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-bold text-[#0B5C37] font-mono">
                    {parsedFileInfo?.unitsSold ?? parsedSellOut.reduce((s, it) => s + it.unitsSold, 0)} ШТ. ПРОДАНО
                  </div>
                  <div className="text-[11px] text-[#6B7280]">
                    для {targetBoutique} ({parsedSellOut.length} артикулов)
                  </div>
                </div>
              </div>

              <div className="bg-[#FAF9F5] p-2.5 rounded-lg border border-[#E5E3DC] max-h-32 overflow-y-auto font-mono text-[11px] divide-y divide-[#E5E3DC]">
                {parsedSellOut.slice(0, 8).map((s, idx) => (
                  <div key={idx} className="flex justify-between py-1 px-1">
                    <span className="text-[#1A1A1A]">
                      <span className="text-[#0284C7] font-semibold">{s.styleName}</span>
                      <span className="text-[#6B7280] ml-2">Разм. {s.size || 'U'} · {s.colorCode || 'Col. Base'}</span>
                    </span>
                    <span className="text-[#0B5C37] font-bold">+{s.unitsSold} шт.</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer in Russian */}
        <div className="px-6 py-4 border-t border-[#E5E3DC] bg-[#FAF9F5] flex flex-wrap items-center justify-between gap-3 text-xs">
          <p className="text-[#6B7280]">
            {activeTab === 'sell-out'
              ? 'Продажи моментально пересчитают уровень Sell-Out, выручку касс и остатки.'
              : 'Оптовые заказы обновят каталог моделей и остатки Sell-In.'}
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white hover:bg-[#FAF9F5] text-[#1A1A1A] border border-[#DCD9CE] transition-colors cursor-pointer shadow-2xs font-medium"
            >
              Закрыть
            </button>

            {((activeTab === 'sell-out' && parsedSellOut.length > 0) ||
              (activeTab === 'sell-in' && parsedOrders.length > 0)) && (
              <button
                onClick={handleApply}
                className="px-4 py-2 rounded-lg bg-[#1A1A1A] hover:bg-[#333333] text-white font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4 text-[#C27803]" />
                <span>
                  {activeTab === 'sell-out' ? 'Применить данные Sell-Out' : 'Применить новые заказы Sell-In'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
