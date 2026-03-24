export interface MarketData {
  city: string;
  state: string;
  county: string;
  prospects: number;
  critical: number;
  high: number;
  warning: number;
  score: number;
  trend: 'rising' | 'stable' | 'declining';
  lat: number;
  lng: number;
}

export const ACCC_MARKETS: MarketData[] = [
  { city: 'Chicago', state: 'IL', county: 'Cook', prospects: 4821, critical: 1204, high: 1580, warning: 2037, score: 81, trend: 'rising', lat: 41.8781, lng: -87.6298 },
  { city: 'Los Angeles', state: 'CA', county: 'Los Angeles', prospects: 3201, critical: 712, high: 1040, warning: 1449, score: 75, trend: 'stable', lat: 34.0522, lng: -118.2437 },
  { city: 'Atlanta', state: 'GA', county: 'Fulton', prospects: 3102, critical: 847, high: 980, warning: 1275, score: 74, trend: 'stable', lat: 33.7490, lng: -84.3880 },
  { city: 'Denver', state: 'CO', county: 'Denver', prospects: 2891, critical: 623, high: 891, warning: 1377, score: 71, trend: 'rising', lat: 39.7392, lng: -104.9903 },
  { city: 'Philadelphia', state: 'PA', county: 'Philadelphia', prospects: 2204, critical: 891, high: 621, warning: 692, score: 78, trend: 'rising', lat: 39.9526, lng: -75.1652 },
  { city: 'Houston', state: 'TX', county: 'Harris', prospects: 2103, critical: 498, high: 672, warning: 933, score: 71, trend: 'stable', lat: 29.7604, lng: -95.3698 },
  { city: 'Dallas', state: 'TX', county: 'Dallas', prospects: 1891, critical: 421, high: 582, warning: 888, score: 69, trend: 'stable', lat: 32.7767, lng: -96.7970 },
  { city: 'Boston', state: 'MA', county: 'Middlesex', prospects: 1847, critical: 412, high: 521, warning: 914, score: 68, trend: 'stable', lat: 42.3370, lng: -71.2092 },
  { city: 'Miami', state: 'FL', county: 'Miami-Dade', prospects: 1742, critical: 445, high: 501, warning: 796, score: 73, trend: 'rising', lat: 25.7617, lng: -80.1918 },
  { city: 'Detroit', state: 'MI', county: 'Wayne', prospects: 1623, critical: 389, high: 498, warning: 736, score: 72, trend: 'stable', lat: 42.3314, lng: -83.0458 },
  { city: 'Phoenix', state: 'AZ', county: 'Maricopa', prospects: 1412, critical: 321, high: 412, warning: 679, score: 67, trend: 'rising', lat: 33.4795, lng: -112.0741 },
  { city: 'Charlotte', state: 'NC', county: 'Mecklenburg', prospects: 1203, critical: 278, high: 340, warning: 585, score: 65, trend: 'stable', lat: 35.2271, lng: -80.8431 },
  { city: 'Seattle', state: 'WA', county: 'King', prospects: 1089, critical: 234, high: 312, warning: 543, score: 63, trend: 'declining', lat: 47.6062, lng: -122.3321 },
  { city: 'Tampa', state: 'FL', county: 'Hillsborough', prospects: 987, critical: 245, high: 298, warning: 444, score: 70, trend: 'rising', lat: 27.9506, lng: -82.4572 },
  { city: 'San Francisco', state: 'CA', county: 'San Francisco', prospects: 891, critical: 198, high: 267, warning: 426, score: 64, trend: 'declining', lat: 37.7946, lng: -122.4026 },
];

export const ACCC_OFFICES = [
  { city: 'Newton', state: 'MA', lat: 42.3370, lng: -71.2092 },
  { city: 'Phoenix', state: 'AZ', lat: 33.4795, lng: -112.0741 },
  { city: 'Los Angeles', state: 'CA', lat: 34.0522, lng: -118.2437 },
  { city: 'San Francisco', state: 'CA', lat: 37.7946, lng: -122.4026 },
  { city: 'San Diego', state: 'CA', lat: 32.7157, lng: -117.1611 },
  { city: 'Denver', state: 'CO', lat: 39.7392, lng: -104.9903 },
  { city: 'Miami', state: 'FL', lat: 25.7617, lng: -80.1918 },
  { city: 'Tampa', state: 'FL', lat: 27.9506, lng: -82.4572 },
  { city: 'Jacksonville', state: 'FL', lat: 30.3322, lng: -81.6557 },
  { city: 'Atlanta', state: 'GA', lat: 33.7490, lng: -84.3880 },
  { city: 'Chicago', state: 'IL', lat: 41.8781, lng: -87.6298 },
  { city: 'New Orleans', state: 'LA', lat: 29.9511, lng: -90.0715 },
  { city: 'Detroit', state: 'MI', lat: 42.3314, lng: -83.0458 },
  { city: 'Las Vegas', state: 'NV', lat: 36.1699, lng: -115.1398 },
  { city: 'Hoboken', state: 'NJ', lat: 40.7440, lng: -74.0324 },
  { city: 'Brooklyn', state: 'NY', lat: 40.7023, lng: -73.9871 },
  { city: 'Charlotte', state: 'NC', lat: 35.2271, lng: -80.8431 },
  { city: 'Raleigh', state: 'NC', lat: 35.7796, lng: -78.6382 },
  { city: 'Columbus', state: 'OH', lat: 39.9612, lng: -82.9988 },
  { city: 'Cleveland', state: 'OH', lat: 41.4993, lng: -81.6944 },
  { city: 'Philadelphia', state: 'PA', lat: 39.9526, lng: -75.1652 },
  { city: 'Memphis', state: 'TN', lat: 35.1495, lng: -90.0490 },
  { city: 'Dallas', state: 'TX', lat: 32.7767, lng: -96.7970 },
  { city: 'Houston', state: 'TX', lat: 29.7604, lng: -95.3698 },
  { city: 'Austin', state: 'TX', lat: 30.2672, lng: -97.7431 },
  { city: 'San Antonio', state: 'TX', lat: 29.4241, lng: -98.4936 },
  { city: 'Seattle', state: 'WA', lat: 47.6062, lng: -122.3321 },
  { city: 'Washington', state: 'DC', lat: 38.9072, lng: -77.0369 },
];

export const MONTHLY_TREND = [
  { month: 'Oct 2025', signals: 14280 },
  { month: 'Nov 2025', signals: 15410 },
  { month: 'Dec 2025', signals: 16890 },
  { month: 'Jan 2026', signals: 17320 },
  { month: 'Feb 2026', signals: 18940 },
  { month: 'Mar 2026', signals: 19847 },
];

export const SIGNAL_BREAKDOWN = [
  { name: 'Tax Delinquency', value: 34, color: '#D97706' },
  { name: 'Long Hold + High Equity', value: 28, color: '#2563EB' },
  { name: 'Lis Pendens', value: 16, color: '#DC2626' },
  { name: 'LLC Dissolved', value: 12, color: '#EA580C' },
  { name: 'Compound (3+)', value: 10, color: '#7C3AED' },
];
