'use client';

import { useState } from 'react';
import { FileText, Presentation, Download, Loader2 } from 'lucide-react';

export default function MarketingPage() {
  const [generatingDeck, setGeneratingDeck] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  async function handleDownloadDeck() {
    setGeneratingDeck(true);
    try {
      const { generateBeaconDeck } = await import('@/lib/generate-deck');
      const pptx = generateBeaconDeck();
      await pptx.writeFile({ fileName: 'Beacon-ACCC-Pitch-Deck-March-2026.pptx' });
    } catch (err) {
      console.error('Failed to generate deck:', err);
    }
    setGeneratingDeck(false);
  }

  async function handleDownloadPDF() {
    setGeneratingPDF(true);
    try {
      const { generateOnePager } = await import('@/lib/generate-onepager');
      const doc = generateOnePager();
      doc.save('Beacon-ACCC-One-Pager.pdf');
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    }
    setGeneratingPDF(false);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-bold text-beacon-text tracking-tight">Marketing Materials</h1>
        <p className="text-sm text-beacon-text-muted mt-1">
          ACCC pitch deck and collateral — ready for download
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
        {/* Pitch Deck */}
        <div className="bg-beacon-surface rounded-xl border border-beacon-border p-6">
          <div className="w-12 h-12 rounded-xl bg-beacon-primary-muted flex items-center justify-center mb-4">
            <Presentation size={22} className="text-beacon-primary" />
          </div>
          <h2 className="text-base font-semibold text-beacon-text">Pitch Deck</h2>
          <p className="text-sm text-beacon-text-muted mt-1 mb-4">
            12-slide PPTX presentation for the ACCC board. Covers the problem, product, data, markets, and pilot proposal.
          </p>
          <button
            onClick={handleDownloadDeck}
            disabled={generatingDeck}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-60"
            style={{ backgroundColor: 'var(--beacon-primary)' }}
          >
            {generatingDeck ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            {generatingDeck ? 'Generating...' : 'Download PPTX'}
          </button>
        </div>

        {/* One-Pager */}
        <div className="bg-beacon-surface rounded-xl border border-beacon-border p-6">
          <div className="w-12 h-12 rounded-xl bg-beacon-accent-light flex items-center justify-center mb-4">
            <FileText size={22} className="text-beacon-accent" />
          </div>
          <h2 className="text-base font-semibold text-beacon-text">One-Pager</h2>
          <p className="text-sm text-beacon-text-muted mt-1 mb-4">
            Single-page PDF overview. Print-ready, letter size. The problem, what Beacon detects, and the pilot proposal.
          </p>
          <button
            onClick={handleDownloadPDF}
            disabled={generatingPDF}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-60"
            style={{ backgroundColor: '#E8540A' }}
          >
            {generatingPDF ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            {generatingPDF ? 'Generating...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-8 bg-beacon-surface-alt rounded-xl border border-beacon-border p-5 max-w-3xl">
        <h3 className="text-sm font-semibold text-beacon-text mb-3">Deck Contents (12 Slides)</h3>
        <ol className="text-xs text-beacon-text-secondary space-y-1.5 list-decimal list-inside">
          <li>Cover — Beacon + ACCC branding</li>
          <li>The Timing Problem — reactive vs proactive outreach</li>
          <li>What Beacon Sees — five distress indicators</li>
          <li>A Real Example — Denver family with indicators</li>
          <li>Three Views — Community Map, Household Feed, Hardship Timeline</li>
          <li>Your Markets — ACCC office locations + data</li>
          <li>The Data Behind Beacon — 93M records, 556 sources</li>
          <li>How Counselors Use It — 3-step workflow</li>
          <li>The Difference It Makes — reactive vs proactive outcomes</li>
          <li>Pilot Proposal — 3 markets, 90 days, zero cost</li>
          <li>About Red Planet Data</li>
          <li>Next Steps — contact info</li>
        </ol>
      </div>
    </div>
  );
}
