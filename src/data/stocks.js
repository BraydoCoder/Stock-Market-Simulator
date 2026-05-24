export const STOCKS = [
  // Technology
  { symbol: 'AAPL',  name: 'Apple Inc.',              sector: 'Technology',  basePrice: 189.52 },
  { symbol: 'MSFT',  name: 'Microsoft Corp.',          sector: 'Technology',  basePrice: 378.90 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.',            sector: 'Technology',  basePrice: 165.30 },
  { symbol: 'AMZN',  name: 'Amazon.com Inc.',          sector: 'Technology',  basePrice: 182.10 },
  { symbol: 'META',  name: 'Meta Platforms Inc.',      sector: 'Technology',  basePrice: 492.60 },
  { symbol: 'NVDA',  name: 'NVIDIA Corporation',       sector: 'Technology',  basePrice: 875.40 },
  { symbol: 'TSLA',  name: 'Tesla Inc.',               sector: 'Technology',  basePrice: 214.80 },
  { symbol: 'AMD',   name: 'Advanced Micro Devices',   sector: 'Technology',  basePrice: 172.50 },
  { symbol: 'INTC',  name: 'Intel Corporation',        sector: 'Technology',  basePrice: 30.20  },
  { symbol: 'ORCL',  name: 'Oracle Corporation',       sector: 'Technology',  basePrice: 118.40 },
  // Healthcare
  { symbol: 'JNJ',   name: 'Johnson & Johnson',        sector: 'Healthcare',  basePrice: 150.20 },
  { symbol: 'PFE',   name: 'Pfizer Inc.',              sector: 'Healthcare',  basePrice: 27.40  },
  { symbol: 'UNH',   name: 'UnitedHealth Group',       sector: 'Healthcare',  basePrice: 492.80 },
  { symbol: 'ABBV',  name: 'AbbVie Inc.',              sector: 'Healthcare',  basePrice: 168.30 },
  { symbol: 'MRK',   name: 'Merck & Co.',              sector: 'Healthcare',  basePrice: 127.60 },
  // Finance
  { symbol: 'JPM',   name: 'JPMorgan Chase',           sector: 'Finance',     basePrice: 196.40 },
  { symbol: 'BAC',   name: 'Bank of America',          sector: 'Finance',     basePrice: 38.20  },
  { symbol: 'GS',    name: 'Goldman Sachs',            sector: 'Finance',     basePrice: 461.30 },
  { symbol: 'V',     name: 'Visa Inc.',                sector: 'Finance',     basePrice: 270.50 },
  { symbol: 'MA',    name: 'Mastercard Inc.',          sector: 'Finance',     basePrice: 462.10 },
  // Consumer
  { symbol: 'WMT',   name: 'Walmart Inc.',             sector: 'Consumer',    basePrice: 167.20 },
  { symbol: 'TGT',   name: 'Target Corporation',       sector: 'Consumer',    basePrice: 152.80 },
  { symbol: 'MCD',   name: "McDonald's Corp.",         sector: 'Consumer',    basePrice: 287.40 },
  { symbol: 'SBUX',  name: 'Starbucks Corp.',          sector: 'Consumer',    basePrice: 78.60  },
  { symbol: 'NKE',   name: 'Nike Inc.',                sector: 'Consumer',    basePrice: 92.30  },
  { symbol: 'DIS',   name: 'The Walt Disney Co.',      sector: 'Consumer',    basePrice: 103.50 },
  // Energy
  { symbol: 'XOM',   name: 'Exxon Mobil Corp.',        sector: 'Energy',      basePrice: 112.40 },
  { symbol: 'CVX',   name: 'Chevron Corporation',      sector: 'Energy',      basePrice: 157.20 },
  { symbol: 'COP',   name: 'ConocoPhillips',           sector: 'Energy',      basePrice: 116.80 },
  // Industrials
  { symbol: 'BA',    name: 'Boeing Company',           sector: 'Industrials', basePrice: 180.60 },
  { symbol: 'CAT',   name: 'Caterpillar Inc.',         sector: 'Industrials', basePrice: 361.20 },
  { symbol: 'GE',    name: 'GE Aerospace',             sector: 'Industrials', basePrice: 163.40 },
  // Telecom
  { symbol: 'T',     name: 'AT&T Inc.',                sector: 'Telecom',     basePrice: 17.40  },
  { symbol: 'VZ',    name: 'Verizon Communications',   sector: 'Telecom',     basePrice: 40.20  },
]

export const SECTORS = ['All', ...new Set(STOCKS.map(s => s.sector))]

export function getStock(symbol) {
  return STOCKS.find(s => s.symbol === symbol)
}
