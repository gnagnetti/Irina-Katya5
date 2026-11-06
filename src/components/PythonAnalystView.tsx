/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Terminal, 
  FileSpreadsheet, 
  Upload, 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  Play, 
  Copy, 
  Check, 
  Search, 
  Filter, 
  RotateCcw,
  Sparkles,
  ArrowRight,
  Database,
  Layers,
  ShoppingBag,
  Package,
  TrendingUp,
  FileCode2,
  Building2,
  Trash2,
  Plus
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  parseSellInPython, 
  parseSellOutPython, 
  elaboraTuttiINegoziPython,
  confrontaSellInOutPython,
  detectQuantityColumnIndex,
  downloadReportConsolidatoGlobaleCsv, 
  downloadPythonScriptFile, 
  PYTHON_REFERENCE_SCRIPT,
  cleanRawValue,
  ParsedSellInItem,
  ParsedSellOutItem
} from '../utils/etl';
import { PythonComparisonReport, PythonComparisonRow, OrderItem, SellOutItem, StoreSellOutFile } from '../types';
import { TARGET_BOUTIQUES } from '../data/initialData';

interface PythonAnalystViewProps {
  orders: OrderItem[];
  currentSellOut: SellOutItem[];
  selectedRetailer: string;
  onApplyReconciledData?: (sellInRows: OrderItem[], sellOutRows: SellOutItem[]) => void;
}

export const PythonAnalystView: React.FC<PythonAnalystViewProps> = ({
  orders,
  currentSellOut,
  selectedRetailer,
  onApplyReconciledData,
}) => {
  // Sell-In State
  const [sellInFileName, setSellInFileName] = useState<string>('ordini_d24feef4.csv (Default B2B)');
  const [sellInRawText, setSellInRawText] = useState<string>('');

  // Multi-Store Sell-Out Excel Files State
  const [storeFiles, setStoreFiles] = useState<StoreSellOutFile[]>([]);
  const [activeStoreTab, setActiveStoreTab] = useState<string>('ALL');

  // Execution & Reporting States
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [report, setReport] = useState<PythonComparisonReport | null>(null);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [showCodeDrawer, setShowCodeDrawer] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Filtering & Sorting
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ANOMALIES' | 'SOLD' | 'UNSOLD' | 'UNORDERED'>('ALL');
  const [sortField, setSortField] = useState<'Modello' | 'Sell_In' | 'Sell_Out' | 'Delta' | 'SellThroughPct'>('Sell_Out');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Target boutiques list
  const knownBoutiques = TARGET_BOUTIQUES;

  // Load initial Sell-In CSV from server
  useEffect(() => {
    const fetchDefaultCsv = async () => {
      try {
        let res = await fetch('/assets/aistudio/database_ordini__1__7caa154e.csv');
        if (!res.ok) res = await fetch('./assets/aistudio/database_ordini__1__7caa154e.csv');
        if (!res.ok) res = await fetch('/assets/aistudio/database_ordini.csv');
        if (!res.ok) res = await fetch('/assets/aistudio/Ordini_CSV_82299fcf.csv');
        if (!res.ok) res = await fetch('/assets/aistudio/ordini_d24feef4.csv');
        if (res.ok) {
          const text = await res.text();
          setSellInRawText(text);
          setSellInFileName('database_ordini.csv (Official Database)');
        }
      } catch {
        // ignore
      }
    };
    fetchDefaultCsv();
  }, []);

  // Helper to create a virtual 1C export file for a boutique with optional variable column layout
  const createVirtual1CStoreSheet = (
    storeName: string,
    isWideLayout: boolean = false
  ): { fileName: string; sheetData: unknown[][] } => {
    const virtualRows: unknown[][] = [];
    const prefixCols = isWideLayout ? ['', '', '', ''] : [];

    // Rows 0..5: 1C metadata header
    virtualRows.push(['1С:Предприятие 8.3 - Отчет по продажам cassa', '', '', '', '']);
    virtualRows.push([`Магазин: ${storeName}`, '', '', '', '']);
    virtualRows.push(['Период: 01.09.2026 - 31.10.2026', '', '', '', '']);
    virtualRows.push(['Валюта: EUR', '', '', '', '']);
    virtualRows.push(['Склад: Основной склад розницы', '', '', '', '']);
    virtualRows.push(['--- НАЧАЛО ДАННЫХ ---', '', '', '', '']);

    // Row 6: Header row containing 'Количество'
    if (isWideLayout) {
      // Wide layout (e.g. Bolshoy or Samara with 8+ columns: Col 7 is 'Количество')
      virtualRows.push([
        'Код / Размер, Цвет',
        'Артикул',
        'Номенклатура (Модель)',
        'Штрихкод',
        'Сумма скидки',
        'Цена розн.',
        'Сумма без НДС',
        'Количество' // col 7
      ]);
    } else {
      // Standard layout (Col 4 is 'Количество')
      virtualRows.push([
        'Код / Размер, Цвет',
        'Артикул',
        'Номенклатура (Модель)',
        'Цена',
        'Количество' // col 4
      ]);
    }

    // Curated models for realistic multi-store variance
    const modelsPool = [
      { model: 'CAPRESE', sizes: ['40', '42', '44'], col: '0101', qty: [1, 2, 1] },
      { model: 'LADULAS', sizes: ['S', 'M'], col: '0813', qty: [2, 1] },
      { model: 'MALU', sizes: ['S', 'M', 'L'], col: '0101', qty: [1, 1, 2] },
      { model: 'DOMINANZA', sizes: ['U'], col: '2248 0002', qty: [1] },
      { model: 'DONORI', sizes: ['U'], col: '0942 0002', qty: [1] },
      { model: 'INDACO', sizes: ['U'], col: '0101 0002', qty: [2] },
      { model: 'MARCATORE', sizes: ['U'], col: '0101', qty: [2] },
      { model: 'PIASTRA', sizes: ['42'], col: '1948', qty: [storeName.includes('Nevskiy') ? 2 : 1] }
    ];

    modelsPool.forEach((st) => {
      // Model header in col_2
      const modelHeaderRow = isWideLayout 
        ? ['', '', `Изделие ${st.model}`, '', '', '', '', '']
        : ['', '', `Изделие ${st.model}`, '', ''];
      virtualRows.push(modelHeaderRow);

      st.sizes.forEach((sz, idx) => {
        const qVal = st.qty[idx] || 1;
        if (isWideLayout) {
          virtualRows.push([
            `${sz}, ${st.col}`,
            '543876',
            '',
            '4600000000',
            '0',
            '540',
            '450',
            qVal // col 7
          ]);
        } else {
          virtualRows.push([
            `${sz}, ${st.col}`,
            '',
            '',
            '540',
            qVal // col 4
          ]);
        }
      });
    });

    const safeName = storeName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return {
      fileName: `${safeName}_cassa_1c.xlsx`,
      sheetData: virtualRows,
    };
  };

  // Seed default boutique files if empty (Nevskiy col 4, others col 7)
  useEffect(() => {
    if (storeFiles.length === 0) {
      const storesConfig = [
        { name: 'Boutique Spb Nevskiy', isWide: false, expectedCol: 4 },
        { name: 'Boutique Nizhniy Novgorod', isWide: true, expectedCol: 7 },
        { name: 'Boutique Spb Bolshoy', isWide: true, expectedCol: 7 },
        { name: 'Boutique Ufa', isWide: true, expectedCol: 7 },
        { name: "Boutique Perm'", isWide: true, expectedCol: 7 },
        { name: 'Boutique Samara', isWide: true, expectedCol: 7 },
      ];

      const initialStores: StoreSellOutFile[] = storesConfig.map((cfg, idx) => {
        const virtual = createVirtual1CStoreSheet(cfg.name, cfg.isWide);
        const { qColIdx, detectedLabel } = detectQuantityColumnIndex(virtual.sheetData);
        const parsed = parseSellOutPython(virtual.sheetData, cfg.name);
        const unitsSold = parsed.reduce((s, it) => s + it.Sell_Out, 0);

        return {
          id: `store_${idx}_${cfg.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          storeName: cfg.name,
          fileName: virtual.fileName,
          sheetData: virtual.sheetData,
          qColIdx,
          detectedLabel: `Rilevato 'Количество' alla riga 6 (colonna ${qColIdx})`,
          unitsSold,
          recordsCount: parsed.length,
        };
      });

      setStoreFiles(initialStores);
    }
  }, []);

  // Execution: Runs elabora_tutti_i_negozi(csv_ordini, lista_excel_vendite)
  const runConsolidatedAnalysis = () => {
    setIsExecuting(true);

    const excelStoresParam = storeFiles.map((sf) => ({
      storeName: sf.storeName,
      fileName: sf.fileName,
      sheetData: sf.sheetData,
    }));

    let rep: PythonComparisonReport;

    if (activeStoreTab === 'ALL') {
      // Consolidated multi-store mode
      rep = elaboraTuttiINegoziPython(sellInRawText, excelStoresParam);
    } else {
      // Single store mode
      const targetStore = storeFiles.find((s) => s.storeName === activeStoreTab);
      if (targetStore) {
        const sellInItems = parseSellInPython(sellInRawText);
        const sellOutItems = parseSellOutPython(targetStore.sheetData, targetStore.storeName);
        rep = confrontaSellInOutPython(sellInItems, sellOutItems);
        rep.terminalLog = [
          `Elaborazione singola boutique: ${targetStore.storeName} (${targetStore.fileName})`,
          `Colonna quantità rilevata: ${targetStore.detectedLabel}`,
          `Totale pezzi Sell-In (Globale): ${rep.totaleSellIn}`,
          `Totale pezzi Sell-Out (${targetStore.storeName}): ${rep.totaleSellOut}`,
          `Anomalie rilevate: ${rep.anomalieCount}`,
          `Report generato per store: report_consolidato_globale.csv`
        ].join('\n');
      } else {
        rep = elaboraTuttiINegoziPython(sellInRawText, excelStoresParam);
      }
    }

    setReport(rep);
    setTerminalOutput(rep.terminalLog.split('\n'));
    setIsExecuting(false);
  };

  // Re-run analysis whenever files, raw text or active tab changes
  useEffect(() => {
    if (sellInRawText && storeFiles.length > 0) {
      runConsolidatedAnalysis();
    }
  }, [sellInRawText, storeFiles, activeStoreTab]);

  // Handle upload of Sell-In CSV
  const handleUploadSellIn = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSellInFileName(file.name);
    try {
      const text = await file.text();
      setSellInRawText(text);
    } catch (err) {
      console.error('Errore lettura CSV Sell-In:', err);
    }
  };

  // Handle upload of one or more Excel files for boutiques
  const handleUploadStoreExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newStoreFiles: StoreSellOutFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const sheetData = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: '' });

        // Dynamic quantity detection at row 6
        const { qColIdx, detectedLabel } = detectQuantityColumnIndex(sheetData);

        // Deduce store name from filename or default to a known boutique
        let deducedStore = 'Boutique ' + file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
        for (const b of knownBoutiques) {
          const cleanB = b.toLowerCase().replace('boutique', '').trim();
          if (file.name.toLowerCase().includes(cleanB)) {
            deducedStore = b;
            break;
          }
        }

        const parsedItems = parseSellOutPython(sheetData, deducedStore);
        const unitsSold = parsedItems.reduce((acc, it) => acc + it.Sell_Out, 0);

        newStoreFiles.push({
          id: `upload_${Date.now()}_${i}`,
          storeName: deducedStore,
          fileName: file.name,
          sheetData,
          qColIdx,
          detectedLabel,
          unitsSold,
          recordsCount: parsedItems.length,
        });
      } catch (err) {
        console.error(`Errore nel caricamento del file ${file.name}:`, err);
      }
    }

    if (newStoreFiles.length > 0) {
      setStoreFiles((prev) => [...prev, ...newStoreFiles]);
    }
  };

  // Remove a store file
  const handleRemoveStoreFile = (id: string) => {
    setStoreFiles((prev) => prev.filter((s) => s.id !== id));
  };

  // Quick action: Add missing known boutiques with simulated cassa 1C data
  const handleAddPresetBoutique = (boutiqueName: string) => {
    const exists = storeFiles.some((s) => s.storeName === boutiqueName);
    if (exists) return;

    // Nevskiy: quantity is in column 4; Perm, Ufa, Samara, Nizhny and Bolshoy: quantity is in column 7
    const isWide = !boutiqueName.includes('Nevskiy');
    const virtual = createVirtual1CStoreSheet(boutiqueName, isWide);
    const { qColIdx, detectedLabel } = detectQuantityColumnIndex(virtual.sheetData);
    const parsed = parseSellOutPython(virtual.sheetData, boutiqueName);
    const units = parsed.reduce((sum, it) => sum + it.Sell_Out, 0);

    const newStore: StoreSellOutFile = {
      id: `store_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      storeName: boutiqueName,
      fileName: virtual.fileName,
      sheetData: virtual.sheetData,
      qColIdx,
      detectedLabel,
      unitsSold: units,
      recordsCount: parsed.length,
    };

    setStoreFiles((prev) => [...prev, newStore]);
  };

  // Filtered rows for display
  const filteredRows = useMemo(() => {
    if (!report) return [];

    let list = report.rows.filter((r) => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matches = 
          r.Modello.toLowerCase().includes(q) ||
          r.Colore.toLowerCase().includes(q) ||
          r.Taglia.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (statusFilter === 'ANOMALIES') return r.isAnomaly;
      if (statusFilter === 'SOLD') return r.Sell_Out > 0;
      if (statusFilter === 'UNSOLD') return r.Sell_Out === 0;
      if (statusFilter === 'UNORDERED') return r.Sell_In === 0 && r.Sell_Out > 0;
      return true;
    });

    list.sort((a, b) => {
      let valA: string | number = a[sortField];
      let valB: string | number = b[sortField];
      if (typeof valA === 'string') {
        const cmp = valA.localeCompare(valB as string);
        return sortAsc ? cmp : -cmp;
      }
      return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

    return list;
  }, [report, searchTerm, statusFilter, sortField, sortAsc]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const copyScript = () => {
    navigator.clipboard.writeText(PYTHON_REFERENCE_SCRIPT);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Title */}
      <div className="bg-white border border-[#E5E3DC] rounded-xl p-5 shadow-2xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded bg-[#F0F9FF] border border-[#BAE6FD] text-[#0284C7] text-xs font-mono font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                Python Multi-Store Data Engine
              </span>
              <span className="text-xs text-[#6B7280] hidden sm:inline">
                Автопоиск колонки количества (Строка 6 'Количество') · Fallback col 4/7
              </span>
            </div>
            <h2 className="text-2xl font-serif text-[#1A1A1A] mt-1.5 font-normal tracking-wide">
              Консолидация Sell-In (CSV) и Sell-Out по бутикам (Excel 1С)
            </h2>
            <p className="text-xs text-[#6B7280] mt-1 max-w-3xl leading-relaxed">
              Универсальный скрипт для таблиц переменной ширины: автоматическое определение колонки <code className="text-[#0284C7]">"Количество"</code> в строке 6 для всех бутиков сети (Невский, Нижний Новгород, Большой, Уфа, Пермь, Самара), агрегация продаж и сверка с оптовыми заказами B2B.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowCodeDrawer(!showCodeDrawer)}
              className="px-3.5 py-2 rounded-lg bg-white hover:bg-[#FAF9F5] border border-[#DCD9CE] text-[#1A1A1A] text-xs font-medium flex items-center gap-2 transition-colors shadow-2xs cursor-pointer"
            >
              <FileCode2 className="w-4 h-4 text-[#C27803]" />
              <span>{showCodeDrawer ? 'Скрыть код Python' : 'Показать код Python'}</span>
            </button>
            <button
              onClick={downloadPythonScriptFile}
              className="px-3.5 py-2 rounded-lg bg-white hover:bg-[#FAF9F5] border border-[#DCD9CE] text-[#0284C7] text-xs font-medium flex items-center gap-2 transition-colors shadow-2xs cursor-pointer"
              title="Скачать elabora_tutti_i_negozi.py"
            >
              <Download className="w-4 h-4" />
              <span>Скачать .py</span>
            </button>
            <button
              onClick={runConsolidatedAnalysis}
              disabled={isExecuting}
              className="px-4 py-2 rounded-lg bg-[#1A1A1A] hover:bg-[#333333] text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current text-[#C27803]" />
              <span>Запустить консолидацию</span>
            </button>
          </div>
        </div>
      </div>

      {/* Python Code Drawer */}
      {showCodeDrawer && (
        <div className="bg-[#0b0d14] border border-[#273046] rounded-lg p-5 shadow-2xl space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-[#1f2738]">
            <div className="flex items-center gap-2 text-xs font-mono text-[#38bdf8]">
              <Terminal className="w-4 h-4" />
              <span>elabora_tutti_i_negozi.py (Script Universale Multi-Store)</span>
            </div>
            <button
              onClick={copyScript}
              className="px-2.5 py-1 rounded bg-[#181f2f] hover:bg-[#232c42] text-xs text-[#d1d5db] flex items-center gap-1.5 transition-colors"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#38bdf8]" />}
              <span>{copiedCode ? 'Copiato!' : 'Copia Script Python'}</span>
            </button>
          </div>
          <div className="relative rounded bg-[#06080d] p-4 font-mono text-xs text-[#cbd5e1] overflow-x-auto leading-relaxed border border-[#1b2233]">
            <pre>{PYTHON_REFERENCE_SCRIPT}</pre>
          </div>
        </div>
      )}

      {/* Ingestion Area: Sell-In CSV & Multi-Boutique Excel Files */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card 1: Sell-In CSV */}
        <div className="bg-white border border-[#E5E3DC] rounded-xl p-4 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#0284C7] bg-[#F0F9FF] px-2 py-0.5 rounded border border-[#BAE6FD] flex items-center gap-1 font-semibold">
                <Database className="w-3 h-3" />
                Input 1: Sell-In B2B
              </span>
              <span className="text-xs text-[#6B7280] font-mono">sep=';'</span>
            </div>
            <h4 className="text-sm font-semibold text-[#1A1A1A]">Ordini JOOR Consolidati</h4>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Colonne: <code className="text-[#C27803]">Style Name</code>, <code className="text-[#C27803]">Color Name(CODICE)</code>, <code className="text-[#C27803]">Size</code>, <code className="text-[#C27803]">Units</code>.
            </p>

            <div className="mt-3 p-3 rounded-lg bg-[#FAF9F5] border border-[#E5E3DC] flex items-center justify-between">
              <div className="truncate pr-2">
                <div className="text-xs font-mono text-[#0B5C37] font-semibold truncate flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{sellInFileName}</span>
                </div>
                <div className="text-[11px] text-[#6B7280] mt-0.5">
                  {report ? `${report.totaleSellIn.toLocaleString()} pezzi Sell-In totali` : 'Pronto'}
                </div>
              </div>
              <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-white hover:bg-[#FAF9F5] text-xs text-[#1A1A1A] font-medium flex items-center gap-1.5 shrink-0 transition-colors border border-[#DCD9CE] shadow-2xs">
                <Upload className="w-3.5 h-3.5 text-[#0284C7]" />
                <span>Carica CSV</span>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleUploadSellIn}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Card 2 & 3: Multi-Boutique Excel Manager */}
        <div className="lg:col-span-2 bg-white border border-[#E5E3DC] rounded-xl p-4 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#332A15] bg-[#FFF9EA] px-2 py-0.5 rounded border border-[#F3E5AB] flex items-center gap-1 font-semibold">
                  <Building2 className="w-3 h-3" />
                  Input 2: Sell-Out Multi-Boutique
                </span>
                <span className="text-xs text-[#0284C7] font-mono font-medium">
                  {storeFiles.length} File Negozio caricati
                </span>
              </div>
              <label className="cursor-pointer px-3 py-1 rounded-lg bg-white hover:bg-[#FAF9F5] text-xs text-[#1A1A1A] font-medium flex items-center gap-1.5 shrink-0 transition-colors border border-[#DCD9CE] shadow-2xs">
                <Plus className="w-3.5 h-3.5 text-[#C27803]" />
                <span>Aggiungi File Excel (.xlsx)</span>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  multiple
                  onChange={handleUploadStoreExcel}
                  className="hidden"
                />
              </label>
            </div>

            <h4 className="text-sm font-semibold text-[#1A1A1A]">
              File Excel Casse POS (Rilevamento Automatico Colonna <code className="text-[#0284C7]">"Количество"</code>)
            </h4>

            {/* List of active store files with their detected column indices */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
              {storeFiles.map((sf) => (
                <div
                  key={sf.id}
                  className="p-2.5 rounded-lg bg-[#FAF9F5] border border-[#E5E3DC] flex flex-col justify-between text-xs space-y-1.5 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="truncate">
                      <span className="font-semibold text-[#1A1A1A] truncate block">
                        {sf.storeName}
                      </span>
                      <span className="text-[11px] font-mono text-[#6B7280] truncate block">
                        {sf.fileName}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveStoreFile(sf.id)}
                      className="text-[#9CA3AF] hover:text-[#DC2626] p-0.5 transition-colors cursor-pointer"
                      title="Rimuovi file negozio"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="pt-1 border-t border-[#E5E3DC] flex items-center justify-between text-[11px]">
                    <span className="text-[#0284C7] font-mono font-medium">
                      Col Q: {sf.qColIdx} ({sf.qColIdx === 7 ? 'Layout 8+ col' : 'Standard'})
                    </span>
                    <span className="text-[#0B5C37] font-mono font-bold">
                      {sf.unitsSold} pz
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Presets for remaining boutiques */}
            <div className="mt-3 pt-2.5 border-t border-[#F0EFEA] flex flex-wrap items-center gap-1.5 text-xs text-[#6B7280]">
              <span className="text-[11px]">Preset rapidi negozi:</span>
              {knownBoutiques.map((b) => {
                const isLoaded = storeFiles.some((s) => s.storeName === b);
                return (
                  <button
                    key={b}
                    onClick={() => handleAddPresetBoutique(b)}
                    disabled={isLoaded}
                    className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                      isLoaded
                        ? 'bg-[#E8F5E9] text-[#0B5C37] font-medium cursor-default'
                        : 'bg-white hover:bg-[#FAF9F5] border border-[#DCD9CE] text-[#374151]'
                    }`}
                  >
                    {isLoaded ? `✓ ${b.replace('Boutique ', '')}` : `+ ${b.replace('Boutique ', '')}`}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Boutique Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#E5E3DC]">
        <button
          onClick={() => setActiveStoreTab('ALL')}
          className={`px-3 py-1.5 rounded-t-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeStoreTab === 'ALL'
              ? 'bg-white text-[#1A1A1A] border-b-2 border-[#1A1A1A] font-semibold'
              : 'text-[#6B7280] hover:text-[#1A1A1A]'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-[#C27803]" />
          <span>Consolidato Globale ({storeFiles.length} Negozi)</span>
        </button>
        {storeFiles.map((sf) => (
          <button
            key={sf.id}
            onClick={() => setActiveStoreTab(sf.storeName)}
            className={`px-3 py-1.5 rounded-t-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeStoreTab === sf.storeName
                ? 'bg-white text-[#C27803] border-b-2 border-[#C27803] font-semibold'
                : 'text-[#6B7280] hover:text-[#1A1A1A]'
            }`}
          >
            <span>{sf.storeName.replace('Boutique ', '')}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#FAF9F5] text-[#6B7280] border border-[#E5E3DC]">
              {sf.unitsSold} pz
            </span>
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      {report && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="bg-white border border-[#E5E3DC] rounded-xl p-4 shadow-2xs">
            <span className="text-[11px] font-mono text-[#6B7280] uppercase tracking-wider block">
              Totale Pezzi Sell-In
            </span>
            <div className="text-2xl font-serif text-[#1A1A1A] font-bold mt-1">
              {report.totaleSellIn.toLocaleString()} <span className="text-xs font-sans text-[#6B7280] font-normal">pz</span>
            </div>
            <span className="text-[11px] text-[#0284C7] flex items-center gap-1 mt-1 font-medium">
              <Package className="w-3.5 h-3.5" />
              <span>Ordinati B2B JOOR</span>
            </span>
          </div>

          <div className="bg-white border border-[#E5E3DC] rounded-xl p-4 shadow-2xs">
            <span className="text-[11px] font-mono text-[#6B7280] uppercase tracking-wider block">
              Totale Pezzi Sell-Out
            </span>
            <div className="text-2xl font-serif text-[#0B5C37] font-bold mt-1">
              {report.totaleSellOut.toLocaleString()} <span className="text-xs font-sans text-[#6B7280] font-normal">pz</span>
            </div>
            <span className="text-[11px] text-[#0B5C37] flex items-center gap-1 mt-1 font-medium">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>
                {activeStoreTab === 'ALL'
                  ? `Venduti (${storeFiles.length} negozi)`
                  : `Venduti (${activeStoreTab})`}
              </span>
            </span>
          </div>

          <div className={`rounded-xl p-4 shadow-2xs border transition-colors ${
            report.anomalieCount > 0 
              ? 'bg-[#FFF0F2] border-[#FECDD3] text-[#B91C1C]' 
              : 'bg-white border-[#E5E3DC]'
          }`}>
            <span className="text-[11px] font-mono uppercase tracking-wider block opacity-80">
              Anomalie (Sell Out &gt; Sell In)
            </span>
            <div className="text-2xl font-serif font-bold mt-1 flex items-center gap-2">
              <span className={report.anomalieCount > 0 ? 'text-[#B91C1C]' : 'text-[#0B5C37]'}>
                {report.anomalieCount}
              </span>
              {report.anomalieCount > 0 ? (
                <AlertTriangle className="w-5 h-5 text-[#B91C1C] animate-pulse" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-[#0B5C37]" />
              )}
            </div>
            <span className="text-[11px] mt-1 block text-[#6B7280]">
              {report.anomalieCount > 0 ? 'Venduto eccedente rispetto a ordine' : 'Nessuna anomalia riscontrata'}
            </span>
          </div>

          <div className="bg-white border border-[#E5E3DC] rounded-xl p-4 shadow-2xs">
            <span className="text-[11px] font-mono text-[#6B7280] uppercase tracking-wider block">
              Sell-Through Consolidato
            </span>
            <div className="text-2xl font-serif text-[#1A1A1A] font-bold mt-1">
              {report.totaleSellIn > 0 
                ? ((report.totaleSellOut / report.totaleSellIn) * 100).toFixed(1)
                : '0.0'}%
            </div>
            <span className="text-[11px] text-[#0B5C37] flex items-center gap-1 mt-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{report.totalUniqueRows} SKU unificati</span>
            </span>
          </div>
        </div>
      )}

      {/* Terminal Output Banner (elabora_tutti_i_negozi stdout) */}
      {terminalOutput.length > 0 && (
        <div className="bg-[#090b10] border border-[#1f2638] rounded-lg p-4 font-mono text-xs text-[#94a3b8] shadow-inner">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1b2233] text-[11px] text-[#64748b]">
            <span className="flex items-center gap-1.5 text-[#38bdf8]">
              <Terminal className="w-3.5 h-3.5" />
              Console Python (elabora_tutti_i_negozi stdout)
            </span>
            <span>Exit Code 0 · pd.merge(outer) completato</span>
          </div>
          <div className="space-y-1">
            {terminalOutput.map((line, idx) => (
              <div 
                key={idx} 
                className={
                  line.includes('Anomalie') && !line.includes(' 0') 
                    ? 'text-rose-400 font-semibold' 
                    : line.includes('--- REPORT CONSOLIDATO') || line.includes('Totale pezzi')
                      ? 'text-[#f3f4f6] font-semibold'
                      : line.includes('report_consolidato_globale')
                        ? 'text-emerald-400 font-semibold'
                        : ''
                }
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table & Report Controls */}
      {report && (
        <div className="bg-white border border-[#E5E3DC] rounded-xl overflow-hidden shadow-2xs space-y-4 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-[#1A1A1A] text-white font-semibold'
                    : 'bg-white text-[#6B7280] hover:text-[#1A1A1A] border border-[#DCD9CE]'
                }`}
              >
                Tutti ({report.rows.length})
              </button>
              <button
                onClick={() => setStatusFilter('ANOMALIES')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === 'ANOMALIES'
                    ? 'bg-[#B91C1C] text-white font-semibold'
                    : 'bg-[#FFF0F2] text-[#B91C1C] border border-[#FECDD3] hover:bg-[#FEE2E2]'
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Solo Anomalie ({report.anomalieCount})</span>
              </button>
              <button
                onClick={() => setStatusFilter('SOLD')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  statusFilter === 'SOLD'
                    ? 'bg-[#0B5C37] text-white font-semibold'
                    : 'bg-[#E8F5E9] text-[#0B5C37] border border-[#0B5C37]/30 hover:bg-[#D4EDDA]'
                }`}
              >
                Venduti (Sell-Out &gt; 0)
              </button>
              <button
                onClick={() => setStatusFilter('UNSOLD')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  statusFilter === 'UNSOLD'
                    ? 'bg-[#C27803] text-white font-semibold'
                    : 'bg-[#FFF9EA] text-[#332A15] border border-[#F3E5AB] hover:bg-[#FDF4D4]'
                }`}
              >
                Giacenza (Zero Vendite)
              </button>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cerca modello, colore, taglia..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-[#DCD9CE] rounded-lg px-3 py-1.5 pl-8 text-xs text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#C27803]"
                />
              </div>

              <button
                onClick={() => downloadReportConsolidatoGlobaleCsv(report.csvReportContent)}
                className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-[#FAF9F5] text-[#0284C7] border border-[#BAE6FD] text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs cursor-pointer"
                title="Scarica report_consolidato_globale.csv"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Scarica report_consolidato_globale.csv</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="border border-[#E5E3DC] rounded-xl overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FAF9F5] sticky top-0 z-10 border-b border-[#E5E3DC] text-[#6B7280] font-mono uppercase text-[11px]">
                <tr>
                  <th 
                    onClick={() => handleSort('Modello')}
                    className="py-3 px-3.5 cursor-pointer hover:text-[#1A1A1A]"
                  >
                    Modello {sortField === 'Modello' && (sortAsc ? '↑' : '↓')}
                  </th>
                  <th className="py-3 px-3">Colore</th>
                  <th className="py-3 px-3">Taglia</th>
                  <th 
                    onClick={() => handleSort('Sell_In')}
                    className="py-3 px-3 text-right cursor-pointer hover:text-[#1A1A1A]"
                  >
                    Sell_In {sortField === 'Sell_In' && (sortAsc ? '↑' : '↓')}
                  </th>
                  <th 
                    onClick={() => handleSort('Sell_Out')}
                    className="py-3 px-3 text-right cursor-pointer hover:text-[#1A1A1A]"
                  >
                    Sell_Out {sortField === 'Sell_Out' && (sortAsc ? '↑' : '↓')}
                  </th>
                  <th 
                    onClick={() => handleSort('Delta')}
                    className="py-3 px-3 text-right cursor-pointer hover:text-[#1A1A1A]"
                  >
                    Delta (Rimanenza) {sortField === 'Delta' && (sortAsc ? '↑' : '↓')}
                  </th>
                  <th 
                    onClick={() => handleSort('SellThroughPct')}
                    className="py-3 px-3 text-right cursor-pointer hover:text-[#1A1A1A]"
                  >
                    Sell-Through % {sortField === 'SellThroughPct' && (sortAsc ? '↑' : '↓')}
                  </th>
                  <th className="py-3 px-3.5 text-center">Stato / Diagnosi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EFEA]">
                {filteredRows.map((row, idx) => {
                  const isAnomaly = row.isAnomaly;
                  return (
                    <tr
                      key={`${row.Modello}-${row.Colore}-${row.Taglia}-${idx}`}
                      className={`hover:bg-[#FAF9F5] transition-colors ${
                        isAnomaly ? 'bg-[#FFF0F2]' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3.5 font-medium text-[#1A1A1A]">
                        {row.Modello}
                      </td>
                      <td className="py-2.5 px-3 text-[#6B7280] font-mono">
                        {row.Colore}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-[#1A1A1A]">
                        {row.Taglia}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#6B7280]">
                        {row.Sell_In}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-mono font-semibold ${
                        isAnomaly ? 'text-[#B91C1C] font-bold' : row.Sell_Out > 0 ? 'text-[#0B5C37]' : 'text-[#9CA3AF]'
                      }`}>
                        {row.Sell_Out}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-mono ${
                        row.Delta < 0 ? 'text-[#B91C1C] font-bold' : 'text-[#6B7280]'
                      }`}>
                        {row.Delta > 0 ? `+${row.Delta}` : row.Delta}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#1A1A1A]">
                        {row.SellThroughPct > 0 ? `${row.SellThroughPct}%` : '0%'}
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        {isAnomaly ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[#FFF0F2] border border-[#FECDD3] text-[#B91C1C] font-semibold">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            ANOMALIA (Out &gt; In)
                          </span>
                        ) : row.Sell_In === 0 && row.Sell_Out > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[#FFF9EA] border border-[#F3E5AB] text-[#332A15]">
                            Venduto non ordinato
                          </span>
                        ) : row.Sell_Out === 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-[#FAF9F5] text-[#6B7280] border border-[#E5E3DC]">
                            In giacenza
                          </span>
                        ) : row.SellThroughPct >= 100 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[#E8F5E9] border border-[#0B5C37]/30 text-[#0B5C37] font-semibold">
                            <CheckCircle2 className="w-3 h-3 shrink-0" />
                            100% Sold Out
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-[#F0F9FF] text-[#0284C7] border border-[#BAE6FD]">
                            Regolare
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-xs text-[#6B7280] px-1 pt-2">
            <span>
              Visualizzati {filteredRows.length} di {report.rows.length} record unificati
            </span>
            <span className="font-mono text-[#0284C7]">
              report_consolidato_globale.csv generato con successo
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
