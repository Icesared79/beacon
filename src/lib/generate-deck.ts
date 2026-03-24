import PptxGenJS from 'pptxgenjs';

const PRIMARY = '1B5EA8';
const PRIMARY_DARK = '144A87';
const ACCENT = 'E8540A';
const NAVY = '0F172A';
const WHITE = 'FFFFFF';
const LIGHT_GREY = 'F8FAFC';
const MUTED = '94A3B8';
const TEXT = '475569';

export function generateBeaconDeck(): PptxGenJS {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'Red Planet Data';
  pptx.company = 'Red Planet Data';
  pptx.subject = 'Beacon — Financial Distress Intelligence for ACCC';
  pptx.title = 'Beacon Pitch Deck';

  // ===== SLIDE 1 — Cover =====
  const s1 = pptx.addSlide();
  s1.background = { color: NAVY };
  // Beacon logo placeholder (lighthouse icon described as text)
  s1.addText('◉', { x: 4.1, y: 1.2, w: 1.8, h: 0.8, fontSize: 48, color: ACCENT, align: 'center', fontFace: 'Arial' });
  s1.addText('BEACON', { x: 2, y: 2.0, w: 6, h: 0.8, fontSize: 44, bold: true, color: WHITE, align: 'center', fontFace: 'Arial' });
  s1.addText('Financial Distress Intelligence\nfor American Consumer Credit Counseling', {
    x: 2, y: 2.9, w: 6, h: 0.9, fontSize: 18, color: MUTED, align: 'center', fontFace: 'Arial', lineSpacing: 26,
  });
  s1.addText('Prepared by Red Planet Data  |  March 2026', {
    x: 2, y: 4.2, w: 6, h: 0.4, fontSize: 11, color: MUTED, align: 'center', fontFace: 'Arial',
  });
  s1.addText('Confidential — Prepared exclusively for ACCC', {
    x: 0, y: 4.9, w: 10, h: 0.3, fontSize: 9, color: '64748B', align: 'center', fontFace: 'Arial',
  });

  // ===== SLIDE 2 — The Timing Problem =====
  const s2 = pptx.addSlide();
  s2.background = { color: WHITE };
  s2.addText('The Timing Problem', { x: 0.7, y: 0.4, w: 8, h: 0.5, fontSize: 28, bold: true, color: NAVY, fontFace: 'Arial' });
  s2.addText('ACCC finds clients when they\'re desperate.\nBeacon finds them when they can still be helped.', {
    x: 0.7, y: 1.0, w: 8.5, h: 0.7, fontSize: 15, color: TEXT, fontFace: 'Arial', lineSpacing: 22,
  });

  // Today column
  s2.addShape(pptx.ShapeType.roundRect, { x: 0.7, y: 2.0, w: 4, h: 2.8, fill: { color: 'FEF2F2' }, rectRadius: 0.1, line: { color: 'FECACA', width: 1 } });
  s2.addText('TODAY', { x: 0.7, y: 2.1, w: 4, h: 0.4, fontSize: 12, bold: true, color: 'DC2626', align: 'center', fontFace: 'Arial' });
  s2.addText('Person searches Google for debt help\n↓\nCalls ACCC\n↓\n18 months into crisis', {
    x: 0.9, y: 2.5, w: 3.6, h: 2.0, fontSize: 13, color: TEXT, align: 'center', fontFace: 'Arial', lineSpacing: 22,
  });

  // With Beacon column
  s2.addShape(pptx.ShapeType.roundRect, { x: 5.3, y: 2.0, w: 4, h: 2.8, fill: { color: 'EBF2FB' }, rectRadius: 0.1, line: { color: 'BFDBFE', width: 1 } });
  s2.addText('WITH BEACON', { x: 5.3, y: 2.1, w: 4, h: 0.4, fontSize: 12, bold: true, color: PRIMARY, align: 'center', fontFace: 'Arial' });
  s2.addText('Atlas detects first distress signal\n↓\nACCC counselor reaches out\n↓\n2 months into distress', {
    x: 5.5, y: 2.5, w: 3.6, h: 2.0, fontSize: 13, color: TEXT, align: 'center', fontFace: 'Arial', lineSpacing: 22,
  });

  // ===== SLIDE 3 — What Beacon Sees =====
  const s3 = pptx.addSlide();
  s3.background = { color: WHITE };
  s3.addText('What Beacon Sees', { x: 0.7, y: 0.4, w: 8, h: 0.5, fontSize: 28, bold: true, color: NAVY, fontFace: 'Arial' });
  s3.addText('Five signals that identify your ideal client before they call anyone.', {
    x: 0.7, y: 1.0, w: 8, h: 0.4, fontSize: 15, color: TEXT, fontFace: 'Arial',
  });

  const signals = [
    { icon: '💰', name: 'Tax Delinquency', desc: 'Unpaid property taxes. Often the first sign of financial stress.', color: 'D97706' },
    { icon: '⚖️', name: 'Lis Pendens', desc: 'Lender has initiated foreclosure. Homeowner needs intervention now.', color: 'DC2626' },
    { icon: '🏢', name: 'Dissolved LLC', desc: 'Business entity that owns property was dissolved. Ownership at risk.', color: 'EA580C' },
    { icon: '📅', name: 'Long Hold + High Equity', desc: 'Owned 10+ years with significant equity. Has assets to protect.', color: '2563EB' },
    { icon: '⚡', name: 'Compound Signal', desc: 'Multiple signals firing simultaneously. Highest priority prospects.', color: '7C3AED' },
  ];

  signals.forEach((sig, i) => {
    const y = 1.7 + i * 0.65;
    s3.addShape(pptx.ShapeType.roundRect, { x: 0.7, y, w: 8.6, h: 0.55, fill: { color: LIGHT_GREY }, rectRadius: 0.05 });
    s3.addText(sig.icon, { x: 0.85, y, w: 0.5, h: 0.55, fontSize: 16, align: 'center', fontFace: 'Arial' });
    s3.addText(sig.name, { x: 1.5, y, w: 2.2, h: 0.55, fontSize: 13, bold: true, color: sig.color, fontFace: 'Arial', valign: 'middle' });
    s3.addText(sig.desc, { x: 3.8, y, w: 5.3, h: 0.55, fontSize: 11, color: TEXT, fontFace: 'Arial', valign: 'middle' });
  });

  // ===== SLIDE 4 — A Real Example =====
  const s4 = pptx.addSlide();
  s4.background = { color: WHITE };
  s4.addText('A Real Example', { x: 0.7, y: 0.4, w: 8, h: 0.5, fontSize: 28, bold: true, color: NAVY, fontFace: 'Arial' });
  s4.addText('This is a real property in Denver, Colorado.', {
    x: 0.7, y: 1.0, w: 8, h: 0.4, fontSize: 15, color: TEXT, fontFace: 'Arial',
  });

  s4.addShape(pptx.ShapeType.roundRect, { x: 0.7, y: 1.6, w: 8.6, h: 2.6, fill: { color: LIGHT_GREY }, rectRadius: 0.1, line: { color: 'E2E8F0', width: 1 } });
  s4.addText('1847 Elm Street, Denver CO 80202', { x: 1.0, y: 1.7, w: 5, h: 0.35, fontSize: 16, bold: true, color: NAVY, fontFace: 'Arial' });
  s4.addText('Robert M. Fischer  |  Owned since 2008 (17 years)', { x: 1.0, y: 2.1, w: 5, h: 0.3, fontSize: 11, color: TEXT, fontFace: 'Arial' });

  s4.addText('Signals:', { x: 1.0, y: 2.5, w: 1, h: 0.3, fontSize: 11, bold: true, color: NAVY, fontFace: 'Arial' });
  s4.addText('Long Hold 17yr  •  Tax Delinquent  •  LLC Dissolved  •  Lis Pendens  •  High Equity', {
    x: 1.8, y: 2.5, w: 6, h: 0.3, fontSize: 11, color: ACCENT, fontFace: 'Arial',
  });

  const propDetails = [
    ['Compound Score', '87/100'],
    ['Assessed Value', '$387,000'],
    ['Estimated Equity', '$284,000'],
    ['First Signal', '14 months ago'],
  ];
  propDetails.forEach(([label, val], i) => {
    const x = 1.0 + i * 2.1;
    s4.addText(label, { x, y: 3.0, w: 2, h: 0.25, fontSize: 9, color: MUTED, fontFace: 'Arial' });
    s4.addText(val, { x, y: 3.25, w: 2, h: 0.3, fontSize: 15, bold: true, color: PRIMARY, fontFace: 'Arial' });
  });

  s4.addText('"This homeowner has $284,000 in equity they want to protect. They\'ve been in distress for over a year. They haven\'t called anyone yet. Beacon found them in month 2."', {
    x: 0.7, y: 4.4, w: 8.6, h: 0.5, fontSize: 12, italic: true, color: TEXT, fontFace: 'Arial',
  });

  // ===== SLIDE 5 — Dashboard =====
  const s5 = pptx.addSlide();
  s5.background = { color: WHITE };
  s5.addText('Three Views. One Platform.', { x: 0.7, y: 0.4, w: 8, h: 0.5, fontSize: 28, bold: true, color: NAVY, fontFace: 'Arial' });

  const views = [
    { title: 'Distress Map', desc: 'Geographic heat map of\nACCC markets', color: PRIMARY },
    { title: 'Prospect Feed', desc: 'Ranked list of homeowners\nmatching ACCC profile', color: ACCENT },
    { title: 'Signal Timeline', desc: 'Individual property\ndistress arc', color: '16A34A' },
  ];
  views.forEach((v, i) => {
    const x = 0.7 + i * 3.1;
    s5.addShape(pptx.ShapeType.roundRect, { x, y: 1.3, w: 2.8, h: 3.2, fill: { color: LIGHT_GREY }, rectRadius: 0.1, line: { color: 'E2E8F0', width: 1 } });
    s5.addShape(pptx.ShapeType.roundRect, { x: x + 0.2, y: 1.5, w: 2.4, h: 1.8, fill: { color: 'E2E8F0' }, rectRadius: 0.08 });
    s5.addText('[ Screenshot ]', { x: x + 0.2, y: 2.0, w: 2.4, h: 0.5, fontSize: 10, color: MUTED, align: 'center', fontFace: 'Arial' });
    s5.addText(v.title, { x, y: 3.5, w: 2.8, h: 0.35, fontSize: 14, bold: true, color: v.color, align: 'center', fontFace: 'Arial' });
    s5.addText(v.desc, { x, y: 3.9, w: 2.8, h: 0.5, fontSize: 10, color: TEXT, align: 'center', fontFace: 'Arial', lineSpacing: 15 });
  });

  // ===== SLIDE 6 — Your Markets =====
  const s6 = pptx.addSlide();
  s6.background = { color: WHITE };
  s6.addText('Your Markets', { x: 0.7, y: 0.4, w: 8, h: 0.5, fontSize: 28, bold: true, color: NAVY, fontFace: 'Arial' });
  s6.addText('Beacon is configured for ACCC\'s 40 offices across 25+ states.', {
    x: 0.7, y: 1.0, w: 8, h: 0.4, fontSize: 15, color: TEXT, fontFace: 'Arial',
  });

  // Market table
  const tableRows: PptxGenJS.TableRow[] = [
    [
      { text: 'Market', options: { bold: true, fontSize: 10, color: MUTED, fill: { color: LIGHT_GREY } } },
      { text: 'Active Prospects', options: { bold: true, fontSize: 10, color: MUTED, fill: { color: LIGHT_GREY }, align: 'right' } },
      { text: 'Critical', options: { bold: true, fontSize: 10, color: MUTED, fill: { color: LIGHT_GREY }, align: 'right' } },
      { text: 'Avg Score', options: { bold: true, fontSize: 10, color: MUTED, fill: { color: LIGHT_GREY }, align: 'right' } },
    ],
    ...([
      ['Chicago, IL', '4,821', '1,204', '81'],
      ['Los Angeles, CA', '3,201', '712', '75'],
      ['Atlanta, GA', '3,102', '847', '74'],
      ['Denver, CO', '2,891', '623', '71'],
      ['Philadelphia, PA', '2,204', '891', '78'],
      ['Houston, TX', '2,103', '498', '71'],
      ['Dallas, TX', '1,891', '421', '69'],
      ['Boston, MA', '1,847', '412', '68'],
    ].map(row => row.map((cell, ci) => ({
      text: cell,
      options: { fontSize: 11, color: NAVY, fontFace: 'Arial', align: ci > 0 ? 'right' as const : 'left' as const },
    })))),
  ];
  s6.addTable(tableRows, {
    x: 0.7, y: 1.6, w: 8.6,
    border: { type: 'solid', pt: 0.5, color: 'E2E8F0' },
    rowH: 0.4,
    colW: [2.8, 2, 1.8, 2],
    fontFace: 'Arial',
  });

  // ===== SLIDE 7 — The Data Behind Beacon =====
  const s7 = pptx.addSlide();
  s7.background = { color: WHITE };
  s7.addText('The Data Behind Beacon', { x: 0.7, y: 0.4, w: 8, h: 0.5, fontSize: 28, bold: true, color: NAVY, fontFace: 'Arial' });

  const dataPoints = [
    { num: '93M+', label: 'Verified property records' },
    { num: '556', label: 'Active data sources' },
    { num: '50', label: 'States covered' },
  ];
  dataPoints.forEach((d, i) => {
    const x = 0.7 + i * 3.1;
    s7.addShape(pptx.ShapeType.roundRect, { x, y: 1.3, w: 2.8, h: 1.4, fill: { color: 'EBF2FB' }, rectRadius: 0.1 });
    s7.addText(d.num, { x, y: 1.4, w: 2.8, h: 0.7, fontSize: 36, bold: true, color: PRIMARY, align: 'center', fontFace: 'Arial' });
    s7.addText(d.label, { x, y: 2.1, w: 2.8, h: 0.4, fontSize: 12, color: TEXT, align: 'center', fontFace: 'Arial' });
  });

  s7.addText('Updated continuously.', { x: 0.7, y: 2.9, w: 8.6, h: 0.4, fontSize: 14, color: PRIMARY, fontFace: 'Arial' });
  s7.addText('This is not a one-time dataset. Beacon updates as new signals are detected — every week new homeowners enter distress.', {
    x: 0.7, y: 3.3, w: 8.6, h: 0.5, fontSize: 12, color: TEXT, fontFace: 'Arial',
  });

  // ===== SLIDE 8 — How Counselors Use It =====
  const s8 = pptx.addSlide();
  s8.background = { color: WHITE };
  s8.addText('How Counselors Use It', { x: 0.7, y: 0.4, w: 8, h: 0.5, fontSize: 28, bold: true, color: NAVY, fontFace: 'Arial' });
  s8.addText('Simple. Fast. Actionable.', { x: 0.7, y: 1.0, w: 8, h: 0.4, fontSize: 15, color: TEXT, fontFace: 'Arial' });

  const steps = [
    { num: '1', title: 'Open Beacon', desc: 'See new high-priority\nprospects in your market' },
    { num: '2', title: 'Review Timeline', desc: 'Understand the homeowner\'s\nfull situation' },
    { num: '3', title: 'Reach Out', desc: 'With context that makes the\nconversation meaningful' },
  ];
  steps.forEach((s, i) => {
    const x = 0.7 + i * 3.1;
    s8.addShape(pptx.ShapeType.ellipse, { x: x + 1.0, y: 1.7, w: 0.7, h: 0.7, fill: { color: PRIMARY } });
    s8.addText(s.num, { x: x + 1.0, y: 1.75, w: 0.7, h: 0.65, fontSize: 22, bold: true, color: WHITE, align: 'center', fontFace: 'Arial' });
    s8.addText(s.title, { x, y: 2.6, w: 2.8, h: 0.35, fontSize: 14, bold: true, color: NAVY, align: 'center', fontFace: 'Arial' });
    s8.addText(s.desc, { x, y: 3.0, w: 2.8, h: 0.6, fontSize: 11, color: TEXT, align: 'center', fontFace: 'Arial', lineSpacing: 16 });
  });

  s8.addText('"No research required. Beacon does the work. Counselors do what they do best."', {
    x: 0.7, y: 4.0, w: 8.6, h: 0.4, fontSize: 13, italic: true, color: PRIMARY, fontFace: 'Arial',
  });

  // ===== SLIDE 9 — The Difference It Makes =====
  const s9 = pptx.addSlide();
  s9.background = { color: WHITE };
  s9.addText('The Difference It Makes', { x: 0.7, y: 0.4, w: 8, h: 0.5, fontSize: 28, bold: true, color: NAVY, fontFace: 'Arial' });
  s9.addText('Proactive outreach changes everything.', { x: 0.7, y: 1.0, w: 8, h: 0.4, fontSize: 15, color: TEXT, fontFace: 'Arial' });

  // Reactive
  s9.addShape(pptx.ShapeType.roundRect, { x: 0.7, y: 1.7, w: 4, h: 2.5, fill: { color: 'FEF2F2' }, rectRadius: 0.1 });
  s9.addText('REACTIVE (Today)', { x: 0.7, y: 1.8, w: 4, h: 0.35, fontSize: 12, bold: true, color: 'DC2626', align: 'center', fontFace: 'Arial' });
  s9.addText('Person calls after filing bankruptcy.\nDMP is no longer an option.\nACCC can offer counseling but the\nmost impactful intervention window\nhas passed.', {
    x: 0.9, y: 2.2, w: 3.6, h: 1.8, fontSize: 11, color: TEXT, align: 'center', fontFace: 'Arial', lineSpacing: 18,
  });

  // Proactive
  s9.addShape(pptx.ShapeType.roundRect, { x: 5.3, y: 1.7, w: 4, h: 2.5, fill: { color: 'F0FDF4' }, rectRadius: 0.1 });
  s9.addText('PROACTIVE (With Beacon)', { x: 5.3, y: 1.8, w: 4, h: 0.35, fontSize: 12, bold: true, color: '16A34A', align: 'center', fontFace: 'Arial' });
  s9.addText('ACCC reaches out when tax delinquency\nfirst appears. DMP is fully viable.\nHomeowner keeps their equity.\nACCC enrolls a client.\nOutcome: better for everyone.', {
    x: 5.5, y: 2.2, w: 3.6, h: 1.8, fontSize: 11, color: TEXT, align: 'center', fontFace: 'Arial', lineSpacing: 18,
  });

  // ===== SLIDE 10 — Pilot Proposal =====
  const s10 = pptx.addSlide();
  s10.background = { color: WHITE };
  s10.addText('Pilot Proposal', { x: 0.7, y: 0.4, w: 8, h: 0.5, fontSize: 28, bold: true, color: NAVY, fontFace: 'Arial' });
  s10.addText('Three markets. 90 days. One metric.', { x: 0.7, y: 1.0, w: 8, h: 0.4, fontSize: 18, bold: true, color: PRIMARY, fontFace: 'Arial' });

  const pilotItems = [
    'Configure Beacon for Boston, Chicago, and Denver',
    'ACCC counselors in those offices use Beacon for 90 days',
    'Measure: enrollment rate from Beacon-sourced prospects vs. current inbound rate',
    'Red Planet handles all configuration, data, and support',
  ];
  pilotItems.forEach((item, i) => {
    s10.addShape(pptx.ShapeType.ellipse, { x: 0.9, y: 1.7 + i * 0.6, w: 0.35, h: 0.35, fill: { color: PRIMARY } });
    s10.addText(`${i + 1}`, { x: 0.9, y: 1.7 + i * 0.6, w: 0.35, h: 0.35, fontSize: 11, bold: true, color: WHITE, align: 'center', fontFace: 'Arial' });
    s10.addText(item, { x: 1.5, y: 1.7 + i * 0.6, w: 7.5, h: 0.35, fontSize: 13, color: TEXT, fontFace: 'Arial', valign: 'middle' });
  });

  s10.addShape(pptx.ShapeType.roundRect, { x: 0.7, y: 4.0, w: 8.6, h: 0.7, fill: { color: 'EBF2FB' }, rectRadius: 0.08 });
  s10.addText('"This costs ACCC nothing except counselor time. If it works, we scale nationally."', {
    x: 0.9, y: 4.05, w: 8.2, h: 0.6, fontSize: 14, italic: true, color: PRIMARY_DARK, fontFace: 'Arial', valign: 'middle',
  });

  // ===== SLIDE 11 — About Red Planet Data =====
  const s11 = pptx.addSlide();
  s11.background = { color: WHITE };
  s11.addText('About Red Planet Data', { x: 0.7, y: 0.4, w: 8, h: 0.5, fontSize: 28, bold: true, color: NAVY, fontFace: 'Arial' });
  s11.addText('Red Planet Data built Atlas — a national property intelligence platform with 93 million verified records across all 50 states.', {
    x: 0.7, y: 1.2, w: 8.6, h: 0.7, fontSize: 16, color: TEXT, fontFace: 'Arial', lineSpacing: 24,
  });
  s11.addText('Founded by Paul Daswani. Based in Connecticut.\nPlatform launched 2025. Currently covering all 50 states\nwith expanding signal coverage.', {
    x: 0.7, y: 2.2, w: 8.6, h: 0.9, fontSize: 13, color: TEXT, fontFace: 'Arial', lineSpacing: 20,
  });
  s11.addShape(pptx.ShapeType.roundRect, { x: 0.7, y: 3.4, w: 8.6, h: 0.6, fill: { color: 'FEF0E8' }, rectRadius: 0.08 });
  s11.addText('"Beacon is the first product Red Planet has built for the nonprofit financial services sector. ACCC is our launch partner."', {
    x: 0.9, y: 3.4, w: 8.2, h: 0.6, fontSize: 12, italic: true, color: ACCENT, fontFace: 'Arial', valign: 'middle',
  });

  // ===== SLIDE 12 — Next Steps =====
  const s12 = pptx.addSlide();
  s12.background = { color: NAVY };
  s12.addText('Let\'s start.', { x: 2, y: 0.8, w: 6, h: 0.7, fontSize: 36, bold: true, color: WHITE, align: 'center', fontFace: 'Arial' });

  const nextSteps = [
    'Identify three pilot offices',
    'Red Planet configures Beacon for those markets (1 week)',
    'Counselors begin using Beacon — first prospects delivered day one',
  ];
  nextSteps.forEach((step, i) => {
    s12.addShape(pptx.ShapeType.ellipse, { x: 2.5, y: 2.0 + i * 0.7, w: 0.4, h: 0.4, fill: { color: ACCENT } });
    s12.addText(`${i + 1}`, { x: 2.5, y: 2.0 + i * 0.7, w: 0.4, h: 0.4, fontSize: 13, bold: true, color: WHITE, align: 'center', fontFace: 'Arial' });
    s12.addText(step, { x: 3.1, y: 2.0 + i * 0.7, w: 5, h: 0.4, fontSize: 14, color: WHITE, fontFace: 'Arial', valign: 'middle' });
  });

  s12.addText('Paul Daswani\nredplanetdata.com  |  beacon.redplanetdata.com', {
    x: 2, y: 4.0, w: 6, h: 0.7, fontSize: 12, color: MUTED, align: 'center', fontFace: 'Arial', lineSpacing: 20,
  });

  return pptx;
}
