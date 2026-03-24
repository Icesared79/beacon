import { jsPDF } from 'jspdf';

export function generateOnePager(): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'in', format: 'letter' });
  const W = 8.5;
  const PRIMARY = [27, 94, 168] as const;
  const NAVY = [15, 23, 42] as const;
  const ACCENT = [232, 84, 10] as const;
  const TEXT = [71, 85, 105] as const;
  const MUTED = [148, 163, 184] as const;
  const LIGHT_BG = [248, 250, 252] as const;

  // Header bar
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, W, 0.9, 'F');

  // Logo text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('BEACON', 0.6, 0.55);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Financial Distress Intelligence for ACCC', 2.4, 0.55);

  // Main headline
  doc.setTextColor(...NAVY);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('ACCC finds clients when they call.', 0.6, 1.35);
  doc.setTextColor(...ACCENT);
  doc.text('Beacon finds them before they know to ask.', 0.6, 1.65);

  // Body text
  doc.setTextColor(...TEXT);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  const bodyLines = doc.splitTextToSize(
    'Beacon monitors property records across ACCC\'s 40+ operating markets and identifies homeowners showing early financial distress — before they reach crisis stage. ACCC counselors reach the right people at the right time — when a debt management plan can still help, and when there\'s equity worth protecting.',
    4.5
  );
  doc.text(bodyLines, 0.6, 2.1);

  // What Beacon detects section
  doc.setTextColor(...NAVY);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('WHAT BEACON DETECTS', 0.6, 3.0);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT);

  const signals = [
    'Unpaid property taxes — first sign of financial stress',
    'Active foreclosure filings — lender has initiated action',
    'Dissolved business entities holding property',
    'Long hold periods with significant equity at risk',
    'Compound signals — multiple indicators simultaneously',
  ];

  signals.forEach((sig, i) => {
    const y = 3.3 + i * 0.28;
    doc.setFillColor(...ACCENT);
    doc.circle(0.75, y - 0.06, 0.04, 'F');
    doc.text(sig, 0.95, y);
  });

  // How it works section
  doc.setTextColor(...NAVY);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('HOW IT WORKS', 0.6, 5.0);

  const steps = [
    ['Open Beacon', 'See high-priority prospects in your market'],
    ['Review Signal Timeline', 'Understand the homeowner\'s full situation'],
    ['Reach Out', 'With context that makes the conversation meaningful'],
  ];

  steps.forEach((step, i) => {
    const y = 5.3 + i * 0.45;
    doc.setFillColor(...PRIMARY);
    doc.circle(0.78, y - 0.06, 0.12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`${i + 1}`, 0.72, y - 0.01);

    doc.setTextColor(...NAVY);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text(step[0], 1.1, y);
    doc.setTextColor(...TEXT);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(step[1], 1.1, y + 0.18);
  });

  // Right column — dashboard views
  doc.setTextColor(...NAVY);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('THREE VIEWS', 5.5, 1.35);

  const viewItems = [
    { title: 'Distress Map', desc: 'Heat map of ACCC markets\nshowing signal density', color: PRIMARY },
    { title: 'Prospect Feed', desc: 'Ranked homeowners\nmatching ACCC profile', color: ACCENT },
    { title: 'Signal Timeline', desc: 'Individual property\ndistress arc', color: [22, 163, 74] as const },
  ];

  viewItems.forEach((v, i) => {
    const y = 1.7 + i * 1.3;
    // Box
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(5.5, y - 0.1, 2.4, 1.1, 0.08, 0.08, 'F');

    doc.setTextColor(...(v.color as [number, number, number]));
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(v.title, 5.7, y + 0.15);

    doc.setTextColor(...TEXT);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const descLines = v.desc.split('\n');
    descLines.forEach((line, li) => {
      doc.text(line, 5.7, y + 0.4 + li * 0.18);
    });
  });

  // Pilot proposal box
  doc.setFillColor(235, 242, 251);
  doc.roundedRect(5.5, 5.5, 2.4, 1.5, 0.08, 0.08, 'F');
  doc.setTextColor(...PRIMARY);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('PILOT PROPOSAL', 5.7, 5.8);

  doc.setTextColor(...TEXT);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  const pilotLines = [
    '3 markets  •  90 days',
    'Boston, Chicago, Denver',
    '',
    'Zero cost to ACCC.',
    'Red Planet handles everything.',
  ];
  pilotLines.forEach((line, i) => {
    doc.text(line, 5.7, 6.05 + i * 0.2);
  });

  // Bottom stats bar
  doc.setFillColor(...NAVY);
  doc.rect(0, 7.5, W, 0.7, 'F');

  const stats = [
    { num: '93M+', label: 'Records' },
    { num: '556', label: 'Data Sources' },
    { num: '50', label: 'States' },
    { num: '40+', label: 'ACCC Markets' },
    { num: '5', label: 'Signal Types' },
  ];

  stats.forEach((s, i) => {
    const x = 0.6 + i * 1.6;
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(s.num, x, 7.85);
    doc.setTextColor(...MUTED);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(s.label, x, 8.0);
  });

  // Footer
  doc.setTextColor(...MUTED);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Powered by Atlas  |  Red Planet Data  |  redplanetdata.com  |  beacon.redplanetdata.com', 0.6, 8.5);

  // Divider line between columns
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.01);
  doc.line(5.2, 1.2, 5.2, 7.3);

  return doc;
}
