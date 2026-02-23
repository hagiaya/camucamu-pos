-- 1. Table for Products
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  cost NUMERIC NOT NULL,
  category TEXT,
  image TEXT,
  description TEXT,
  popular BOOLEAN DEFAULT false,
  "searchKeywords" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Table for Orders / Transactions
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  items JSONB NOT NULL,
  total NUMERIC NOT NULL,
  "totalCost" NUMERIC NOT NULL,
  profit NUMERIC NOT NULL,
  "customerName" TEXT,
  "customerPhone" TEXT,
  "customerAddress" TEXT,
  notes TEXT,
  "paymentMethod" TEXT,
  "cashReceived" NUMERIC,
  change NUMERIC,
  type TEXT,
  status TEXT,
  "cashierName" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Table for Expenses
CREATE TABLE expenses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT,
  notes TEXT,
  date DATE NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (Optional but recommended)
-- For now, we'll keep it simple for the user to get started.
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for development/demo)
CREATE POLICY "Public Access" ON products FOR ALL USING (true);
CREATE POLICY "Public Access" ON transactions FOR ALL USING (true);
CREATE POLICY "Public Access" ON expenses FOR ALL USING (true);

-- 4. Table for Users/Admin
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff', -- 'super' or 'staff'
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access" ON users;
CREATE POLICY "Public Access" ON users FOR ALL USING (true);

-- Seed Initial Users (Passwords are plain text for simplicity as requested/local dev)
INSERT INTO users (username, password, role) VALUES 
('reza', 'reza1797', 'super'),
('andris', 'andris123', 'staff'),
('lasulika', 'lasulika123', 'staff')
ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password;
