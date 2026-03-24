-- Beacon Database Schema
-- ACCC Financial Distress Intelligence Platform

-- Users and authentication
CREATE TABLE beacon_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    full_name text,
    role text NOT NULL DEFAULT 'counselor',
    office_location text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    last_login timestamptz
);

-- ACCC office locations
CREATE TABLE beacon_offices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    city text NOT NULL,
    state text NOT NULL,
    address text,
    phone text,
    latitude numeric,
    longitude numeric,
    radius_miles integer DEFAULT 25,
    is_active boolean DEFAULT true
);

-- Prospect records — homeowners showing distress signals
CREATE TABLE beacon_prospects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    address text NOT NULL,
    city text,
    state text NOT NULL,
    zip text,
    county text,
    latitude numeric,
    longitude numeric,
    owner_name text,
    owner_mailing_address text,
    owner_city text,
    owner_state text,
    owner_zip text,
    is_absentee_owner boolean DEFAULT false,
    assessed_value numeric,
    estimated_equity numeric,
    last_sale_price numeric,
    last_sale_date date,
    years_held numeric,
    compound_score integer DEFAULT 0,
    signal_count integer DEFAULT 0,
    has_tax_delinquency boolean DEFAULT false,
    has_lis_pendens boolean DEFAULT false,
    has_dissolved_llc boolean DEFAULT false,
    has_bankruptcy boolean DEFAULT false,
    has_probate boolean DEFAULT false,
    is_long_hold boolean DEFAULT false,
    is_high_equity boolean DEFAULT false,
    first_signal_date date,
    most_recent_signal_date date,
    distress_months integer,
    status text DEFAULT 'new',
    assigned_to uuid REFERENCES beacon_users(id),
    office_id uuid REFERENCES beacon_offices(id),
    notes text,
    atlas_parcel_id text,
    source text DEFAULT 'atlas',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Signal timeline events
CREATE TABLE beacon_signal_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    prospect_id uuid REFERENCES beacon_prospects(id),
    signal_type text NOT NULL,
    severity text DEFAULT 'warning',
    detected_date date,
    description text,
    amount numeric,
    source text,
    created_at timestamptz DEFAULT now()
);

-- Activity log — counselor actions on prospects
CREATE TABLE beacon_activity (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    prospect_id uuid REFERENCES beacon_prospects(id),
    user_id uuid REFERENCES beacon_users(id),
    action text NOT NULL,
    old_status text,
    new_status text,
    note text,
    created_at timestamptz DEFAULT now()
);

-- Market snapshots — zip/county level distress data
CREATE TABLE beacon_market_snapshots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    geography_type text,
    geography_code text,
    geography_name text,
    state text,
    latitude numeric,
    longitude numeric,
    total_prospects integer DEFAULT 0,
    critical_signals integer DEFAULT 0,
    high_signals integer DEFAULT 0,
    warning_signals integer DEFAULT 0,
    avg_compound_score numeric,
    distress_trend text,
    snapshot_date date DEFAULT CURRENT_DATE,
    created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_prospects_state ON beacon_prospects(state);
CREATE INDEX idx_prospects_office ON beacon_prospects(office_id);
CREATE INDEX idx_prospects_status ON beacon_prospects(status);
CREATE INDEX idx_prospects_score ON beacon_prospects(compound_score DESC);
CREATE INDEX idx_prospects_assigned ON beacon_prospects(assigned_to);
CREATE INDEX idx_signal_events_prospect ON beacon_signal_events(prospect_id);
CREATE INDEX idx_market_snapshots_geo ON beacon_market_snapshots(geography_code, state);

-- Row Level Security
ALTER TABLE beacon_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE beacon_prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE beacon_signal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE beacon_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE beacon_offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE beacon_market_snapshots ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "users_own_data" ON beacon_users
    FOR ALL USING (auth.uid()::text = id::text);

CREATE POLICY "counselors_see_prospects" ON beacon_prospects
    FOR SELECT USING (true);

CREATE POLICY "counselors_update_prospects" ON beacon_prospects
    FOR UPDATE USING (true);

CREATE POLICY "read_signal_events" ON beacon_signal_events
    FOR SELECT USING (true);

CREATE POLICY "read_activity" ON beacon_activity
    FOR SELECT USING (true);

CREATE POLICY "insert_activity" ON beacon_activity
    FOR INSERT WITH CHECK (true);

CREATE POLICY "read_offices" ON beacon_offices
    FOR SELECT USING (true);

CREATE POLICY "read_market_snapshots" ON beacon_market_snapshots
    FOR SELECT USING (true);

-- Seed ACCC office locations
INSERT INTO beacon_offices (city, state, address, latitude, longitude) VALUES
('Newton', 'MA', '130 Rumford Ave, Newton MA 02466', 42.3370, -71.2092),
('Phoenix', 'AZ', '20 E Thomas Road Suite 2200, Phoenix AZ 85012', 33.4795, -112.0741),
('Los Angeles', 'CA', '633 West Fifth Street, Los Angeles CA 90071', 34.0522, -118.2437),
('San Francisco', 'CA', '505 Montgomery Street, San Francisco CA 94111', 37.7946, -122.4026),
('San Diego', 'CA', '350 10th Avenue Suite 1000, San Diego CA 92101', 32.7157, -117.1611),
('Denver', 'CO', '999 18th Street, Denver CO 80202', 39.7392, -104.9903),
('Miami', 'FL', '1688 Meridian Avenue, Miami Beach FL 33139', 25.7617, -80.1918),
('Tampa', 'FL', '100 S Ashley Drive, Tampa FL 33602', 27.9506, -82.4572),
('Jacksonville', 'FL', '50 N Laura Street, Jacksonville FL 32202', 30.3322, -81.6557),
('Atlanta', 'GA', '260 Peachtree Street NW, Atlanta GA 30303', 33.7490, -84.3880),
('Chicago', 'IL', '875 N Michigan Ave Suite 3100, Chicago IL 60611', 41.8781, -87.6298),
('New Orleans', 'LA', '1615 Poydras Street, New Orleans LA 70112', 29.9511, -90.0715),
('Detroit', 'MI', '400 Renaissance Center, Detroit MI 48243', 42.3314, -83.0458),
('Las Vegas', 'NV', '3753 Howard Hughes Parkway, Las Vegas NV 89169', 36.1699, -115.1398),
('Hoboken', 'NJ', '221 River Street, Hoboken NJ 07030', 40.7440, -74.0324),
('Brooklyn', 'NY', '175 Pearl Street, Brooklyn NY 11201', 40.7023, -73.9871),
('Charlotte', 'NC', '525 N Tryon St, Charlotte NC 28202', 35.2271, -80.8431),
('Raleigh', 'NC', '421 Fayetteville St, Raleigh NC 27601', 35.7796, -78.6382),
('Columbus', 'OH', '350 E First Avenue, Columbus OH 43201', 39.9612, -82.9988),
('Cleveland', 'OH', '600 Superior Ave, Cleveland OH 44114', 41.4993, -81.6944),
('Philadelphia', 'PA', '1650 Market Street, Philadelphia PA 19103', 39.9526, -75.1652),
('Memphis', 'TN', '5100 Poplar Avenue, Memphis TN 38137', 35.1495, -90.0490),
('Dallas', 'TX', '100 Crescent Court, Dallas TX 75201', 32.7767, -96.7970),
('Houston', 'TX', '1201 Fannin Street, Houston TX 77002', 29.7604, -95.3698),
('Austin', 'TX', '13785 Research Blvd, Austin TX 78750', 30.2672, -97.7431),
('San Antonio', 'TX', '1100 NW Loop 410, San Antonio TX 78213', 29.4241, -98.4936),
('Seattle', 'WA', '701 5th Ave, Seattle WA 98104', 47.6062, -122.3321),
('Washington', 'DC', '20 F Street, Washington DC 20001', 38.9072, -77.0369);
