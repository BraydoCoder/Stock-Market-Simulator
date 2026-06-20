export const STOCKS = [
  // Technology
  { symbol: 'AAPL',  name: 'Apple Inc.',              sector: 'Technology',  basePrice: 189.52, domain: 'apple.com',              risk: 'Low' },
  { symbol: 'MSFT',  name: 'Microsoft Corp.',          sector: 'Technology',  basePrice: 378.90, domain: 'microsoft.com',          risk: 'Low' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.',            sector: 'Technology',  basePrice: 165.30, domain: 'google.com',             risk: 'Low' },
  { symbol: 'AMZN',  name: 'Amazon.com Inc.',          sector: 'Technology',  basePrice: 182.10, domain: 'amazon.com',             risk: 'Medium' },
  { symbol: 'META',  name: 'Meta Platforms Inc.',      sector: 'Technology',  basePrice: 492.60, domain: 'meta.com',               risk: 'Medium' },
  { symbol: 'NVDA',  name: 'NVIDIA Corporation',       sector: 'Technology',  basePrice: 875.40, domain: 'nvidia.com',             risk: 'High' },
  { symbol: 'TSLA',  name: 'Tesla Inc.',               sector: 'Technology',  basePrice: 214.80, domain: 'tesla.com',              risk: 'High' },
  { symbol: 'AMD',   name: 'Advanced Micro Devices',   sector: 'Technology',  basePrice: 172.50, domain: 'amd.com',                risk: 'High' },
  { symbol: 'INTC',  name: 'Intel Corporation',        sector: 'Technology',  basePrice: 30.20,  domain: 'intel.com',              risk: 'High' },
  { symbol: 'ORCL',  name: 'Oracle Corporation',       sector: 'Technology',  basePrice: 118.40, domain: 'oracle.com',             risk: 'Medium' },
  // Healthcare
  { symbol: 'JNJ',   name: 'Johnson & Johnson',        sector: 'Healthcare',  basePrice: 150.20, domain: 'jnj.com',               risk: 'Low' },
  { symbol: 'PFE',   name: 'Pfizer Inc.',              sector: 'Healthcare',  basePrice: 27.40,  domain: 'pfizer.com',            risk: 'Medium' },
  { symbol: 'UNH',   name: 'UnitedHealth Group',       sector: 'Healthcare',  basePrice: 492.80, domain: 'unitedhealthgroup.com', risk: 'Low' },
  { symbol: 'ABBV',  name: 'AbbVie Inc.',              sector: 'Healthcare',  basePrice: 168.30, domain: 'abbvie.com',            risk: 'Medium' },
  { symbol: 'MRK',   name: 'Merck & Co.',              sector: 'Healthcare',  basePrice: 127.60, domain: 'merck.com',             risk: 'Low' },
  // Finance
  { symbol: 'JPM',   name: 'JPMorgan Chase',           sector: 'Finance',     basePrice: 196.40, domain: 'jpmorganchase.com',     risk: 'Low' },
  { symbol: 'BAC',   name: 'Bank of America',          sector: 'Finance',     basePrice: 38.20,  domain: 'bankofamerica.com',     risk: 'Medium' },
  { symbol: 'GS',    name: 'Goldman Sachs',            sector: 'Finance',     basePrice: 461.30, domain: 'goldmansachs.com',      risk: 'Medium' },
  { symbol: 'V',     name: 'Visa Inc.',                sector: 'Finance',     basePrice: 270.50, domain: 'visa.com',              risk: 'Low' },
  { symbol: 'MA',    name: 'Mastercard Inc.',          sector: 'Finance',     basePrice: 462.10, domain: 'mastercard.com',        risk: 'Low' },
  // Consumer
  { symbol: 'WMT',   name: 'Walmart Inc.',             sector: 'Consumer',    basePrice: 167.20, domain: 'walmart.com',           risk: 'Low' },
  { symbol: 'TGT',   name: 'Target Corporation',       sector: 'Consumer',    basePrice: 152.80, domain: 'target.com',            risk: 'Medium' },
  { symbol: 'MCD',   name: "McDonald's Corp.",         sector: 'Consumer',    basePrice: 287.40, domain: 'mcdonalds.com',         risk: 'Low' },
  { symbol: 'SBUX',  name: 'Starbucks Corp.',          sector: 'Consumer',    basePrice: 78.60,  domain: 'starbucks.com',         risk: 'Medium' },
  { symbol: 'NKE',   name: 'Nike Inc.',                sector: 'Consumer',    basePrice: 92.30,  domain: 'nike.com',              risk: 'Medium' },
  { symbol: 'DIS',   name: 'The Walt Disney Co.',      sector: 'Consumer',    basePrice: 103.50, domain: 'disney.com',            risk: 'Medium' },
  // Energy
  { symbol: 'XOM',   name: 'Exxon Mobil Corp.',        sector: 'Energy',      basePrice: 112.40, domain: 'exxonmobil.com',        risk: 'Medium' },
  { symbol: 'CVX',   name: 'Chevron Corporation',      sector: 'Energy',      basePrice: 157.20, domain: 'chevron.com',           risk: 'Medium' },
  { symbol: 'COP',   name: 'ConocoPhillips',           sector: 'Energy',      basePrice: 116.80, domain: 'conocophillips.com',    risk: 'High' },
  // Industrials
  { symbol: 'BA',    name: 'Boeing Company',           sector: 'Industrials', basePrice: 180.60, domain: 'boeing.com',            risk: 'High' },
  { symbol: 'CAT',   name: 'Caterpillar Inc.',         sector: 'Industrials', basePrice: 361.20, domain: 'caterpillar.com',       risk: 'Medium' },
  { symbol: 'GE',    name: 'GE Aerospace',             sector: 'Industrials', basePrice: 163.40, domain: 'geaerospace.com',       risk: 'Medium' },
  // Telecom
  { symbol: 'T',     name: 'AT&T Inc.',                sector: 'Telecom',     basePrice: 17.40,  domain: 'att.com',               risk: 'Low' },
  { symbol: 'VZ',    name: 'Verizon Communications',   sector: 'Telecom',     basePrice: 40.20,  domain: 'verizon.com',           risk: 'Low' },
  // Crypto
  { symbol: 'BTC',   name: 'Bitcoin',                  sector: 'Crypto',      basePrice: 67000,  domain: 'bitcoin.org',           risk: 'High' },
]

export const SECTORS = ['All', ...new Set(STOCKS.map(s => s.sector))]

export function getStock(symbol) {
  return STOCKS.find(s => s.symbol === symbol)
}
