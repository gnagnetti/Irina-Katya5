/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MergedProduct, SalesObjectionItem } from '../types';
import { SALES_OBJECTIONS_KNOWLEDGE_BASE } from '../data/initialData';
import { 
  X, 
  Sparkles, 
  ShieldCheck, 
  MessageSquare, 
  ShoppingBag, 
  Printer, 
  Check, 
  HelpCircle,
  Scissors,
  Layers
} from 'lucide-react';

interface ModelTrainingSheetProps {
  product: MergedProduct | null;
  onClose: () => void;
  allProducts: MergedProduct[];
  onSelectProduct: (product: MergedProduct) => void;
}

export const ModelTrainingSheet: React.FC<ModelTrainingSheetProps> = ({
  product,
  onClose,
  allProducts,
  onSelectProduct,
}) => {
  if (!product) return null;

  const generalObjections = SALES_OBJECTIONS_KNOWLEDGE_BASE.general || [];
  let categoryObjections: SalesObjectionItem[] = [];

  if (['Pullover', 'Cardigan', 'Knitwear'].includes(product.silhouette)) {
    categoryObjections = SALES_OBJECTIONS_KNOWLEDGE_BASE.Knitwear || [];
  } else if (['Jacket', 'Coat', 'Suit', 'Pants', 'Skirt'].includes(product.silhouette)) {
    categoryObjections = SALES_OBJECTIONS_KNOWLEDGE_BASE.Tailoring || [];
  } else if (['Bag', 'Belt', 'Earring', 'Key Ring', 'Accessory'].includes(product.silhouette)) {
    categoryObjections = SALES_OBJECTIONS_KNOWLEDGE_BASE.Accessories || [];
  }

  const combinedObjections = [...categoryObjections, ...generalObjections];

  const complementaryItems = allProducts
    .filter(
      (p) =>
        p.id !== product.id &&
        (p.silhouette === 'Bag' ||
          p.silhouette === 'Belt' ||
          p.silhouette === 'Earring' ||
          (product.silhouette === 'Skirt' && p.silhouette === 'Pullover') ||
          (product.silhouette === 'Pants' && p.silhouette === 'Jacket'))
    )
    .slice(0, 3);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white border border-[#E5E3DC] rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E3DC] bg-[#FAF9F5]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#FFF9EA] border border-[#F3E5AB] flex items-center justify-center text-[#C27803]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-serif uppercase tracking-widest text-[#332A15] font-semibold">
                  Scheda Formazione & Argomentario Boutique
                </h3>
                <span className="text-[10px] text-[#6B7280] px-2 py-0.5 rounded bg-white border border-[#E5E3DC]">
                  Clientele Excellence
                </span>
              </div>
              <p className="text-xs text-[#6B7280]">
                Modello: <strong className="text-[#1A1A1A] font-serif text-sm">{product.styleName}</strong> (Cod. {product.styleNumber}) · Retail €{product.suggRetailEur}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#1A1A1A] hover:bg-white border border-[#DCD9CE] transition-colors cursor-pointer shadow-2xs"
              title="Stampa scheda per il personale di cassa"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#1A1A1A] hover:bg-white border border-[#DCD9CE] transition-colors cursor-pointer shadow-2xs"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-xs">
          {/* Garment Quick Brief & Craftsmanship */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-4 rounded-xl bg-[#FAF9F5] border border-[#E5E3DC] shadow-2xs">
            <div className="md:col-span-3 aspect-[3/4] bg-white rounded-lg overflow-hidden border border-[#E5E3DC] flex items-center justify-center p-2">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.styleName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-300">
                  <ShoppingBag className="w-8 h-8 opacity-40 text-[#C27803]" />
                </div>
              )}
            </div>

            <div className="md:col-span-9 flex flex-col justify-between text-xs space-y-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#C27803] font-semibold">
                  L’Eccellenza Sartoriale Made in {product.countryOfOrigin}
                </span>
                <h4 className="text-lg font-serif text-[#1A1A1A] mt-0.5">
                  {product.styleName} · Collezione {product.linesheet}
                </h4>
                <p className="text-[#374151] mt-1.5 leading-relaxed">
                  Capo cardine della selezione FW26 per la {product.retailer || 'boutique'}. Realizzato con{' '}
                  <strong className="text-[#C27803]">{product.fabrication}</strong>. La maison
                  Luisa Spagnoli dal 1928 unisce la tradizione manifatturiera umbra al rigore
                  contemporaneo: ogni asola, fodera e finitura è concepita per durare una vita senza
                  deformazioni strutturali.
                </p>
              </div>

              {/* 3 Value Pillars for Sales Assistant */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#E5E3DC]">
                <div className="p-2.5 rounded-lg bg-white border border-[#E5E3DC] shadow-2xs">
                  <span className="text-[#C27803] font-semibold flex items-center gap-1 text-[11px]">
                    <Sparkles className="w-3 h-3 shrink-0" /> Filato Nobile
                  </span>
                  <p className="text-[10px] text-[#6B7280] mt-1">
                    Fibre selezionate ad altissima coibenza termica, leggere e soffici al tatto.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-[#E5E3DC] shadow-2xs">
                  <span className="text-[#0284C7] font-semibold flex items-center gap-1 text-[11px]">
                    <Scissors className="w-3 h-3 shrink-0" /> Taglio Perfetto
                  </span>
                  <p className="text-[10px] text-[#6B7280] mt-1">
                    Cuciture ribattute calibrate per assecondare la postura naturale.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-[#E5E3DC] shadow-2xs">
                  <span className="text-[#0B5C37] font-semibold flex items-center gap-1 text-[11px]">
                    <ShieldCheck className="w-3 h-3 shrink-0" /> Longevità Capi
                  </span>
                  <p className="text-[10px] text-[#6B7280] mt-1">
                    Resistenza all’usura e al pilling, investimento sartoriale per il guardaroba.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Core Section: Objection Overcoming Matrix */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-[#C27803]" />
              <h4 className="text-sm font-serif uppercase tracking-wider text-[#1A1A1A] font-semibold">
                Matrice Superamento Obiezioni Cliente in Boutique
              </h4>
            </div>

            <div className="space-y-3">
              {combinedObjections.map((obj, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-white border border-[#E5E3DC] shadow-2xs hover:shadow-xs transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-serif text-sm font-semibold text-[#B91C1C] flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                      Obiezione: &ldquo;{obj.objection}&rdquo;
                    </span>
                    <span className="text-[10px] text-[#6B7280] px-2 py-0.5 rounded bg-[#FAF9F5] border border-[#E5E3DC]">
                      Modulo Vendita {idx + 1}
                    </span>
                  </div>

                  <p className="text-xs text-[#6B7280] italic mb-3">
                    <strong>Contesto Psicologico Cliente:</strong> {obj.customerRationale}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-3 border-t border-[#F0EFEA]">
                    {/* What to Say */}
                    <div className="bg-[#F0F9FF] p-3 rounded-lg border border-[#BAE6FD]">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-[#0284C7] block font-semibold mb-1">
                        Risposta Consigliata all&apos;Assistente:
                      </span>
                      <p className="text-[#0C4A6E] leading-relaxed">
                        &ldquo;{obj.salesResponse}&rdquo;
                      </p>
                    </div>

                    {/* Luxury Craftsmanship Proof */}
                    <div className="bg-[#FFF9EA] p-3 rounded-lg border border-[#F3E5AB]">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-[#C27803] block font-semibold mb-1">
                        Dettaglio Sartoriale di Supporto:
                      </span>
                      <p className="text-[#78350F] leading-relaxed">
                        {obj.luxuryCraftArgument}
                      </p>
                    </div>
                  </div>

                  {/* Suggestion */}
                  <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-[#0B5C37]">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      <strong>Strategia di chiusura:</strong> {obj.pairingSuggestion}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coordinated Total Look Recommendations */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-[#C27803]" />
              <h4 className="text-sm font-serif uppercase tracking-wider text-[#1A1A1A] font-semibold">
                Proposta &ldquo;Total Look&rdquo; Coordinato FW26
              </h4>
            </div>

            <p className="text-xs text-[#6B7280] mb-3">
              Suggerisci questi abbinamenti per incrementare lo scontrino medio boutique e offrire una consulenza d&apos;immagine completa:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {complementaryItems.map((comp) => (
                <div
                  key={comp.id}
                  onClick={() => onSelectProduct(comp)}
                  className="p-3 rounded-xl bg-white border border-[#E5E3DC] hover:border-[#C27803] cursor-pointer transition-all flex items-center gap-3 group shadow-2xs"
                >
                  <div className="w-12 h-16 bg-[#FAF9F5] rounded-lg overflow-hidden shrink-0 border border-[#E5E3DC] flex items-center justify-center p-1">
                    {comp.image && (
                      <img
                        src={comp.image}
                        alt={comp.styleName}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      />
                    )}
                  </div>
                  <div className="text-xs min-w-0">
                    <span className="text-[9px] uppercase font-mono text-[#C27803] font-semibold">
                      {comp.silhouette}
                    </span>
                    <h5 className="font-serif font-medium text-[#1A1A1A] truncate group-hover:text-[#C27803]">
                      {comp.styleName}
                    </h5>
                    <p className="text-[10px] text-[#6B7280] truncate mt-0.5">
                      {comp.colorCode}
                    </p>
                    <span className="text-[11px] font-mono text-[#0B5C37] font-semibold block mt-1">
                      €{comp.suggRetailEur}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E5E3DC] bg-[#FAF9F5] flex items-center justify-between text-xs">
          <span className="text-[#6B7280]">
            Formazione Retail · {product.retailer || 'Boutique Partner'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white hover:bg-[#FAF9F5] text-[#1A1A1A] border border-[#DCD9CE] transition-colors cursor-pointer shadow-2xs"
          >
            Chiudi Scheda
          </button>
        </div>
      </div>
    </div>
  );
};
